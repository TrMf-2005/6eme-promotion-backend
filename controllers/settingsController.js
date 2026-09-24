const bcrypt = require("bcryptjs");
const Settings = require("../models/Settings");

// GET /api/public/site-info — public, pour afficher nom + logo sur l'accueil
exports.getPublicSiteInfo = async (req, res) => {
  const settings = await Settings.findOne().select("siteName logoBase64");
  res.json(settings || { siteName: "Notre promo" });
};

// GET /api/admin/settings
exports.getSettings = async (req, res) => {
  const settings = await Settings.findOne().select("siteName logoBase64");
  res.json(settings);
};

// PUT /api/admin/settings  { siteName, logoBase64 }
// Accessible aux 3 administrateurs : chacun peut mettre à jour le nom
// de la promo et le logo de l'université.
exports.updateSettings = async (req, res) => {
  const { siteName, logoBase64 } = req.body;
  const settings = await Settings.findOne();
  if (!settings) return res.status(500).json({ message: "Site non configuré." });

  if (siteName) settings.siteName = siteName;
  if (logoBase64) settings.logoBase64 = logoBase64;
  await settings.save();

  res.json({ message: "Réglages mis à jour." });
};

// PUT /api/admin/settings/password  { newPassword }
// Mot de passe commun d'accès au site — accessible aux 3 administrateurs.
exports.updateSitePassword = async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ message: "Le mot de passe doit faire au moins 6 caractères." });
  }
  const settings = await Settings.findOne();
  settings.sitePasswordHash = await bcrypt.hash(newPassword, 10);
  await settings.save();

  res.json({ message: "Mot de passe d'accès mis à jour." });
};
