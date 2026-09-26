const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const Member = require('../models/Member');
const Settings = require('../models/Settings');
const ActionLog = require('../models/ActionLog');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin); // toutes les routes ci-dessous nécessitent d'être connecté en admin

async function logAction(req, actionType, member, details) {
  await ActionLog.create({
    admin: req.admin.id,
    adminUsername: req.admin.username,
    actionType,
    memberId: member?._id,
    memberNomComplet: member ? `${member.prenom} ${member.nom}` : undefined,
    details,
  });
}

// GET /api/admin/dashboard — statistiques
router.get('/dashboard', async (req, res) => {
  const [valides, enAttente, refuses, total] = await Promise.all([
    Member.countDocuments({ status: 'valide' }),
    Member.countDocuments({ status: 'en_attente' }),
    Member.countDocuments({ status: 'refuse' }),
    Member.countDocuments({}),
  ]);
  res.json({ valides, enAttente, refuses, total });
});

// GET /api/admin/file-attente — soumissions en attente, détail complet
router.get('/file-attente', async (req, res) => {
  const membres = await Member.find({ status: 'en_attente' }).sort({ createdAt: 1 });
  res.json(membres);
});

// POST /api/admin/membres/:id/valider
router.post('/membres/:id/valider', async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: 'Fiche introuvable.' });

  member.status = 'valide';
  member.validatedBy = req.admin.id;
  member.validatedAt = new Date();
  await member.save();

  await logAction(req, 'validation', member);
  res.json(member);
});

// POST /api/admin/membres/:id/refuser
router.post('/membres/:id/refuser', async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: 'Fiche introuvable.' });

  member.status = 'refuse';
  await member.save();

  await logAction(req, 'refus', member);
  res.json(member);
});

// GET /api/admin/membres — recherche/filtre sur tous les membres (tous statuts)
router.get('/membres', async (req, res) => {
  const { q, status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) {
    filter.$or = [
      { nom: new RegExp(q, 'i') },
      { prenom: new RegExp(q, 'i') },
      { telephone: new RegExp(q, 'i') },
      { email: new RegExp(q, 'i') },
    ];
  }
  const membres = await Member.find(filter).sort({ nom: 1, prenom: 1 });
  res.json(membres);
});

// POST /api/admin/membres — ajout manuel d'un membre par un admin
router.post('/membres', async (req, res) => {
  const data = req.body;
  if (!data.nom || !data.prenom || !data.telephone) {
    return res.status(400).json({ message: 'Nom, prénom et téléphone sont requis.' });
  }
  const member = await Member.create({
    ...data,
    addedByAdmin: true,
    status: data.status || 'valide',
    validatedBy: req.admin.id,
    validatedAt: new Date(),
  });
  await logAction(req, 'ajout_manuel', member);
  res.status(201).json(member);
});

// PUT /api/admin/membres/:id — modification d'une fiche
router.put('/membres/:id', async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: 'Fiche introuvable.' });

  const champsModifiables = [
    'nom', 'prenom', 'telephone', 'ville', 'email', 'photoUrl',
    'whatsapp', 'tiktok', 'facebook', 'details', 'status',
  ];
  const modifies = [];
  for (const champ of champsModifiables) {
    if (req.body[champ] !== undefined && req.body[champ] !== member[champ]) {
      modifies.push(champ);
      member[champ] = req.body[champ];
    }
  }
  await member.save();
  await logAction(req, 'modification', member, `Champs modifiés : ${modifies.join(', ') || 'aucun'}`);
  res.json(member);
});

// DELETE /api/admin/membres/:id
router.delete('/membres/:id', async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: 'Fiche introuvable.' });

  await logAction(req, 'suppression', member);
  await member.deleteOne();
  res.json({ message: 'Fiche supprimée.' });
});

// GET /api/admin/export — export CSV de la liste des contacts (membres validés)
router.get('/export', async (req, res) => {
  const membres = await Member.find({ status: 'valide' }).sort({ nom: 1, prenom: 1 });
  const entetes = ['Nom', 'Prénom', 'Téléphone', 'Ville', 'Email', 'WhatsApp', 'TikTok', 'Facebook'];
  const lignes = membres.map((m) =>
    [m.nom, m.prenom, m.telephone, m.ville, m.email, m.whatsapp, m.tiktok, m.facebook]
      .map((v) => `"${(v || '').toString().replace(/"/g, '""')}"`)
      .join(',')
  );
  const csv = [entetes.join(','), ...lignes].join('\n');

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="contacts-promo.csv"');
  res.send('\uFEFF' + csv); // BOM pour un bon affichage des accents dans Excel
});

// GET /api/admin/reglages — lecture des réglages (accessible aux 3 admins)
router.get('/reglages', async (req, res) => {
  const settings = await Settings.findOne().select('-accessPasswordHash');
  res.json(settings);
});

// PUT /api/admin/reglages — modification des réglages (accessible aux 3 admins)
router.put('/reglages', async (req, res) => {
  const { nomPromo, logoUrl, messageAccroche, nouveauMotDePasseAcces } = req.body;
  const settings = await Settings.findOne();
  if (!settings) return res.status(500).json({ message: 'Site non configuré.' });

  if (nomPromo !== undefined) settings.nomPromo = nomPromo;
  if (logoUrl !== undefined) settings.logoUrl = logoUrl;
  if (messageAccroche !== undefined) settings.messageAccroche = messageAccroche;
  if (nouveauMotDePasseAcces) {
    settings.accessPasswordHash = await bcrypt.hash(nouveauMotDePasseAcces, 10);
  }
  await settings.save();
  res.json({ message: 'Réglages mis à jour.' });
});

module.exports = router;
