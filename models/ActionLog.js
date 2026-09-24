const mongoose = require("mongoose");

const actionLogSchema = new mongoose.Schema(
  {
    admin: { type: mongoose.Schema.Types.ObjectId, ref: "Admin", required: true },
    adminDisplayName: { type: String, required: true },
    action: {
      type: String,
      enum: ["validate", "refuse", "edit", "delete"],
      required: true,
    },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "Member" },
    memberName: { type: String },
    details: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ActionLog", actionLogSchema);
