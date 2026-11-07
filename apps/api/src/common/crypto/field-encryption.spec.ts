import { randomBytes } from 'crypto';
import {
  decryptField,
  encryptField,
  FieldEncryptionError,
  isFieldEncryptionConfigured,
} from './field-encryption';

describe('field-encryption', () => {
  const originalKey = process.env.FIELD_ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.FIELD_ENCRYPTION_KEY = randomBytes(32).toString('base64');
  });

  afterAll(() => {
    if (originalKey === undefined) delete process.env.FIELD_ENCRYPTION_KEY;
    else process.env.FIELD_ENCRYPTION_KEY = originalKey;
  });

  function tamper(stored: string, index: number) {
    const parts = stored.split(':');
    const bytes = Buffer.from(parts[index], 'base64');
    bytes[0] ^= 0xff;
    parts[index] = bytes.toString('base64');
    return parts.join(':');
  }

  it('round-trips a value and stores it as three base64 parts', () => {
    const stored = encryptField('apple-refresh-token-fixture');

    expect(stored.split(':')).toHaveLength(3);
    expect(stored).not.toContain('apple-refresh-token-fixture');
    expect(decryptField(stored)).toBe('apple-refresh-token-fixture');
  });

  it('round-trips an empty string and unicode text', () => {
    expect(decryptField(encryptField(''))).toBe('');
    expect(decryptField(encryptField('Ọ̀kàfọ̀ — ₦'))).toBe('Ọ̀kàfọ̀ — ₦');
  });

  it('uses a different IV for every encryption', () => {
    const first = encryptField('same-input');
    const second = encryptField('same-input');

    expect(first).not.toBe(second);
    expect(first.split(':')[0]).not.toBe(second.split(':')[0]);
    expect(Buffer.from(first.split(':')[0], 'base64')).toHaveLength(12);
  });

  it.each([
    ['ciphertext', 2],
    ['auth tag', 1],
    ['IV', 0],
  ])('fails when the %s has been tampered with', (_label, index) => {
    const stored = encryptField('sensitive-fixture');

    expect(() => decryptField(tamper(stored, index))).toThrow(FieldEncryptionError);
  });

  it('fails with a different key', () => {
    const stored = encryptField('sensitive-fixture');
    process.env.FIELD_ENCRYPTION_KEY = randomBytes(32).toString('base64');

    expect(() => decryptField(stored)).toThrow(FieldEncryptionError);
  });

  it.each(['not-encrypted', 'a:b', 'a:b:c:d', ''])(
    'rejects a malformed value without echoing it',
    (stored) => {
      expect(() => decryptField(stored)).toThrow('Unable to decrypt field');
    },
  );

  it('does not include the input in error messages', () => {
    const stored = encryptField('sensitive-fixture');
    process.env.FIELD_ENCRYPTION_KEY = randomBytes(32).toString('base64');

    try {
      decryptField(stored);
      throw new Error('expected decryptField to throw');
    } catch (err) {
      expect((err as Error).message).not.toContain(stored);
      expect((err as Error).message).not.toContain('sensitive-fixture');
    }
  });

  describe('when the key is missing or invalid', () => {
    it('reports not configured and refuses to encrypt or decrypt', () => {
      const stored = encryptField('sensitive-fixture');
      delete process.env.FIELD_ENCRYPTION_KEY;

      expect(isFieldEncryptionConfigured()).toBe(false);
      expect(() => encryptField('x')).toThrow(/not configured/);
      expect(() => decryptField(stored)).toThrow(/not configured/);
    });

    it('rejects a key that does not decode to 32 bytes', () => {
      process.env.FIELD_ENCRYPTION_KEY = randomBytes(16).toString('base64');

      expect(isFieldEncryptionConfigured()).toBe(false);
      expect(() => encryptField('x')).toThrow(/invalid/);
    });

    it('reports configured with a valid key', () => {
      expect(isFieldEncryptionConfigured()).toBe(true);
    });
  });
});
