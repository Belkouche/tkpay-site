import { NextApiRequest, NextApiResponse } from 'next';
import { apiRateLimiter } from './rate-limiter';

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  identifier?: (req: NextApiRequest) => string;
}

// Security headers configuration
const securityHeaders = {
  // Prevent loading content from other origins
  'X-Frame-Options': 'DENY',
  // Prevent MIME-type sniffing
  'X-Content-Type-Options': 'nosniff',
  // Basic XSS protection
  'X-XSS-Protection': '1; mode=block',
  // Referrer policy to limit information leakage
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  // Content Security Policy for API responses
  'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'",
  // Strict transport security
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
};

function applySecurityHeaders(res: NextApiResponse): void {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export function withRateLimit(config: RateLimitConfig) {
  return function (
    handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>
  ) {
    return async (req: NextApiRequest, res: NextApiResponse) => {
      // Apply security headers
      applySecurityHeaders(res);

      // Use IP address as default identifier, or use custom identifier function if provided
      const identifier = config.identifier 
        ? config.identifier(req)
        : req.headers['x-forwarded-for']?.toString() || req.connection.remoteAddress || 'unknown';

      const limiter = new (require('./rate-limiter').default)(config.maxRequests, config.windowMs);
      const allowed = limiter.isAllowed(identifier);

      if (!allowed) {
        return res.status(429).json({ 
          success: false, 
          message: 'Rate limit exceeded. Please try again later.' 
        });
      }

      return handler(req, res);
    };
  };
}

// Specific middleware for contact form rate limiting
export function withContactFormRateLimit() {
  return withRateLimit({
    maxRequests: 3, // 3 submissions per hour per IP
    windowMs: 3600000, // 1 hour window
    identifier: (req) => {
      // Use IP address and possibly email to create a more specific identifier
      const ip = req.headers['x-forwarded-for']?.toString() || req.connection.remoteAddress || 'unknown';
      const email = req.body?.email || '';
      return `contact:${ip}:${email}`;
    }
  });
}