const db = require('../models');

function safeParseDetails(value) {
  if (typeof value !== 'string') return value || {};
  try {
    return JSON.parse(value);
  } catch {
    return {};
  }
}

function sanitizeDetails(value) {
  if (Array.isArray(value)) return value.map(sanitizeDetails);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter(([key]) => !/(mot_de_passe|password|temporarypassword|token)/i.test(key))
      .map(([key, item]) => [key, sanitizeDetails(item)])
  );
}

class AuditService {
  // Historique d'audit brut (utile pour la console Admin). Aucun mock en dur.
  async list(entite = null) {
    if (!db.AuditLog) return [];
    const where = entite ? { entite } : {};
    return db.AuditLog.findAll({ where, order: [['created_at', 'DESC']] });
  }

  // Résout le couple {partenaireId, partenaire} d'un événement d'audit.
  async resolvePartner(entite, entiteId, details) {
    // Affectation opérationnel : le DA est décrit dans details.da_id.
    if (entite === 'utilisateur') {
      const daId = details && details.da_id;
      if (!daId) return null;
      const da = await db.Da.findByPk(daId);
      return { partenaireId: daId, partenaire: da ? da.nom : null };
    }
    if (!entiteId) return null;

    let resolvedDaId = entiteId;
    if (entite === 'dsm') {
      const dsm = await db.Dsm.findByPk(entiteId);
      resolvedDaId = dsm ? dsm.da_id : null;
    } else if (entite === 'pos') {
      const pos = await db.Pos.findByPk(entiteId, { include: [{ model: db.Dsm, as: 'dsm' }] });
      resolvedDaId = pos && pos.dsm ? pos.dsm.da_id : null;
    }

    if (!resolvedDaId) return null;
    const da = await db.Da.findByPk(resolvedDaId);
    return { partenaireId: resolvedDaId, partenaire: da ? da.nom : null };
  }

  mapRole(libelle) {
    const normalized = String(libelle || '').toLowerCase().replace(/\s+/g, '_');
    const map = { super_admin: 'SUPER_ADMIN', admin: 'ADMIN', chef_operationnel: 'CHEF_OPE', manager: 'MANAGER', operationnel: 'OPERATIONNEL' };
    return map[normalized] || normalized.toUpperCase();
  }

  mapType(action, details) {
    const known = {
      dsm_ajoute: 'DSM_AJOUTE',
      pos_ajoute: 'POS_AJOUTE',
      saisie_creee: 'SAISIE_CREEE',
      saisie_modifiee: 'SAISIE_CORRIGEE',
      saisie_corrigee: 'SAISIE_CORRIGEE',
      correction_validee: 'CORRECTION_VALIDEE',
      operationnel_affecte: 'OPERATIONNEL_AFFECTE',
      operationnel_desaffecte: 'OPERATIONNEL_DESAFFECTE',
      operationnel_suspendu: 'OPERATIONNEL_SUSPENDU',
      operationnel_active: 'OPERATIONNEL_REACTIVE',
      operationnel_transfere_chef: 'OPERATIONNEL_TRANSFERE_CHEF'
    };
    if (known[action]) return known[action];
    // pos_modifie avec changement de DSM -> déplacement de POS.
    if (action === 'pos_modifie' && details && details.dsm_id !== undefined) return 'POS_DEPLACE';
    return String(action || 'MODIFICATION').toUpperCase();
  }
// Historique enrichi au format attendu par la page « Modifications » du frontend.
  async listForModifications(actor = null) {
    if (!db.AuditLog) return [];

    const logs = await db.AuditLog.findAll({
      order: [['created_at', 'DESC']],
      limit: 500
    });

    const detailLabels = {
      'DSM_AJOUTE': 'Un DSM a été ajouté',
      'POS_AJOUTE': 'Un POS a été ajouté',
      'SAISIE_CREEE': 'Une saisie journalière a été créée',
      'SAISIE_CORRIGEE': 'Une saisie journalière a été corrigée',
      'CORRECTION_VALIDEE': 'Une correction a été validée',
      'OPERATIONNEL_AFFECTE': 'Un opérationnel a été affecté',
      'OPERATIONNEL_DESAFFECTE': 'Les périmètres d’un opérationnel ont été retirés',
      'OPERATIONNEL_SUSPENDU': 'Un opérationnel a été suspendu temporairement',
      'OPERATIONNEL_REACTIVE': 'Un opérationnel a été réactivé',
      'OPERATIONNEL_TRANSFERE_CHEF': 'Un opérationnel a été transféré vers un autre Chef',
      'POS_DEPLACE': 'Un POS a été déplacé'
    };

    // Cache auteur (nom + rôle) pour éviter une requête par ligne.
    const userCache = new Map();
    const centreCache = new Map();
    const getUser = async (userId) => {
      if (!userId) return null;
      if (!userCache.has(userId)) {
        const u = await db.Utilisateur.findByPk(userId, {
          include: [
            { model: db.Role, as: 'role' },
            { model: db.Poste, as: 'poste', required: false },
            { model: db.Utilisateur, as: 'chefOperationnel', attributes: ['id', 'nom_complet', 'matricule'], required: false },
          ],
        });
        userCache.set(userId, u);
      }
      return userCache.get(userId);
    };
    const getCentre = async (centreId) => {
      if (!centreId) return null;
      if (!centreCache.has(centreId)) {
        centreCache.set(centreId, await db.Centre.findByPk(centreId, {
          attributes: ['id', 'code_centre', 'nom_centre', 'region'],
        }));
      }
      return centreCache.get(centreId);
    };

    const results = [];
    for (const log of logs) {
      const user = await getUser(log.utilisateur_id);
      const details = sanitizeDetails(safeParseDetails(log.details));
      const concernedCentreId = details.centre_id || details.auteur_centre_id || (user && user.centre_id) || null;
      if (actor && !['super_admin', 'manager'].includes(actor.role) && String(concernedCentreId || '') !== String(actor.centerId || '')) {
        continue;
      }
      const type = this.mapType(log.action, details);
      const centre = await getCentre(concernedCentreId);
      const partner = ['da', 'dsm', 'pos', 'utilisateur'].includes(log.entite)
        ? await this.resolvePartner(log.entite, log.entite_id, details)
        : null;

      results.push({
        id: log.id,
        date: (log.created_at || new Date()).toISOString(),
        auteurId: log.utilisateur_id ? String(log.utilisateur_id) : null,
        auteur: (user && user.nom_complet) || 'Système',
        auteurEmail: (user && user.email) || null,
        roleAuteur: user && user.role ? this.mapRole(user.role.libelle) : 'SYSTEME',
        posteAuteur: user && user.poste ? user.poste.libelle : null,
        chefOperationnel: user && user.chefOperationnel ? {
          id: String(user.chefOperationnel.id),
          nomComplet: user.chefOperationnel.nom_complet,
          matricule: user.chefOperationnel.matricule,
        } : null,
        centreId: concernedCentreId,
        centre: centre ? {
          id: centre.id,
          code_centre: centre.code_centre,
          nom_centre: centre.nom_centre,
          region: centre.region,
        } : null,
        type,
        partenaireId: partner && partner.partenaireId ? String(partner.partenaireId) : null,
        partenaire: (partner && partner.partenaire) || null,
        entite: log.entite ? String(log.entite).toUpperCase() : '',
        entiteType: log.entite || null,
        entiteId: log.entite_id || null,
        detail: detailLabels[type] || "Modification d'entité",
        details,
        statut: 'EFFECTUEE'
      });
    }

    return results;
  }

  async add(entry, transaction = undefined) {
    if (!db.AuditLog) return null;
    return db.AuditLog.create({
      utilisateur_id: entry.utilisateur_id || null,
      action: entry.action,
      entite: entry.entite || null,
      entite_id: entry.entite_id || null,
      details: typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details || {})
    }, { transaction });
  }
}

module.exports = new AuditService();
