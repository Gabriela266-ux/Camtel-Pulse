const { randomUUID } = require('crypto');
const db = require('../src/models');
const { SaisieService } = require('../src/services/saisieService');
const { getDailyRecords } = require('../src/services/entityDashboardService');

describe('Saisie journalière indépendante par portée', () => {
  test('enregistre un partenaire et un DSM sans exiger de POS', async () => {
    const suffix = randomUUID();
    const centre = await db.Centre.create({ nom_centre: `Centre scope ${suffix}`, region: 'Test' });
    const da = await db.Da.create({
      centre_id: centre.id, code: `SCOPE-${suffix}`, nom: `Partenaire ${suffix}`,
      numero_sim: `SIM-${suffix}`, objectif_mensuel: 3100, active: true
    });
    const dsm = await db.Dsm.create({ da_id: da.id, nom: `DSM ${suffix}`, statut: 'actif' });
    const service = new SaisieService();

    try {
      await service.create({ entity_type: 'DA', entity_id: da.id, date: '2026-08-12', vente_jour: 100, stock_journalier: 50 });
      await service.create({ entity_type: 'DSM', entity_id: dsm.id, date: '2026-08-13', vente_jour: 200, stock_journalier: 75 });

      const daRows = await getDailyRecords('DA', da.id, '2026-08');
      const dsmRows = await getDailyRecords('DSM', dsm.id, '2026-08');
      expect(daRows.map((row) => [row.date, row.achat])).toEqual([
        ['2026-08-12', 100], ['2026-08-13', 200]
      ]);
      expect(dsmRows.map((row) => [row.date, row.achat])).toEqual([['2026-08-13', 200]]);
    } finally {
      await db.Stock.destroy({ where: { [db.Sequelize.Op.or]: [{ da_id: da.id }, { dsm_id: dsm.id }] } });
      await db.AchatJournaliere.destroy({ where: { da_id: da.id } });
      await dsm.destroy();
      await da.destroy();
      await centre.destroy();
    }
  });
});
