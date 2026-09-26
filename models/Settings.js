const mongoose = require('mongoose');

// Un seul document dans cette collection : les réglages globaux du site
const settingsSchema = new mongoose.Schema(
  {
    nomPromo: { type: String, default: '6ème promotion ER' },
    logoUrl: { type: String, default: '' },
    messageAccroche: {
      type: String,
      default: 'Restons en contact, où que la vie nous mène.',
    },
    // Mot de passe commun d'accès au formulaire, haché comme les mots de passe admin
    accessPasswordHash: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
