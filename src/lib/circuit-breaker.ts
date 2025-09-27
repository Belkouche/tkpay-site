// Simple circuit breaker implementation for Zoho API calls
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
  private failureCount: number = 0;
  private lastFailureTime: number | null = null;
  private readonly failureThreshold: number;
  private readonly timeout: number; // milliseconds to stay OPEN before HALF_OPEN
  private readonly successThreshold: number; // number of successes to go from HALF_OPEN to CLOSED

  constructor(
    failureThreshold: number = 5,
    timeout: number = 60000, // 1 minute
    successThreshold: number = 3
  ) {
    this.failureThreshold = failureThreshold;
    this.timeout = timeout;
    this.successThreshold = successThreshold;
  }

  async call<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (this.lastFailureTime && Date.now() - this.lastFailureTime >= this.timeout) {
        // Timeout has passed, move to HALF_OPEN
        this.state = 'HALF_OPEN';
      } else {
        // Still in OPEN state, fail fast
        throw new Error('Circuit breaker is OPEN - failing fast');
      }
    }

    try {
      const result = await fn();
      
      // Call succeeded
      if (this.state === 'HALF_OPEN' || this.state === 'CLOSED') {
        this.onSuccess();
      }
      
      return result;
    } catch (error) {
      // Call failed
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    if (this.state === 'HALF_OPEN') {
      // If we're in HALF_OPEN and have enough successes, close the circuit
      this.failureCount++;
      if (this.failureCount >= this.successThreshold) {
        this.reset();
      }
    } else {
      // If we're in CLOSED state, just reset everything
      this.reset();
    }
  }

  private onFailure() {
    this.failureCount++;
    
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.lastFailureTime = Date.now();
    }
  }

  private reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
  }

  isOpen(): boolean {
    return this.state === 'OPEN';
  }

  isClosed(): boolean {
    return this.state === 'CLOSED';
  }

  isHalfOpen(): boolean {
    return this.state === 'HALF_OPEN';
  }

  getStats(): { state: string; failureCount: number; lastFailureTime: number | null } {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime
    };
  }
}

export default CircuitBreaker;