import assert from 'node:assert/strict';
import { test, describe } from 'node:test';
import { encrypt, decrypt, generateEncryptionKey } from './encryption.js';

describe('Encryption Module Black-box Contract Tests', () => {
  const FAKE_KEY_HEX = generateEncryptionKey();
  const FAKE_PLAINTEXT = 'test_api_key_for_unit_test_only_sk_live_1234567890';

  test('Encrypting the same input twice yields different payloads due to unique IVs', async () => {
    const encrypted1 = await encrypt(FAKE_PLAINTEXT, FAKE_KEY_HEX);
    const encrypted2 = await encrypt(FAKE_PLAINTEXT, FAKE_KEY_HEX);

    assert.notEqual(encrypted1, encrypted2);

    const parsed1 = JSON.parse(encrypted1);
    const parsed2 = JSON.parse(encrypted2);

    assert.notEqual(parsed1.iv, parsed2.iv);
  });

  test('Encrypted payload includes version, algorithm, iv, ciphertext, and authTag', async () => {
    const encrypted = await encrypt(FAKE_PLAINTEXT, FAKE_KEY_HEX);
    const parsed = JSON.parse(encrypted);

    assert.equal(parsed.version, 1);
    assert.equal(parsed.algorithm, 'aes-256-gcm');
    assert.ok(typeof parsed.iv === 'string' && parsed.iv.length > 0);
    assert.ok(typeof parsed.ciphertext === 'string' && parsed.ciphertext.length > 0);
    assert.ok(typeof parsed.authTag === 'string' && parsed.authTag.length > 0);
  });

  test('Decryption restores the exact original fake plaintext input', async () => {
    const encrypted = await encrypt(FAKE_PLAINTEXT, FAKE_KEY_HEX);
    const decrypted = await decrypt(encrypted, FAKE_KEY_HEX);

    assert.equal(decrypted, FAKE_PLAINTEXT);
  });

  test('Tampering with ciphertext or authTag fails safely without throwing unhandled exceptions', async () => {
    const encrypted = await encrypt(FAKE_PLAINTEXT, FAKE_KEY_HEX);
    const parsed = JSON.parse(encrypted);

    // Tamper ciphertext
    parsed.ciphertext = 'AAAA' + parsed.ciphertext.slice(4);
    const tamperedPayload = JSON.stringify(parsed);

    await assert.rejects(
      async () => {
        await decrypt(tamperedPayload, FAKE_KEY_HEX);
      },
      (err: Error) => {
        assert.ok(err instanceof Error);
        return true;
      }
    );
  });
});
