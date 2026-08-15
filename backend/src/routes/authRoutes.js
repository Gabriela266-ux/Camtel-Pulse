const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { users } = require('../data/seedData');
const { authenticate } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/login', (req, res) => {
  const { email, password } = req.body || {};

  if (!email || !password) {
    return res.status(400).json({ ok: false, message: 'Email et mot de passe requis' });
  }

  const user = users.find((item) => item.email.toLowerCase() === String(email).toLowerCase());

  if (!user) {
    return res.status(401).json({ ok: false, message: 'Identifiants invalides' });
  }

  const isValid = bcrypt.compareSync(password, user.passwordHash);

  if (!isValid) {
    return res.status(401).json({ ok: false, message: 'Identifiants invalides' });
  }

  const token = jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role,
      centerId: user.centerId
    },
    process.env.JWT_SECRET || 'camtel-secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
  );

  return res.json({
    ok: true,
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      centerId: user.centerId,
      status: user.status
    }
  });
});

router.get('/me', authenticate, (req, res) => {
  return res.json({ ok: true, user: req.user });
});

module.exports = router;
