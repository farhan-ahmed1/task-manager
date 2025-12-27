/**
 * CORS configuration validation
 * Ensures CORS is properly configured for production environments
 */

import { logger } from '../middleware/logging';

export interface CorsConfig {
  origin: string | string[];
  credentials: boolean;
}

/**
 * Validates CORS origin configuration
 * @param corsOrigin - CORS_ORIGIN environment variable value
 * @param nodeEnv - NODE_ENV environment variable value
 * @returns Validated CORS configuration
 */
export function validateCorsOrigin(corsOrigin?: string, nodeEnv?: string): CorsConfig {
  const environment = nodeEnv || process.env.NODE_ENV || 'development';
  const isProduction = environment === 'production';

  // If CORS_ORIGIN is not set
  if (!corsOrigin || corsOrigin.trim() === '') {
    if (isProduction) {
      // In production, CORS_ORIGIN must be explicitly set
      logger.error(
        'CRITICAL: CORS_ORIGIN is not set in production environment. ' +
          'This is a security risk. Set CORS_ORIGIN to your frontend domain.',
      );
      throw new Error(
        'CORS_ORIGIN must be explicitly set in production. ' +
          'Set it to your frontend domain (e.g., https://yourdomain.com)',
      );
    } else {
      // In development, warn but allow wildcard
      logger.warn(
        'CORS_ORIGIN is not set. Using wildcard (*) for development. ' +
          'Set CORS_ORIGIN in production to your frontend domain.',
      );
      return {
        origin: '*',
        credentials: false, // Must be false when origin is '*'
      };
    }
  }

  // Check for wildcard in production
  if (corsOrigin === '*') {
    if (isProduction) {
      logger.error(
        'CRITICAL: CORS_ORIGIN is set to wildcard (*) in production. ' +
          'This is insecure. Set it to your specific frontend domain.',
      );
      throw new Error(
        'CORS_ORIGIN cannot be wildcard (*) in production. ' +
          'Set it to your frontend domain (e.g., https://yourdomain.com)',
      );
    } else {
      logger.warn('CORS_ORIGIN is set to wildcard (*). This should only be used in development.');
      return {
        origin: '*',
        credentials: false,
      };
    }
  }

  // Parse multiple origins (comma-separated)
  const origins = corsOrigin
    .split(',')
    .map((o) => o.trim())
    .filter((o) => o.length > 0);

  // Validate each origin
  const validatedOrigins: string[] = [];

  for (const origin of origins) {
    // Check if it's a valid URL format
    if (!isValidOrigin(origin)) {
      logger.error(`Invalid CORS origin format: ${origin}`);
      throw new Error(
        `Invalid CORS origin: ${origin}. Must be a valid URL (e.g., https://example.com)`,
      );
    }

    // Production-specific validations
    if (isProduction) {
      // Warn about HTTP in production
      if (origin.startsWith('http://') && !origin.includes('localhost')) {
        logger.warn(
          `CORS origin uses HTTP (not HTTPS): ${origin}. ` +
            'This is insecure for production. Use HTTPS instead.',
        );
      }

      // Warn about localhost in production
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        logger.warn(
          `CORS origin includes localhost: ${origin}. ` +
            'This is unusual for production and may not work as expected.',
        );
      }
    }

    validatedOrigins.push(origin);
  }

  // Return configuration
  const finalOrigin = validatedOrigins.length === 1 ? validatedOrigins[0] : validatedOrigins;

  logger.info(`CORS configured with origin(s): ${JSON.stringify(finalOrigin)}`);

  return {
    origin: finalOrigin,
    credentials: true, // Enable credentials for authenticated requests
  };
}

/**
 * Validates if a string is a valid origin URL
 * @param origin - Origin string to validate
 * @returns true if valid, false otherwise
 */
function isValidOrigin(origin: string): boolean {
  // Must start with http:// or https://
  if (!origin.startsWith('http://') && !origin.startsWith('https://')) {
    return false;
  }

  try {
    const url = new URL(origin);

    // Should not have path, query, or fragment
    if (url.pathname !== '/' || url.search !== '' || url.hash !== '') {
      return false;
    }

    // Should have valid hostname
    if (!url.hostname || url.hostname.length === 0) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Gets a user-friendly error message for CORS issues
 */
export function getCorsErrorHelp(): string {
  return `
CORS Configuration Help:
========================

For Development:
  CORS_ORIGIN=http://localhost:5173

For Production (single domain):
  CORS_ORIGIN=https://yourdomain.com

For Production (multiple domains):
  CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com

Important:
- In production, CORS_ORIGIN MUST be set to your actual frontend domain(s)
- Do NOT use wildcard (*) in production
- Use HTTPS in production (not HTTP)
- Do not include trailing slashes
- Do not include paths (e.g., /app) - just the origin

Example:
  ✓ CORS_ORIGIN=https://example.com
  ✗ CORS_ORIGIN=https://example.com/
  ✗ CORS_ORIGIN=https://example.com/app
  `;
}
