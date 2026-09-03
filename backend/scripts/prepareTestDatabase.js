const fs = require('fs');
const path = require('path');

const backendRoot = path.resolve(__dirname, '..');
const source = process.env.DB_STORAGE
  ? path.resolve(process.env.DB_STORAGE)
  : path.join(backendRoot, 'camtel_pulse.db');
const target = process.env.TEST_DB_STORAGE
  ? path.resolve(process.env.TEST_DB_STORAGE)
  : path.join(backendRoot, 'camtel_pulse.test.db');

if (!fs.existsSync(source)) {
  throw new Error(`Base SQLite source introuvable : ${source}`);
}
if (path.resolve(source) === path.resolve(target)) {
  throw new Error('La base de test doit être différente de la base applicative');
}

fs.copyFileSync(source, target);
console.log(`Base de test isolée préparée : ${path.basename(target)}`);
