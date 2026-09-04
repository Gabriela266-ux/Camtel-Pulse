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

function mysqlConfig() {
  return {
    dialect: 'mysql',
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    database: process.env.DB_NAME || 'camtel_pulse',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    pool: {
      max: Number(process.env.DB_POOL_MAX || 30),
      min: Number(process.env.DB_POOL_MIN || 5),
      acquire: Number(process.env.DB_POOL_ACQUIRE || 30000),
      idle: Number(process.env.DB_POOL_IDLE || 10000),
    },
    logging: false,
    define: {
      underscored: true,
      timestamps: true,
      freezeTableName: true
    }
  };
}

function productionConfig() {
  return process.env.DB_DIALECT === 'sqlite' ? sqliteConfig(
    process.env.DB_STORAGE
      ? path.resolve(process.env.DB_STORAGE)
      : path.join(backendRoot, 'camtel_pulse.db')
  ) : mysqlConfig();
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
  production: productionConfig()
};
