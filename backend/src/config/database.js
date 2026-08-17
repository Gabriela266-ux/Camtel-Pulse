require('dotenv').config();
const path = require('path');

const config = {
  dialect: 'sqlite',
  storage: path.resolve('camtel_pulse.db'),
  logging: false,
  define: {
    underscored: true,
    timestamps: true,
    freezeTableName: true
  }
};

module.exports = {
  development: config,
  test: config,
  production: config
};