const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const { isValidSignature } = require('../controllers/webhookController');

test('validates Meta webhook signatures safely', () => {
  const body = Buffer.from('{"object":"instagram"}');
  const secret = 'test-secret';
  const signature = `sha256=${crypto.createHmac('sha256', secret).update(body).digest('hex')}`;

  assert.equal(isValidSignature(body, signature, secret), true);
  assert.equal(isValidSignature(body, 'sha256=invalid', secret), false);
  assert.equal(isValidSignature(body, signature, ''), false);
});
