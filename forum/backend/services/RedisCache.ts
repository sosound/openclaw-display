import { createClient, RedisClientType } from 'redis';
import { config } from '../config/index.js';

export class RedisCache {
  private client: RedisClientType | null = null;
  private connected: boolean = false;

  async connect(): Promise<void> {
    try {
      this.client = createClient({
        url: `redis://${config.redis.host}:${config.redis.port}`,
        password: config.redis.password,
      });

      this.client.on('error', (err) => {
        console.error('Redis Client Error:', err);
        this.connected = false;
      });

      this.client.on('connect', () => {
        console.log('✅ Connected to Redis cache');
        this.connected = true;
      });

      await this.client.connect();
    } catch (error) {
      console.warn('⚠️ Redis not available, caching disabled');
      this.connected = false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.connected) {
      await this.client.quit();
      this.connected = false;
    }
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.client || !this.connected) return null;
    
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    if (!this.client || !this.connected) return;
    
    try {
      const serialized = JSON.stringify(value);
      if (ttlSeconds) {
        await this.client.setEx(key, ttlSeconds, serialized);
      } else {
        await this.client.set(key, serialized);
      }
    } catch (error) {
      console.error('Redis SET error:', error);
    }
  }

  async delete(key: string): Promise<void> {
    if (!this.client || !this.connected) return;
    
    try {
      await this.client.del(key);
    } catch (error) {
      console.error('Redis DELETE error:', error);
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.client || !this.connected) return false;
    
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  // Cache helpers for specific entities
  async cacheUser(userId: string, userData: any, ttlSeconds: number = 3600): Promise<void> {
    await this.set(`user:${userId}`, userData, ttlSeconds);
  }

  async getCachedUser(userId: string): Promise<any> {
    return await this.get(`user:${userId}`);
  }

  async cachePost(postId: string, postData: any, ttlSeconds: number = 300): Promise<void> {
    await this.set(`post:${postId}`, postData, ttlSeconds);
  }

  async getCachedPost(postId: string): Promise<any> {
    return await this.get(`post:${postId}`);
  }

  async invalidatePostCache(postId: string): Promise<void> {
    await this.delete(`post:${postId}`);
  }

  // Online status tracking
  async setOnline(userId: string): Promise<void> {
    if (!this.client || !this.connected) return;
    await this.client.set(`online:${userId}`, '1', { EX: 300 }); // 5 min expiry
  }

  async setOffline(userId: string): Promise<void> {
    if (!this.client || !this.connected) return;
    await this.delete(`online:${userId}`);
  }

  async isOnline(userId: string): Promise<boolean> {
    if (!this.client || !this.connected) return false;
    const result = await this.client.exists(`online:${userId}`);
    return result === 1;
  }

  // Rate limiting helpers
  async incrementRateLimit(key: string, windowMs: number): Promise<number> {
    if (!this.client || !this.connected) return 0;
    
    const current = await this.client.incr(key);
    if (current === 1) {
      await this.client.pExpire(key, windowMs);
    }
    return current;
  }
}

export const redisCache = new RedisCache();
