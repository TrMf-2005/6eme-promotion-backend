const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const Admin = require("../models/Admin");
const ActionLog = require("../models/ActionLog");

// GET /api/admin/admins  (principal uniquement)
exports.listAdmins = async (req, res) => {
  const admins = await Admin.find().select("username displayName role mustChangePassword createdAt");
  res.json(admins);
};

// POST /api/admin/admins  (principal uniquement)  { username, displayName }
// Un mot de passe temporaire aléatoire est généré ; la personne le change
// obligatoirement à sa première connexion (l'admin principal ne le voit jamais après ça).
exports.createSubordinateAdmin = async (req, res) => {
  const { username, displayName } = req.body;
  if (!username || !displayName) {
    return res.status(400).json({ message: "Identifiant et nom sont obligatoires." });
  }

  const tempPassword = crypto.randomBytes(4).toString("hex"); // ex: "a1b2c3d4"
  const passwordHash = await bcrypt.hash(tempPassword, 10);

  const admin = await Admin.create({
    username: username.trim().toLowerCase(),
    displayName,
    passwordHash,
    role: "subordonne",
    mustChangePassword: true,
  });

  // Le mot de passe temporaire n'est renvoyé qu'une seule fois, ici,
  // pour que Régis puisse le transmettre à la personne concernée.
  res.status(201).json({
    id: admin._id,
    username: admin.username,
    tempPassword,
  });
};

// DELETE /api/admin/admins/:id  (principal uniquement)
exports.deleteAdmin = async (req, res) => {
  const admin = await Admin.findById(req.params.id);
  if (!admin) return res.status(404).json({ message: "Introuvable." });
  if (admin.role === "principal") {
    return res.status(400).json({ message: "Impossible de supprimer l'admin principal." });
  }
  await admin.deleteOne();
  res.json({ message: "Administrateur retiré." });
};

// GET /api/admin/logs?admin=...&action=...  (principal uniquement)
exports.getLogs = async (req, res) => {
  const { admin, action } = req.query;
  const filter = {};
  if (admin) filter.admin = admin;
  if (action) filter.action = action;

  const logs = await ActionLog.find(filter).sort({ createdAt: -1 }).limit(200);
  res.json(logs);
};
