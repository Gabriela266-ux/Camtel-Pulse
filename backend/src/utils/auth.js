const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const templateUser = {
  id: '1',
  name: 'Admin principal',
  email: 'admin@camtel.local',
  role: 'admin',
  centerId: 'center-1',
  status: 'active'
};

const seedUsers = [
  {
    ...templateUser,
    passwordHash: bcrypt.hashSync('Admin123!', 10)
  },
  {
    id: '2',
    name: 'Chef opérationnel',
    email: 'chef@camtel.local',
    role: 'chef_operationnel',
    centerId: 'center-1',
    status: 'active',
    passwordHash: bcrypt.hashSync('Chef123!', 10)
  },
  {
    id: '3',
    name: 'Opérationnel',
    email: 'operateur@camtel.local',
    role: 'operational',
    centerId: 'center-1',
    status: 'active',
    passwordHash: bcrypt.hashSync('Op123456!', 10)
  }
];

function generateToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'camtel-secret', {
    expiresIn: process.env.JWT_EXPIRES_IN || '8h'
  });
}

function verifyPassword(password, hash) {
  return bcrypt.compareSync(password, hash);
}

function findUserByEmail(email) {
  return seedUsers.find((user) => user.email.toLowerCase() === String(email).toLowerCase()) || null;
}

function getSeedUsers() {
  return seedUsers.map(({ passwordHash, ...user }) => user);
}

module.exports = {
  generateToken,
  verifyPassword,
  findUserByEmail,
  getSeedUsers
};
