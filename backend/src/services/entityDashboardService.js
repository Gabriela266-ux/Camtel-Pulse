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

// Objectif mensuel du mois en cours (référence : dernière vente enregistrée, sinon mois courant).
async function getObjectifMensuel(type, id, annee, mois) {
  if (type === 'DA') {
    const da = await db.Da.findByPk(id);
    return Number(da?.objectif_mensuel || 0);
  }

  if (type === 'DSM' || type === 'POS') {
    const where = type === 'DSM' ? { dsm_id: id, annee, mois } : { pos_id: id, annee, mois };
    const objectif = await db.ObjectifMensuel.findOne({ where });
    return Number(objectif?.montant_objectif || 0);
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
async function getDailySeries(posIds, startDate, endDate) {
  if (!posIds.length) return { achatByDate: {}, stockByDate: {}, calendrierByDate: {} };

  const [ventes, stocks, calendrier] = await Promise.all([
    db.VenteDsmAuPos.findAll({
      where: { pos_id: posIds, date_vente: { [db.Sequelize.Op.between]: [startDate, endDate] } }
    }),
    db.Stock.findAll({
      where: { pos_id: posIds, date_stock: { [db.Sequelize.Op.between]: [startDate, endDate] } }
    }),
    db.CalendrierAchat.findAll({
      where: { pos_id: posIds, date_prevue: { [db.Sequelize.Op.between]: [startDate, endDate] } }
    })
  ]);

  const achatByDate = {};
  ventes.forEach((v) => {
    achatByDate[v.date_vente] = (achatByDate[v.date_vente] || 0) + Number(v.montant || 0);
  });

  // Somme du "Stock journalier (U)" saisi par les opérationnels de tous les POS
  // rattachés à l'entité, pour chaque date (cohérent avec la façon dont l'achat
  // est déjà agrégé par entité).
  const stockByDate = {};
  stocks.forEach((s) => {
    stockByDate[s.date_stock] = (stockByDate[s.date_stock] || 0) + Number(s.quantite_credit || 0);
  });

  // Calendrier d'Achat = jargon Camtel pour "prévisions" (table calendrier_achat).
  const calendrierByDate = {};
  calendrier.forEach((c) => {
    calendrierByDate[c.date_prevue] = (calendrierByDate[c.date_prevue] || 0) + Number(c.quantite_prevue || 0);
  });

  return { achatByDate, stockByDate, calendrierByDate };
}

// objectif_mensuel, achat_cumule, stock_securite = (objectif/31)*3,
// ecart_jour/ecart_cumule vs stock de sécurité, alerte rouge (CRITIQUE) si écart négatif.
// consommation (U) et stock_journalier_moyen_hebdo calculés à partir du vrai stock
// journalier saisi (table stock), selon les formules validées par l'encadreur :
//   consommation(j) = stock_journalier(j) + achat(j) - stock_journalier(j+1)
//   stock_journalier_moyen_hebdo = somme des stock_journalier des 7 derniers jours saisis / 7
async function getEntityDashboard(type, id) {
  const meta = await getEntityMeta(type, id);
  if (!meta) return null;

  const posIds = await getPosIdsForEntity(type, id);
  const ventes = posIds.length
    ? await db.VenteDsmAuPos.findAll({ where: { pos_id: posIds } })
    : [];

  const lastDay = ventes.reduce((max, v) => (v.date_vente > max ? v.date_vente : max), '');
  const refDate = lastDay || new Date().toISOString().slice(0, 10);
  const [annee, mois] = refDate.split('-').map(Number);

  const achatCumule = ventes.reduce((sum, v) => sum + Number(v.montant || 0), 0);

  const objectifMensuel = await getObjectifMensuel(type, id, annee, mois);
  const stockSecurite = calculateSecurityStock(objectifMensuel, 31);

  const achatJour = ventes
    .filter((v) => v.date_vente === lastDay)
    .reduce((sum, v) => sum + Number(v.montant || 0), 0);

  const ecartJour = achatJour - stockSecurite;
  const ecartCumule = achatCumule - stockSecurite;

  // Fenêtre des 30 derniers jours (jusqu'à refDate) pour la consommation,
  // + 1 jour au-delà pour pouvoir calculer la consommation du dernier jour connu.
  const windowStart = addDays(refDate, -30);
  const windowEnd = addDays(refDate, 1);
  const { stockByDate } = await getDailySeries(posIds, windowStart, windowEnd);

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
    const achatDuJour = ventes
      .filter((v) => v.date_vente === date)
      .reduce((sum, v) => sum + Number(v.montant || 0), 0);
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

// Historique journalier réel (Suivi journalier / DailyTrackingTable du frontend).
// Agrège les ventes ET le vrai stock journalier saisi (table stock) de tous les POS
// rattachés à l'entité, jour par jour, pour le mois demandé.
async function getDailyRecords(type, id, month) {
  const posIds = await getPosIdsForEntity(type, id);
  if (!posIds.length) return [];

  const [year, mon] = (month || new Date().toISOString().slice(0, 7)).split('-').map(Number);
  const startDate = `${year}-${String(mon).padStart(2, '0')}-01`;
  const lastDayNum = new Date(year, mon, 0).getDate();
  const endDate = `${year}-${String(mon).padStart(2, '0')}-${String(lastDayNum).padStart(2, '0')}`;
  // +1 jour au-delà de la fin du mois : nécessaire pour calculer la consommation
  // du dernier jour du mois (qui dépend du stock du lendemain).
  const fetchEnd = addDays(endDate, 1);

  const { achatByDate, stockByDate, calendrierByDate } = await getDailySeries(posIds, startDate, fetchEnd);

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

    cumul += achat;
    // Écart Calendrier d'Achat = Achat (réalisation) − Calendrier d'Achat (prévision) du jour,
    // quand une prévision a été saisie ; sinon écart vs stock de sécurité (repli).
    const ecartJour = previsionJour !== undefined ? achat - previsionJour : achat - stockSecurite;
    const ecartCumule = cumul - stockSecurite;

    // consommation(j) = stock_journalier(j) + achat(j) - stock_journalier(j+1) :
    // connue seulement une fois le stock du lendemain saisi (décalage d'un jour assumé).
    const consommation =
      stockJour !== undefined && stockLendemain !== undefined
        ? round2(stockJour + achat - stockLendemain)
        : null;

    return {
      date,
      prevision_ca: previsionJour !== undefined ? round2(previsionJour) : 0,
      achat: round2(achat),
      stock_journalier: stockJour !== undefined ? round2(stockJour) : null,
      cumul_achat: round2(cumul),
      consommation,
      ecart_jour: round2(ecartJour),
      ecart_cumule: round2(ecartCumule),
      statut: ecartJour >= 0 ? 'NORMAL' : 'CRITIQUE'
    };
  });
}

module.exports = { getEntityDashboard, getDailyRecords, getPosIdsForEntity, getObjectifMensuel };
