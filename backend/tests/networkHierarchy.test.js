const { randomInt, randomUUID } = require('crypto');
const bcrypt = require('bcryptjs');
const request = require('supertest');
const { createApp } = require('../src/app');
const db = require('../src/models');
const {
  dsmNetworkCode,
  networkLabel,
  normalizeEntityCode,
  normalizePhone,
  normalizeZoneCode,
  partnerNetworkCode,
  posNetworkCode,
} = require('../src/utils/networkIdentity');

function uniquePhone() {
  return `6${randomInt(10000000, 99999999)}`;
}

describe('Network identity helpers', () => {
  test('normalizes and formats the Partner, DSM and POS identities', () => {
    expect(normalizePhone('+237 620 473 545')).toBe('620473545');
    expect(normalizeZoneCode('Littoral 1')).toBe('LITTORAL_1');
    expect(normalizeEntityCode('dsm-4', 'DSM', 'Code DSM')).toBe('DSM4');
    expect(normalizeEntityCode('pos_274', 'POS', 'Code POS')).toBe('POS274');
    expect(partnerNetworkCode('LITTORAL_1')).toBe('MASTER_SIM_ZONE_LITTORAL_1');
    expect(dsmNetworkCode('DSM4', 'LT1')).toBe('DSM4_LT1');
    expect(posNetworkCode('POS274', 'DSM4', 'LT1')).toBe('POS274_DSM4_LT1');
    expect(networkLabel('620109476', 'POS274_DSM4_LT1')).toBe('620109476 - POS274_DSM4_LT1');
  });

  test('rejects invalid phone numbers and entity codes', () => {
    expect(() => normalizePhone('123')).toThrow('9 chiffres');
    expect(() => normalizeEntityCode('4', 'DSM', 'Code DSM')).toThrow('commencer par DSM');
  });
});

describe('Network hierarchy API', () => {
  let app;
  let chefToken;
  let adminToken;
  let chefUserId;
  let partner;
  let dsm;
  let pos;
  let secondaryPartner;
  let roleTestDsm;
  let secondaryRoleTestDsm;
  const testUsers = [];

  beforeAll(async () => {
    app = createApp();
    const [chefLogin, adminLogin] = await Promise.all([
      request(app)
        .post('/api/auth/login')
        .send({ matricule: 'AGT-001', password: 'Admin123!' }),
      request(app)
        .post('/api/auth/login')
        .send({ matricule: 'ADM-001', password: 'Admin123!' }),
    ]);

    expect(chefLogin.status).toBe(200);
    expect(adminLogin.status).toBe(200);
    chefToken = chefLogin.body.token;
    chefUserId = chefLogin.body.user.id;
    adminToken = adminLogin.body.token;
  });

  afterAll(async () => {
    if (testUsers.length) {
      const userIds = testUsers.map((user) => user.id);
      await db.AuditLog.destroy({ where: { utilisateur_id: userIds } });
      await db.Utilisateur.destroy({ where: { id: userIds } });
    }
    if (roleTestDsm) await db.Dsm.destroy({ where: { id: roleTestDsm.id } });
    if (secondaryRoleTestDsm) await db.Dsm.destroy({ where: { id: secondaryRoleTestDsm.id } });
    if (pos) await db.Pos.destroy({ where: { id: pos.id } });
    if (dsm) await db.Dsm.destroy({ where: { id: dsm.id } });
    if (secondaryPartner) await db.Da.destroy({ where: { id: secondaryPartner.id } });
    if (partner) await db.Da.destroy({ where: { id: partner.id } });
  });

  test('keeps operational network creation away from the administrator', async () => {
    const response = await request(app)
      .post('/api/partenaires')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        nom: 'Partenaire non autorisé',
        region: 'Littoral',
        masterSim: uniquePhone(),
        codeZone: `TEST_${randomInt(1000, 9999)}`,
        attribution: { type: 'CHEF' },
      });

    expect(response.status).toBe(403);
  });

  test('creates a Partner, DSM and POS with inherited real network identifiers', async () => {
    const suffix = randomInt(1000, 9999);
    const partnerPhone = uniquePhone();
    const dsmPhone = uniquePhone();
    const posPhone = uniquePhone();

    const partnerResponse = await request(app)
      .post('/api/partenaires')
      .set('Authorization', `Bearer ${chefToken}`)
      .send({
        nom: `Partenaire test ${suffix}`,
        region: 'Littoral',
        masterSim: partnerPhone,
        codeZone: `LITTORAL_${suffix}`,
        attribution: { type: 'CHEF' },
      });

    expect(partnerResponse.status).toBe(201);
    partner = partnerResponse.body.data;
    expect(partner.code).toBe(`MASTER_SIM_ZONE_LITTORAL_${suffix}`);
    expect(partner.code_zone).toBe(`LITTORAL_${suffix}`);
    expect(partner.nom_reseau).toBe(`${partnerPhone} - MASTER_SIM_ZONE_LITTORAL_${suffix}`);

    const dsmResponse = await request(app)
      .post('/api/organization/dsms')
      .set('Authorization', `Bearer ${chefToken}`)
      .send({
        da_id: partner.id,
        nom: `DSM test ${suffix}`,
        numero_telephone: dsmPhone,
        code_dsm: `DSM${suffix}`,
        code_zone: `LT${suffix}`,
      });

    expect(dsmResponse.status).toBe(201);
    dsm = dsmResponse.body.data;
    expect(dsm.code_dsm).toBe(`DSM${suffix}`);
    expect(dsm.code_zone).toBe(`LT${suffix}`);
    expect(dsm.nom_reseau).toBe(`${dsmPhone} - DSM${suffix}_LT${suffix}`);

    const posResponse = await request(app)
      .post('/api/organization/pos')
      .set('Authorization', `Bearer ${chefToken}`)
      .send({
        dsm_id: dsm.id,
        numero_telephone: posPhone,
        code_pos: `POS${suffix}`,
      });

    expect(posResponse.status).toBe(201);
    pos = posResponse.body.data;
    expect(pos.code_dsm).toBe(`DSM${suffix}`);
    expect(pos.code_zone).toBe(`LT${suffix}`);
    expect(pos.nom_reseau).toBe(`${posPhone} - POS${suffix}_DSM${suffix}_LT${suffix}`);
  });

  test('allows an Operationnel to manage DSM/POS only under the assigned Partner', async () => {
    const persistedPartner = await db.Da.findByPk(partner.id);
    const center = persistedPartner ? await db.Centre.findByPk(persistedPartner.centre_id) : null;
    const [operationnelRole, managerRole] = await Promise.all([
      db.Role.findOne({ where: { libelle: 'Operationnel' } }),
      db.Role.findOne({ where: { libelle: 'Manager' } }),
    ]);
    expect(center).toBeTruthy();
    expect(operationnelRole).toBeTruthy();
    expect(managerRole).toBeTruthy();

    const suffix = randomUUID();
    const password = 'RoleTest123!';
    secondaryPartner = await db.Da.create({
      centre_id: center.id,
      code: `MASTER_SIM_ZONE_SECOND_${suffix.slice(0, 6)}`,
      nom: `Partenaire secondaire ${suffix}`,
      region: 'Littoral',
      numero_sim: uniquePhone(),
      code_zone: `SECOND_${suffix.slice(0, 6).toUpperCase()}`,
      objectif_mensuel: 0,
      active: true,
    });

    const [operationnel, manager] = await Promise.all([
      db.Utilisateur.create({
        role_id: operationnelRole.id,
        centre_id: center.id,
        id_manager: chefUserId,
        da_id: partner.id,
        matricule: `OPE-${suffix}`,
        nom_complet: 'Opérationnel test réseau',
        email: `operationnel-${suffix}@example.test`,
        mot_de_passe: await bcrypt.hash(password, 10),
        statut: 'actif',
      }),
      db.Utilisateur.create({
        role_id: managerRole.id,
        centre_id: center.id,
        matricule: `MGR-${suffix}`,
        nom_complet: 'Manager test réseau',
        email: `manager-${suffix}@example.test`,
        mot_de_passe: await bcrypt.hash(password, 10),
        statut: 'actif',
      }),
    ]);
    testUsers.push(operationnel, manager);
    await db.AffectationOperationnelPartenaire.create({
      utilisateur_id: operationnel.id,
      da_id: partner.id,
      statut: 'actif',
    });

    const [operationnelLogin, managerLogin] = await Promise.all([
      request(app).post('/api/auth/login').send({ matricule: operationnel.matricule, password }),
      request(app).post('/api/auth/login').send({ matricule: manager.matricule, password }),
    ]);
    expect(operationnelLogin.status).toBe(200);
    expect(managerLogin.status).toBe(200);

    const operationnelsList = await request(app)
      .get('/api/operationnels')
      .set('Authorization', `Bearer ${chefToken}`);
    expect(operationnelsList.status).toBe(200);
    expect(operationnelsList.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: operationnel.id,
        nom_complet: 'Opérationnel test réseau',
        email: operationnel.email,
      }),
    ]));

    const createAllowed = await request(app)
      .post('/api/organization/dsms')
      .set('Authorization', `Bearer ${operationnelLogin.body.token}`)
      .send({
        da_id: partner.id,
        nom: 'DSM attribué',
        numero_telephone: uniquePhone(),
        code_dsm: `DSM${randomInt(10000, 99999)}`,
        code_zone: 'LT_ROLE_TEST',
      });
    expect(createAllowed.status).toBe(201);
    roleTestDsm = createAllowed.body.data;

    const updateAllowed = await request(app)
      .patch(`/api/organization/dsms/${roleTestDsm.id}`)
      .set('Authorization', `Bearer ${operationnelLogin.body.token}`)
      .send({ nom: 'DSM attribué modifié' });
    expect(updateAllowed.status).toBe(200);
    expect(updateAllowed.body.data.nom).toBe('DSM attribué modifié');

    const createOutsideScope = await request(app)
      .post('/api/organization/dsms')
      .set('Authorization', `Bearer ${operationnelLogin.body.token}`)
      .send({
        da_id: secondaryPartner.id,
        nom: 'DSM hors périmètre',
        numero_telephone: uniquePhone(),
        code_dsm: `DSM${randomInt(10000, 99999)}`,
        code_zone: 'LT_FORBIDDEN',
      });
    expect(createOutsideScope.status).toBe(403);

    const multiAssignment = await request(app)
      .patch(`/api/affectations/${operationnel.id}`)
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ partenaireIds: [partner.id, secondaryPartner.id] });
    expect(multiAssignment.status).toBe(200);
    expect(multiAssignment.body.data.partenaireIds.sort()).toEqual([partner.id, secondaryPartner.id].sort());

    const createAfterExplicitAssignment = await request(app)
      .post('/api/organization/dsms')
      .set('Authorization', `Bearer ${operationnelLogin.body.token}`)
      .send({
        da_id: secondaryPartner.id,
        nom: 'DSM second périmètre',
        numero_telephone: uniquePhone(),
        code_dsm: `DSM${randomInt(10000, 99999)}`,
        code_zone: 'LT_SECOND_SCOPE',
      });
    expect(createAfterExplicitAssignment.status).toBe(201);
    secondaryRoleTestDsm = createAfterExplicitAssignment.body.data;

    const managerMutation = await request(app)
      .post('/api/organization/dsms')
      .set('Authorization', `Bearer ${managerLogin.body.token}`)
      .send({});
    expect(managerMutation.status).toBe(403);

    const operationnelDelete = await request(app)
      .delete(`/api/organization/dsms/${roleTestDsm.id}`)
      .set('Authorization', `Bearer ${operationnelLogin.body.token}`);
    expect(operationnelDelete.status).toBe(403);

    const adminAssignment = await request(app)
      .patch(`/api/affectations/${operationnel.id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ partenaireId: secondaryPartner.id, dsmId: null, posId: null });
    expect(adminAssignment.status).toBe(403);

    const chefAssignment = await request(app)
      .patch(`/api/affectations/${operationnel.id}`)
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ partenaireId: secondaryPartner.id, dsmId: null, posId: null });
    expect(chefAssignment.status).toBe(200);
    expect(chefAssignment.body.data.partenaireId).toBe(secondaryPartner.id);

    const suspend = await request(app)
      .patch(`/api/operationnels/${operationnel.id}/statut`)
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ statut: 'suspendu' });
    expect(suspend.status).toBe(200);
    expect(suspend.body.data.statut).toBe('suspendu');

    const suspendedTokenRequest = await request(app)
      .get('/api/operationnels')
      .set('Authorization', `Bearer ${operationnelLogin.body.token}`);
    expect(suspendedTokenRequest.status).toBe(403);

    const suspendedLogin = await request(app)
      .post('/api/auth/login')
      .send({ matricule: operationnel.matricule, password });
    expect(suspendedLogin.status).toBe(403);

    const adminReactivation = await request(app)
      .patch(`/api/operationnels/${operationnel.id}/statut`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ statut: 'actif' });
    expect(adminReactivation.status).toBe(403);

    const reactivate = await request(app)
      .patch(`/api/operationnels/${operationnel.id}/statut`)
      .set('Authorization', `Bearer ${chefToken}`)
      .send({ statut: 'actif' });
    expect(reactivate.status).toBe(200);
    expect(reactivate.body.data.statut).toBe('actif');
  });
});
