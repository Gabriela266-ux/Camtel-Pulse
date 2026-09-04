'use strict';

const bcrypt = require('bcryptjs');
const db = require('../models');
const accountService = require('./accountService');
const auditService = require('./auditService');
const emailService = require('./emailService');
const { toCanonicalRole } = require('../utils/roles');
const redis = require('../config/redis');

function httpError(message, statusCode) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function cleanText(value) {
  return String(value || '').trim();
}

function normalizePhone(value) {
  const raw = cleanText(value);
  if (!raw) throw httpError('Le téléphone est obligatoire.', 400);
  const normalized = raw.replace(/[\s().-]/g, '');
  if (!/^\+?\d{8,15}$/.test(normalized)) {
    throw httpError('Le numéro de téléphone est invalide.', 400);
  }
  return normalized;
}

async function findRole(canonicalRole, transaction) {
  const roles = await db.Role.findAll({ transaction });
  return roles.find((role) => toCanonicalRole(role.libelle) === canonicalRole) || null;
}

async function serializeCentre(centre) {
  const [users, partners, dsms, pos] = await Promise.all([
    db.Utilisateur.count({ where: { centre_id: centre.id } }),
    db.Da.count({ where: { centre_id: centre.id } }),
    db.Dsm.count({
      include: [{ model: db.Da, as: 'da', required: true, where: { centre_id: centre.id } }],
    }),
    db.Pos.count({
      include: [{
        model: db.Dsm,
        as: 'dsm',
        required: true,
        include: [{ model: db.Da, as: 'da', required: true, where: { centre_id: centre.id } }],
      }],
    }),
  ]);
  return {
    id: centre.id,
    code_centre: centre.code_centre,
    nom_centre: centre.nom_centre,
    region: centre.region,
    telephone: centre.telephone,
    active: Boolean(centre.active),
    created_at: centre.created_at || centre.createdAt,
    updated_at: centre.updated_at || centre.updatedAt,
    counts: { users, partners, dsms, pos },
  };
}

class SuperAdminService {
  async publicCentres() {
    const cached = await redis.getCache('centres:public');
    if (cached) return JSON.parse(cached);
    const centres = await db.Centre.findAll({
      where: { active: true },
      attributes: ['id', 'code_centre', 'nom_centre', 'region'],
      order: [['code_centre', 'ASC']],
    });
    const data = centres.map((centre) => centre.toJSON());
    await redis.setCache('centres:public', data, 30);
    return data;
  }

  async overview() {
    const adminRole = await findRole('admin');
    const [activeCentres, admins, users, pendingRequests, suspendedAccounts] = await Promise.all([
      db.Centre.count({ where: { active: true } }),
      adminRole ? db.Utilisateur.count({ where: { role_id: adminRole.id } }) : 0,
      db.Utilisateur.count(),
      db.DemandeAcces.count({ where: { statut: 'EN_ATTENTE' } }),
      db.Utilisateur.count({ where: { statut: { [db.Sequelize.Op.ne]: 'actif' } } }),
    ]);
    return { activeCentres, admins, users, pendingRequests, suspendedAccounts };
  }

  async listCentres() {
    const centres = await db.Centre.findAll({ order: [['code_centre', 'ASC']] });
    return Promise.all(centres.map(serializeCentre));
  }

  async getCentre(id) {
    const centre = await db.Centre.findByPk(id);
    if (!centre) throw httpError('Centre introuvable.', 404);
    return serializeCentre(centre);
  }

  async nextCentreCode(transaction) {
    const rows = await db.Centre.findAll({
      attributes: ['code_centre'], transaction, lock: transaction.LOCK.UPDATE,
    });
    const max = rows.reduce((current, row) => {
      const match = String(row.code_centre || '').match(/^CPDSM\s+(\d+)$/i);
      return match ? Math.max(current, Number(match[1])) : current;
    }, 0);
    return `CPDSM ${max + 1}`;
  }

  async createCentre(payload, actor) {
    const nomCentre = cleanText(payload.nom_centre);
    const region = cleanText(payload.region);
    const telephone = normalizePhone(payload.telephone);
    if (!nomCentre || !region) throw httpError('Le nom et la région sont obligatoires.', 400);

    let created;
    for (let attempt = 0; attempt < 3 && !created; attempt += 1) {
      try {
        created = await db.sequelize.transaction({
          type: db.Sequelize.Transaction.TYPES.IMMEDIATE,
        }, async (transaction) => {
          const codeCentre = await this.nextCentreCode(transaction);
          const centre = await db.Centre.create({
            nom_centre: nomCentre,
            code_centre: codeCentre,
            region,
            telephone,
            active: true,
          }, { transaction });
          await auditService.add({
            utilisateur_id: actor.id,
            action: 'centre_cree',
            entite: 'centre',
            entite_id: centre.id,
            details: {
              centre_id: centre.id,
              auteur_centre_id: actor.centerId || null,
              auteur_role: actor.role,
              avant: null,
              apres: { code_centre: codeCentre, nom_centre: nomCentre, region, telephone, active: true },
            },
          }, transaction);
          return centre;
        });
      } catch (error) {
        if (error.name !== 'SequelizeUniqueConstraintError' || attempt === 2) throw error;
      }
    }
    await redis.deleteCache('centres:public');
    await redis.publish('events', { type: 'dashboard_updated', payload: { event: 'created', centreId: created.id } });
    return serializeCentre(created);
  }

  async updateCentre(id, payload, actor) {
    const centre = await db.Centre.findByPk(id);
    if (!centre) throw httpError('Centre introuvable.', 404);
    const avant = {
      nom_centre: centre.nom_centre,
      region: centre.region,
      telephone: centre.telephone,
      active: Boolean(centre.active),
    };
    const updates = {};
    if (payload.nom_centre !== undefined) updates.nom_centre = cleanText(payload.nom_centre);
    if (payload.region !== undefined) updates.region = cleanText(payload.region);
    if (payload.telephone !== undefined) updates.telephone = normalizePhone(payload.telephone);
    if ('nom_centre' in updates && !updates.nom_centre) throw httpError('Le nom est obligatoire.', 400);
    if ('region' in updates && !updates.region) throw httpError('La région est obligatoire.', 400);
    await centre.update(updates);
    await redis.deleteCache('centres:public');
    await redis.publish('events', { type: 'dashboard_updated', payload: { event: 'updated', centreId: centre.id } });
    await auditService.add({
      utilisateur_id: actor.id,
      action: 'centre_modifie',
      entite: 'centre',
      entite_id: centre.id,
      details: { centre_id: centre.id, auteur_role: actor.role, avant, apres: { ...avant, ...updates } },
    });
    return serializeCentre(centre);
  }

  async setCentreStatus(id, active, actor) {
    if (typeof active !== 'boolean') throw httpError('Le statut active doit être un booléen.', 400);
    const centre = await db.Centre.findByPk(id);
    if (!centre) throw httpError('Centre introuvable.', 404);
    const before = Boolean(centre.active);
    await centre.update({ active });
    await redis.deleteCache('centres:public');
    await redis.publish('events', { type: 'dashboard_updated', payload: { event: active ? 'activated' : 'deactivated', centreId: centre.id } });
    await auditService.add({
      utilisateur_id: actor.id,
      action: active ? 'centre_active' : 'centre_desactive',
      entite: 'centre',
      entite_id: centre.id,
      details: { centre_id: centre.id, auteur_role: actor.role, avant: { active: before }, apres: { active } },
    });
    return serializeCentre(centre);
  }

  async deleteCentre(id) {
    const centre = await db.Centre.findByPk(id);
    if (!centre) throw httpError('Centre introuvable.', 404);

    await db.sequelize.transaction(async (transaction) => {
      const [daRows] = await db.sequelize.query(
        'SELECT id FROM da WHERE centre_id = :centreId',
        { replacements: { centreId: id }, transaction }
      );
      const daIds = daRows.map((row) => row.id);
      const [dsmRows] = daIds.length ? await db.sequelize.query(
        'SELECT id FROM dsm WHERE da_id IN (:daIds)',
        { replacements: { daIds }, transaction }
      ) : [[]];
      const dsmIds = dsmRows.map((row) => row.id);
      const [posRows] = dsmIds.length ? await db.sequelize.query(
        'SELECT id FROM pos WHERE dsm_id IN (:dsmIds)',
        { replacements: { dsmIds }, transaction }
      ) : [[]];
      const posIds = posRows.map((row) => row.id);
      const [userRows] = await db.sequelize.query(
        'SELECT id FROM utilisateur WHERE centre_id = :centreId',
        { replacements: { centreId: id }, transaction }
      );
      const userIds = userRows.map((row) => row.id);
      const entityIds = [id, ...daIds, ...dsmIds, ...posIds];

      const deleteByIds = async (table, columns, ids) => {
        if (!ids.length) return;
        const predicates = columns.map((column) => `${column} IN (:ids)`).join(' OR ');
        await db.sequelize.query(`DELETE FROM ${table} WHERE ${predicates}`, {
          replacements: { ids }, transaction,
        });
      };

      await deleteByIds('correction', ['pos_id', 'utilisateur_id', 'valide_par'], [...posIds, ...userIds]);
      await deleteByIds('vente_dsm_au_pos', ['dsm_id', 'pos_id', 'utilisateur_id'], [...dsmIds, ...posIds, ...userIds]);
      await deleteByIds('stock', ['dsm_id', 'pos_id', 'utilisateur_id'], [...dsmIds, ...posIds, ...userIds]);
      await deleteByIds('acht_journaliere', ['da_id', 'dsm_id', 'utilisateur_id'], [...daIds, ...dsmIds, ...userIds]);
      await deleteByIds('calendrier_achat', ['dsm_id', 'pos_id', 'utilisateur_id'], [...dsmIds, ...posIds, ...userIds]);
      await deleteByIds('prevision_journaliere', ['da_id', 'dsm_id', 'pos_id'], [...daIds, ...dsmIds, ...posIds]);
      await deleteByIds('objectif_mensuel', ['da_id', 'dsm_id', 'pos_id'], [...daIds, ...dsmIds, ...posIds]);
      await deleteByIds('affectation_operationnel_partenaire', ['da_id', 'utilisateur_id', 'affecte_par'], [...daIds, ...userIds]);
      await deleteByIds('demande_acces', ['centre_id', 'utilisateur_id', 'valide_par'], [id, ...userIds]);
      await deleteByIds('table_snapshot', ['entite_id', 'created_by'], [...entityIds, ...userIds]);
      await deleteByIds('audit_log', ['entite_id', 'utilisateur_id'], [...entityIds, ...userIds]);
      await db.sequelize.query('DELETE FROM audit_log WHERE details LIKE :centrePattern', {
        replacements: { centrePattern: `%${id}%` }, transaction,
      });

      if (userIds.length) {
        await db.sequelize.query('UPDATE utilisateur SET id_manager = NULL WHERE id_manager IN (:userIds)', { replacements: { userIds }, transaction });
        await db.sequelize.query('DELETE FROM utilisateur WHERE id IN (:userIds)', { replacements: { userIds }, transaction });
      }
      if (posIds.length) await db.sequelize.query('DELETE FROM pos WHERE id IN (:posIds)', { replacements: { posIds }, transaction });
      if (dsmIds.length) await db.sequelize.query('DELETE FROM dsm WHERE id IN (:dsmIds)', { replacements: { dsmIds }, transaction });
      if (daIds.length) await db.sequelize.query('DELETE FROM da WHERE id IN (:daIds)', { replacements: { daIds }, transaction });
      await db.sequelize.query('DELETE FROM centre WHERE id = :centreId', { replacements: { centreId: id }, transaction });
    });

    await redis.deleteCache('centres:public');
    await redis.publish('events', { type: 'dashboard_updated', payload: { event: 'deleted', centreId: id } });
    return { id, deleted: true };
  }

  async listAdmins() {
    const adminRole = await findRole('admin');
    if (!adminRole) return [];
    return db.Utilisateur.findAll({
      where: { role_id: adminRole.id },
      attributes: { exclude: ['mot_de_passe'] },
      include: [{ model: db.Centre, as: 'centre' }, { model: db.Role, as: 'role' }],
      order: [['nom_complet', 'ASC']],
    });
  }

  async createAdmin(payload, actor) {
    const nomComplet = cleanText(payload.nom_complet || payload.name);
    const email = cleanText(payload.email).toLowerCase();
    const matricule = cleanText(payload.matricule);
    const telephone = normalizePhone(payload.telephone);
    const centreId = cleanText(payload.centre_id);
    if (!nomComplet || !email || !matricule || !centreId) {
      throw httpError('Nom, matricule, email, téléphone et centre sont obligatoires.', 400);
    }
    const centre = await db.Centre.findOne({ where: { id: centreId, active: true } });
    if (!centre) throw httpError('Centre actif introuvable.', 400);
    const duplicate = await db.Utilisateur.findOne({
      where: { [db.Sequelize.Op.or]: [{ email }, { matricule }] },
    });
    if (duplicate) throw httpError('Cet email ou ce matricule est déjà utilisé.', 409);
    const role = await findRole('admin');
    if (!role) throw httpError('Rôle Admin introuvable.', 500);
    const temporaryPassword = accountService.generateTemporaryPassword();
    let user;
    await db.sequelize.transaction(async (transaction) => {
      user = await db.Utilisateur.create({
        nom_complet: nomComplet,
        email,
        matricule,
        telephone,
        centre_id: centreId,
        role_id: role.id,
        poste_id: null,
        da_id: null,
        dsm_id: null,
        pos_id: null,
        zone_id: null,
        statut: 'actif',
        mot_de_passe: await bcrypt.hash(temporaryPassword, 10),
        must_change_password: true,
      }, { transaction });
      await auditService.add({
        utilisateur_id: actor.id,
        action: 'admin_cree',
        entite: 'utilisateur',
        entite_id: user.id,
        details: {
          centre_id: centreId,
          auteur_centre_id: actor.centerId || null,
          auteur_role: actor.role,
          apres: { nom_complet: nomComplet, email, matricule, telephone, role: 'ADMIN', centre_id: centreId },
        },
      }, transaction);
    });
    const emailNotification = await emailService.sendAccountCreated({
      email, name: nomComplet, temporaryPassword,
    });
    const safeUser = user.toJSON();
    delete safeUser.mot_de_passe;
    return { ...safeUser, centre, temporaryPassword, emailNotification };
  }

  async findAdmin(id) {
    const user = await db.Utilisateur.findByPk(id, {
      include: [{ model: db.Role, as: 'role' }, { model: db.Centre, as: 'centre' }],
    });
    if (!user || toCanonicalRole(user.role && user.role.libelle) !== 'admin') {
      throw httpError('Administrateur introuvable.', 404);
    }
    return user;
  }

  async setAdminStatus(id, statut, actor) {
    if (!['actif', 'suspendu'].includes(statut)) throw httpError('Statut invalide.', 400);
    const admin = await this.findAdmin(id);
    const before = admin.statut;
    await admin.update({ statut });
    await auditService.add({
      utilisateur_id: actor.id,
      action: statut === 'actif' ? 'admin_active' : 'admin_suspendu',
      entite: 'utilisateur',
      entite_id: admin.id,
      details: { centre_id: admin.centre_id, auteur_role: actor.role, avant: { statut: before }, apres: { statut } },
    });
    const safe = admin.toJSON();
    delete safe.mot_de_passe;
    return safe;
  }

  async resetAdminPassword(id, actor) {
    const admin = await this.findAdmin(id);
    const temporaryPassword = accountService.generateTemporaryPassword();
    await admin.update({
      mot_de_passe: await bcrypt.hash(temporaryPassword, 10),
      must_change_password: true,
      statut: 'actif',
    });
    await auditService.add({
      utilisateur_id: actor.id,
      action: 'mot_de_passe_admin_reinitialise',
      entite: 'utilisateur',
      entite_id: admin.id,
      details: { centre_id: admin.centre_id, auteur_role: actor.role, apres: { must_change_password: true, statut: 'actif' } },
    });
    const emailNotification = await emailService.sendPasswordResetCompleted({
      email: admin.email, name: admin.nom_complet, temporaryPassword,
    });
    return { id: admin.id, email: admin.email, temporaryPassword, emailNotification };
  }
}

module.exports = new SuperAdminService();
