const { randomInt, randomUUID } = require('crypto');
const request = require('supertest');
const { createApp } = require('../src/app');
const db = require('../src/models');

function phone() {
  return `6${randomInt(10000000, 99999999)}`;
}

describe("Calendrier d'achat contextuel", () => {
  let app;
  let token;
  let partner;
  let dsm;
  let pos;

  beforeAll(async () => {
    app = createApp();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ matricule: 'AGT-001', password: 'Admin123!' });
    expect(login.status).toBe(200);
    token = login.body.token;

    const center = await db.Centre.findOne();
    const suffix = randomUUID();
    partner = await db.Da.create({
      centre_id: center.id,
      code: `MASTER_SIM_ZONE_CAL_${suffix.slice(0, 6)}`,
      nom: `Partenaire calendrier ${suffix}`,
      region: 'Littoral',
      numero_sim: phone(),
      code_zone: `CAL_${suffix.slice(0, 6).toUpperCase()}`,
      objectif_mensuel: 0,
      active: true,
    });
    dsm = await db.Dsm.create({
      da_id: partner.id,
      nom: `DSM calendrier ${suffix}`,
      numero_telephone: phone(),
      code_dsm: `DSM${randomInt(10000, 99999)}`,
      code_zone: 'LT_CAL',
      statut: 'actif',
    });
    pos = await db.Pos.create({
      dsm_id: dsm.id,
      nom: `POS calendrier ${suffix}`,
      numero_telephone: phone(),
      code_pos: `POS${randomInt(10000, 99999)}`,
      code_dsm: dsm.code_dsm,
      code_zone: dsm.code_zone,
      statut: 'actif',
    });
  });

  afterAll(async () => {
    if (partner) await db.CalendrierAchat.destroy({
      where: {
        [db.Sequelize.Op.or]: [
          { da_id: partner.id },
          { dsm_id: dsm.id },
          { pos_id: pos.id },
        ],
      },
    });
    if (pos) await pos.destroy();
    if (dsm) await dsm.destroy();
    if (partner) await partner.destroy();
  });

  async function save(type, id, forecasts) {
    return request(app)
      .post('/api/calendrier-achat')
      .set('Authorization', `Bearer ${token}`)
      .send({ entity_type: type, entity_id: id, forecasts });
  }

  test('stores several dates for one POS and the same date for different scopes', async () => {
    const daSave = await save('DA', partner.id, {
      '2026-08-01': 100,
      '2026-08-02': 200,
    });
    const dsmSave = await save('DSM', dsm.id, {
      '2026-08-01': 300,
      '2026-08-02': 400,
    });
    const posSave = await save('POS', pos.id, {
      '2026-08-01': 500,
      '2026-08-02': 600,
    });

    expect(daSave.status).toBe(201);
    expect(dsmSave.status).toBe(201);
    expect(posSave.status).toBe(201);
    expect(daSave.body.data).toHaveLength(2);
    expect(dsmSave.body.data).toHaveLength(2);
    expect(posSave.body.data).toHaveLength(2);
  });

  test('updates an existing contextual calendar without duplicating rows', async () => {
    const update = await save('POS', pos.id, {
      '2026-08-01': 750,
      '2026-08-02': 850,
    });
    expect(update.status).toBe(201);

    const response = await request(app)
      .get(`/api/calendrier-achat?entity_type=POS&entity_id=${pos.id}&year=2026&month=8`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual({
      '2026-08-01': 750,
      '2026-08-02': 850,
    });
    expect(await db.CalendrierAchat.count({ where: { pos_id: pos.id } })).toBe(2);
  });
});
