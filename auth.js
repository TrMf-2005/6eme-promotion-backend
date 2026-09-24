const jwt = require("jsonwebtoken");

function verifyAdmin(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Non authentifié." });
  }
  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "admin") throw new Error("mauvais type de jeton");
    req.admin = payload; // { id, username, displayName, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: "Session invalide ou expirée." });
  }
}

// Réservé à l'admin principal : gestion des admins et consultation de l'historique
function requirePrincipal(req, res, next) {
  if (req.admin.role !== "principal") {
    return res.status(403).json({ message: "Réservé à l'administrateur principal." });
  }
  next();
}

// Vérifie que la personne a bien saisi le mot de passe commun d'accès au site
// avant de pouvoir consulter le formulaire ou l'annuaire.
function verifySiteAccess(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Accès au site non vérifié." });
  }
  try {
    const token = header.split(" ")[1];
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.type !== "site-access") throw new Error("mauvais type de jeton");
    next();
  } catch (err) {
    return res.status(401).json({ message: "Accès au site non vérifié." });
  }
}

module.exports = { verifyAdmin, requirePrincipal, verifySiteAccess };
