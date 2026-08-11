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
  list(entite = null) {
    if (!entite) {
      return auditLogs;
    }

    return auditLogs.filter((entry) => entry.entite === entite);
  }

  add(entry) {
    const auditEntry = {
      id: `audit-${Date.now()}`,
      ...entry,
      date: entry.date || new Date().toISOString()
    };
    auditLogs.push(auditEntry);
    return auditEntry;
  }
}

module.exports = new AuditService();
