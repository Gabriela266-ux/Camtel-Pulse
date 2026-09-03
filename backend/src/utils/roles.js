'use strict';

function normalizeRoleLabel(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[\/_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

const CANONICAL_ROLES = new Map([
  ['super admin', 'super_admin'],
  ['super administrateur', 'super_admin'],
  ['admin', 'admin'],
  ['administrateur', 'admin'],
  ['manager', 'manager'],
  ['chef operationnel', 'chef_operationnel'],
  ['operationnel', 'operationnel'],
]);

function toCanonicalRole(value) {
  return CANONICAL_ROLES.get(normalizeRoleLabel(value)) || null;
}

module.exports = { normalizeRoleLabel, toCanonicalRole };
