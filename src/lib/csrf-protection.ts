import { NextApiRequest, NextApiResponse } from 'next';
import { randomBytes, createHash } from 'crypto';

const CSRF_TOKEN_KEY = 'csrf_token';
const CSRF_SECRET_KEY = process.env.CSRF_SECRET || 'default-secret-key-for-development';

// Store for CSRF tokens (in production, use Redis or database)
const csrfTokens = new Map<string, Date>();

// Generate a secure random token
export function generateCSRFToken(): string {
  const random = randomBytes(32).toString('hex');
  const token = createHash('sha256')
    .update(random + CSRF_SECRET_KEY)
    .digest('hex');
  
  // Store the token with expiration (1 hour)
  const expiry = new Date();
  expiry.setTime(expiry.getTime() + 60 * 60 * 1000); // 1 hour
  csrfTokens.set(token, expiry);
  
  // Clean up expired tokens periodically
  cleanupExpiredTokens();
  
  return token;
}

// Validate the CSRF token
export function validateCSRFToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const expiry = csrfTokens.get(token);
  
  if (!expiry || expiry < new Date()) {
    // Token doesn't exist or is expired
    csrfTokens.delete(token);
    return false;
  }
  
  // Token is valid, remove it to prevent reuse
  csrfTokens.delete(token);
  return true;
}

// Clean up expired tokens
function cleanupExpiredTokens(): void {
  const now = new Date();
  const expiredTokens: string[] = [];
  
  for (const [token, expiry] of csrfTokens.entries()) {
    if (expiry < now) {
      expiredTokens.push(token);
    }
  }
  
  for (const token of expiredTokens) {
    csrfTokens.delete(token);
  }
}

// Middleware to add CSRF protection to API routes
export function withCSRFProtection(handler: (req: NextApiRequest, res: NextApiResponse) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    // Only check CSRF for destructive operations (POST, PUT, DELETE, PATCH)
    if (req.method !== 'GET' && req.method !== 'HEAD' && req.method !== 'OPTIONS') {
      const token = req.headers['x-csrf-token'] as string;
      
      if (!validateCSRFToken(token)) {
        return res.status(403).json({ 
          success: false, 
          message: 'Invalid or missing CSRF token' 
        });
      }
    }
    
    return handler(req, res);
  };
}

// Function to verify CSRF token from request body
export function verifyCSRFTokenFromBody(req: NextApiRequest): boolean {
  // Check both header and body for token
  const headerToken = req.headers['x-csrf-token'] as string;
  const bodyToken = (req.body && req.body._csrf) as string;
  
  return validateCSRFToken(headerToken) || validateCSRFToken(bodyToken);
}