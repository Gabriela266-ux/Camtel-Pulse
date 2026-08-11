function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ ok: false, message: 'Authentification requise' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ ok: false, message: 'Droits insuffisants pour cette action' });
    }

    return next();
  };
}

module.exports = { authorize };
