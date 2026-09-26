const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const router = express.Router();
const Admin = require('../models/Admin');
const { requireAdmin } = require('../middleware/auth');

function signToken(admin) {
  return jwt.sign(
    { id: admin._id, username: admin.username, role: admin.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );
}

// POST /api/auth/connexion
router.post('/connexion', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Identifiant et mot de passe requis.' });
  }

  const admin = await Admin.findOne({ username: username.trim() });
  if (!admin) return res.status(401).json({ message: 'Identifiants incorrects.' });

  const valide = await bcrypt.compare(password, admin.passwordHash);
  if (!valide) return res.status(401).json({ message: 'Identifiants incorrects.' });

  res.json({
    token: signToken(admin),
    admin: {
      id: admin._id,
      username: admin.username,
      role: admin.role,
      displayName: admin.displayName,
      mustChangePassword: admin.mustChangePassword,
    },
  });
});

// POST /api/auth/definir-mot-de-passe — à la première connexion, l'admin
// choisit lui-même son mot de passe définitif (remplace le mot de passe temporaire)
router.post('/definir-mot-de-passe', requireAdmin, async (req, res) => {
  const { nouveauMotDePasse } = req.body;
  if (!nouveauMotDePasse || nouveauMotDePasse.length < 8) {
    return res.status(400).json({ message: 'Le mot de passe doit contenir au moins 8 caractères.' });
  }

  const admin = await Admin.findById(req.admin.id);
  admin.passwordHash = await bcrypt.hash(nouveauMotDePasse, 10);
  admin.mustChangePassword = false;
  await admin.save();

  res.json({ message: 'Mot de passe défini avec succès.' });
});

// GET /api/auth/moi — infos du compte connecté
router.get('/moi', requireAdmin, async (req, res) => {
  const admin = await Admin.findById(req.admin.id).select('-passwordHash');
  res.json(admin);
});

module.exports = router;
