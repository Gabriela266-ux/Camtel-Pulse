const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const { createApp } = require('../src/app');
const db = require('../src/models');
const { toCanonicalRole } = require('../src/utils/roles');

describe('Hiérarchie Chef opérationnel et transfert d’équipe', () => {
  const app = createApp();
  const suffix = randomUUID();
  const password = 'EquipeTest123!';
  const createdUserIds = [];
  let adminToken;
  let centreId;
  let chefOne;
  let chefTwo;
  let operationnelOne;
  let operationnelTwo;
  let chefOneToken;
  let chefTwoToken;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ matricule: 'ADM-001', password: 'Admin123!' })
      .expect(200);
    adminToken = adminLogin.body.token;
    centreId = adminLogin.body.user.centerId;

    const roles = await db.Role.findAll();
    const chefRole = roles.find((role) => toCanonicalRole(role.libelle) === 'chef_operationnel');
    const operationnelRole = roles.find((role) => toCanonicalRole(role.libelle) === 'operationnel');
    const passwordHash = await bcrypt.hash(password, 10);

    chefOne = await db.Utilisateur.create({
      role_id: chefRole.id,
      centre_id: centreId,
      matricule: `CHEF-A-${suffix}`,
      nom_complet: 'Chef équipe Alpha',
      email: `chef-alpha-${suffix}@example.test`,
      mot_de_passe: passwordHash,
      must_change_password: false,
      statut: 'actif',
    });
    chefTwo = await db.Utilisateur.create({
      role_id: chefRole.id,
      centre_id: centreId,
      matricule: `CHEF-B-${suffix}`,
      nom_complet: 'Chef équipe Bêta',
      email: `chef-beta-${suffix}@example.test`,
      mot_de_passe: passwordHash,
      must_change_password: false,
      statut: 'actif',
    });
    operationnelOne = await db.Utilisateur.create({
      role_id: operationnelRole.id,
      centre_id: centreId,
      id_manager: chefOne.id,
      matricule: `OPE-A-${suffix}`,
      nom_complet: 'Opérationnel Alpha',
      email: `ope-alpha-${suffix}@example.test`,
      mot_de_passe: passwordHash,
      must_change_password: false,
      statut: 'actif',
    });
    operationnelTwo = await db.Utilisateur.create({
      role_id: operationnelRole.id,
      centre_id: centreId,
      id_manager: chefTwo.id,
      matricule: `OPE-B-${suffix}`,
      nom_complet: 'Opérationnel Bêta',
      email: `ope-beta-${suffix}@example.test`,
      mot_de_passe: passwordHash,
      must_change_password: false,
      statut: 'actif',
    });
    createdUserIds.push(chefOne.id, chefTwo.id, operationnelOne.id, operationnelTwo.id);

    const [chefOneLogin, chefTwoLogin] = await Promise.all([
      request(app).post('/api/auth/login').send({ matricule: chefOne.matricule, password }).expect(200),
      request(app).post('/api/auth/login').send({ matricule: chefTwo.matricule, password }).expect(200),
    ]);
    chefOneToken = chefOneLogin.body.token;
    chefTwoToken = chefTwoLogin.body.token;
  });

  afterAll(async () => {
    await db.AuditLog.destroy({
      where: {
        [db.Sequelize.Op.or]: [
          { utilisateur_id: createdUserIds },
          { entite_id: createdUserIds },
        ],
      },
    });
    await db.Utilisateur.destroy({ where: { id: [operationnelOne.id, operationnelTwo.id] } });
    await db.Utilisateur.destroy({ where: { id: [chefOne.id, chefTwo.id] } });
  });

  test('chaque Chef ne voit et ne gère que sa propre équipe', async () => {
    const [teamOne, teamTwo] = await Promise.all([
      request(app).get('/api/affectations').set('Authorization', `Bearer ${chefOneToken}`).expect(200),
      request(app).get('/api/affectations').set('Authorization', `Bearer ${chefTwoToken}`).expect(200),
    ]);

    expect(teamOne.body.data.map((item) => item.userId)).toContain(operationnelOne.id);
    expect(teamOne.body.data.map((item) => item.userId)).not.toContain(operationnelTwo.id);
    expect(teamTwo.body.data.map((item) => item.userId)).toContain(operationnelTwo.id);
    expect(teamTwo.body.data.map((item) => item.userId)).not.toContain(operationnelOne.id);

    await request(app)
      .patch(`/api/operationnels/${operationnelTwo.id}/statut`)
      .set('Authorization', `Bearer ${chefOneToken}`)
      .send({ statut: 'suspendu' })
      .expect(403);
  });

  test('l’Admin transfère un opérationnel et le changement est audité', async () => {
    const transferred = await request(app)
      .patch(`/api/operationnels/${operationnelTwo.id}/chef`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ chef_operationnel_id: chefOne.id })
      .expect(200);

    expect(transferred.body.data.chefOperationnel.id).toBe(chefOne.id);

    const [teamOne, teamTwo] = await Promise.all([
      request(app).get('/api/affectations').set('Authorization', `Bearer ${chefOneToken}`).expect(200),
      request(app).get('/api/affectations').set('Authorization', `Bearer ${chefTwoToken}`).expect(200),
    ]);
    expect(teamOne.body.data.map((item) => item.userId)).toEqual(
      expect.arrayContaining([operationnelOne.id, operationnelTwo.id]),
    );
    expect(teamTwo.body.data.map((item) => item.userId)).not.toContain(operationnelTwo.id);

    const audit = await db.AuditLog.findOne({
      where: { action: 'operationnel_transfere_chef', entite_id: operationnelTwo.id },
      order: [['created_at', 'DESC']],
    });
    expect(audit).not.toBeNull();
    expect(JSON.parse(audit.details)).toMatchObject({
      avant: { id: chefTwo.id },
      apres: { id: chefOne.id },
    });
  });
});
