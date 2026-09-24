const mongoose = require("mongoose");

const memberSchema = new mongoose.Schema(
  {
    nom: { type: String, required: true, trim: true },
    prenom: { type: String, required: true, trim: true },
    telephone: { type: String, required: true, trim: true },
    ville: { type: String, required: true, trim: true },
    email: { type: String, trim: true },
    whatsapp: { type: String, trim: true },
    tiktok: { type: String, trim: true },
    facebook: { type: String, trim: true },
    autresDetails: { type: String, trim: true },
    // Photo facultative, stockée en base64 (même pattern que la boutique)
    photoBase64: { type: String },

    status: {
      type: String,
      enum: ["pending", "validated", "refused"],
      default: "pending",
    },

    submittedAt: { type: Date, default: Date.now },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "Admin" },
    reviewedAt: { type: Date },
  },
  { timestamps: true }
);

memberSchema.index({ nom: "text", prenom: "text" });

module.exports = mongoose.model("Member", memberSchema);
