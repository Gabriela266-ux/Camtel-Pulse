const db = require('../src/models');

async function main() {
  try {
    const [violations] = await db.sequelize.query('PRAGMA foreign_key_check');
    if (violations.length) {
      console.error('Foreign-key integrity check failed:', violations);
      process.exitCode = 1;
      return;
    }
    console.log('Foreign-key integrity check passed.');
  } finally {
    await db.sequelize.close();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
