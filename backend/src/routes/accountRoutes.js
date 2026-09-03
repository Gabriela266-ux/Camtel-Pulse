const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const accountService = require('../services/accountService');

const router = express.Router();

// POST /api/accounts/request — dépôt d'une demande d'accès (public).
// Le rôle demandé est validé côté backend à partir de la table `role`.
router.post('/request', async(req, res, next) => {
    try {
        const data = await accountService.requestAccount(req.body || {});
        res.status(201).json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

// GET /api/accounts/roles — rôles pouvant faire l'objet d'une demande (public).
// Les identifiants proviennent toujours de la base de données.
router.get('/roles', async(req, res, next) => {
    try {
        const data = await accountService.listRequestRoles();
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

router.get('/request-roles', async(req, res, next) => {
    try {
        const data = await accountService.listRequestRoles();
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

// GET /api/accounts/postes — liste des postes disponibles (public).
router.get('/postes', async(req, res, next) => {
    try {
        const data = await accountService.listPostes();
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

router.post('/password-reset', async(req, res, next) => {
    try {
                const data = await accountService.requestPasswordReset(req.body && (req.body.identifiant || req.body.email));
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

router.post('/delete', async(req, res, next) => {
    try {
                const data = await accountService.deleteAccount(req.body && (req.body.identifiant || req.body.email), req.body && req.body.password);
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

router.use(authenticate);

router.get('/pending', authorize('admin', 'super_admin'), async(req, res, next) => {
    try {
        const data = await accountService.listPendingAccounts(req.user);
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

// Approbation d'une demande : associe poste_id + role_id à l'utilisateur,
// active son compte et enregistre l'admin ayant validé + la date.
router.patch('/:id/approve', authorize('admin', 'super_admin'), async(req, res, next) => {
    try {
        const data = await accountService.approveAccount(req.params.id, req.user);
        res.json({ ok: true, data, message: 'Demande validée. Le compte peut maintenant se connecter.' });
    } catch (error) {
        next(error);
    }
});

// Refus d'une demande : le motif est obligatoire.
router.patch('/:id/reject', authorize('admin', 'super_admin'), async(req, res, next) => {
    try {
        const data = await accountService.rejectAccount(req.params.id, req.body && req.body.motif, req.user);
        res.json({ ok: true, data, message: 'Demande refusée.' });
    } catch (error) {
        next(error);
    }
});

router.use(authorize('admin', 'super_admin'));

router.get('/users', async(req, res, next) => {
    try {
        const data = await accountService.listUsers(req.user);
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

router.post('/users', async(req, res, next) => {
    try {
        const data = await accountService.createUserByAdmin(req.body || {}, req.user);
        res.status(201).json({ ok: true, data, message: 'Compte créé avec succès.' });
    } catch (error) {
        next(error);
    }
});

router.patch('/users/:id/reset-password', async(req, res, next) => {
    try {
        const data = await accountService.resetUserPassword(req.params.id, req.user);
        res.json({ ok: true, data, message: 'Mot de passe réinitialisé avec succès.' });
    } catch (error) {
        next(error);
    }
});

router.delete('/users/:id', async(req, res, next) => {
    try {
        const data = await accountService.deleteUserByAdmin(req.params.id, req.user);
        res.json({ ok: true, data, message: 'Compte supprimé avec succès.' });
    } catch (error) {
        next(error);
    }
});

// Historique complet des demandes d'acces (toutes les statuts).
router.get('/demandes', async(req, res, next) => {
    try {
        const data = await accountService.listAllDemandes(req.user);
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

// Envoi d'un message email par l'administrateur a un utilisateur.
router.post('/:id/message', async(req, res, next) => {
    try {
        const data = await accountService.sendUserMessage(req.params.id, req.body && req.body.message, req.user);
        res.json({ ok: true, data, message: data.sent ? 'Message envoye a l\'utilisateur.' : 'Message enregistre mais envoi email impossible (SMTP).' });
    } catch (error) {
        next(error);
    }
});

router.patch('/:id', async(req, res, next) => {
    try {
        const data = await accountService.updateUser(req.params.id, req.body || {}, req.user);
        res.json({ ok: true, data });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
