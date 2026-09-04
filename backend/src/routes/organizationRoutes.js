const express = require('express');
const { authenticate, authorize } = require('../middlewares/authMiddleware');
const db = require('../models');
const auditService = require('../services/auditService');
const {
    networkLabel,
    normalizeEntityCode,
    normalizePhone,
    normalizeZoneCode,
    partnerNetworkCode,
    dsmNetworkCode,
    posNetworkCode,
} = require('../utils/networkIdentity');

const router = express.Router();

router.use(authenticate);

const manageNetwork = authorize('chef_operationnel');
const createNetworkEntity = authorize('chef_operationnel', 'operationnel');
const updateNetworkEntity = authorize('chef_operationnel', 'operationnel');

async function audit(req, action, entite, entiteId, details) {
    await auditService.add({
        utilisateur_id: req.user.id,
        action,
        entite,
        entite_id: entiteId,
        details: { ...details, centre_id: (details && details.centre_id) || req.user.centerId || null },
    });
}

async function ensureUniquePhone(phone, excluded = {}) {
    const { Op } = db.Sequelize;
    const daWhere = { numero_sim: phone };
    const dsmWhere = { numero_telephone: phone };
    const posWhere = { numero_telephone: phone };
    if (excluded.daId) daWhere.id = { [Op.ne]: excluded.daId };
    if (excluded.dsmId) dsmWhere.id = { [Op.ne]: excluded.dsmId };
    if (excluded.posId) posWhere.id = { [Op.ne]: excluded.posId };

    const [partner, dsm, pos] = await Promise.all([
        db.Da.findOne({ where: daWhere, attributes: ['id'] }),
        db.Dsm.findOne({ where: dsmWhere, attributes: ['id'] }),
        db.Pos.findOne({ where: posWhere, attributes: ['id'] }),
    ]);
    if (partner || dsm || pos) {
        const error = new Error('Ce numéro est déjà utilisé par une autre entité du réseau');
        error.statusCode = 409;
        throw error;
    }
}

function assertDaWriteAccess(req, da) {
    if (req.user.role === 'operationnel' && !(req.user.partnerIds || []).includes(String(da.id))) {
        const error = new Error('Vous ne pouvez créer une entité que sous votre partenaire affecté');
        error.statusCode = 403;
        throw error;
    }
    if (req.user.centerId && String(da.centre_id) !== String(req.user.centerId)) {
        const error = new Error("Cette entité n'appartient pas à votre centre");
        error.statusCode = 403;
        throw error;
    }
}

async function deleteForeignKeyDependents(referencedTable, ids, transaction) {
    if (!ids.length) return;

    const dialect = db.sequelize.getDialect();
    const quoteIdentifier = (name) => dialect === 'mysql' ?
        `\`${String(name).replace(/`/g, '``')}\``
        : `"${String(name).replace(/"/g, '""')}"`;

    if (dialect === 'mysql') {
        const [foreignKeys] = await db.sequelize.query(
            `SELECT TABLE_NAME AS tableName, COLUMN_NAME AS columnName
             FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
             WHERE CONSTRAINT_SCHEMA = DATABASE()
               AND REFERENCED_TABLE_NAME = :referencedTable`,
            { replacements: { referencedTable }, transaction },
        );

        for (const foreignKey of Array.isArray(foreignKeys) ? foreignKeys : []) {
            await db.sequelize.query(
                `DELETE FROM ${quoteIdentifier(foreignKey.tableName)}
                 WHERE ${quoteIdentifier(foreignKey.columnName)} IN (:ids)`,
                { replacements: { ids }, transaction },
            );
        }
        return;
    }

    const tables = await db.sequelize.query(
        "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%'",
        { transaction, type: db.Sequelize.QueryTypes.SELECT }
    );
    for (const tableRow of Array.isArray(tables) ? tables : []) {
        const tableName = tableRow.name;
        if (tableName === referencedTable) continue;

        const foreignKeys = await db.sequelize.query(
            `PRAGMA foreign_key_list(${quoteIdentifier(tableName)})`,
            { transaction, type: db.Sequelize.QueryTypes.SELECT }
        );
        const matchingKeys = foreignKeys
            .filter((foreignKey) => foreignKey.table === referencedTable);

        for (const foreignKey of matchingKeys) {
            await db.sequelize.query(
                `DELETE FROM ${quoteIdentifier(tableName)} WHERE ${quoteIdentifier(foreignKey.from)} IN (:ids)`, { replacements: { ids }, transaction }
            );
        }
    }
}

async function deletePosData(posIds, transaction) {
    if (!posIds.length) return;

    if (db.Correction) await db.Correction.destroy({ where: { pos_id: posIds }, transaction });
    if (db.CalendrierAchat) await db.CalendrierAchat.destroy({ where: { pos_id: posIds }, transaction });
    if (db.PrevisionJournaliere) await db.PrevisionJournaliere.destroy({ where: { pos_id: posIds }, transaction });
    if (db.ObjectifMensuel) await db.ObjectifMensuel.destroy({ where: { pos_id: posIds }, transaction });
    if (db.Stock) await db.Stock.destroy({ where: { pos_id: posIds }, transaction });
    if (db.VenteDsmAuPos) await db.VenteDsmAuPos.destroy({ where: { pos_id: posIds }, transaction });
    await db.Utilisateur.update({ pos_id: null }, { where: { pos_id: posIds }, transaction });
}

async function deleteDsmData(dsmIds, transaction) {
    if (!dsmIds.length) return;

    const posRows = await db.Pos.findAll({ where: { dsm_id: dsmIds }, attributes: ['id'], transaction });
    const posIds = posRows.map((pos) => pos.id);
    await deletePosData(posIds, transaction);
    if (db.AchatJournaliere) await db.AchatJournaliere.destroy({ where: { dsm_id: dsmIds }, transaction });
    if (db.CalendrierAchat) await db.CalendrierAchat.destroy({ where: { dsm_id: dsmIds }, transaction });
    if (db.PrevisionJournaliere) await db.PrevisionJournaliere.destroy({ where: { dsm_id: dsmIds }, transaction });
    if (db.ObjectifMensuel) await db.ObjectifMensuel.destroy({ where: { dsm_id: dsmIds }, transaction });
    if (db.Stock) await db.Stock.destroy({ where: { dsm_id: dsmIds }, transaction });
    if (db.VenteDsmAuPos) await db.VenteDsmAuPos.destroy({ where: { dsm_id: dsmIds }, transaction });
    await db.Utilisateur.update({ dsm_id: null }, { where: { dsm_id: dsmIds }, transaction });
    await db.Pos.destroy({ where: { dsm_id: dsmIds }, transaction });
}

router.post('/clients', authorize('chef_operationnel'), async(req, res, next) => {
    try {
        const nom = String((req.body && req.body.nom) || '').trim();
        const region = String((req.body && req.body.region) || '').trim();
        const numeroSim = normalizePhone(req.body && (req.body.numero_sim || req.body.masterSim), 'La Master SIM');
        const codeZone = normalizeZoneCode(req.body && (req.body.code_zone || req.body.codeZone));
        const centreId = req.user.centerId;

        if (!nom || !region || !centreId) {
            return res.status(400).json({ ok: false, message: 'nom, region et centre_id sont obligatoires' });
        }

        const centre = await db.Centre.findOne({ where: { id: centreId, active: true } });
        if (!centre) {
            return res.status(404).json({ ok: false, message: 'Centre introuvable' });
        }

        await ensureUniquePhone(numeroSim);
        const code = partnerNetworkCode(codeZone);
        const client = await db.Da.create({
            centre_id: centreId,
            code,
            nom,
            region,
            numero_sim: numeroSim,
            code_zone: codeZone,
            objectif_mensuel: 0,
            active: true,
        });

        await audit(req, 'partenaire_ajoute', 'da', client.id, {
            nom,
            region,
            numero_sim: numeroSim,
            code_zone: codeZone,
            nom_reseau: networkLabel(numeroSim, code),
            centre_id: centreId,
        });

        return res.status(201).json({ ok: true, data: client });
    } catch (error) {
        return next(error);
    }
});

router.patch('/clients/:id', manageNetwork, async(req, res, next) => {
    try {
        const client = await db.Da.findByPk(req.params.id);
        if (!client) return res.status(404).json({ ok: false, message: 'Partenaire introuvable' });
        assertDaWriteAccess(req, client);
        const updates = {};
        if (req.body && req.body.nom !== undefined) updates.nom = String(req.body.nom).trim();
        if (req.body && req.body.region !== undefined) updates.region = String(req.body.region).trim();
        if (req.body && req.body.numero_sim !== undefined) {
            updates.numero_sim = normalizePhone(req.body.numero_sim, 'La Master SIM');
            await ensureUniquePhone(updates.numero_sim, { daId: client.id });
        }
        if (req.body && (req.body.code_zone !== undefined || req.body.codeZone !== undefined)) {
            updates.code_zone = normalizeZoneCode(req.body.code_zone || req.body.codeZone);
            updates.code = partnerNetworkCode(updates.code_zone);
        }
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
        assertDaWriteAccess(req, client);
        await db.sequelize.transaction(async(transaction) => {
            const dsmRows = await db.Dsm.findAll({ where: { da_id: client.id }, attributes: ['id'], transaction });
            const dsmIds = dsmRows.map((dsm) => dsm.id);
            await deleteDsmData(dsmIds, transaction);
            if (db.AchatJournaliere) await db.AchatJournaliere.destroy({ where: { da_id: client.id }, transaction });
            if (db.CalendrierAchat) await db.CalendrierAchat.destroy({ where: { da_id: client.id }, transaction });
            if (db.ObjectifMensuel) await db.ObjectifMensuel.destroy({ where: { da_id: client.id }, transaction });
            if (db.PrevisionJournaliere) await db.PrevisionJournaliere.destroy({ where: { da_id: client.id }, transaction });
            await db.Utilisateur.update({ da_id: null }, { where: { da_id: client.id }, transaction });
            await db.Dsm.destroy({ where: { da_id: client.id }, transaction });
            await deleteForeignKeyDependents('da', [client.id], transaction);
            await client.destroy({ transaction });
        });
        await audit(req, 'partenaire_supprime', 'da', req.params.id, {});
        return res.json({ ok: true, data: { id: req.params.id } });
    } catch (error) { return next(error); }
});

router.post('/dsms', createNetworkEntity, async(req, res, next) => {
    try {
        const nom = String((req.body && req.body.nom) || '').trim();
        const daId = req.body && req.body.da_id;
        const numeroTelephone = normalizePhone(req.body && req.body.numero_telephone, 'Le numéro du DSM');
        const codeDsm = normalizeEntityCode(req.body && req.body.code_dsm, 'DSM', 'Le code DSM');
        const codeZone = normalizeZoneCode(req.body && req.body.code_zone, 'Le code zone du DSM');
        if (!nom || !daId) return res.status(400).json({ ok: false, message: 'nom et da_id sont obligatoires' });
        const da = await db.Da.findByPk(daId);
        if (!da) return res.status(404).json({ ok: false, message: 'Partenaire introuvable' });
        assertDaWriteAccess(req, da);
        await ensureUniquePhone(numeroTelephone);
        const duplicateCode = await db.Dsm.findOne({ where: { da_id: daId, code_dsm: codeDsm } });
        if (duplicateCode) return res.status(409).json({ ok: false, message: 'Ce code DSM existe déjà pour ce partenaire' });

        const dsm = await db.Dsm.create({
            da_id: daId,
            nom,
            numero_telephone: numeroTelephone,
            code_dsm: codeDsm,
            code_zone: codeZone,
            contact: numeroTelephone,
            statut: 'actif',
        });
        await audit(req, 'dsm_ajoute', 'dsm', dsm.id, {
            nom,
            da_id: daId,
            numero_telephone: numeroTelephone,
            code_dsm: codeDsm,
            code_zone: codeZone,
            nom_reseau: networkLabel(numeroTelephone, dsmNetworkCode(codeDsm, codeZone)),
        });
        return res.status(201).json({ ok: true, data: dsm });
    } catch (error) { return next(error); }
});

router.patch('/dsms/:id', updateNetworkEntity, async(req, res, next) => {
    try {
        const dsm = await db.Dsm.findByPk(req.params.id, { include: [{ model: db.Da, as: 'da' }] });
        if (!dsm) return res.status(404).json({ ok: false, message: 'DSM introuvable' });
        assertDaWriteAccess(req, dsm.da);
        const updates = {};
        if (req.body && req.body.nom !== undefined) updates.nom = String(req.body.nom).trim();
        if (!updates.nom && req.body && req.body.nom !== undefined) {
            return res.status(400).json({ ok: false, message: 'Le nom est obligatoire' });
        }
        if (req.body && req.body.numero_telephone !== undefined) {
            updates.numero_telephone = normalizePhone(req.body.numero_telephone, 'Le numéro du DSM');
            updates.contact = updates.numero_telephone;
            await ensureUniquePhone(updates.numero_telephone, { dsmId: dsm.id });
        }
        if (req.body && req.body.code_dsm !== undefined) {
            updates.code_dsm = normalizeEntityCode(req.body.code_dsm, 'DSM', 'Le code DSM');
            const duplicateCode = await db.Dsm.findOne({
                where: { da_id: dsm.da_id, code_dsm: updates.code_dsm, id: { [db.Sequelize.Op.ne]: dsm.id } },
            });
            if (duplicateCode) return res.status(409).json({ ok: false, message: 'Ce code DSM existe déjà pour ce partenaire' });
        }
        if (req.body && req.body.code_zone !== undefined) {
            updates.code_zone = normalizeZoneCode(req.body.code_zone, 'Le code zone du DSM');
        }
        await db.sequelize.transaction(async(transaction) => {
            await dsm.update(updates, { transaction });
            if (updates.code_dsm || updates.code_zone) {
                await db.Pos.update({
                    code_dsm: updates.code_dsm || dsm.code_dsm,
                    code_zone: updates.code_zone || dsm.code_zone,
                }, { where: { dsm_id: dsm.id }, transaction });
            }
        });
        await audit(req, 'dsm_modifie', 'dsm', dsm.id, updates);
        return res.json({ ok: true, data: dsm });
    } catch (error) { return next(error); }
});

router.delete('/dsms/:id', manageNetwork, async(req, res, next) => {
    try {
        const dsm = await db.Dsm.findByPk(req.params.id, { include: [{ model: db.Da, as: 'da' }] });
        if (!dsm) return res.status(404).json({ ok: false, message: 'DSM introuvable' });
        assertDaWriteAccess(req, dsm.da);
        await db.sequelize.transaction(async(transaction) => {
            await deleteDsmData([dsm.id], transaction);
            await deleteForeignKeyDependents('dsm', [dsm.id], transaction);
            await dsm.destroy({ transaction });
        });
        await audit(req, 'dsm_supprime', 'dsm', req.params.id, {});
        return res.json({ ok: true, data: { id: req.params.id } });
    } catch (error) { return next(error); }
});

router.post('/pos', createNetworkEntity, async(req, res, next) => {
    try {
        const dsmId = req.body && req.body.dsm_id;
        const numeroTelephone = normalizePhone(req.body && req.body.numero_telephone, 'Le numéro du POS');
        const codePos = normalizeEntityCode(req.body && req.body.code_pos, 'POS', 'Le code POS');
        if (!dsmId) return res.status(400).json({ ok: false, message: 'dsm_id est obligatoire' });
        const dsm = await db.Dsm.findByPk(dsmId, { include: [{ model: db.Da, as: 'da' }] });
        if (!dsm) return res.status(404).json({ ok: false, message: 'DSM introuvable' });
        assertDaWriteAccess(req, dsm.da);
        if (!dsm.code_dsm || !dsm.code_zone) {
            return res.status(409).json({ ok: false, message: 'Complétez le code DSM et le code zone du DSM avant d’ajouter un POS' });
        }
        await ensureUniquePhone(numeroTelephone);
        const duplicateCode = await db.Pos.findOne({ where: { dsm_id: dsmId, code_pos: codePos } });
        if (duplicateCode) return res.status(409).json({ ok: false, message: 'Ce code POS existe déjà sous ce DSM' });

        const generatedCode = posNetworkCode(codePos, dsm.code_dsm, dsm.code_zone);
        const nom = String((req.body && req.body.nom) || '').trim() || generatedCode;
        const pos = await db.Pos.create({
            dsm_id: dsmId,
            zone_id: dsm.zone_id || null,
            nom,
            numero_telephone: numeroTelephone,
            code_pos: codePos,
            code_dsm: dsm.code_dsm,
            code_zone: dsm.code_zone,
            contact: numeroTelephone,
            statut: 'actif',
        });
        await audit(req, 'pos_ajoute', 'pos', pos.id, {
            nom,
            dsm_id: dsmId,
            numero_telephone: numeroTelephone,
            code_pos: codePos,
            code_dsm: dsm.code_dsm,
            code_zone: dsm.code_zone,
            nom_reseau: networkLabel(numeroTelephone, generatedCode),
        });
        return res.status(201).json({ ok: true, data: pos });
    } catch (error) { return next(error); }
});

router.patch('/pos/:id', updateNetworkEntity, async(req, res, next) => {
    try {
        const pos = await db.Pos.findByPk(req.params.id, {
            include: [{
                model: db.Dsm,
                as: 'dsm',
                include: [{ model: db.Da, as: 'da' }],
            }],
        });
        if (!pos) return res.status(404).json({ ok: false, message: 'POS introuvable' });
        assertDaWriteAccess(req, pos.dsm.da);
        const updates = {};
        if (req.body && req.body.nom !== undefined) updates.nom = String(req.body.nom).trim();
        if (req.body && req.body.numero_telephone !== undefined) {
            updates.numero_telephone = normalizePhone(req.body.numero_telephone, 'Le numéro du POS');
            updates.contact = updates.numero_telephone;
            await ensureUniquePhone(updates.numero_telephone, { posId: pos.id });
        }
        if (req.body && req.body.code_pos !== undefined) {
            updates.code_pos = normalizeEntityCode(req.body.code_pos, 'POS', 'Le code POS');
        }
        if (req.body && req.body.dsm_id) updates.dsm_id = req.body.dsm_id;
        if (!updates.nom && req.body && req.body.nom !== undefined) return res.status(400).json({ ok: false, message: 'Le nom est obligatoire' });
        const changesNetworkIdentity = Boolean(
            req.body && (
                req.body.numero_telephone !== undefined ||
                req.body.code_pos !== undefined ||
                req.body.dsm_id !== undefined
            )
        );
        if (changesNetworkIdentity) {
            const targetDsm = await db.Dsm.findByPk(updates.dsm_id || pos.dsm_id, { include: [{ model: db.Da, as: 'da' }] });
            if (!targetDsm) return res.status(404).json({ ok: false, message: 'DSM introuvable' });
            assertDaWriteAccess(req, targetDsm.da);
            if (!targetDsm.code_dsm || !targetDsm.code_zone) {
                return res.status(409).json({ ok: false, message: 'Le DSM de destination ne possède pas encore ses identifiants réseau' });
            }
            const effectiveCodePos = updates.code_pos || pos.code_pos;
            if (!effectiveCodePos) {
                return res.status(409).json({ ok: false, message: 'Complétez le code POS avant de modifier ou déplacer cette entité' });
            }
            const duplicateCode = await db.Pos.findOne({
                where: {
                    dsm_id: targetDsm.id,
                    code_pos: effectiveCodePos,
                    id: { [db.Sequelize.Op.ne]: pos.id },
                },
            });
            if (duplicateCode) return res.status(409).json({ ok: false, message: 'Ce code POS existe déjà sous le DSM de destination' });
            updates.zone_id = targetDsm.zone_id || null;
            updates.code_dsm = targetDsm.code_dsm;
            updates.code_zone = targetDsm.code_zone;
        }
        await pos.update(updates);
        await audit(req, 'pos_modifie', 'pos', pos.id, updates);
        return res.json({ ok: true, data: pos });
    } catch (error) { return next(error); }
});

router.delete('/pos/:id', manageNetwork, async(req, res, next) => {
    try {
        const pos = await db.Pos.findByPk(req.params.id, {
            include: [{ model: db.Dsm, as: 'dsm', include: [{ model: db.Da, as: 'da' }] }],
        });
        if (!pos) return res.status(404).json({ ok: false, message: 'POS introuvable' });
        assertDaWriteAccess(req, pos.dsm.da);
        await db.sequelize.transaction(async(transaction) => {
            await deletePosData([pos.id], transaction);
            await deleteForeignKeyDependents('pos', [pos.id], transaction);
            await pos.destroy({ transaction });
        });
        await audit(req, 'pos_supprime', 'pos', req.params.id, {});
        return res.json({ ok: true, data: { id: req.params.id } });
    } catch (error) { return next(error); }
});

router.get('/centers', async(req, res) => {
    try {
        const centers = await db.Centre.findAll({ where: req.user.role === 'super_admin' ? {} : { id: req.user.centerId } });
        res.json({ ok: true, data: centers });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
});

router.get('/clients', async(req, res) => {
    try {
        const clients = await db.Da.findAll({ where: req.user.role === 'super_admin' ? {} : { centre_id: req.user.centerId } });
        res.json({ ok: true, data: clients });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
});

router.get('/dsms', async(req, res) => {
    try {
        const dsms = await db.Dsm.findAll({
            include: [{ model: db.Da, as: 'da', required: true, where: req.user.role === 'super_admin' ? {} : { centre_id: req.user.centerId } }]
        });
        res.json({ ok: true, data: dsms });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
});

router.get('/pos', async(req, res) => {
    try {
        const pos = await db.Pos.findAll({
            include: [{ model: db.Dsm, as: 'dsm', required: true, include: [{ model: db.Da, as: 'da', required: true, where: req.user.role === 'super_admin' ? {} : { centre_id: req.user.centerId } }] }]
        });
        res.json({ ok: true, data: pos });
    } catch (error) {
        res.status(500).json({ ok: false, message: error.message });
    }
});

module.exports = router;
