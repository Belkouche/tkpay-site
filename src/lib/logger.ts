import { NextApiRequest } from 'next';

// Define log levels
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Define log entry interface
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  metadata?: Record<string, any>;
}

// Security event types
export type SecurityEvent = 
  | 'rate_limit_exceeded'
  | 'invalid_input'
  | 'authentication_failed'
  | 'unauthorized_access'
  | 'csrf_token_invalid'
  | 'zoho_api_error'
  | 'contact_form_submission';

class Logger {
  private static readonly LOG_LEVEL: LogLevel = 
    (process.env.LOG_LEVEL as LogLevel) || 'info';
  
  private static readonly LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };

  static log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    const currentLevel = this.LOG_LEVELS[this.LOG_LEVEL];
    const messageLevel = this.LOG_LEVELS[level];
    
    if (messageLevel >= currentLevel) {
      const logEntry: LogEntry = {
        timestamp: new Date().toISOString(),
        level,
        message,
        metadata
      };
      
      // In production, you might want to send logs to a centralized service
      console.log(JSON.stringify(logEntry));
    }
  }

  static debug(message: string, metadata?: Record<string, any>): void {
    this.log('debug', message, metadata);
  }

  static info(message: string, metadata?: Record<string, any>): void {
    this.log('info', message, metadata);
  }

  static warn(message: string, metadata?: Record<string, any>): void {
    this.log('warn', message, metadata);
  }

  static error(message: string, metadata?: Record<string, any>): void {
    this.log('error', message, metadata);
  }

  // Security-specific logging methods
  static logSecurityEvent(
    event: SecurityEvent, 
    req: NextApiRequest, 
    additionalData?: Record<string, any>
  ): void {
    const clientInfo = {
      ip: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      userAgent: req.headers['user-agent'],
      method: req.method,
      url: req.url,
      referer: req.headers.referer
    };

    this.info(`Security Event: ${event}`, {
      ...clientInfo,
      ...additionalData
    });
  }

  static logRateLimitExceeded(req: NextApiRequest, identifier: string): void {
    this.logSecurityEvent('rate_limit_exceeded', req, { identifier });
  }

  static logInvalidInput(req: NextApiRequest, errors: string[]): void {
    this.logSecurityEvent('invalid_input', req, { errors });
  }

  static logCSRFTokenInvalid(req: NextApiRequest): void {
    this.logSecurityEvent('csrf_token_invalid', req);
  }

  static logContactFormSubmission(req: NextApiRequest, formData: any): void {
    // Don't log sensitive data like email or phone
    this.logSecurityEvent('contact_form_submission', req, {
      nameLength: formData.name?.length || 0,
      interest: formData.interest,
      locale: formData.locale
    });
  }
}

export default Logger;