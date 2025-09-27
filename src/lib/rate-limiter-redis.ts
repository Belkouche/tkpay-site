import { NextApiRequest } from 'next';
import { createClient, RedisClientType } from 'redis';

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

class RedisRateLimiter {
  private redisClient: RedisClientType | null = null;
  private readonly defaultOptions: RateLimitOptions = {
    maxRequests: 5, // Default: 5 requests
    windowMs: 3600000, // Default: 1 hour
  };

  async connect() {
    if (!this.redisClient) {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      this.redisClient = createClient({ url: redisUrl });
      
      this.redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
      });

      await this.redisClient.connect();
    }
  }

  async isAllowed(
    req: NextApiRequest, 
    key: string, 
    options: RateLimitOptions = this.defaultOptions
  ): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    await this.connect();

    // Use IP address as part of the key for rate limiting
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress || 'unknown';
    const fullKey = `rate_limit:${key}:${ip}`;

    // Get current count and expiration time
    const result = await this.redisClient.multi()
      .get(fullKey)
      .ttl(fullKey)
      .exec();

    const currentCount = result && result[0] && result[0][1] ? parseInt(result[0][1] as string) : 0;
    const ttl = result && result[1] && result[1][1] ? parseInt(result[1][1] as string) : -1;

    // Calculate reset time (in milliseconds)
    const resetTime = ttl > 0 
      ? Date.now() + (ttl * 1000) 
      : Date.now() + options.windowMs;

    if (currentCount >= options.maxRequests) {
      // Rate limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetTime
      };
    }

    // Increment the count and set expiration
    await this.redisClient.multi()
      .incr(fullKey)
      .expire(fullKey, Math.floor(options.windowMs / 1000))
      .exec();

    return {
      allowed: true,
      remaining: options.maxRequests - currentCount - 1,
      resetTime
    };
  }

  async disconnect() {
    if (this.redisClient) {
      await this.redisClient.quit();
      this.redisClient = null;
    }
  }
}

export const redisRateLimiter = new RedisRateLimiter();

export default RedisRateLimiter;