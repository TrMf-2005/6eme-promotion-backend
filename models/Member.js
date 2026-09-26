const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    telephone: { type: String, required: true, trim: true },
    ville: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true },
    photoUrl: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    tiktok: { type: String, trim: true },
    facebook: { type: String, trim: true },
    details: { type: String, trim: true }, // champ libre

    status: {
      type: String,
      enum: ['en_attente', 'valide', 'refuse'],
      default: 'en_attente',
    },

    // Rempli quand la fiche est ajoutée directement par un admin plutôt
    // que soumise par la personne elle-même
    addedByAdmin: { type: Boolean, default: false },

    validatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    validatedAt: { type: Date },
  },
  { timestamps: true }
);

memberSchema.index({ nom: 'text', prenom: 'text' });

module.exports = mongoose.model('Member', memberSchema);
