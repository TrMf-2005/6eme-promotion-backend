const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const router = express.Router();
const Admin = require('../models/Admin');
const ActionLog = require('../models/ActionLog');
const { requireAdmin, requirePrincipal } = require('../middleware/auth');

router.use(requireAdmin, requirePrincipal); // réservé à Régis

// GET /api/principal/historique — traçabilité des actions, filtrable par admin et par type
router.get('/historique', async (req, res) => {
  const { adminId, actionType } = req.query;
  const filter = {};
  if (adminId) filter.admin = adminId;
  if (actionType) filter.actionType = actionType;

  const historique = await ActionLog.find(filter)
    .populate('admin', 'username displayName role')
    .sort({ createdAt: -1 })
    .limit(500);
  res.json(historique);
});

// GET /api/principal/admins — liste des comptes admin (sans les mots de passe)
router.get('/admins', async (req, res) => {
  const admins = await Admin.find().select('-passwordHash');
  res.json(admins);
});

// POST /api/principal/admins — création d'un compte admin subordonné avec mot
// de passe temporaire ; la personne le changera à sa première connexion
router.post('/admins', async (req, res) => {
  const { username, displayName } = req.body;
  if (!username) return res.status(400).json({ message: 'Identifiant requis.' });

  const existe = await Admin.findOne({ username: username.trim() });
  if (existe) return res.status(409).json({ message: 'Cet identifiant existe déjà.' });

  const motDePasseTemporaire = crypto.randomBytes(6).toString('hex'); // 12 caractères
  const passwordHash = await bcrypt.hash(motDePasseTemporaire, 10);

  const admin = await Admin.create({
    username: username.trim(),
    passwordHash,
    displayName,
    role: 'subordonne',
    mustChangePassword: true,
  });

  res.status(201).json({
    message: 'Compte créé. Communiquez ce mot de passe temporaire à la personne : elle devra le changer à sa première connexion.',
    admin: { id: admin._id, username: admin.username, displayName: admin.displayName },
    motDePasseTemporaire,
  });
});

// DELETE /api/principal/admins/:id — retrait d'un compte admin subordonné
router.delete('/admins/:id', async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ message: 'Compte introuvable.' });
  if (admin.role === 'principal') {
    return res.status(400).json({ message: 'Impossible de supprimer le compte principal.' });
  }
  await admin.deleteOne();
  res.json({ message: 'Compte supprimé.' });
});

// POST /api/principal/admins/:id/reinitialiser — réinitialise le mot de passe
// d'un admin subordonné (Régis ne peut jamais le consulter, seulement le réinitialiser)
router.post('/admins/:id/reinitialiser', async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ message: 'Compte introuvable.' });
  if (admin.role === 'principal') {
    return res.status(400).json({ message: 'Utilisez votre propre écran de connexion pour changer votre mot de passe.' });
  }

  const motDePasseTemporaire = crypto.randomBytes(6).toString('hex');
  admin.passwordHash = await bcrypt.hash(motDePasseTemporaire, 10);
  admin.mustChangePassword = true;
  await admin.save();

  res.json({
    message: 'Mot de passe réinitialisé. Communiquez ce mot de passe temporaire à la personne.',
    motDePasseTemporaire,
  });
});

module.exports = router;
