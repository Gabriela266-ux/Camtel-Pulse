const bcrypt = require('bcryptjs');
const { users: seedUsers } = require('../src/data/seedData');

describe('Debug Auth', () => {
  test('Check seedUsers data', () => {
    console.log('seedUsers:', seedUsers);
    console.log('Number of users:', seedUsers.length);
    
    const admin = seedUsers.find(u => u.email.toLowerCase() === 'admin@camtel.local'.toLowerCase());
    console.log('Found admin user:', admin);
    
    if (admin) {
      const isValid = bcrypt.compareSync('Admin123!', admin.passwordHash);
      console.log('Password valid:', isValid);
    }
    
    expect(seedUsers).toBeDefined();
    expect(seedUsers.length).toBeGreaterThan(0);
  });
});
