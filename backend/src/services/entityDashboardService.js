const db = require('../models');
const { calculateSecurityStock } = require('../utils/business');

function round2(value) {
    return Math.round(Number(value || 0) * 100) / 100;
}

function addDays(dateStr, days) {
    const d = new Date(`${dateStr}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + days);
    return d.toISOString().slice(0, 10);
}

function normalizeDate(value) {
    if (value instanceof Date) return value.toISOString().slice(0, 10);
    const text = String(value || '');
    return text.length >= 10 ? text.slice(0, 10) : text;
}

// Semaine calendaire lundi→dimanche contenant dateStr, avec numéro de semaine ISO-8601
// et un libellé lisible ("Semaine 34 (17–23 août 2026)") pour affichage sous la carte KPI.
function getWeekRange(dateStr) {
    const d = new Date(`${dateStr}T00:00:00Z`);
    const isoDay = (d.getUTCDay() + 6) % 7; // 0 = lundi ... 6 = dimanche
    const monday = addDays(dateStr, -isoDay);
    const sunday = addDays(monday, 6);

    // Numéro de semaine ISO-8601
    const thursday = addDays(monday, 3);
    const thursdayDate = new Date(`${thursday}T00:00:00Z`);
    const yearStart = new Date(Date.UTC(thursdayDate.getUTCFullYear(), 0, 1));
    const weekNumber = Math.ceil(((thursdayDate - yearStart) / 86400000 + 1) / 7);

    const fmt = (iso) => {
        const [, m, day] = iso.split('-');
        return `${day}/${m}`;
    };

    return {
        start: monday,
        end: sunday,
        weekNumber,
        label: `Semaine ${weekNumber} (${fmt(monday)} – ${fmt(sunday)})`
    };
}

async function getEntityMeta(type, id) {
    if (type === 'POS') return db.Pos.findByPk(id);
    if (type === 'DSM') return db.Dsm.findByPk(id);
    if (type === 'DA') return db.Da.findByPk(id);
    if (type === 'CENTRE') return db.Centre.findByPk(id);
    return null;
}

async function getPosIdsForEntity(type, id) {
    if (type === 'POS') return [id];

    if (type === 'DSM') {
        const posList = await db.Pos.findAll({ where: { dsm_id: id } });
        return posList.map((p) => p.id);
    }

    if (type === 'DA') {
        const dsms = await db.Dsm.findAll({ where: { da_id: id } });
        const posList = await db.Pos.findAll({ where: { dsm_id: dsms.map((d) => d.id) } });
        return posList.map((p) => p.id);
    }

    if (type === 'CENTRE') {
        const das = await db.Da.findAll({ where: { centre_id: id } });
        const dsms = await db.Dsm.findAll({ where: { da_id: das.map((d) => d.id) } });
        const posList = await db.Pos.findAll({ where: { dsm_id: dsms.map((d) => d.id) } });
        return posList.map((p) => p.id);
    }

    return [];
}

async function getDsmIdsForEntity(type, id) {
    if (type === 'DSM') return [id];
    if (type === 'POS') {
        const pos = await db.Pos.findByPk(id);
        return pos ? [pos.dsm_id] : [];
    }
    if (type === 'DA') {
        const rows = await db.Dsm.findAll({ where: { da_id: id }, attributes: ['id'] });
        return rows.map((row) => row.id);
    }
    if (type === 'CENTRE') {
        const das = await db.Da.findAll({ where: { centre_id: id }, attributes: ['id'] });
        const rows = await db.Dsm.findAll({ where: { da_id: das.map((row) => row.id) }, attributes: ['id'] });
        return rows.map((row) => row.id);
    }
    return [];
}

// Objectif mensuel du mois en cours (référence : dernière vente enregistrée, sinon mois courant).
async function getObjectifMensuel(type, id, annee, mois) {
    if (type === 'DA') {
        const da = await db.Da.findByPk(id);
        return Number((da && da.objectif_mensuel) || 0);
    }

    if (type === 'DSM' || type === 'POS') {
        const where = type === 'DSM' ? { dsm_id: id, annee, mois } : { pos_id: id, annee, mois };
        const objectif = await db.ObjectifMensuel.findOne({ where });
        return Number((objectif && objectif.montant_objectif) || 0);
    }

    if (type === 'CENTRE') {
        const das = await db.Da.findAll({ where: { centre_id: id } });
        return das.reduce((sum, da) => sum + Number(da.objectif_mensuel || 0), 0);
    }

    return 0;
}

// Ventes (achat) et stock journalier réels, agrégés par date, pour les POS donnés,
// sur une plage [startDate, endDate] inclusive (bornes gte/lte : un LIKE sur une
// colonne DATEONLY est mal interprété par Sequelize et renvoie toujours 0 résultat).
async function getDailySeries(type, id, posIds, startDate, endDate) {
    const dsmIds = await getDsmIdsForEntity(type, id);
    const calendarScopes = [];
    if (posIds.length) calendarScopes.push({ pos_id: posIds });
    if (type === 'DA') calendarScopes.push({ da_id: id, dsm_id: null, pos_id: null });
    if (type === 'DSM') calendarScopes.push({ da_id: null, dsm_id: id, pos_id: null });

    const directPurchaseScopes = [];
    if (type === 'DA') {
        directPurchaseScopes.push({ scope_type: 'DA', da_id: id, dsm_id: null });
        if (dsmIds.length) directPurchaseScopes.push({ scope_type: 'DSM', dsm_id: dsmIds });
    } else if (type === 'DSM') {
        directPurchaseScopes.push({ scope_type: 'DSM', dsm_id: id });
    }
    const stockScopes = [];
    if (posIds.length) stockScopes.push({ pos_id: posIds });
    if (type === 'DA') {
        stockScopes.push({ da_id: id, dsm_id: null, pos_id: null });
        if (dsmIds.length) stockScopes.push({ da_id: null, dsm_id: dsmIds, pos_id: null });
    } else if (type === 'DSM') {
        stockScopes.push({ da_id: null, dsm_id: id, pos_id: null });
    }

    const authorInclude = [{
        model: db.Utilisateur,
        as: 'saisi_par',
        attributes: ['id', 'nom_complet', 'email'],
        include: [
            { model: db.Role, as: 'role', attributes: ['libelle'] },
            { model: db.Utilisateur, as: 'chefOperationnel', attributes: ['id', 'nom_complet', 'matricule'], required: false },
        ],
        required: false,
    }];

    const [ventes, directPurchases, stocks, calendrier] = await Promise.all([
        posIds.length ? db.VenteDsmAuPos.findAll({
            where: {
                pos_id: posIds,
                date_vente: {
                    [db.Sequelize.Op.between]: [startDate, endDate]
                }
            },
            include: authorInclude,
        }) : [],
        directPurchaseScopes.length ? db.AchatJournaliere.findAll({
            where: {
                [db.Sequelize.Op.or]: directPurchaseScopes,
                date_achat: { [db.Sequelize.Op.between]: [startDate, endDate] }
            },
            include: authorInclude,
        }) : [],
        stockScopes.length ? db.Stock.findAll({
            where: {
                [db.Sequelize.Op.or]: stockScopes,
                date_stock: {
                    [db.Sequelize.Op.between]: [startDate, endDate]
                }
            },
            include: authorInclude,
        }) : [],
        db.CalendrierAchat.findAll({
            where: {
                [db.Sequelize.Op.or]: calendarScopes,
                date_prevue: {
                    [db.Sequelize.Op.between]: [startDate, endDate]
                }
            }
        })
    ]);

    const achatByDate = {};
    const traceByDate = {};
    const normalizeAuthorRole = (role) => {
        const normalized = String(role || '').toLowerCase().replace(/\s+/g, '_');
        const labels = {
            admin: 'ADMIN',
            manager: 'MANAGER',
            chef_operationnel: 'CHEF_OPE',
            operationnel: 'OPERATIONNEL',
        };
        return labels[normalized] || normalized.toUpperCase() || 'INCONNU';
    };
    const addTrace = (date, row, source, valeur) => {
        if (!date) return;
        if (!traceByDate[date]) traceByDate[date] = { auteurs: new Map(), lignes: [] };
        const user = row.saisi_par;
        if (user) {
            traceByDate[date].auteurs.set(String(user.id), {
                id: String(user.id),
                nomComplet: user.nom_complet,
                email: user.email,
                role: normalizeAuthorRole(user.role && user.role.libelle),
                chefOperationnel: user.chefOperationnel ? {
                    id: String(user.chefOperationnel.id),
                    nomComplet: user.chefOperationnel.nom_complet,
                    matricule: user.chefOperationnel.matricule,
                } : null,
            });
        }
        traceByDate[date].lignes.push({
            id: String(row.id),
            source,
            valeur: round2(valeur),
            saisiLe: row.updated_at || row.updatedAt || row.created_at || row.createdAt || null,
            auteurId: user ? String(user.id) : null,
            daId: row.da_id ? String(row.da_id) : null,
            dsmId: row.dsm_id ? String(row.dsm_id) : null,
            posId: row.pos_id ? String(row.pos_id) : null,
        });
    };
    ventes.forEach((v) => {
        const date = normalizeDate(v.date_vente);
        if (!date) return;
        achatByDate[date] = (achatByDate[date] || 0) + Number(v.montant || 0);
        addTrace(date, v, 'ACHAT', Number(v.montant || 0));
    });
    directPurchases.forEach((purchase) => {
        const date = normalizeDate(purchase.date_achat);
        if (!date) return;
        achatByDate[date] = (achatByDate[date] || 0) + Number(purchase.montant_achat || 0);
        addTrace(date, purchase, 'ACHAT', Number(purchase.montant_achat || 0));
    });

    // Somme du "Stock journalier (U)" saisi par les opérationnels de tous les POS
    // rattachés à l'entité, pour chaque date (cohérent avec la façon dont l'achat
    // est déjà agrégé par entité).
    const stockByDate = {};
    stocks.forEach((s) => {
        const date = normalizeDate(s.date_stock);
        if (!date) return;
        stockByDate[date] = (stockByDate[date] || 0) + Number(s.quantite_credit || 0);
        addTrace(date, s, 'STOCK', Number(s.quantite_credit || 0));
    });

    // Calendrier d'Achat = jargon Camtel pour "prévisions" (table calendrier_achat).
    const calendrierByDate = {};
    calendrier.forEach((c) => {
        const date = normalizeDate(c.date_prevue);
        if (!date) return;
        calendrierByDate[date] = (calendrierByDate[date] || 0) + Number(c.quantite_prevue || 0);
    });

    const saisieDetailsByDate = Object.fromEntries(Object.entries(traceByDate).map(([date, trace]) => [
        date,
        {
            auteurs: [...trace.auteurs.values()],
            lignes: trace.lignes,
        },
    ]));

    return { achatByDate, stockByDate, calendrierByDate, saisieDetailsByDate };
}

// objectif_mensuel, achat_cumule, stock_securite = (objectif/31)*3,
// ecart_jour/ecart_cumule vs stock de sécurité, alerte rouge (CRITIQUE) si écart négatif.
// consommation (U) et stock_journalier_moyen_hebdo calculés à partir du vrai stock
// journalier saisi (table stock), selon les formules validées par l'encadreur :
//   consommation(j) = stock_journalier(j) + achat(j) - stock_journalier(j+1)
//   stock_journalier_moyen_hebdo = somme des stock_journalier des 7 derniers jours saisis / 7
async function getEntityDashboard(type, id, month) {
    const meta = await getEntityMeta(type, id);
    if (!meta) return null;

    const posIds = await getPosIdsForEntity(type, id);
    const requestedMonth = /^\d{4}-\d{2}$/.test(String(month || '')) ? String(month) : new Date().toISOString().slice(0, 7);
    const [requestedYear, requestedMonthNumber] = requestedMonth.split('-').map(Number);
    const startDate = `${requestedMonth}-01`;
    const endDate = `${requestedMonth}-${String(new Date(requestedYear, requestedMonthNumber, 0).getDate()).padStart(2, '0')}`;
    const { achatByDate: monthlyPurchases } = await getDailySeries(type, id, posIds, startDate, endDate);
    const purchaseDates = Object.keys(monthlyPurchases).sort();
    const lastDay = purchaseDates[purchaseDates.length - 1] || '';
    const today = new Date().toISOString().slice(0, 10);
    const refDate = lastDay || (today.startsWith(requestedMonth) ? today : endDate);
    const [annee, mois] = refDate.split('-').map(Number);

    const achatCumule = Object.values(monthlyPurchases).reduce((sum, value) => sum + Number(value || 0), 0);

    const objectifMensuel = await getObjectifMensuel(type, id, annee, mois);
    const stockSecurite = calculateSecurityStock(objectifMensuel, 31);

    const achatJour = monthlyPurchases[lastDay] || 0;

    const ecartJour = achatJour - stockSecurite;
    const ecartCumule = achatCumule - stockSecurite;

    // Fenêtre des 30 derniers jours (jusqu'à refDate) pour la consommation,
    // + 1 jour au-delà pour pouvoir calculer la consommation du dernier jour connu.
    const windowStart = addDays(refDate, -30);
    const windowEnd = addDays(refDate, 1);
    const { stockByDate, achatByDate: windowPurchases } = await getDailySeries(type, id, posIds, windowStart, windowEnd);

    // Stock journalier moyen hebdomadaire : somme des stocks journaliers de la semaine
    // calendaire (lundi→dimanche) contenant refDate, divisée par 7 — pas une fenêtre
    // glissante de 7 jours. Le libellé de la semaine est renvoyé pour affichage.
    const week = getWeekRange(refDate);
    const weekStockSum = Object.keys(stockByDate)
        .filter((d) => d >= week.start && d <= week.end)
        .reduce((sum, d) => sum + stockByDate[d], 0);
    const stockJournalierMoyenHebdo = round2(weekStockSum / 7);

    let consommationTotale = 0;
    const stockDates = Object.keys(stockByDate).sort();
    stockDates.forEach((date) => {
        if (date > refDate) return;
        const nextDate = addDays(date, 1);
        if (stockByDate[nextDate] === undefined) return; // pas encore connu (saisie du lendemain manquante)
        const achatDuJour = windowPurchases[date] || 0;
        consommationTotale += stockByDate[date] + achatDuJour - stockByDate[nextDate];
    });

    const nom = meta.nom_centre || meta.nom || '';

    return {
        entite_id: id,
        nom_entite: nom,
        kpi: {
            objectif_mensuel: objectifMensuel,
            achat_cumule: achatCumule,
            stock_securite: round2(stockSecurite),
            ecart_jour: round2(ecartJour),
            ecart_cumule: round2(ecartCumule),
            statut_alerte: ecartCumule < 0 ? 'CRITIQUE' : 'NORMAL',
            consommation: round2(consommationTotale),
            stock_journalier_moyen_hebdo: stockJournalierMoyenHebdo,
            semaine_label: week.label
        }
    };
}

// Nombre de demandes de correction ouvertes (non résolues = ni validée ni refusée)
// par jour, pour les POS rattachés à l'entité. Utilisé par la carte CORRECTIONS
// de l'espace Opérationnel (RoleWorkspace).
async function countCorrectionsByDate(posIds, startDate, endDate) {
    const counts = {};
    if (!posIds.length || !db.Correction) return counts;

    const rows = await db.Correction.findAll({
        where: {
            pos_id: posIds,
            date_vente: {
                [db.Sequelize.Op.between]: [startDate, endDate]
            },
            statut: {
                [db.Sequelize.Op.notIn]: ['validee', 'refusee']
            }
        },
        attributes: ['date_vente']
    });

    rows.forEach((c) => {
        counts[c.date_vente] = (counts[c.date_vente] || 0) + 1;
    });

    return counts;
}

// Historique journalier réel (Suivi journalier / DailyTrackingTable du frontend).
// Agrège les ventes ET le vrai stock journalier saisi (table stock) de tous les POS
// rattachés à l'entité, jour par jour, pour le mois demandé.
async function getDailyRecords(type, id, month) {
    const meta = await getEntityMeta(type, id);
    if (!meta) return null;
    const posIds = await getPosIdsForEntity(type, id);

    const [year, mon] = (month || new Date().toISOString().slice(0, 7)).split('-').map(Number);
    const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
    const lastDayNum = new Date(year, mon, 0).getDate();
    const endDate = `${year}-${String(mon).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;
    // +1 jour au-delà de la fin du mois : nécessaire pour calculer la consommation
    // du dernier jour du mois (qui dépend du stock du lendemain).
    // (Finance/Position: même plage pour compter les corrections ouvertes du mois.)
    const fetchEnd = addDays(endDate, 1);

    const { achatByDate, stockByDate, calendrierByDate, saisieDetailsByDate } = await getDailySeries(type, id, posIds, startDate, fetchEnd);
    const correctionsByDate = posIds.length ? await countCorrectionsByDate(posIds, startDate, endDate) : {};

    const objectifMensuel = await getObjectifMensuel(type, id, year, mon);
    const stockSecurite = calculateSecurityStock(objectifMensuel, 31);

    const dates = Array.from(
        new Set([
            ...Object.keys(achatByDate).filter((d) => d >= startDate && d <= endDate),
            ...Object.keys(stockByDate).filter((d) => d >= startDate && d <= endDate),
            ...Object.keys(calendrierByDate).filter((d) => d >= startDate && d <= endDate)
        ])
    ).sort();

    let cumul = 0;

    return dates.map((date) => {
        const achat = achatByDate[date] || 0;
        const stockJour = stockByDate[date];
        const nextDate = addDays(date, 1);
        const stockLendemain = stockByDate[nextDate];
        const previsionJour = calendrierByDate[date];
        const trace = saisieDetailsByDate[date] || { auteurs: [], lignes: [] };

        cumul += achat;
        // Écart Calendrier d'Achat = Achat (réalisation) − Calendrier d'Achat (prévision) du jour,
        // quand une prévision a été saisie ; sinon écart vs stock de sécurité (repli).
        const ecartJour = previsionJour !== undefined ? achat - previsionJour : achat - stockSecurite;
        const ecartCumule = cumul - stockSecurite;

        // consommation(j) = stock_journalier(j) + achat(j) - stock_journalier(j+1) :
        // connue seulement une fois le stock du lendemain saisi (décalage d'un jour assumé).
        const consommation =
            stockJour !== undefined && stockLendemain !== undefined ?
            round2(stockJour + achat - stockLendemain) :
            null;

        return {
            date,
            prevision_ca: previsionJour !== undefined ? round2(previsionJour) : 0,
            achat: round2(achat),
            stock_journalier: stockJour !== undefined ? round2(stockJour) : null,
            cumul_achat: round2(cumul),
            consommation,
            ecart_jour: round2(ecartJour),
            ecart_cumule: round2(ecartCumule),
            statut: ecartJour >= 0 ? 'NORMAL' : 'CRITIQUE',
            corrections: correctionsByDate[date] || 0,
            saisi_par: trace.auteurs[0] || null,
            saisie_auteurs: trace.auteurs,
            saisie_details: {
                entityType: type,
                entityId: String(id),
                lignes: trace.lignes,
            },
        };
    });
}

module.exports = { getEntityDashboard, getDailyRecords, getPosIdsForEntity, getObjectifMensuel };
