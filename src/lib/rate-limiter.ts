interface RateLimitRecord {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private readonly requests: Map<string, RateLimitRecord> = new Map();
  private readonly maxRequests: number;
  private readonly windowMs: number;

  constructor(maxRequests: number = 10, windowMs: number = 1000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async waitForToken(identifier: string = 'default'): Promise<void> {
    const now = Date.now();
    let record = this.requests.get(identifier);

    if (!record || now >= record.resetTime) {
      // Create new record or reset existing one
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return;
    }

    if (record.count >= this.maxRequests) {
      // Rate limit exceeded, calculate wait time
      const waitTime = record.resetTime - now;
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime));
        // After waiting, try again (reset the count for the new window)
        this.requests.set(identifier, {
          count: 1,
          resetTime: Date.now() + this.windowMs
        });
        return;
      }
    }

    // Increment count for this identifier
    this.requests.set(identifier, {
      count: record.count + 1,
      resetTime: record.resetTime
    });
  }

  isAllowed(identifier: string = 'default'): boolean {
    const now = Date.now();
    const record = this.requests.get(identifier);

    if (!record || now >= record.resetTime) {
      // Either no record exists or window has passed, allow request
      this.requests.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      });
      return true;
    }

    // Check if we're under the limit
    const allowed = record.count < this.maxRequests;
    
    if (allowed) {
      // Increment count only if we're allowed
      this.requests.set(identifier, {
        count: record.count + 1,
        resetTime: record.resetTime
      });
    }

    return allowed;
  }

  // Method to clean up old records to prevent memory bloat
  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.requests.entries()) {
      if (now >= record.resetTime) {
        this.requests.delete(key);
      }
    }
  }
}

const rateLimit = parseInt(process.env.ZOHO_RATE_LIMIT || '10', 10);
export const zohoRateLimiter = new RateLimiter(rateLimit, 1000);

// Export a general rate limiter for API endpoints
export const apiRateLimiter = new RateLimiter(5, 3600000); // 5 requests per hour for general API

export default RateLimiter;