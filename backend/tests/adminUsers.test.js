const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const { createApp } = require('../src/app');
const db = require('../src/models');
const { toCanonicalRole } = require('../src/utils/roles');

async function loginAdmin(app) {
  const response = await request(app)
    .post('/api/auth/login')
    .send({ matricule: 'ADM-001', password: 'Admin123!' })
    .expect(200);
  return response.body.token;
}

async function getAdminAndChef() {
  const admin = await db.Utilisateur.findOne({
    where: { matricule: 'ADM-001' },
  });
  if (!admin) {
    throw new Error('Le jeu de données de test doit contenir un Admin actif.');
  }
  const roles = await db.Role.findAll();
  const chefRole = roles.find((role) => toCanonicalRole(role.libelle) === 'chef_operationnel');
  if (!chefRole) {
    throw new Error('Le rôle Chef opérationnel est absent du jeu de données de test.');
  }
  const chef = await db.Utilisateur.findOne({
    where: {
      centre_id: admin.centre_id,
      role_id: chefRole.id,
      statut: 'actif',
    },
  });

  if (!chef) {
    throw new Error('Le jeu de données de test doit contenir un Admin et un Chef opérationnel actifs.');
  }

  return { admin, chef };
}

describe('Administration des comptes utilisateurs', () => {
  test('un Admin crée puis supprime réellement un compte', async () => {
    const app = createApp();
    const token = await loginAdmin(app);
    const suffix = randomUUID();
    const roles = await request(app).get('/api/accounts/roles').expect(200);
    const operationnel = roles.body.data.find((role) => role.libelle === 'Opérationnel');
    const { chef } = await getAdminAndChef();

    let userId;
    try {
      const created = await request(app)
        .post('/api/accounts/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nom_complet: 'Compte test administration',
          email: `admin-created-${suffix}@example.test`,
          matricule: `ADM-${suffix}`,
          telephone: '600000000',
          role_id: operationnel.id,
          chef_operationnel_id: chef.id,
        })
        .expect(201);

      expect(created.body.data.temporaryPassword).toBeDefined();
      userId = created.body.data.id;
      expect(await db.Utilisateur.findByPk(userId)).not.toBeNull();

      const listed = await request(app)
        .get('/api/accounts/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(listed.body.data.some((account) => account.id === userId)).toBe(true);

      await request(app)
        .delete(`/api/accounts/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(await db.Utilisateur.findByPk(userId)).toBeNull();
    } finally {
      if (userId) await db.Utilisateur.destroy({ where: { id: userId } });
    }
  });

  test('la suppression d’un compte issu d’une demande conserve la demande archivée', async () => {
    const app = createApp();
    const token = await loginAdmin(app);
    const suffix = randomUUID();
    const roles = await request(app).get('/api/accounts/roles').expect(200);
    const operationnel = roles.body.data.find((role) => role.libelle === 'Opérationnel');
    const { admin, chef } = await getAdminAndChef();

    const submitted = await request(app)
      .post('/api/accounts/request')
      .send({
        name: 'Opérationnel à supprimer',
        email: `requested-${suffix}@example.test`,
        matricule: `REQ-${suffix}`,
        telephone: '600000001',
        role_id: operationnel.id,
        centre_id: admin.centre_id,
        chef_operationnel_id: chef.id,
        dateDemande: '2026-08-27',
      })
      .expect(201);

    const demandeId = submitted.body.data.id;
    const userId = submitted.body.data.utilisateur_id;

    try {
      await request(app)
        .delete(`/api/accounts/users/${userId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(await db.Utilisateur.findByPk(userId)).toBeNull();
      const archivedRequest = await db.DemandeAcces.findByPk(demandeId);
      expect(archivedRequest).not.toBeNull();
      expect(archivedRequest.utilisateur_id).toBeNull();
      expect(archivedRequest.email).toBe(`requested-${suffix}@example.test`);
    } finally {
      await db.DemandeAcces.destroy({ where: { id: demandeId } });
      await db.Utilisateur.destroy({ where: { id: userId } });
    }
  });

  test('mot de passe oublié : confirmation utilisateur puis réinitialisation par l’Admin', async () => {
    const app = createApp();
    const token = await loginAdmin(app);
    const suffix = randomUUID();
    const email = `password-reset-${suffix}@example.test`;
    const roles = await request(app).get('/api/accounts/roles').expect(200);
    const operationnel = roles.body.data.find((role) => role.libelle === 'Opérationnel');
    const { chef } = await getAdminAndChef();
    let userId;

    try {
      const created = await request(app)
        .post('/api/accounts/users')
        .set('Authorization', `Bearer ${token}`)
        .send({
          nom_complet: 'Compte test réinitialisation',
          email,
          matricule: `RESET-${suffix}`,
          role_id: operationnel.id,
          chef_operationnel_id: chef.id,
        })
        .expect(201);
      userId = created.body.data.id;

      const requested = await request(app)
        .post('/api/accounts/password-reset')
        .send({ email })
        .expect(200);
      expect(requested.body.data.message).toContain('un email de confirmation');
      expect((await db.Utilisateur.findByPk(userId)).statut).toBe('reset_demande');

      const reset = await request(app)
        .patch(`/api/accounts/users/${userId}/reset-password`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      const temporaryPassword = reset.body.data.temporaryPassword;
      expect(temporaryPassword).toBeDefined();

      const updated = await db.Utilisateur.findByPk(userId);
      expect(updated.statut).toBe('actif');
      expect(updated.must_change_password).toBe(true);
      expect(await bcrypt.compare(temporaryPassword, updated.mot_de_passe)).toBe(true);

      const unknown = await request(app)
        .post('/api/accounts/password-reset')
        .send({ email: `unknown-${suffix}@example.test` })
        .expect(200);
      expect(unknown.body.data.message).toBe(requested.body.data.message);
    } finally {
      if (userId) {
        const admin = await db.Utilisateur.findByPk('11111111-1111-5111-8111-111111111111');
        if (await db.Utilisateur.findByPk(userId)) {
          await require('../src/services/accountService').deleteUserByAdmin(userId, {
            id: admin.id, role: 'admin', centerId: admin.centre_id,
          });
        }
      }
    }
  });
});
