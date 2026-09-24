const mongoose = require("mongoose");

// Document unique (singleton) : réglages globaux du site, modifiables
// par les 3 administrateurs depuis leur espace respectif.
const settingsSchema = new mongoose.Schema({
  siteName: { type: String, default: "Notre promo" },
  logoBase64: { type: String },
  sitePasswordHash: { type: String, required: true },
});

module.exports = mongoose.model("Settings", settingsSchema);
