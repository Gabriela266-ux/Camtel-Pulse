const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const db = require('../models');
const auditService = require('../services/auditService');

const router = express.Router();

router.use(authenticate);

const manageNetwork = authorize('admin', 'chef_operationnel', 'operationnel');

async function audit(req, action, entite, entiteId, details) {
    await auditService.add({
        utilisateur_id: req.user.id,
        action,
        entite,
        entite_id: entiteId,
        details,
    });
}

router.post('/clients', authorize('admin', 'chef_operationnel'), async(req, res, next) => {
    try {
        const nom = String((req.body && req.body.nom) || '').trim();
        const region = String((req.body && req.body.region) || '').trim();
        const numeroSim = String((req.body && req.body.numero_sim) || '').trim();
        const centreId = (req.body && req.body.centre_id) || req.user.centerId;

        if (!nom || !region || !numeroSim || !centreId) {
            return res.status(400).json({ ok: false, message: 'nom, region, numero_sim et centre_id sont obligatoires' });
        }

        const centre = await db.Centre.findByPk(centreId);
        if (!centre) {
            return res.status(404).json({ ok: false, message: 'Centre introuvable' });
        }

        const client = await db.Da.create({
            centre_id: centreId,
            code: `DA-${Date.now()}`,
            nom,
            region,
            numero_sim: numeroSim,
            objectif_mensuel: 0,
            active: true,
        });

        await audit(req, 'partenaire_ajoute', 'da', client.id, { nom, region, numero_sim: numeroSim, centre_id: centreId });

        return res.status(201).json({ ok: true, data: client });
    } catch (error) {
        return next(error);
    }
});

router.patch('/clients/:id', manageNetwork, async(req, res, next) => {
    try {
        const client = await db.Da.findByPk(req.params.id);
        if (!client) return res.status(404).json({ ok: false, message: 'Partenaire introuvable' });
        const updates = {};
        if (req.body && req.body.nom !== undefined) updates.nom = String(req.body.nom).trim();
        if (req.body && req.body.region !== undefined) updates.region = String(req.body.region).trim();
        if (req.body && req.body.numero_sim !== undefined) updates.numero_sim = String(req.body.numero_sim).trim();
        if (!updates.nom && req.body && req.body.nom !== undefined) return res.status(400).json({ ok: false, message: 'Le nom est obligatoire' });
        await client.update(updates);
        await audit(req, 'partenaire_modifie', 'da', client.id, updates);
        return res.json({ ok: true, data: client });
    } catch (error) { return next(error); }
});

router.delete('/clients/:id', manageNetwork, async(req, res, next) => {
    try {
        const client = await db.Da.findByPk(req.params.id);
        if (!client) return res.status(404).json({ ok: false, message: 'Partenaire introuvable' });
        await client.destroy();
        await audit(req, 'partenaire_supprime', 'da', req.params.id, {});
        return res.json({ ok: true, data: { id: req.params.id } });
    } catch (error) { return next(error); }
});

router.post('/dsms', manageNetwork, async(req, res, next) => {
    try {
        const nom = String((req.body && req.body.nom) || '').trim();
        const daId = req.body && req.body.da_id;
        if (!nom || !daId) return res.status(400).json({ ok: false, message: 'nom et da_id sont obligatoires' });
        const da = await db.Da.findByPk(daId);
        if (!da) return res.status(404).json({ ok: false, message: 'Partenaire introuvable' });
        const dsm = await db.Dsm.create({ da_id: daId, nom, statut: 'actif' });
        await audit(req, 'dsm_ajoute', 'dsm', dsm.id, { nom, da_id: daId });
        return res.status(201).json({ ok: true, data: dsm });
    } catch (error) { return next(error); }
});

router.patch('/dsms/:id', manageNetwork, async(req, res, next) => {
    try {
        const dsm = await db.Dsm.findByPk(req.params.id);
        if (!dsm) return res.status(404).json({ ok: false, message: 'DSM introuvable' });
        const nom = String((req.body && req.body.nom) || '').trim();
        if (!nom) return res.status(400).json({ ok: false, message: 'Le nom est obligatoire' });
        await dsm.update({ nom });
        await audit(req, 'dsm_modifie', 'dsm', dsm.id, { nom });
        return res.json({ ok: true, data: dsm });
    } catch (error) { return next(error); }
});

router.delete('/dsms/:id', manageNetwork, async(req, res, next) => {
    try {
        const dsm = await db.Dsm.findByPk(req.params.id);
        if (!dsm) return res.status(404).json({ ok: false, message: 'DSM introuvable' });
        await dsm.destroy();
        await audit(req, 'dsm_supprime', 'dsm', req.params.id, {});
        return res.json({ ok: true, data: { id: req.params.id } });
    } catch (error) { return next(error); }
});

router.post('/pos', manageNetwork, async(req, res, next) => {
    try {
        const nom = String((req.body && req.body.nom) || '').trim();
        const dsmId = req.body && req.body.dsm_id;
        if (!nom || !dsmId) return res.status(400).json({ ok: false, message: 'nom et dsm_id sont obligatoires' });
        const dsm = await db.Dsm.findByPk(dsmId);
        if (!dsm) return res.status(404).json({ ok: false, message: 'DSM introuvable' });
        const pos = await db.Pos.create({ dsm_id: dsmId, nom, statut: 'actif' });
        await audit(req, 'pos_ajoute', 'pos', pos.id, { nom, dsm_id: dsmId });
        return res.status(201).json({ ok: true, data: pos });
    } catch (error) { return next(error); }
});

router.patch('/pos/:id', manageNetwork, async(req, res, next) => {
    try {
        const pos = await db.Pos.findByPk(req.params.id);
        if (!pos) return res.status(404).json({ ok: false, message: 'POS introuvable' });
        const updates = {};
        if (req.body && req.body.nom !== undefined) updates.nom = String(req.body.nom).trim();
        if (req.body && req.body.dsm_id) updates.dsm_id = req.body.dsm_id;
        if (!updates.nom && req.body && req.body.nom !== undefined) return res.status(400).json({ ok: false, message: 'Le nom est obligatoire' });
        if (updates.dsm_id && !(await db.Dsm.findByPk(updates.dsm_id))) return res.status(404).json({ ok: false, message: 'DSM introuvable' });
        await pos.update(updates);
        await audit(req, 'pos_modifie', 'pos', pos.id, updates);
        return res.json({ ok: true, data: pos });
    } catch (error) { return next(error); }
});

router.delete('/pos/:id', manageNetwork, async(req, res, next) => {
    try {
        const pos = await db.Pos.findByPk(req.params.id);
        if (!pos) return res.status(404).json({ ok: false, message: 'POS introuvable' });
        await pos.destroy();
        await audit(req, 'pos_supprime', 'pos', req.params.id, {});
        return res.json({ ok: true, data: { id: req.params.id } });
    } catch (error) { return next(error); }
});

router.get('/centers', async(req, res) => {
    try {
        const centers = await db.Centre.findAll();
        res.json({ ok: true, data: centers });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
});

router.get('/clients', async(req, res) => {
    try {
        const clients = await db.Da.findAll();
        res.json({ ok: true, data: clients });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
});

router.get('/dsms', async(req, res) => {
    try {
        const dsms = await db.Dsm.findAll({
            include: [{ model: db.Da, as: 'da' }]
        });
        res.json({ ok: true, data: dsms });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
});

router.get('/pos', async(req, res) => {
    try {
        const pos = await db.Pos.findAll({
            include: [{ model: db.Dsm, as: 'dsm' }]
        });
        res.json({ ok: true, data: pos });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
});

module.exports = router;