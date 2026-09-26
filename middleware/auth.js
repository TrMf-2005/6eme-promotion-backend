const jwt = require('jsonwebtoken');

// Vérifie qu'un token JWT admin valide est présent
function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: 'Authentification requise.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.admin = payload; // { id, username, role }
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Session invalide ou expirée.' });
  }
}

// A utiliser après requireAdmin : réserve la route à l'admin principal (Régis)
function requirePrincipal(req, res, next) {
  if (req.admin?.role !== 'principal') {
    return res.status(403).json({ message: 'Réservé à l\'administrateur principal.' });
  }
  next();
}

module.exports = { requireAdmin, requirePrincipal };
