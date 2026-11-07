import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12;
const AUTH_TAG_LENGTH = 16;
const KEY_LENGTH = 32;
const KEY_ENV_VAR = 'FIELD_ENCRYPTION_KEY';

export class FieldEncryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'FieldEncryptionError';
  }
}

function loadKey(): Buffer {
  const encodedKey = process.env[KEY_ENV_VAR];
  if (!encodedKey) {
    throw new FieldEncryptionError('Field encryption key is not configured');
  }
  const key = Buffer.from(encodedKey, 'base64');
  if (key.length !== KEY_LENGTH) {
    throw new FieldEncryptionError('Field encryption key is invalid');
  }
  return key;
}

export function isFieldEncryptionConfigured(): boolean {
  try {
    loadKey();
    return true;
  } catch {
    return false;
  }
}

export function encryptField(plain: string): string {
  const key = loadKey();
  const iv = randomBytes(IV_LENGTH);
  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const ciphertext = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv, authTag, ciphertext].map((part) => part.toString('base64')).join(':');
}

export function decryptField(stored: string): string {
  const key = loadKey();
  const parts = typeof stored === 'string' ? stored.split(':') : [];
  if (parts.length !== 3) {
    throw new FieldEncryptionError('Unable to decrypt field');
  }

  const [iv, authTag, ciphertext] = parts.map((part) => Buffer.from(part, 'base64'));
  if (iv.length !== IV_LENGTH || authTag.length !== AUTH_TAG_LENGTH) {
    throw new FieldEncryptionError('Unable to decrypt field');
  }

  try {
    const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
    decipher.setAuthTag(authTag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8');
  } catch {
    throw new FieldEncryptionError('Unable to decrypt field');
  }
}
