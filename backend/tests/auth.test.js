const request = require('supertest');
const { createApp } = require('../src/app');

describe('Camtel Pulse backend', () => {
  test('GET /api/health returns backend status', async () => {
    const app = createApp();

    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    expect(response.body.name).toBe('Camtel Pulse API');
  });

  test('POST /api/auth/login authenticates seeded admin account', async () => {
    const app = createApp();

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        matricule: 'ADM-001',
        password: 'Admin123!'
      });

    expect(response.status).toBe(200);
    expect(response.body.token).toBeDefined();
    expect(response.body.user.role).toBe('admin');
    expect(response.body.user.email).toBe('admin@camtel.local');

    const emailLogin = await request(app)
      .post('/api/auth/login')
      .send({ identifiant: 'admin@camtel.local', password: 'Admin123!' });
    expect(emailLogin.status).toBe(401);
  });
});
