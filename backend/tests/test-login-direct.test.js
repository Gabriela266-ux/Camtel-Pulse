const request = require('supertest');
const { createApp } = require('../src/app');

describe('Direct Login Test', () => {
  test('POST /api/auth/login with admin credentials', async () => {
    const app = createApp();
    
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@camtel.local',
        password: 'Admin123!'
      });

    console.log('Response status:', response.status);
    console.log('Response body:', response.body);
    console.log('Response headers:', response.headers);

    if (response.status !== 200) {
      console.log('Login failed! Check why.');
    }
  });
});
