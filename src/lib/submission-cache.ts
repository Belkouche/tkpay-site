import { createHash } from 'crypto';

// Simple in-memory cache to prevent duplicate submissions
// In production, you'd want to use Redis or a database for persistence across server instances
class SubmissionCache {
  private cache: Map<string, { timestamp: number; data: any }> = new Map();
  private readonly ttl: number; // Time to live in milliseconds

  constructor(ttl: number = 5 * 60 * 1000) { // Default 5 minutes
    this.ttl = ttl;
  }

  generateKey(data: any): string {
    // Create a hash of the important form fields to identify duplicates
    const importantFields = {
      name: data.name,
      email: data.email,
      phone: data.phone,
      interest: data.interest
    };
    
    const jsonString = JSON.stringify(importantFields);
    return createHash('sha256').update(jsonString).digest('hex');
  }

  isDuplicate(key: string): boolean {
    const cached = this.cache.get(key);
    
    if (!cached) {
      return false;
    }

    // Check if the cached entry has expired
    if (Date.now() - cached.timestamp > this.ttl) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  add(key: string, data: any): void {
    this.cache.set(key, {
      timestamp: Date.now(),
      data
    });
  }

  // Clean up expired entries periodically (should be called regularly)
  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

export const submissionCache = new SubmissionCache();

export default SubmissionCache;