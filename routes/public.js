const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const Member = require('../models/Member');
const Settings = require('../models/Settings');

// GET /api/public/settings — infos affichées sur la page d'accueil
// (nom de la promo, logo, message d'accroche) - jamais le mot de passe
router.get('/settings', async (req, res) => {
  const settings = await Settings.findOne();
  if (!settings) return res.json({ nomPromo: '', logoUrl: '', messageAccroche: '' });
  res.json({
    nomPromo: settings.nomPromo,
    logoUrl: settings.logoUrl,
    messageAccroche: settings.messageAccroche,
  });
});

// POST /api/public/verifier-mot-de-passe — vérifie le mot de passe commun
// avant d'autoriser l'accès au formulaire
router.post('/verifier-mot-de-passe', async (req, res) => {
  const { motDePasse } = req.body;
  if (!motDePasse) return res.status(400).json({ message: 'Mot de passe requis.' });

  const settings = await Settings.findOne();
  if (!settings) return res.status(500).json({ message: 'Site non configuré.' });

  const valide = await bcrypt.compare(motDePasse, settings.accessPasswordHash);
  if (!valide) return res.status(401).json({ message: 'Mot de passe incorrect.' });

  res.json({ ok: true });
});

// POST /api/public/inscription — soumission du formulaire (nécessite le mot
// de passe commun, vérifié une seconde fois côté serveur par sécurité)
router.post('/inscription', async (req, res) => {
  const {
    motDePasse,
    nom,
    prenom,
    telephone,
    ville,
    email,
    photoUrl,
    whatsapp,
    tiktok,
    facebook,
    details,
  } = req.body;

  if (!nom || !prenom || !telephone) {
    return res.status(400).json({ message: 'Nom, prénom et téléphone sont requis.' });
  }

  const settings = await Settings.findOne();
  if (!settings) return res.status(500).json({ message: 'Site non configuré.' });

  const valide = motDePasse && (await bcrypt.compare(motDePasse, settings.accessPasswordHash));
  if (!valide) return res.status(401).json({ message: 'Mot de passe incorrect.' });

  const member = await Member.create({
    nom,
    prenom,
    telephone,
    ville,
    email,
    photoUrl,
    whatsapp,
    tiktok,
    facebook,
    details,
    status: 'en_attente',
  });

  res.status(201).json({
    message: 'Merci ! Votre fiche a été envoyée et sera visible dans l\'annuaire après validation.',
    id: member._id,
  });
});

// GET /api/public/annuaire — liste des membres validés, recherche par nom optionnelle
router.get('/annuaire', async (req, res) => {
  const { q } = req.query;
  const filter = { status: 'valide' };
  if (q) {
    filter.$or = [
      { nom: new RegExp(q, 'i') },
      { prenom: new RegExp(q, 'i') },
    ];
  }
  const membres = await Member.find(filter)
    .select('nom prenom ville photoUrl whatsapp tiktok facebook')
    .sort({ nom: 1, prenom: 1 });
  res.json(membres);
});

// GET /api/public/annuaire/:id — fiche détaillée d'un membre validé, pour sa
// page de profil dédiée (le site entier est déjà protégé par le mot de passe
// commun, donc on peut y afficher toutes les coordonnées, pas seulement les
// réseaux sociaux)
router.get('/annuaire/:id', async (req, res) => {
  const membre = await Member.findOne({ _id: req.params.id, status: 'valide' })
    .select('nom prenom ville email telephone photoUrl whatsapp tiktok facebook details');
  if (!membre) return res.status(404).json({ message: 'Membre introuvable.' });
  res.json(membre);
});

module.exports = router;
