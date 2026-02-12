import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class AuditQueueService implements OnModuleDestroy {
  private readonly logger = new Logger(AuditQueueService.name);
  private readonly redis: Redis;
  private readonly fallbackQueue: number[] = [];

  constructor(private readonly configService: ConfigService) {
    this.redis = new Redis({
      host: this.configService.get<string>('REDIS_HOST') || '127.0.0.1',
      port: Number(this.configService.get<string>('REDIS_PORT') || 6379),
      password: this.configService.get<string>('REDIS_PASSWORD') || undefined,
      db: Number(this.configService.get<string>('REDIS_DB') || 0),
      maxRetriesPerRequest: 1,
      connectTimeout: 1000,
      retryStrategy: () => null,
    });

    this.redis.on('error', (error) => {
      this.logger.warn(`Redis unavailable, fallback to memory queue: ${error.message}`);
    });
  }

  async onModuleDestroy() {
    await this.redis.quit().catch(() => undefined);
  }

  async enqueuePost(postId: number) {
    const value = String(postId);
    this.fallbackQueue.push(postId);
    await this.safeRedisCall(() => this.redis.lpush('sh:audit:queue', value));
  }

  async dequeuePost(): Promise<number | null> {
    const redisValue = await this.safeRedisCall(() => this.redis.rpop('sh:audit:queue'));
    if (redisValue !== null) {
      return Number(redisValue);
    }

    const fallback = this.fallbackQueue.shift();
    return fallback === undefined ? null : fallback;
  }

  async getQueueSize(): Promise<{ total: number; redis: number; memory: number }> {
    const redisSize = await this.safeRedisCall(() => this.redis.llen('sh:audit:queue'));
    const memorySize = this.fallbackQueue.length;
    const redisCount = Number(redisSize || 0);

    return {
      total: redisCount + memorySize,
      redis: redisCount,
      memory: memorySize,
    };
  }

  private async safeRedisCall<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }
}
