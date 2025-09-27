import { NextApiResponse } from 'next';

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
  // Content Security Policy
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: https:",
    "font-src 'self'",
    "connect-src 'self' https://www.zohoapis.com https://accounts.zoho.com",
    "frame-ancestors 'none'",
  ].join('; '),
  // Strict transport security
  'Strict-Transport-Security': 'max-age=63072000; includeSubDomains; preload',
  // Disable content sniffing for safer downloads
  'X-Download-Options': 'noopen'
};

// Apply security headers to a response
export function applySecurityHeaders(res: NextApiResponse): void {
  Object.entries(securityHeaders).forEach(([key, value]) => {
    res.setHeader(key, value);
  });
}

export default securityHeaders;