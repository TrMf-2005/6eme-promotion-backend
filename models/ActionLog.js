const mongoose = require('mongoose');

const actionLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin', required: true },
    adminUsername: { type: String, required: true }, // copie pour garder l'historique lisible même si le compte est supprimé
    actionType: {
      type: String,
      enum: ['validation', 'refus', 'modification', 'suppression', 'ajout_manuel'],
      required: true,
    },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: 'Member' },
    memberNomComplet: { type: String }, // copie pour garder trace même après suppression
    details: { type: String }, // ex: liste des champs modifiés
  },
  { timestamps: true }
);

module.exports = mongoose.model('ActionLog', actionLogSchema);
