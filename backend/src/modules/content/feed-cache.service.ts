import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type CacheValue = {
  value: string;
  expiresAt: number;
};

type MinuteBucket = {
  minute: string;
  requests: number;
  redisHits: number;
  memoryHits: number;
  misses: number;
  setRequests: number;
};

@Injectable()
export class FeedCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(FeedCacheService.name);
  private readonly redis: Redis;
  private readonly fallbackCache = new Map<string, CacheValue>();
  private readonly startedAt = new Date().toISOString();
  private readonly stats = {
    getRequests: 0,
    redisHits: 0,
    memoryHits: 0,
    misses: 0,
    setRequests: 0,
    redisErrors: 0,
  };
  private readonly minuteBuckets = new Map<string, MinuteBucket>();
  private readonly maxMinuteBuckets = 24 * 60;

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
      this.logger.warn(`Redis unavailable, fallback to memory cache: ${error.message}`);
    });
  }

  async onModuleDestroy() {
    await this.redis.quit().catch(() => undefined);
  }

  async getRecommend(page: number, pageSize: number): Promise<any | null> {
    this.stats.getRequests += 1;
    this.updateMinuteBucket('requests', 1);
    const key = this.buildRecommendKey(page, pageSize);
    const redisValue = await this.safeRedisCall(() => this.redis.get(key));
    if (redisValue) {
      this.stats.redisHits += 1;
      this.updateMinuteBucket('redisHits', 1);
      return JSON.parse(redisValue);
    }

    const fallback = this.getFallbackValue(key);
    if (fallback) {
      this.stats.memoryHits += 1;
      this.updateMinuteBucket('memoryHits', 1);
      return JSON.parse(fallback);
    }

    this.stats.misses += 1;
    this.updateMinuteBucket('misses', 1);
    return null;
  }

  async setRecommend(page: number, pageSize: number, value: any) {
    this.stats.setRequests += 1;
    this.updateMinuteBucket('setRequests', 1);
    const key = this.buildRecommendKey(page, pageSize);
    const ttl = Number(this.configService.get<string>('FEED_RECOMMEND_CACHE_TTL') || 600);
    const serialized = JSON.stringify(value);
    const expiresAt = Date.now() + ttl * 1000;
    this.fallbackCache.set(key, { value: serialized, expiresAt });
    await this.safeRedisCall(() => this.redis.set(key, serialized, 'EX', ttl));
  }

  private buildRecommendKey(page: number, pageSize: number) {
    return `sh:feed:home:recommend:${page}:${pageSize}`;
  }

  private getFallbackValue(key: string): string | null {
    const item = this.fallbackCache.get(key);
    if (!item) return null;
    if (item.expiresAt < Date.now()) {
      this.fallbackCache.delete(key);
      return null;
    }
    return item.value;
  }

  private async safeRedisCall<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      this.stats.redisErrors += 1;
      return null;
    }
  }

  getRecommendStats() {
    const hitCount = this.stats.redisHits + this.stats.memoryHits;
    const requests = this.stats.getRequests;
    const hitRate = requests > 0 ? Number((hitCount / requests).toFixed(4)) : 0;

    return {
      startedAt: this.startedAt,
      ttlSeconds: Number(this.configService.get<string>('FEED_RECOMMEND_CACHE_TTL') || 600),
      requests,
      hitCount,
      missCount: this.stats.misses,
      hitRate,
      redisHits: this.stats.redisHits,
      memoryHits: this.stats.memoryHits,
      setRequests: this.stats.setRequests,
      redisErrors: this.stats.redisErrors,
      memoryCacheSize: this.fallbackCache.size,
    };
  }

  getRecommendWindowStats(windowMinutes: number = 10) {
    const normalizedWindow = Number.isFinite(windowMinutes)
      ? Math.max(1, Math.min(180, Math.floor(windowMinutes)))
      : 10;
    const nowMinute = this.toMinuteKey(new Date());
    const currentMinuteTime = new Date(`${nowMinute}:00.000Z`).getTime();
    const series: MinuteBucket[] = [];

    for (let i = normalizedWindow - 1; i >= 0; i -= 1) {
      const target = new Date(currentMinuteTime - i * 60 * 1000);
      const minute = this.toMinuteKey(target);
      const bucket = this.minuteBuckets.get(minute) || {
        minute,
        requests: 0,
        redisHits: 0,
        memoryHits: 0,
        misses: 0,
        setRequests: 0,
      };
      series.push(bucket);
    }

    const summary = series.reduce(
      (acc, item) => {
        acc.requests += item.requests;
        acc.redisHits += item.redisHits;
        acc.memoryHits += item.memoryHits;
        acc.misses += item.misses;
        acc.setRequests += item.setRequests;
        return acc;
      },
      { requests: 0, redisHits: 0, memoryHits: 0, misses: 0, setRequests: 0 },
    );

    const hitCount = summary.redisHits + summary.memoryHits;
    const hitRate = summary.requests > 0 ? Number((hitCount / summary.requests).toFixed(4)) : 0;

    return {
      windowMinutes: normalizedWindow,
      requests: summary.requests,
      hitCount,
      missCount: summary.misses,
      hitRate,
      redisHits: summary.redisHits,
      memoryHits: summary.memoryHits,
      setRequests: summary.setRequests,
      series,
    };
  }

  private updateMinuteBucket(
    field: 'requests' | 'redisHits' | 'memoryHits' | 'misses' | 'setRequests',
    value: number,
  ) {
    const minute = this.toMinuteKey(new Date());
    const bucket = this.minuteBuckets.get(minute) || {
      minute,
      requests: 0,
      redisHits: 0,
      memoryHits: 0,
      misses: 0,
      setRequests: 0,
    };
    bucket[field] += value;
    this.minuteBuckets.set(minute, bucket);
    this.pruneMinuteBuckets();
  }

  private pruneMinuteBuckets() {
    if (this.minuteBuckets.size <= this.maxMinuteBuckets) return;
    const keys = [...this.minuteBuckets.keys()].sort();
    const deleteCount = this.minuteBuckets.size - this.maxMinuteBuckets;
    for (let i = 0; i < deleteCount; i += 1) {
      this.minuteBuckets.delete(keys[i]);
    }
  }

  private toMinuteKey(date: Date) {
    return date.toISOString().slice(0, 16);
  }
}
