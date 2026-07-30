import { Controller, Get } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(private redisService: RedisService) {}

  @Get()
  async check() {
    const pingKey = 'health:ping';
    await this.redisService.set(pingKey, 'ok', 5);
    const redis = (await this.redisService.get(pingKey)) === 'ok';

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      redis,
    };
  }
}
