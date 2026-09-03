const { randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const { createApp } = require('../src/app');
const db = require('../src/models');
const { toCanonicalRole } = require('../src/utils/roles');

describe('Super Admin et isolation multi-centres', () => {
  const app = createApp();
  const suffix = randomUUID();
  const password = 'ScopeTest123!';
  const createdUserIds = [];
  const createdRequestIds = [];
  const createdCentreIds = [];
  const createdPartnerIds = [];
  let superToken;
  let adminRole;
  let operationnelRole;
  let chefRole;
  let centreOne;
  let centreTwo;
  let adminOne;
  let adminTwo;
  let adminOneToken;
  let adminTwoToken;

  beforeAll(async () => {
    const roles = await db.Role.findAll();
    const superRole = roles.find((role) => toCanonicalRole(role.libelle) === 'super_admin');
    adminRole = roles.find((role) => toCanonicalRole(role.libelle) === 'admin');
    operationnelRole = roles.find((role) => toCanonicalRole(role.libelle) === 'operationnel');
    chefRole = roles.find((role) => toCanonicalRole(role.libelle) === 'chef_operationnel');

    const superUser = await db.Utilisateur.create({
      role_id: superRole.id,
      centre_id: null,
      matricule: `SUP-TEST-${suffix}`,
      nom_complet: 'Super Admin test multi-centres',
      email: `super-${suffix}@example.test`,
      mot_de_passe: await bcrypt.hash(password, 10),
      must_change_password: false,
      statut: 'actif',
    });
    createdUserIds.push(superUser.id);
    const login = await request(app).post('/api/auth/login').send({ matricule: superUser.matricule, password }).expect(200);
    superToken = login.body.token;
  });

  afterAll(async () => {
    if (createdUserIds.length || createdRequestIds.length) {
      await db.AuditLog.destroy({
        where: {
          [db.Sequelize.Op.or]: [
            { utilisateur_id: createdUserIds },
            { entite_id: [...createdUserIds, ...createdRequestIds, ...createdCentreIds] },
          ],
        },
      });
    }
    if (createdRequestIds.length) await db.DemandeAcces.destroy({ where: { id: createdRequestIds } });
    if (createdUserIds.length) {
      await db.AffectationOperationnelPartenaire.destroy({ where: { utilisateur_id: createdUserIds } });
      await db.Utilisateur.destroy({ where: { id: createdUserIds } });
    }
    if (createdPartnerIds.length) await db.Da.destroy({ where: { id: createdPartnerIds } });
    if (createdCentreIds.length) await db.Centre.destroy({ where: { id: createdCentreIds } });
  });

  test('le compte initial existe une seule fois, est hashé et reste global', async () => {
    const initialAccounts = await db.Utilisateur.findAll({ where: { email: 'superadmin@camtel.local' } });
    expect(initialAccounts).toHaveLength(1);
    expect(initialAccounts[0].centre_id).toBeNull();
    expect(initialAccounts[0].mot_de_passe).not.toBe('Amind123!');
    expect(initialAccounts[0].mot_de_passe).toMatch(/^\$2[aby]\$/);
  });

  test('les rôles publics excluent Admin et Super Admin, y compris côté backend', async () => {
    const response = await request(app).get('/api/accounts/request-roles').expect(200);
    expect(response.body.data.map((role) => role.libelle)).toEqual([
      'Manager', 'Chef Opérationnel', 'Opérationnel',
    ]);

    const existingCentre = await db.Centre.findOne({ where: { active: true } });
    await request(app).post('/api/accounts/request').send({
      name: 'Tentative Admin publique',
      matricule: `BAD-ADM-${suffix}`,
      email: `bad-admin-${suffix}@example.test`,
      telephone: '699000001',
      centre_id: existingCentre.id,
      role_id: adminRole.id,
    }).expect(400);
  });

  test('crée deux centres avec des codes CPDSM uniques et sans réutilisation', async () => {
    const first = await request(app)
      .post('/api/super-admin/centres')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ nom_centre: `Centre Nord ${suffix}`, region: 'Nord', telephone: '699100001' })
      .expect(201);
    const second = await request(app)
      .post('/api/super-admin/centres')
      .set('Authorization', `Bearer ${superToken}`)
      .send({ nom_centre: `Centre Sud ${suffix}`, region: 'Sud', telephone: '699100002' })
      .expect(201);
    centreOne = first.body.data;
    centreTwo = second.body.data;
    createdCentreIds.push(centreOne.id, centreTwo.id);
    expect(centreOne.code_centre).toMatch(/^CPDSM \d+$/);
    expect(centreTwo.code_centre).toMatch(/^CPDSM \d+$/);
    expect(centreOne.code_centre).not.toBe(centreTwo.code_centre);

    await expect(db.Centre.create({
      nom_centre: 'Doublon impossible', code_centre: centreOne.code_centre,
      region: 'Test', telephone: '699100009', active: true,
    })).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' });

    await request(app)
      .patch(`/api/super-admin/centres/${centreTwo.id}/status`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ active: false })
      .expect(200);
    const publicCentres = await request(app).get('/api/centres/public').expect(200);
    expect(publicCentres.body.data.some((centre) => centre.id === centreTwo.id)).toBe(false);
    await request(app)
      .patch(`/api/super-admin/centres/${centreTwo.id}/status`)
      .set('Authorization', `Bearer ${superToken}`)
      .send({ active: true })
      .expect(200);
  });

  test('seul le Super Admin crée les Admins rattachés à leur centre', async () => {
    const createAdmin = async (centre, index) => {
      const response = await request(app)
        .post('/api/super-admin/admins')
        .set('Authorization', `Bearer ${superToken}`)
        .send({
          nom_complet: `Admin centre ${index}`,
          matricule: `ADM-C${index}-${suffix}`,
          email: `admin-c${index}-${suffix}@example.test`,
          telephone: `69920000${index}`,
          centre_id: centre.id,
        })
        .expect(201);
      createdUserIds.push(response.body.data.id);
      expect(response.body.data.temporaryPassword).toBeTruthy();
      expect(response.body.data.centre_id).toBe(centre.id);
      return response.body.data;
    };
    adminOne = await createAdmin(centreOne, 1);
    adminTwo = await createAdmin(centreTwo, 2);

    const activateAdmin = async (admin, newPassword) => {
      const initialLogin = await request(app).post('/api/auth/login').send({
        matricule: admin.matricule, password: admin.temporaryPassword,
      }).expect(200);
      await request(app)
        .get('/api/accounts/users')
        .set('Authorization', `Bearer ${initialLogin.body.token}`)
        .expect(403);
      await request(app)
        .post('/api/auth/change-temporary-password')
        .set('Authorization', `Bearer ${initialLogin.body.token}`)
        .send({ currentPassword: admin.temporaryPassword, newPassword })
        .expect(200);
      const login = await request(app).post('/api/auth/login').send({ matricule: admin.matricule, password: newPassword }).expect(200);
      return login.body.token;
    };
    adminOneToken = await activateAdmin(adminOne, 'AdminOne123!');
    adminTwoToken = await activateAdmin(adminTwo, 'AdminTwo123!');

    await request(app)
      .post('/api/super-admin/centres')
      .set('Authorization', `Bearer ${adminOneToken}`)
      .send({ nom_centre: 'Interdit', region: 'Test', telephone: '699000009' })
      .expect(403);
    await request(app)
      .post('/api/accounts/users')
      .set('Authorization', `Bearer ${adminOneToken}`)
      .send({
        nom_complet: 'Admin interdit', matricule: `ADM-BAD-${suffix}`,
        email: `admin-forbidden-${suffix}@example.test`, role_id: adminRole.id,
      })
      .expect(403);
  });

  test('isole la demande, la validation, le compte et les affectations par centre', async () => {
    const chef = await db.Utilisateur.create({
      role_id: chefRole.id,
      centre_id: centreOne.id,
      matricule: `CHEF-SCOPE-${suffix}`,
      nom_complet: 'Chef test centre un',
      email: `chef-scope-${suffix}@example.test`,
      mot_de_passe: await bcrypt.hash(password, 10),
      must_change_password: false,
      statut: 'actif',
    });
    createdUserIds.push(chef.id);

    const submitted = await request(app).post('/api/accounts/request').send({
      name: 'Opérationnel multi-centres',
      matricule: `OPE-SCOPE-${suffix}`,
      email: `ope-scope-${suffix}@example.test`,
      telephone: '699300001',
      centre_id: centreOne.id,
      role_id: operationnelRole.id,
      chef_operationnel_id: chef.id,
    }).expect(201);
    const demande = submitted.body.data;
    createdRequestIds.push(demande.id);
    createdUserIds.push(demande.utilisateur_id);

    const otherCenterRequests = await request(app)
      .get('/api/accounts/demandes')
      .set('Authorization', `Bearer ${adminTwoToken}`)
      .expect(200);
    expect(otherCenterRequests.body.data.some((item) => item.id === demande.id)).toBe(false);
    await request(app)
      .patch(`/api/accounts/${demande.id}/approve`)
      .set('Authorization', `Bearer ${adminTwoToken}`)
      .expect(403);

    await request(app)
      .patch(`/api/accounts/${demande.id}/approve`)
      .set('Authorization', `Bearer ${adminOneToken}`)
      .expect(200);
    const operationnel = await db.Utilisateur.findByPk(demande.utilisateur_id);
    expect(operationnel.centre_id).toBe(centreOne.id);
    expect(operationnel.id_manager).toBe(chef.id);
    expect(await db.AffectationOperationnelPartenaire.count({ where: { utilisateur_id: operationnel.id } })).toBe(0);

    const chefLogin = await request(app).post('/api/auth/login').send({ matricule: chef.matricule, password }).expect(200);
    const partner = await db.Da.create({
      centre_id: centreTwo.id,
      code: `CROSS-${suffix}`,
      nom: 'Partenaire autre centre',
      region: 'Sud',
      numero_sim: `SIM-${suffix}`,
      objectif_mensuel: 0,
      active: true,
    });
    createdPartnerIds.push(partner.id);
    await request(app)
      .patch(`/api/affectations/${operationnel.id}`)
      .set('Authorization', `Bearer ${chefLogin.body.token}`)
      .send({ partenaireIds: [partner.id] })
      .expect(403);

    const centreOneUsers = await request(app)
      .get('/api/accounts/users')
      .set('Authorization', `Bearer ${adminOneToken}`)
      .expect(200);
    expect(centreOneUsers.body.data.some((item) => item.id === adminTwo.id)).toBe(false);
    const globalUsers = await request(app)
      .get('/api/accounts/users')
      .set('Authorization', `Bearer ${superToken}`)
      .expect(200);
    expect(globalUsers.body.data.some((item) => item.id === adminTwo.id)).toBe(true);
  });

  test('l’audit ne contient aucun mot de passe, hash ou token', async () => {
    const audit = await request(app)
      .get('/api/super-admin/audit')
      .set('Authorization', `Bearer ${superToken}`)
      .expect(200);
    const serialized = JSON.stringify(audit.body.data.map((entry) => entry.details || {})).toLowerCase();
    expect(serialized).not.toContain('temporarypassword');
    expect(serialized).not.toContain('mot_de_passe');
    expect(serialized).not.toContain('passwordhash');
    expect(serialized).not.toContain('bearer ');
    expect(serialized).not.toContain('admintwo123!');
  });
});
