import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

type ExpiringValue = {
  value: string;
  expiresAt: number;
};

@Injectable()
export class AuthCacheService implements OnModuleDestroy {
  private readonly logger = new Logger(AuthCacheService.name);
  private readonly redis: Redis;
  private readonly sessionFallback = new Map<number, ExpiringValue>();
  private readonly smsFallback = new Map<string, ExpiringValue>();
  private readonly smsDailyFallback = new Map<string, ExpiringValue>();

  constructor(private configService: ConfigService) {
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

  async setSessionKey(userId: number, sessionKey: string, ttlSeconds: number) {
    const key = `sh:auth:wx_session:${userId}`;
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.sessionFallback.set(userId, { value: sessionKey, expiresAt });
    await this.safeRedisCall(() => this.redis.set(key, sessionKey, 'EX', ttlSeconds));
  }

  async getSessionKey(userId: number): Promise<string | null> {
    const key = `sh:auth:wx_session:${userId}`;
    const redisValue = await this.safeRedisCall(() => this.redis.get(key));
    if (redisValue) {
      return redisValue;
    }

    return this.getFallbackValue(this.sessionFallback, userId);
  }

  async setSmsCode(phone: string, code: string, ttlSeconds: number) {
    const key = `sh:auth:sms:${phone}`;
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.smsFallback.set(phone, { value: code, expiresAt });
    await this.safeRedisCall(() => this.redis.set(key, code, 'EX', ttlSeconds));
  }

  async getSmsCode(phone: string): Promise<string | null> {
    const key = `sh:auth:sms:${phone}`;
    const redisValue = await this.safeRedisCall(() => this.redis.get(key));
    if (redisValue) {
      return redisValue;
    }

    return this.getFallbackValue(this.smsFallback, phone);
  }

  async deleteSmsCode(phone: string) {
    this.smsFallback.delete(phone);
    await this.safeRedisCall(() => this.redis.del(`sh:auth:sms:${phone}`));
  }

  async incrementSmsDailyCount(phone: string): Promise<number> {
    const dateKey = this.getDateKey();
    const key = `sh:auth:sms_daily:${phone}:${dateKey}`;

    const redisCount = await this.safeRedisCall(async () => {
      const count = await this.redis.incr(key);
      if (count === 1) {
        await this.redis.expire(key, this.getSecondsToDayEnd());
      }
      return count;
    });
    if (typeof redisCount === 'number') {
      return redisCount;
    }

    return this.incrementFallbackCounter(key);
  }

  private getFallbackValue<K>(fallback: Map<K, ExpiringValue>, key: K): string | null {
    const item = fallback.get(key);
    if (!item) return null;
    if (item.expiresAt < Date.now()) {
      fallback.delete(key);
      return null;
    }
    return item.value;
  }

  private async safeRedisCall<T>(fn: () => Promise<T>): Promise<T | null> {
    try {
      return await fn();
    } catch {
      return null;
    }
  }

  private incrementFallbackCounter(key: string): number {
    const now = Date.now();
    const ttl = this.getSecondsToDayEnd();
    const existing = this.smsDailyFallback.get(key);
    if (!existing || existing.expiresAt < now) {
      this.smsDailyFallback.set(key, {
        value: '1',
        expiresAt: now + ttl * 1000,
      });
      return 1;
    }

    const next = Number(existing.value) + 1;
    existing.value = String(next);
    this.smsDailyFallback.set(key, existing);
    return next;
  }

  private getDateKey() {
    const now = new Date();
    const y = now.getFullYear();
    const m = `${now.getMonth() + 1}`.padStart(2, '0');
    const d = `${now.getDate()}`.padStart(2, '0');
    return `${y}${m}${d}`;
  }

  private getSecondsToDayEnd() {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return Math.max(1, Math.floor((end.getTime() - now.getTime()) / 1000));
  }
}
