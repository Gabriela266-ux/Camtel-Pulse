const db = require('../models');

const calculateSecurityStock = (objectifMensuel, daysCount = 31) => {
    if (!objectifMensuel || Number(objectifMensuel) <= 0) return 0;
    return (Number(objectifMensuel) / Number(daysCount || 31)) * 3;
};

class SaisieService {
    async getEntity(entityType, entityId) {
        if (entityType === 'POS') {
            const pos = await db.Pos.findByPk(entityId);
            if (!pos) throw new Error('POS introuvable');
            const dsm = await db.Dsm.findByPk(pos.dsm_id);
            if (!dsm) throw new Error('DSM parent introuvable');
            return { entity: pos, da_id: dsm.da_id, dsm_id: pos.dsm_id, pos_id: pos.id };
        }
        if (entityType === 'DSM') {
            const dsm = await db.Dsm.findByPk(entityId);
            if (!dsm) throw new Error('DSM introuvable');
            return { entity: dsm, da_id: dsm.da_id, dsm_id: dsm.id, pos_id: null };
        }
        if (entityType === 'DA') {
            const da = await db.Da.findByPk(entityId);
            if (!da) throw new Error('Partenaire introuvable');
            return { entity: da, da_id: da.id, dsm_id: null, pos_id: null };
        }
        throw new Error('Type d\'entité invalide');
    }

    async getObjectifMensuel(entityType, entityId, date) {
        const d = new Date(date);
        const annee = d.getFullYear();
        const mois = d.getMonth() + 1;

        if (entityType === 'DA') {
            const da = await db.Da.findByPk(entityId);
            return Number((da && da.objectif_mensuel) || 0);
        }
        const where = entityType === 'POS' ? { pos_id: entityId } : { dsm_id: entityId };
        const objectif = await db.ObjectifMensuel.findOne({ where: { ...where, annee, mois } });

        return Number((objectif && objectif.montant_objectif) || 0);
    }

    async buildRecord(payload) {
        const { da_id, dsm_id, pos_id } = await this.getEntity(payload.entity_type, payload.entity_id);
        const date = payload.date || new Date().toISOString().slice(0, 10);
        const venteJour = Number(payload.vente_jour || 0);

        const objectifMensuel = await this.getObjectifMensuel(payload.entity_type, payload.entity_id, date);
        const stockSecurite = calculateSecurityStock(objectifMensuel, 31);

        const historique = payload.entity_type === 'POS'
            ? await db.VenteDsmAuPos.findAll({ where: { pos_id, date_vente: { [db.Sequelize.Op.lte]: date } } })
            : await db.AchatJournaliere.findAll({
                where: {
                    scope_type: payload.entity_type,
                    da_id,
                    ...(payload.entity_type === 'DSM' ? { dsm_id } : { dsm_id: null }),
                    date_achat: { [db.Sequelize.Op.lte]: date }
                }
            });

        const ecartJour = venteJour - stockSecurite;
        const ecartCumule =
            historique.reduce((sum, item) => sum + (Number(item.montant || item.montant_achat || 0) - stockSecurite), 0) + ecartJour;

        return {
            da_id,
            dsm_id,
            pos_id,
            entity_type: payload.entity_type,
            date,
            vente_jour: venteJour,
            objectif_mensuel: objectifMensuel,
            stock_securite: stockSecurite,
            ecart_jour: ecartJour,
            ecart_cumule: ecartCumule,
            created_at: new Date().toISOString()
        };
    }

    async create(payload) {
        const { da_id, dsm_id, pos_id } = await this.getEntity(payload.entity_type, payload.entity_id);
        const record = await this.buildRecord(payload);

        let vente;
        if (pos_id) {
            const existingSales = await db.VenteDsmAuPos.findAll({
                where: { pos_id, date_vente: record.date },
                order: [['created_at', 'ASC']]
            });
            if (existingSales.length > 0) {
                vente = existingSales[0];
                await vente.update({
                    dsm_id,
                    utilisateur_id: payload.utilisateur_id || vente.utilisateur_id,
                    quantite_vendu: record.vente_jour,
                    montant: record.vente_jour
                });
                for (const duplicate of existingSales.slice(1)) await duplicate.destroy();
            } else {
                vente = await db.VenteDsmAuPos.create({
                    dsm_id,
                    pos_id,
                    utilisateur_id: payload.utilisateur_id || null,
                    date_vente: record.date,
                    quantite_vendu: record.vente_jour,
                    montant: record.vente_jour
                });
            }
        } else {
            const where = {
                scope_type: payload.entity_type,
                da_id,
                dsm_id: payload.entity_type === 'DSM' ? dsm_id : null,
                date_achat: record.date
            };
            const [achat] = await db.AchatJournaliere.findOrCreate({
                where,
                defaults: { ...where, utilisateur_id: payload.utilisateur_id || null, montant_achat: record.vente_jour }
            });
            await achat.update({ utilisateur_id: payload.utilisateur_id || achat.utilisateur_id, montant_achat: record.vente_jour });
            vente = achat;
        }

        if (payload.stock_journalier !== undefined && payload.stock_journalier !== null) {
            const stockWhere = pos_id
                ? { pos_id, date_stock: record.date }
                : payload.entity_type === 'DSM'
                    ? { da_id: null, dsm_id, pos_id: null, date_stock: record.date }
                    : { da_id, dsm_id: null, pos_id: null, date_stock: record.date };
            const [stockRow] = await db.Stock.findOrCreate({
                where: stockWhere,
                defaults: {
                    da_id: payload.entity_type === 'DA' ? da_id : null,
                    dsm_id,
                    pos_id,
                    utilisateur_id: payload.utilisateur_id || null,
                    quantite_credit: Number(payload.stock_journalier)
                }
            });
            await stockRow.update({ quantite_credit: Number(payload.stock_journalier) });
        }

        return vente;
    }

    async listByEntity(posId = null) {
        const query = posId ? { pos_id: posId } : {};
        return db.VenteDsmAuPos.findAll({
            where: query,
            include: [{ model: db.Pos, as: 'pos' }]
        });
    }

    async listDailyRecords(entityType, entityId) {
        const where = entityType === 'POS' ? { pos_id: entityId } : { dsm_id: entityId };
        const ventes = await db.VenteDsmAuPos.findAll({
            where,
            order: [['date_vente', 'ASC']]
        });
        const stocks = await db.Stock.findAll({
            where,
            order: [['date_stock', 'ASC']]
        });
        const forecasts = db.PrevisionJournaliere ?
            await db.PrevisionJournaliere.findAll({
                where,
                order: [['date_prevision', 'ASC']]
            }) : [];
        const byDate = new Map();
        for (const vente of ventes) byDate.set(vente.date_vente, { date: vente.date_vente, achat: Number(vente.montant || 0) });
        for (const stock of stocks) {
            const row = byDate.get(stock.date_stock) || { date: stock.date_stock, achat: 0 };
            row.stock_journalier = Number(stock.quantite_credit || 0);
            byDate.set(stock.date_stock, row);
        }
        for (const forecast of forecasts) {
            const row = byDate.get(forecast.date_prevision) || { date: forecast.date_prevision, achat: 0 };
            row.prevision_ca = Number(forecast.montant_prevision || 0);
            byDate.set(forecast.date_prevision, row);
        }
        let cumul = 0;
        return [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date)).map((row) => {
            cumul += row.achat || 0;
            const stock = row.stock_journalier || 0;
            const ecart = stock - 0;
            return { date: row.date, prevision_ca: row.prevision_ca || 0, achat: row.achat || 0, stock_journalier: stock, cumul_achat: cumul, consommation: row.achat || 0, ecart_jour: ecart, ecart_cumule: ecart, statut: ecart >= 0 ? 'NORMAL' : 'CRITIQUE' };
        });
    }

    async clearEntityPeriod(entityType, entityId, month) {
        const { da_id, dsm_id, pos_id } = await this.getEntity(entityType, entityId);
        if (!/^\d{4}-\d{2}$/.test(String(month || ''))) {
            const error = new Error('La période doit respecter le format AAAA-MM');
            error.statusCode = 400;
            throw error;
        }
        const [year, monthNumber] = month.split('-').map(Number);
        const startDate = `${month}-01`;
        const endDate = `${month}-${String(new Date(year, monthNumber, 0).getDate()).padStart(2, '0')}`;
        let dsmIds = dsm_id ? [dsm_id] : [];
        if (entityType === 'DA') {
            const dsms = await db.Dsm.findAll({ where: { da_id }, attributes: ['id'] });
            dsmIds = dsms.map((row) => row.id);
        }
        let posIds = pos_id ? [pos_id] : [];
        if (entityType !== 'POS' && dsmIds.length) {
            const posRows = await db.Pos.findAll({ where: { dsm_id: dsmIds }, attributes: ['id'] });
            posIds = posRows.map((row) => row.id);
        }
        const dateRange = { [db.Sequelize.Op.between]: [startDate, endDate] };
        return db.sequelize.transaction(async(transaction) => {
            let deleted = 0;
            if (posIds.length) {
                deleted += await db.VenteDsmAuPos.destroy({ where: { pos_id: posIds, date_vente: dateRange }, transaction });
            }
            const directPurchaseWhere = entityType === 'DA'
                ? { da_id, scope_type: ['DA', 'DSM'], date_achat: dateRange }
                : entityType === 'DSM'
                    ? { dsm_id, scope_type: 'DSM', date_achat: dateRange }
                    : null;
            if (directPurchaseWhere) deleted += await db.AchatJournaliere.destroy({ where: directPurchaseWhere, transaction });
            const stockScopes = [];
            if (posIds.length) stockScopes.push({ pos_id: posIds });
            if (entityType === 'DA') {
                stockScopes.push({ da_id, dsm_id: null, pos_id: null });
                if (dsmIds.length) stockScopes.push({ da_id: null, dsm_id: dsmIds, pos_id: null });
            } else if (entityType === 'DSM') stockScopes.push({ da_id: null, dsm_id, pos_id: null });
            if (stockScopes.length) deleted += await db.Stock.destroy({ where: { [db.Sequelize.Op.or]: stockScopes, date_stock: dateRange }, transaction });
            const calendarScopes = [];
            if (posIds.length) calendarScopes.push({ pos_id: posIds });
            if (entityType === 'DA') calendarScopes.push({ da_id, dsm_id: null, pos_id: null });
            if (entityType === 'DSM') calendarScopes.push({ dsm_id, pos_id: null });
            if (calendarScopes.length) deleted += await db.CalendrierAchat.destroy({ where: { [db.Sequelize.Op.or]: calendarScopes, date_prevue: dateRange }, transaction });
            return deleted;
        });
    }
}

module.exports = { SaisieService, calculateSecurityStock };
