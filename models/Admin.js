const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    passwordHash: { type: String, required: true },
    role: {
      type: String,
      enum: ['principal', 'subordonne'],
      default: 'subordonne',
    },
    displayName: { type: String, trim: true },
    // true tant que la personne n'a pas défini son propre mot de passe
    // à la première connexion (compte créé par Régis avec un mot de passe temporaire)
    mustChangePassword: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Admin', adminSchema);
