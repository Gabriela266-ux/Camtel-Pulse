const users = [
  {
    id: 'user-admin-1',
    name: 'Admin principal',
    email: 'admin@camtel.local',
    passwordHash: '$2a$10$8YAPCiS7zaHa3ldrias5heBkkGMDXJG9gpdRScZUzE9D0b0.eiACi',
    role: 'admin',
    centerId: 'center-1',
    status: 'active'
  },
  {
    id: 'user-chef-1',
    name: 'Chef opérationnel',
    email: 'chef@camtel.local',
    passwordHash: '$2a$10$ybSg8jNxqgrkXNbmJRixoOrGBARjibTm/3OaitOnp.8wX54tngY0W',
    role: 'chef_operationnel',
    centerId: 'center-1',
    status: 'active'
  },
  {
    id: 'user-op-1',
    name: 'Opérationnel',
    email: 'operateur@camtel.local',
    passwordHash: '$2a$10$YJTo2Nq5d0dMyunqo6cuAea9JMhcfy92xSOPOSO3Auz650dfNhwHa',
    role: 'operational',
    centerId: 'center-1',
    status: 'active'
  }
];

const centers = [
  { id: 'center-1', name: 'Centre 1 CDPSM', region: 'Littoral', active: true }
];

const clients = [
  { id: 'client-1', centerId: 'center-1', name: 'Glotelho', monthlyGoal: 3400000 },
  { id: 'client-2', centerId: 'center-1', name: 'Master Color', monthlyGoal: 2700000 }
];

const dsms = [
  { id: 'dsm-1', clientId: 'client-1', name: 'DSM A', monthlyGoal: 1500000 },
  { id: 'dsm-2', clientId: 'client-1', name: 'DSM B', monthlyGoal: 1900000 },
  { id: 'dsm-3', clientId: 'client-2', name: 'DSM C', monthlyGoal: 2700000 }
];

const pos = [
  { id: 'pos-1', dsmId: 'dsm-1', name: 'POS 11', monthlyGoal: 600000 },
  { id: 'pos-2', dsmId: 'dsm-1', name: 'POS 12', monthlyGoal: 900000 },
  { id: 'pos-3', dsmId: 'dsm-2', name: 'POS 21', monthlyGoal: 750000 },
  { id: 'pos-4', dsmId: 'dsm-2', name: 'POS 22', monthlyGoal: 1150000 },
  { id: 'pos-5', dsmId: 'dsm-3', name: 'POS 31', monthlyGoal: 2700000 }
];

const salesRecords = [
  { id: 'sale-1', posId: 'pos-1', day: '2026-08-01', forecast: 21000, realization: 19500, followUp: 16000 },
  { id: 'sale-2', posId: 'pos-2', day: '2026-08-01', forecast: 26000, realization: 24000, followUp: 22000 },
  { id: 'sale-3', posId: 'pos-3', day: '2026-08-01', forecast: 18000, realization: 17000, followUp: 15000 },
  { id: 'sale-4', posId: 'pos-4', day: '2026-08-01', forecast: 32000, realization: 31000, followUp: 28000 },
  { id: 'sale-5', posId: 'pos-5', day: '2026-08-01', forecast: 55000, realization: 52000, followUp: 48000 }
];

module.exports = {
  users,
  centers,
  clients,
  dsms,
  pos,
  salesRecords
};
