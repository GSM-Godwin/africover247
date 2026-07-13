import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from '@upstash/redis';

const DRAFT_TTL_SECONDS = 7 * 24 * 60 * 60;

@Injectable()
export class RedisService {
  private readonly logger = new Logger(RedisService.name);
  private readonly isStub: boolean;
  private readonly client: Redis | null;

  constructor(private configService: ConfigService) {
    const url = this.configService.get<string>('UPSTASH_REDIS_REST_URL');
    const token = this.configService.get<string>('UPSTASH_REDIS_REST_TOKEN');

    this.isStub =
      !url ||
      !token ||
      url === 'placeholder' ||
      token === 'placeholder';

    if (this.isStub) {
      this.client = null;
      this.logger.log('[STUB] Redis not configured');
    } else {
      this.client = new Redis({ url, token });
    }
  }

  // --- Save draft ---

  async saveDraft(
    applicationId: string,
    formData: Record<string, unknown>,
  ): Promise<void> {
    try {
      if (this.isStub) {
        this.logger.log(`[STUB] Redis saveDraft for ${applicationId}`);
        return;
      }
      await this.client!.set(`draft:${applicationId}`, JSON.stringify(formData), {
        ex: DRAFT_TTL_SECONDS,
      });
    } catch (error) {
      this.logger.error(`Redis saveDraft failed for ${applicationId}`, error);
    }
  }

  // --- Get draft ---

  async getDraft(
    applicationId: string,
  ): Promise<Record<string, unknown> | null> {
    try {
      if (this.isStub) return null;

      const raw = await this.client!.get<string>(`draft:${applicationId}`);
      if (!raw) return null;
      return JSON.parse(raw) as Record<string, unknown>;
    } catch (error) {
      this.logger.error(`Redis getDraft failed for ${applicationId}`, error);
      return null;
    }
  }

  // --- Delete draft ---

  async deleteDraft(applicationId: string): Promise<void> {
    try {
      if (this.isStub) return;
      await this.client!.del(`draft:${applicationId}`);
    } catch (error) {
      this.logger.error(`Redis deleteDraft failed for ${applicationId}`, error);
    }
  }

  // --- Health ping ---

  async ping(): Promise<boolean> {
    try {
      if (this.isStub) return false;
      const result = await this.client!.ping();
      return result === 'PONG';
    } catch (error) {
      this.logger.error('Redis ping failed', error);
      return false;
    }
  }
}
