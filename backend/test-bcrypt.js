const bcrypt = require('bcryptjs');

// Test if existing hash is valid
const hash = '$2a$10$BNLmm4mBm1Q6k8QTBlRuxe1ScstVuqhArrmEJ5zcmZF1lVqulBqoq';
const password = 'Admin123!';
const isValid = bcrypt.compareSync(password, hash);
console.log('Hash valid:', isValid);

// If not valid, generate new ones
if (!isValid) {
  console.log('\nGenerating new hashes:');
  console.log('Admin123!:', bcrypt.hashSync('Admin123!', 10));
  console.log('Chef123!:', bcrypt.hashSync('Chef123!', 10));
  console.log('Operateur123!:', bcrypt.hashSync('Operateur123!', 10));
} else {
  console.log('\nExisting hash is valid! No new hashes needed.');
}
