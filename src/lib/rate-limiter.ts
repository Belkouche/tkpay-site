class RateLimiter {
  private requestCount: number = 0
  private windowStart: number = Date.now()
  private readonly maxRequests: number
  private readonly windowMs: number

  constructor(maxRequests: number = 10, windowMs: number = 1000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
  }

  async waitForToken(): Promise<void> {
    const now = Date.now()

    if (now - this.windowStart >= this.windowMs) {
      this.requestCount = 0
      this.windowStart = now
    }

    if (this.requestCount >= this.maxRequests) {
      const waitTime = this.windowMs - (now - this.windowStart)
      if (waitTime > 0) {
        await new Promise(resolve => setTimeout(resolve, waitTime))
        return this.waitForToken()
      }
    }

    this.requestCount++
  }

  isAllowed(): boolean {
    const now = Date.now()

    if (now - this.windowStart >= this.windowMs) {
      this.requestCount = 0
      this.windowStart = now
    }

    return this.requestCount < this.maxRequests
  }
}

const rateLimit = parseInt(process.env.ZOHO_RATE_LIMIT || '10', 10)
export const zohoRateLimiter = new RateLimiter(rateLimit, 1000)

export default RateLimiter