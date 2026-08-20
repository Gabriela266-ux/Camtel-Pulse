const db = require('../models');

const auditLogs = [
  {
    id: 'audit-1',
    action: 'login',
    entite: 'system',
    utilisateur: 'admin@camtel.local',
    date: '2026-08-11T08:00:00.000Z',
    details: 'Connexion initiale du compte Admin'
  },
  {
    id: 'audit-2',
    action: 'saisie',
    entite: 'pos-1',
    utilisateur: 'admin@camtel.local',
    date: '2026-08-11T09:06:00.000Z',
    details: 'Saisie journalière enregistrée'
  }
];

class AuditService {
  async list(entite = null) {
    if (!db.AuditLog) return entite ? auditLogs.filter((entry) => entry.entite === entite) : auditLogs;
    const where = entite ? { entite } : {};
    return db.AuditLog.findAll({ where, order: [['created_at', 'DESC']] });
  }

  async add(entry) {
    const auditEntry = {
      id: `audit-${Date.now()}`,
      ...entry,
      date: entry.date || new Date().toISOString()
    };
    if (!db.AuditLog) {
      auditLogs.push(auditEntry);
      return auditEntry;
    }
    return db.AuditLog.create({
      utilisateur_id: entry.utilisateur_id || null,
      action: entry.action,
      entite: entry.entite || null,
      entite_id: entry.entite_id || null,
      details: typeof entry.details === 'string' ? entry.details : JSON.stringify(entry.details || {})
    });
  }
}

module.exports = new AuditService();
