const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const importService = require('../services/importService');
const { body, validationResult } = require('express-validator');

const router = express.Router();

router.use(authenticate);

const MAX_CSV_SIZE = 10 * 1024 * 1024; // 10MB

router.post('/csv', authorize('admin'), body('content').isString().isLength({ min: 1, max: 10 * 1024 * 1024 }), async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ ok: false, message: 'Contenu CSV invalide', errors: errors.array() });
    const { content } = req.body || {};

    if (!content) {
      return res.status(400).json({ ok: false, message: 'Le contenu CSV est obligatoire' });
    }

    // Validate size
    if (content.length > MAX_CSV_SIZE) {
      return res.status(413).json({ 
        ok: false, 
        message: `Fichier CSV dépasse 10MB (reçu: ${(content.length / 1024 / 1024).toFixed(2)}MB)` 
      });
    }

    const data = await importService.importFromCsv(content, { centreId: req.user.centerId });
    return res.status(201).json({ 
      ok: true, 
      data: {
        imported: data.totalImported || data.length,
        records: data.records || data
      }
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
