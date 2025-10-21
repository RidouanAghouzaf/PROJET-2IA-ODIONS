const jwt = require('jsonwebtoken');

const token = jwt.sign(
  { id: 1, username: 'TestUser' }, // ✅ must include `id`
  'myUltraSecureKey123!',         // ✅ must match JWT_SECRET in .env
  { expiresIn: '1h' }
);

console.log('✅ Your token:\n', token);
