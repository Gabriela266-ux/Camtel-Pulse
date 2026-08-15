const request = require('supertest');
const { createApp } = require('../src/app');

describe('Saisie API', () => {
  test('POST /api/saisies creates a sale with stock and variance computation', async () => {
    const app = createApp();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@camtel.local', password: 'Admin123!' });

    const response = await request(app)
      .post('/api/saisies')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({
        id_pos: 'pos-1',
        date: '2026-08-01',
        vente_jour: 15000
      });

    expect(response.status).toBe(201);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.stock_securite).toBeCloseTo((600000 / 31) * 3, 2);
    expect(response.body.data.ecart_jour).toBeCloseTo(15000 - response.body.data.stock_securite, 2);
    expect(response.body.data.ecart_cumule).toBeCloseTo(response.body.data.ecart_jour, 2);
  });

  test('GET /api/saisies?entite=pos-1 returns history filtered to the POS', async () => {
    const app = createApp();
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@camtel.local', password: 'Admin123!' });

    await request(app)
      .post('/api/saisies')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send({ id_pos: 'pos-1', date: '2026-08-02', vente_jour: 20000 });

    const response = await request(app)
      .get('/api/saisies?entite=pos-1')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.data.length).toBeGreaterThan(0);
    expect(response.body.data.every((item) => item.id_pos === 'pos-1')).toBe(true);
  });
});
