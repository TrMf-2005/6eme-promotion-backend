const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const Admin = require("../models/Admin");
const Settings = require("../models/Settings");

function signToken(payload, expiresIn) {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

// POST /api/public/verify-access  { password }
// Vérifie le mot de passe commun d'accès au site et délivre un jeton de session.
exports.verifySiteAccess = async (req, res) => {
  const { password } = req.body;
  const settings = await Settings.findOne();
  if (!settings) return res.status(500).json({ message: "Site non configuré." });

  const ok = await bcrypt.compare(password || "", settings.sitePasswordHash);
  if (!ok) return res.status(401).json({ message: "Mot de passe incorrect." });

  const token = signToken({ type: "site-access" }, "12h");
  res.json({ token });
};

// POST /api/admin/login  { username, password }
exports.adminLogin = async (req, res) => {
  const { username, password } = req.body;
  const admin = await Admin.findOne({
  username: { $regex: new RegExp(`^${username?.trim()}$`, "i") },
});
  if (!admin) return res.status(401).json({ message: "Identifiants incorrects." });

  const ok = await bcrypt.compare(password || "", admin.passwordHash);
  if (!ok) return res.status(401).json({ message: "Identifiants incorrects." });

  if (admin.mustChangePassword) {
    // Jeton limité, juste assez pour poser le nouveau mot de passe
    const setupToken = signToken(
      { type: "admin-setup", id: admin._id },
      "15m"
    );
    return res.json({ mustChangePassword: true, setupToken });
  }

  const token = signToken(
    {
      type: "admin",
      id: admin._id,
      username: admin.username,
      displayName: admin.displayName,
      role: admin.role,
    },
    "8h"
  );
  res.json({ token, role: admin.role, displayName: admin.displayName });
};

// POST /api/admin/set-password  { setupToken, newPassword }
// Utilisé une seule fois, à la première connexion : la personne choisit
// elle-même son mot de passe définitif. Personne d'autre ne le voit jamais.
exports.setInitialPassword = async (req, res) => {
  const { setupToken, newPassword } = req.body;
  if (!newPassword || newPassword.length < 8) {
    return res.status(400).json({ message: "Le mot de passe doit faire au moins 8 caractères." });
  }
  try {
    const payload = jwt.verify(setupToken, process.env.JWT_SECRET);
    if (payload.type !== "admin-setup") throw new Error("mauvais jeton");

    const admin = await Admin.findById(payload.id);
    if (!admin) return res.status(404).json({ message: "Compte introuvable." });

    admin.passwordHash = await bcrypt.hash(newPassword, 10);
    admin.mustChangePassword = false;
    await admin.save();

    const token = signToken(
      {
        type: "admin",
        id: admin._id,
        username: admin.username,
        displayName: admin.displayName,
        role: admin.role,
      },
      "8h"
    );
    res.json({ token, role: admin.role, displayName: admin.displayName });
  } catch (err) {
    res.status(401).json({ message: "Lien expiré, reconnecte-toi." });
  }
};
