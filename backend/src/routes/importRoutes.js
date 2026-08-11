const express = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const importService = require('../services/importService');

const router = express.Router();

router.use(authenticate);

router.post('/csv', (req, res) => {
  const { content } = req.body || {};

  if (!content) {
    return res.status(400).json({ ok: false, message: 'Le contenu CSV est obligatoire' });
  }

  const data = importService.importFromCsv(content);
  return res.status(201).json({ ok: true, data });
});

module.exports = router;
