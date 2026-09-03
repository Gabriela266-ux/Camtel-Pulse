require('dotenv').config();
const path = require('path');

const backendRoot = path.resolve(__dirname, '..', '..');

function sqliteConfig(storage) {
  return {
    dialect: 'sqlite',
    storage,
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      freezeTableName: true
    }
  };
}

module.exports = {
  development: sqliteConfig(
    process.env.DB_STORAGE
      ? path.resolve(process.env.DB_STORAGE)
      : path.join(backendRoot, 'camtel_pulse.db')
  ),
  // Jest travaille exclusivement sur une copie dédiée. Les créations,
  // suppressions et audits des tests ne peuvent donc plus polluer la base
  // utilisée par l'application locale.
  test: sqliteConfig(
    process.env.TEST_DB_STORAGE
      ? path.resolve(process.env.TEST_DB_STORAGE)
      : path.join(backendRoot, 'camtel_pulse.test.db')
  ),
  production: sqliteConfig(
    process.env.DB_STORAGE
      ? path.resolve(process.env.DB_STORAGE)
      : path.join(backendRoot, 'camtel_pulse.db')
  )
};
