const { randomUUID } = require('crypto');
const request = require('supertest');
const { createApp } = require('../src/app');
const db = require('../src/models');

describe('Partner deletion', () => {
  test('deletes a partner referenced by a direct purchase calendar', async () => {
    const app = createApp();
    const center = await db.Centre.findOne();
    expect(center).toBeTruthy();

    const partner = await db.Da.create({
      centre_id: center.id,
      code: `DELETE-${randomUUID()}`,
      nom: 'Partenaire suppression FK',
      region: 'Centre',
      numero_sim: `SIM-${randomUUID()}`,
      objectif_mensuel: 0,
      active: true,
    });

    try {
      await db.CalendrierAchat.create({
        da_id: partner.id,
        dsm_id: null,
        pos_id: null,
        date_prevue: '2099-01-01',
        quantite_prevue: 10,
      });

      const login = await request(app)
        .post('/api/auth/login')
        .send({ matricule: 'AGT-001', password: 'Admin123!' });

      expect(login.status).toBe(200);
      expect(login.body.user.role).toBe('chef_operationnel');

      const response = await request(app)
        .delete(`/api/organization/clients/${partner.id}`)
        .set('Authorization', `Bearer ${login.body.token}`);

      expect(response.status).toBe(200);
      expect(await db.Da.findByPk(partner.id)).toBeNull();
      expect(await db.CalendrierAchat.count({ where: { da_id: partner.id } })).toBe(0);
    } finally {
      await db.CalendrierAchat.destroy({ where: { da_id: partner.id } });
      await db.Da.destroy({ where: { id: partner.id } });
    }
  });
});
