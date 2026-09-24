const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true },
    displayName: { type: String, required: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["principal", "subordonne"], required: true },
    // Tant que mustChangePassword est vrai, le mot de passe stocké est le
    // mot de passe temporaire donné par l'admin principal à la création.
    // La personne DOIT le changer à sa première connexion ; une fois changé,
    // même l'admin principal ne peut plus le consulter (seulement le réinitialiser).
    mustChangePassword: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
