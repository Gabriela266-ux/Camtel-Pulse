function validationError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function normalizeAscii(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function normalizePhone(value, label = 'Le numéro') {
  let digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('237')) digits = digits.slice(3);
  if (!/^6\d{8}$/.test(digits)) {
    throw validationError(`${label} doit contenir 9 chiffres et commencer par 6`);
  }
  return digits;
}

function normalizeZoneCode(value, label = 'Le code zone') {
  let code = normalizeAscii(value)
    .trim()
    .toUpperCase()
    .replace(/^MASTER_SIM_ZONE_/, '')
    .replace(/[\s-]+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');

  if (!code || !/^[A-Z0-9]+(?:_[A-Z0-9]+)*$/.test(code)) {
    throw validationError(`${label} est invalide`);
  }
  return code;
}

function normalizeEntityCode(value, prefix, label) {
  const code = normalizeAscii(value)
    .trim()
    .toUpperCase()
    .replace(/[\s_-]+/g, '');

  if (!new RegExp(`^${prefix}[A-Z0-9]+$`).test(code)) {
    throw validationError(`${label} doit commencer par ${prefix} (ex. ${prefix}1)`);
  }
  return code;
}

function partnerNetworkCode(zoneCode) {
  return `MASTER_SIM_ZONE_${zoneCode}`;
}

function dsmNetworkCode(codeDsm, zoneCode) {
  return `${codeDsm}_${zoneCode}`;
}

function posNetworkCode(codePos, codeDsm, zoneCode) {
  return `${codePos}_${codeDsm}_${zoneCode}`;
}

function networkLabel(phone, code) {
  return phone && code ? `${phone} - ${code}` : code || phone || '';
}

module.exports = {
  dsmNetworkCode,
  networkLabel,
  normalizeEntityCode,
  normalizePhone,
  normalizeZoneCode,
  partnerNetworkCode,
  posNetworkCode,
  validationError,
};
