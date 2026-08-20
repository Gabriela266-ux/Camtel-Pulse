const bcrypt = require('bcryptjs');
const db = require('../models');

class AccountService {
  async listPendingAccounts() {
    return await db.Utilisateur.findAll({
      where: { statut: 'inactif' },
      include: [{ model: db.Role, as: 'role' }]
    });
  }

  async requestAccount(payload) {
    const email = payload.email;
    if (!email) {
      throw new Error('Email requis');
    }

    const existing = await db.Utilisateur.findOne({ where: { email: email.toLowerCase() } });
    if (existing) {
      throw new Error('Compte déjà existant');
    }

    const account = await db.Utilisateur.create({
      nom_complet: payload.name || 'Nouvel utilisateur',
      email,
      telephone: payload.telephone || null,
      mot_de_passe: await bcrypt.hash(payload.password || 'Temp123!', 10),
      role_id: payload.role_id || null,
      statut: 'inactif',
      da_id: payload.da_id || null,
      zone_id: payload.zone_id || null,
      matricule: `MAT-${Date.now()}`
    });

    return account;
  }

  async approveAccount(userId) {
    const user = await db.Utilisateur.findByPk(userId);
    if (!user) {
      throw new Error('Compte introuvable');
    }

    await user.update({ statut: 'actif' });
    return user;
  }
}

module.exports = new AccountService();