const Member = require("../models/Member");
const ActionLog = require("../models/ActionLog");

// POST /api/members/submit  (accès site requis)
// Une soumission part toujours en attente de validation, jamais publiée directement.
exports.submitMember = async (req, res) => {
  const { nom, prenom, telephone, ville, email, whatsapp, tiktok, facebook, autresDetails, photoBase64 } = req.body;

  if (!nom || !prenom || !telephone || !ville) {
    return res.status(400).json({ message: "Nom, prénom, téléphone et ville sont obligatoires." });
  }

  const member = await Member.create({
    nom, prenom, telephone, ville, email, whatsapp, tiktok, facebook, autresDetails, photoBase64,
    status: "pending",
  });

  res.status(201).json({ message: "Envoyé, en attente de validation.", id: member._id });
};

// GET /api/members  (accès site requis) — annuaire public, membres validés uniquement
exports.getValidatedMembers = async (req, res) => {
  const { q } = req.query;
  const filter = { status: "validated" };
  if (q) filter.$text = { $search: q };

  const members = await Member.find(filter)
    .select("nom prenom ville whatsapp tiktok facebook photoBase64")
    .sort({ nom: 1 });

  res.json(members);
};

// --- Côté admin (les 3 comptes) ---

// GET /api/admin/pending
exports.getPendingMembers = async (req, res) => {
  const members = await Member.find({ status: "pending" }).sort({ submittedAt: 1 });
  res.json(members);
};

// GET /api/admin/pending/:id — détail complet avant de statuer
exports.getMemberDetail = async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: "Introuvable." });
  res.json(member);
};

// POST /api/admin/pending/:id/validate
exports.validateMember = async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: "Introuvable." });

  member.status = "validated";
  member.reviewedBy = req.admin.id;
  member.reviewedAt = new Date();
  await member.save();

  await ActionLog.create({
    admin: req.admin.id,
    adminDisplayName: req.admin.displayName,
    action: "validate",
    memberId: member._id,
    memberName: `${member.prenom} ${member.nom}`,
  });

  res.json({ message: "Fiche validée." });
};

// POST /api/admin/pending/:id/refuse  { motif }
exports.refuseMember = async (req, res) => {
  const member = await Member.findById(req.params.id);
  if (!member) return res.status(404).json({ message: "Introuvable." });

  member.status = "refused";
  member.reviewedBy = req.admin.id;
  member.reviewedAt = new Date();
  await member.save();

  await ActionLog.create({
    admin: req.admin.id,
    adminDisplayName: req.admin.displayName,
    action: "refuse",
    memberId: member._id,
    memberName: `${member.prenom} ${member.nom}`,
    details: req.body.motif,
  });

  res.json({ message: "Fiche refusée." });
};

// PUT /api/admin/members/:id — modification ou ajout manuel
exports.updateMember = async (req, res) => {
  const member = await Member.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!member) return res.status(404).json({ message: "Introuvable." });

  await ActionLog.create({
    admin: req.admin.id,
    adminDisplayName: req.admin.displayName,
    action: "edit",
    memberId: member._id,
    memberName: `${member.prenom} ${member.nom}`,
  });

  res.json(member);
};

// DELETE /api/admin/members/:id
exports.deleteMember = async (req, res) => {
  const member = await Member.findByIdAndDelete(req.params.id);
  if (!member) return res.status(404).json({ message: "Introuvable." });

  await ActionLog.create({
    admin: req.admin.id,
    adminDisplayName: req.admin.displayName,
    action: "delete",
    memberId: member._id,
    memberName: `${member.prenom} ${member.nom}`,
  });

  res.json({ message: "Fiche supprimée." });
};

// GET /api/admin/members?q=...&status=...  — recherche/filtre côté admin
exports.searchMembers = async (req, res) => {
  const { q, status } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (q) filter.$text = { $search: q };

  const members = await Member.find(filter).sort({ createdAt: -1 });
  res.json(members);
};

// GET /api/admin/stats
exports.getStats = async (req, res) => {
  const [validated, pending, refused] = await Promise.all([
    Member.countDocuments({ status: "validated" }),
    Member.countDocuments({ status: "pending" }),
    Member.countDocuments({ status: "refused" }),
  ]);
  res.json({ validated, pending, refused });
};

// GET /api/admin/members/export — export simple en JSON (à convertir en CSV côté frontend si besoin)
exports.exportMembers = async (req, res) => {
  const members = await Member.find({ status: "validated" }).select("-photoBase64");
  res.json(members);
};
