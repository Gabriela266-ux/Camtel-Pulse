const jwt = require('jsonwebtoken');
const db = require('../models');

async function authenticate(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, message: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'camtel-secret');
    const user = await db.Utilisateur.findOne({
      where: { id: decoded.sub },
      include: [{ model: db.Role, as: 'role' }]
    });

    if (!user) {
      return res.status(401).json({ ok: false, message: 'Utilisateur introuvable' });
    }

    req.user = {
      id: user.id,
      nom_complet: user.nom_complet,
      email: user.email,
      role: user.role.libelle,
      da_id: user.da_id,
      status: user.statut
    };

    return next();
  } catch (error) {
    return res.status(401).json({ ok: false, message: 'Token invalide ou expiré' });
  }
}
function authorize(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ ok: false, message: 'Authentification requise' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, message: 'Droits insuffisants' });
    }

    return next();
  };
}

module.exports = { authenticate, authorize };
