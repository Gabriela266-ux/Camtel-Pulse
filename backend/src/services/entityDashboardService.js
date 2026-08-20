const db = require('../models');
const { calculateSecurityStock } = require('../utils/business');

function round2(value) {
  return Math.round(Number(value || 0) * 100) / 100;
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

// objectif_mensuel, achat_cumule, stock_securite = (objectif/31)*3,
// ecart_jour/ecart_cumule vs stock de sécurité, alerte rouge (CRITIQUE) si écart négatif.
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
      consommation: objectifMensuel > 0 ? round2((achatCumule / objectifMensuel) * 100) : 0
    }
  };
}

module.exports = { getEntityDashboard };
