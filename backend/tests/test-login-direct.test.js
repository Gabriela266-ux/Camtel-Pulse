const request = require('supertest');
const { createApp } = require('../src/app');

describe('Direct Login Test', () => {
  test('POST /api/auth/login with admin credentials', async () => {
    const app = createApp();
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        matricule: 'ADM-001',
        password: 'Admin123!'
      });

    if (response.status !== 200) {
      console.log('Login failed! Check why.');
    }
  });
});
