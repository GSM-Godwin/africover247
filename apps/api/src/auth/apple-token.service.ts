import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { importPKCS8, SignJWT } from 'jose';
import {
  decryptField,
  encryptField,
  isFieldEncryptionConfigured,
} from '../common/crypto/field-encryption';

export const APPLE_ISSUER = 'https://appleid.apple.com';
export const DEFAULT_APPLE_AUDIENCE = 'com.afriglobal.Africover247';
const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';
const CLIENT_SECRET_TTL_SECONDS = 5 * 60;
const APPLE_REQUEST_TIMEOUT_MS = 10_000;

interface AppleSigningConfig {
  teamId: string;
  keyId: string;
  privateKey: string;
  clientId: string;
}

@Injectable()
export class AppleTokenService implements OnModuleInit {
  private readonly logger = new Logger(AppleTokenService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const missing = this.missingConfigNames();
    if (missing.length) {
      this.logger.warn(
        `Apple token storage and revocation disabled; missing env: ${missing.join(', ')}`,
      );
    }
  }

  getAudience(): string[] {
    return (this.configService.get<string>('APPLE_CLIENT_ID') || DEFAULT_APPLE_AUDIENCE)
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  }

  isEnabled(): boolean {
    return this.missingConfigNames().length === 0;
  }

  async exchangeAuthorizationCode(authorizationCode: string): Promise<string | null> {
    const config = this.signingConfig();
    if (!config || !authorizationCode) return null;

    try {
      const response = await this.postToApple(APPLE_TOKEN_URL, {
        client_id: config.clientId,
        client_secret: await this.buildClientSecret(config),
        code: authorizationCode,
        grant_type: 'authorization_code',
      });
      if (!response.ok) {
        this.logger.warn(`Apple code exchange failed with status ${response.status}`);
        return null;
      }
      const body = (await response.json()) as { refresh_token?: unknown };
      if (typeof body.refresh_token !== 'string' || !body.refresh_token) {
        this.logger.warn('Apple code exchange returned no refresh token');
        return null;
      }
      return encryptField(body.refresh_token);
    } catch {
      this.logger.warn('Apple code exchange failed');
      return null;
    }
  }

  async revokeRefreshToken(encryptedRefreshToken: string): Promise<boolean> {
    const config = this.signingConfig();
    if (!config || !encryptedRefreshToken) return false;

    try {
      const response = await this.postToApple(APPLE_REVOKE_URL, {
        client_id: config.clientId,
        client_secret: await this.buildClientSecret(config),
        token: decryptField(encryptedRefreshToken),
        token_type_hint: 'refresh_token',
      });
      if (!response.ok) {
        this.logger.warn(`Apple token revoke failed with status ${response.status}`);
        return false;
      }
      return true;
    } catch {
      this.logger.warn('Apple token revoke failed');
      return false;
    }
  }

  private missingConfigNames(): string[] {
    const missing = ['APPLE_TEAM_ID', 'APPLE_KEY_ID', 'APPLE_PRIVATE_KEY'].filter(
      (name) => !this.configService.get<string>(name),
    );
    if (!isFieldEncryptionConfigured()) missing.push('FIELD_ENCRYPTION_KEY');
    return missing;
  }

  private signingConfig(): AppleSigningConfig | null {
    if (!this.isEnabled()) return null;
    return {
      teamId: this.configService.get<string>('APPLE_TEAM_ID') as string,
      keyId: this.configService.get<string>('APPLE_KEY_ID') as string,
      privateKey: (this.configService.get<string>('APPLE_PRIVATE_KEY') as string).replace(
        /\\n/g,
        '\n',
      ),
      clientId: this.getAudience()[0],
    };
  }

  private async buildClientSecret(config: AppleSigningConfig): Promise<string> {
    const signingKey = await importPKCS8(config.privateKey, 'ES256');
    return new SignJWT({})
      .setProtectedHeader({ alg: 'ES256', kid: config.keyId })
      .setIssuer(config.teamId)
      .setSubject(config.clientId)
      .setAudience(APPLE_ISSUER)
      .setIssuedAt()
      .setExpirationTime(`${CLIENT_SECRET_TTL_SECONDS}s`)
      .sign(signingKey);
  }

  private postToApple(url: string, form: Record<string, string>) {
    return fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams(form).toString(),
      signal: AbortSignal.timeout(APPLE_REQUEST_TIMEOUT_MS),
    });
  }
}
