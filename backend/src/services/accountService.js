const bcrypt = require('bcryptjs');
const { users } = require('../data/seedData');

class AccountService {
  async listPendingAccounts() {
    return users.filter((user) => user.status === 'pending');
  }

  async requestAccount(payload) {
    const email = payload.email;
    if (!email) {
      throw new Error('Email requis');
    }

    const existing = users.find((user) => user.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error('Compte déjà existant');
    }

    const account = {
      id: `user-${Date.now()}`,
      name: payload.name || 'Nouvel utilisateur',
      email,
      role: payload.role || 'operational',
      centerId: payload.centerId || 'center-1',
      status: 'pending',
      passwordHash: await bcrypt.hash(payload.password || 'Temp123!', 10)
    };

    users.push(account);
    return account;
  }

  async approveAccount(userId) {
    const user = users.find((item) => item.id === userId);
    if (!user) {
      throw new Error('Compte introuvable');
    }

    user.status = 'active';
    return user;
  }
}

module.exports = new AccountService();
