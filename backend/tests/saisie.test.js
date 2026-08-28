const request = require('supertest');
const { createApp } = require('../src/app');
const db = require('../src/models');
const { randomUUID } = require('crypto');

describe('Saisie API', () => {
  let app;
  let token;
  let testPos;
  let fixture;

  beforeAll(async () => {
    app = createApp();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@camtel.local', password: 'Admin123!' });

    expect(login.status).toBe(200);
    token = login.body.token;

    const suffix = randomUUID();
    const centre = await db.Centre.create({ nom_centre: `Centre saisie ${suffix}`, region: 'Test' });
    const da = await db.Da.create({ centre_id: centre.id, code: `SAISIE-${suffix}`, nom: `DA ${suffix}`, numero_sim: `SIM-${suffix}`, objectif_mensuel: 31000, active: true });
    const dsm = await db.Dsm.create({ da_id: da.id, nom: `DSM ${suffix}`, statut: 'actif' });
    const pos = await db.Pos.create({ dsm_id: dsm.id, nom: `POS ${suffix}`, statut: 'actif' });
    const now = new Date();
    const objectif = await db.ObjectifMensuel.create({ pos_id: pos.id, dsm_id: dsm.id, da_id: da.id, annee: now.getFullYear(), mois: now.getMonth() + 1, montant_objectif: 31000 });
    fixture = { centre, da, dsm, pos, objectif };
    testPos = { id: pos.id, objectif: 31000 };
  });

  afterAll(async () => {
    if (!fixture) return;
    await db.Stock.destroy({ where: { pos_id: fixture.pos.id } });
    await db.VenteDsmAuPos.destroy({ where: { pos_id: fixture.pos.id } });
    await fixture.objectif.destroy();
    await fixture.pos.destroy();
    await fixture.dsm.destroy();
    await fixture.da.destroy();
    await fixture.centre.destroy();
  });

  test('POST /api/saisies creates a sale with stock and variance computation', async () => {
    const expectedStock = (testPos.objectif / 31) * 3;

    const response = await request(app)
      .post('/api/saisies')
      .set('Authorization', `Bearer ${token}`)
      .send({
        entity_type: 'POS',
        entity_id: testPos.id,
        date: new Date().toISOString().slice(0, 10),
        vente_jour: 15000
      });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.stock_securite).toBeCloseTo(expectedStock, 2);
    expect(response.body.data.ecart_jour).toBeCloseTo(15000 - expectedStock, 2);
    expect(response.body.data.ecart_cumule).toBeDefined();
    expect(typeof response.body.data.ecart_cumule).toBe('number');
  });

  test('GET /api/saisies?entite=... returns history filtered to the POS', async () => {
    await request(app)
      .post('/api/saisies')
      .set('Authorization', `Bearer ${token}`)
      .send({ entity_type: 'POS', entity_id: testPos.id, date: new Date().toISOString().slice(0, 10), vente_jour: 20000 });

    const response = await request(app)
      .get(`/api/saisies?entite=${encodeURIComponent(testPos.id)}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.every((item) => item.pos_id === testPos.id)).toBe(true);
  });
});
