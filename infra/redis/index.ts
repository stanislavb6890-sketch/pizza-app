import { createClient, type RedisClientType } from 'redis';
import { logger } from '@/core/logger';

let redisClient: RedisClientType | null = null;

export async function getRedisClient(): Promise<RedisClientType> {
  if (!redisClient) {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = createClient({ url });

    redisClient.on('error', (err) => {
      logger.error('Redis Client Error', err);
    });

    redisClient.on('connect', () => {
      logger.info('Redis Client Connected');
    });

    await redisClient.connect();
  }

  return redisClient;
}

export async function closeRedisClient(): Promise<void> {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}

export class RedisCacheService {
  constructor(private client?: RedisClientType) {}

  private async getClient(): Promise<RedisClientType> {
    if (this.client) return this.client;
    return getRedisClient();
  }

  async get<T>(key: string): Promise<T | null> {
    const client = await this.getClient();
    const data = await client.get(key);
    if (!data) return null;
    return JSON.parse(data) as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    const client = await this.getClient();
    const data = JSON.stringify(value);
    if (ttlSeconds) {
      await client.setEx(key, ttlSeconds, data);
    } else {
      await client.set(key, data);
    }
  }

  async delete(key: string): Promise<void> {
    const client = await this.getClient();
    await client.del(key);
  }

  async deletePattern(pattern: string): Promise<void> {
    const client = await this.getClient();
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
  }

  async exists(key: string): Promise<boolean> {
    const client = await this.getClient();
    const result = await client.exists(key);
    return result === 1;
  }

  async increment(key: string, ttlSeconds?: number): Promise<number> {
    const client = await this.getClient();
    const result = await client.incr(key);
    if (ttlSeconds && result === 1) {
      await client.expire(key, ttlSeconds);
    }
    return result;
  }
}
