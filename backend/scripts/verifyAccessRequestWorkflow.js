const { randomUUID } = require('crypto');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { createApp } = require('../src/app');
const db = require('../src/models');
const accountService = require('../src/services/accountService');

async function main() {
  const suffix = randomUUID();
  const email = `access-request-${suffix}@example.test`;
  let createdUser;

  try {
    const admin = await db.Utilisateur.findOne({
      include: [{ model: db.Role, as: 'role' }],
      where: db.Sequelize.where(
        db.Sequelize.fn('lower', db.Sequelize.col('role.libelle')),
        'admin'
      )
    });
    if (!admin) throw new Error('An active Admin account is required for the access-request workflow test');

    const app = createApp();
    const rolesResponse = await request(app)
      .get('/api/accounts/roles')
      .expect(200);
    const managerRole = rolesResponse.body?.data?.find((role) => role.libelle === 'Manager');
    if (!managerRole) throw new Error('The Manager role is required for this workflow test');
    const submit = await request(app)
      .post('/api/accounts/request')
      .send({
        name: 'Access request workflow test',
        role_id: managerRole.id,
        matricule: `REQ-${suffix}`,
        email,
        telephone: '600000000',
        dateDemande: '2026-08-25'
      })
      .expect(201);

    const demandeId = submit.body?.data?.id;
    if (!demandeId) throw new Error('The access request did not create a demande');
    const demande = await db.DemandeAcces.findByPk(demandeId, {
      include: [{ model: db.Utilisateur, as: 'user' }, { model: db.Role, as: 'role' }]
    });
    if (!demande?.role_id || !demande.role) throw new Error('The created demande has no valid role');
    if (demande.statut !== 'EN_ATTENTE') throw new Error('The demande is not pending approval');
    createdUser = demande.user;
    if (!createdUser?.role_id) throw new Error('The created account has no valid role');
    if (createdUser.statut !== 'inactif') throw new Error('The created account is not pending approval');

    const token = jwt.sign(
      { sub: admin.id, email: admin.email, role: 'admin' },
      process.env.JWT_SECRET || 'camtel-secret',
      { expiresIn: '5m' }
    );
    const pending = await request(app)
      .get('/api/accounts/pending')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    if (!pending.body.data.some((account) => account.id === demandeId)) {
      throw new Error('The new access request is not visible to the Admin');
    }

    await request(app)
      .patch(`/api/accounts/${demandeId}/approve`)
      .set('Authorization', `Bearer ${token}`)
      .expect(200);
    const approvedUser = await db.Utilisateur.findByPk(createdUser.id);
    if (approvedUser?.statut !== 'actif') throw new Error('The Admin approval did not activate the account');
    if (approvedUser.role_id !== demande.role_id) throw new Error('role_id was not correctly associated on approval');
    if (approvedUser.poste_id !== null || demande.poste_id !== null) throw new Error('A role-based request must not invent a poste_id');

    console.log('Access request workflow passed: valid role, pending Admin review, and approval.');
  } finally {
    if (createdUser) {
      await db.sequelize.transaction(async (transaction) => {
        await db.DemandeAcces.destroy({ where: { utilisateur_id: createdUser.id }, transaction });
        await accountService.destroyUnreferencedUser(createdUser, transaction);
      });
    }
    await db.sequelize.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
