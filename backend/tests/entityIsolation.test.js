const { randomUUID } = require('crypto');
const db = require('../src/models');
const { getEntityDashboard, getDailyRecords } = require('../src/services/entityDashboardService');

describe('Dashboard entity isolation', () => {
  test('keeps KPI and daily rows scoped to the selected partner', async () => {
    const suffix = randomUUID();
    const center = await db.Centre.create({ nom_centre: `Centre ${suffix}`, code_centre: `CPDSM TEST ISO ${suffix.slice(0, 12)}`, region: 'Centre' });
    const created = { center, partners: [], dsms: [], pos: [] };

    try {
      for (const [index, amount] of [125, 875].entries()) {
        const partner = await db.Da.create({
          centre_id: center.id,
          code: `ISO-${index}-${suffix}`,
          nom: `Partenaire isolation ${index}`,
          numero_sim: `SIM-ISO-${index}-${suffix}`,
          objectif_mensuel: index === 0 ? 1000 : 9000,
          active: true,
        });
        const dsm = await db.Dsm.create({ da_id: partner.id, nom: `DSM isolation ${index}`, statut: 'actif' });
        const pos = await db.Pos.create({ dsm_id: dsm.id, nom: `POS isolation ${index}`, statut: 'actif' });
        await db.VenteDsmAuPos.create({
          dsm_id: dsm.id,
          pos_id: pos.id,
          date_vente: '2026-08-10',
          quantite_vendu: amount,
          montant: amount,
        });
        await db.Stock.create({
          dsm_id: dsm.id,
          pos_id: pos.id,
          date_stock: '2026-08-10',
          quantite_credit: amount + 10,
        });
        created.partners.push(partner);
        created.dsms.push(dsm);
        created.pos.push(pos);
      }

      const firstDashboard = await getEntityDashboard('DA', created.partners[0].id, '2026-08');
      const secondDashboard = await getEntityDashboard('DA', created.partners[1].id, '2026-08');
      const firstRows = await getDailyRecords('DA', created.partners[0].id, '2026-08');
      const secondRows = await getDailyRecords('DA', created.partners[1].id, '2026-08');

      expect(firstDashboard.kpi.objectif_mensuel).toBe(1000);
      expect(firstDashboard.kpi.achat_cumule).toBe(125);
      expect(secondDashboard.kpi.objectif_mensuel).toBe(9000);
      expect(secondDashboard.kpi.achat_cumule).toBe(875);
      expect(firstRows).toHaveLength(1);
      expect(firstRows[0].achat).toBe(125);
      expect(secondRows).toHaveLength(1);
      expect(secondRows[0].achat).toBe(875);
    } finally {
      const posIds = created.pos.map((item) => item.id);
      const dsmIds = created.dsms.map((item) => item.id);
      if (posIds.length) {
        await db.Stock.destroy({ where: { pos_id: posIds } });
        await db.VenteDsmAuPos.destroy({ where: { pos_id: posIds } });
        await db.Pos.destroy({ where: { id: posIds } });
      }
      if (dsmIds.length) await db.Dsm.destroy({ where: { id: dsmIds } });
      if (created.partners.length) await db.Da.destroy({ where: { id: created.partners.map((item) => item.id) } });
      await db.Centre.destroy({ where: { id: center.id } });
    }
  });
});
