const jwt = require('jsonwebtoken');
const { users } = require('../data/seedData');

function authenticate(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : null;

  if (!token) {
    return res.status(401).json({ ok: false, message: 'Token manquant' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'camtel-secret');
    const persistedUser = users.find((user) => user.id === decoded.sub || user.email === decoded.email) || null;

    if (!persistedUser) {
      return res.status(401).json({ ok: false, message: 'Utilisateur introuvable' });
    }

    req.user = {
      id: persistedUser.id,
      name: persistedUser.name,
      email: persistedUser.email,
      role: persistedUser.role,
      centerId: persistedUser.centerId,
      status: persistedUser.status
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
