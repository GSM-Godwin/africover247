import { Controller, Get } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

@Controller('health')
export class HealthController {
  constructor(private redisService: RedisService) {}

  @Get()
  async check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      redis: await this.redisService.ping(),
    };
  }
}
