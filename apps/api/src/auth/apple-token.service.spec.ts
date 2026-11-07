jest.mock('jose', () => {
  const recorded: Record<string, unknown> = {};
  class SignJWT {
    constructor(payload: unknown) {
      recorded.payload = payload;
    }
    setProtectedHeader(header: unknown) {
      recorded.header = header;
      return this;
    }
    setIssuer(issuer: unknown) {
      recorded.issuer = issuer;
      return this;
    }
    setSubject(subject: unknown) {
      recorded.subject = subject;
      return this;
    }
    setAudience(audience: unknown) {
      recorded.audience = audience;
      return this;
    }
    setIssuedAt() {
      return this;
    }
    setExpirationTime(expiration: unknown) {
      recorded.expiration = expiration;
      return this;
    }
    sign() {
      return Promise.resolve('client-secret-jwt');
    }
  }
  return {
    SignJWT,
    importPKCS8: jest.fn().mockResolvedValue({}),
    __recorded: recorded,
  };
});

import { randomBytes } from 'crypto';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as jose from 'jose';
import { AppleTokenService } from './apple-token.service';
import { decryptField, encryptField } from '../common/crypto/field-encryption';

const APPLE_ENV = {
  APPLE_TEAM_ID: 'TEAMFIXTURE',
  APPLE_KEY_ID: 'KEYFIXTURE',
  APPLE_PRIVATE_KEY: 'unit-test-placeholder\\nnot-a-real-key',
};

function buildService(env: Record<string, string | undefined>) {
  const configService = {
    get: jest.fn((name: string) => env[name]),
  } as unknown as ConfigService;
  return new AppleTokenService(configService);
}

function jsonResponse(status: number, body: unknown = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(body),
  } as Response;
}

function formBody(call: unknown[]) {
  return new URLSearchParams((call[1] as RequestInit).body as string);
}

describe('AppleTokenService', () => {
  const originalKey = process.env.FIELD_ENCRYPTION_KEY;
  let fetchMock: jest.SpyInstance;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.FIELD_ENCRYPTION_KEY = randomBytes(32).toString('base64');
    fetchMock = jest.spyOn(global, 'fetch');
    warnSpy = jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    fetchMock.mockRestore();
    warnSpy.mockRestore();
  });

  afterAll(() => {
    if (originalKey === undefined) delete process.env.FIELD_ENCRYPTION_KEY;
    else process.env.FIELD_ENCRYPTION_KEY = originalKey;
  });

  describe('exchangeAuthorizationCode', () => {
    it('exchanges the code and returns the refresh token encrypted', async () => {
      fetchMock.mockResolvedValue(
        jsonResponse(200, { refresh_token: 'apple-refresh-fixture', id_token: 'x' }),
      );
      const service = buildService(APPLE_ENV);

      const stored = await service.exchangeAuthorizationCode('auth-code-fixture');

      expect(stored).not.toBeNull();
      expect(stored).not.toContain('apple-refresh-fixture');
      expect(decryptField(stored as string)).toBe('apple-refresh-fixture');

      expect(fetchMock).toHaveBeenCalledTimes(1);
      expect(fetchMock.mock.calls[0][0]).toBe('https://appleid.apple.com/auth/token');
      const form = formBody(fetchMock.mock.calls[0]);
      expect(form.get('client_id')).toBe('com.afriglobal.Africover247');
      expect(form.get('client_secret')).toBe('client-secret-jwt');
      expect(form.get('code')).toBe('auth-code-fixture');
      expect(form.get('grant_type')).toBe('authorization_code');
    });

    it('signs the client secret with ES256 using the configured team, key and client id', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, { refresh_token: 'r' }));
      const service = buildService({
        ...APPLE_ENV,
        APPLE_CLIENT_ID: 'com.example.primary, com.example.secondary',
      });

      await service.exchangeAuthorizationCode('auth-code-fixture');

      const recorded = (jose as unknown as { __recorded: Record<string, unknown> }).__recorded;
      expect(jose.importPKCS8).toHaveBeenCalledWith(
        'unit-test-placeholder\nnot-a-real-key',
        'ES256',
      );
      expect(recorded.header).toEqual({ alg: 'ES256', kid: 'KEYFIXTURE' });
      expect(recorded.issuer).toBe('TEAMFIXTURE');
      expect(recorded.subject).toBe('com.example.primary');
      expect(recorded.audience).toBe('https://appleid.apple.com');
      expect(formBody(fetchMock.mock.calls[0]).get('client_id')).toBe('com.example.primary');
    });

    it('returns null and logs only the status when Apple rejects the code', async () => {
      fetchMock.mockResolvedValue(jsonResponse(400, { error: 'invalid_grant' }));
      const service = buildService(APPLE_ENV);

      await expect(service.exchangeAuthorizationCode('auth-code-fixture')).resolves.toBeNull();
      expect(warnSpy).toHaveBeenCalledWith('Apple code exchange failed with status 400');
    });

    it('returns null when the request throws, without logging the code', async () => {
      fetchMock.mockRejectedValue(new Error('network down auth-code-fixture'));
      const service = buildService(APPLE_ENV);

      await expect(service.exchangeAuthorizationCode('auth-code-fixture')).resolves.toBeNull();
      const logged = warnSpy.mock.calls.flat().join(' ');
      expect(logged).not.toContain('auth-code-fixture');
    });

    it('returns null when Apple returns no refresh token', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200, {}));
      const service = buildService(APPLE_ENV);

      await expect(service.exchangeAuthorizationCode('auth-code-fixture')).resolves.toBeNull();
    });
  });

  describe('revokeRefreshToken', () => {
    it('revokes the decrypted refresh token with the refresh_token hint', async () => {
      fetchMock.mockResolvedValue(jsonResponse(200));
      const service = buildService(APPLE_ENV);

      const revoked = await service.revokeRefreshToken(encryptField('apple-refresh-fixture'));

      expect(revoked).toBe(true);
      expect(fetchMock.mock.calls[0][0]).toBe('https://appleid.apple.com/auth/revoke');
      const form = formBody(fetchMock.mock.calls[0]);
      expect(form.get('token')).toBe('apple-refresh-fixture');
      expect(form.get('token_type_hint')).toBe('refresh_token');
      expect(form.get('client_id')).toBe('com.afriglobal.Africover247');
      expect(form.get('client_secret')).toBe('client-secret-jwt');
    });

    it('returns false without throwing when Apple responds with an error', async () => {
      fetchMock.mockResolvedValue(jsonResponse(500));
      const service = buildService(APPLE_ENV);

      await expect(
        service.revokeRefreshToken(encryptField('apple-refresh-fixture')),
      ).resolves.toBe(false);
      expect(warnSpy).toHaveBeenCalledWith('Apple token revoke failed with status 500');
    });

    it('returns false without throwing when the stored token cannot be decrypted', async () => {
      const service = buildService(APPLE_ENV);

      await expect(service.revokeRefreshToken('corrupted:value:here')).resolves.toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });
  });

  describe('missing configuration', () => {
    it.each(['APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'])(
      'skips exchange and revoke when %s is not set',
      async (missingName) => {
        const service = buildService({ ...APPLE_ENV, [missingName]: undefined });

        expect(service.isEnabled()).toBe(false);
        await expect(service.exchangeAuthorizationCode('auth-code-fixture')).resolves.toBeNull();
        await expect(service.revokeRefreshToken(encryptField('r'))).resolves.toBe(false);
        expect(fetchMock).not.toHaveBeenCalled();
      },
    );

    it('skips exchange and revoke when FIELD_ENCRYPTION_KEY is not set', async () => {
      delete process.env.FIELD_ENCRYPTION_KEY;
      const service = buildService(APPLE_ENV);

      expect(service.isEnabled()).toBe(false);
      await expect(service.exchangeAuthorizationCode('auth-code-fixture')).resolves.toBeNull();
      await expect(service.revokeRefreshToken('a:b:c')).resolves.toBe(false);
      expect(fetchMock).not.toHaveBeenCalled();
    });

    it('warns once at startup naming only the missing variables', () => {
      delete process.env.FIELD_ENCRYPTION_KEY;
      const service = buildService({ APPLE_TEAM_ID: 'TEAMFIXTURE' });

      service.onModuleInit();

      expect(warnSpy).toHaveBeenCalledTimes(1);
      const message = warnSpy.mock.calls[0][0] as string;
      expect(message).toContain('APPLE_KEY_ID');
      expect(message).toContain('APPLE_PRIVATE_KEY');
      expect(message).toContain('FIELD_ENCRYPTION_KEY');
      expect(message).not.toContain('APPLE_TEAM_ID');
      expect(message).not.toContain('TEAMFIXTURE');
    });

    it('does not warn at startup when fully configured', () => {
      buildService(APPLE_ENV).onModuleInit();

      expect(warnSpy).not.toHaveBeenCalled();
    });
  });
});
