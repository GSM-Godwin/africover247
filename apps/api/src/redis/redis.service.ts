import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name)
  private readonly client: Redis | null = null
  private readonly isStub: boolean

  constructor(private configService: ConfigService) {
    const redisUrl = this.configService.get<string>('REDIS_URL') || ''

    this.isStub = !redisUrl || redisUrl === 'placeholder'

    if (this.isStub) {
      this.logger.log('[STUB] Redis not configured — using stub mode')
    } else {
      this.client = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        reconnectOnError: () => true,
      })
      this.client.on('error', (err) => {
        this.logger.error('Redis connection error:', err.message)
      })
      this.client.on('connect', () => {
        this.logger.log('Redis connected')
      })
    }
  }

  // --- Save draft ---
  async saveDraft(applicationId: string, data: Record<string, unknown>): Promise<void> {
    if (this.isStub) {
      this.logger.log(`[STUB] Redis saveDraft for ${applicationId}`)
      return
    }
    await this.client!.setex(
      `draft:${applicationId}`,
      60 * 60 * 24 * 7,
      JSON.stringify(data)
    )
  }

  // --- Get draft ---
  async getDraft(applicationId: string): Promise<Record<string, unknown> | null> {
    if (this.isStub) {
      this.logger.log(`[STUB] Redis getDraft for ${applicationId}`)
      return null
    }
    const raw = await this.client!.get(`draft:${applicationId}`)
    if (!raw) return null
    try { return JSON.parse(raw) } catch { return null }
  }

  // --- Delete draft ---
  async deleteDraft(applicationId: string): Promise<void> {
    if (this.isStub) {
      this.logger.log(`[STUB] Redis deleteDraft for ${applicationId}`)
      return
    }
    await this.client!.del(`draft:${applicationId}`)
  }

  // --- Set key ---
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.isStub) return
    if (ttlSeconds) {
      await this.client!.setex(key, ttlSeconds, value)
    } else {
      await this.client!.set(key, value)
    }
  }

  // --- Get key ---
  async get(key: string): Promise<string | null> {
    if (this.isStub) return null
    return this.client!.get(key)
  }

  // --- Delete key ---
  async del(key: string): Promise<void> {
    if (this.isStub) return
    await this.client!.del(key)
  }

  // --- Cleanup on shutdown ---
  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit()
    }
  }
}
