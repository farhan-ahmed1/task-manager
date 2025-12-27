/**
 * Environment variable validation
 * Validates required environment variables at application startup
 */

interface EnvConfig {
  NODE_ENV: string;
  PORT: number;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DB: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  JWT_SECRET: string;
  JWT_EXPIRES?: string;
  CORS_ORIGIN?: string;
  LOG_LEVEL?: string;
  PG_MAX_CLIENTS?: number;
  DISABLE_RATE_LIMITING?: string;
}

class EnvironmentValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'EnvironmentValidationError';
  }
}

/**
 * Validates that a required environment variable exists and is not empty
 */
function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim() === '') {
    throw new EnvironmentValidationError(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Gets an optional environment variable with a default value
 */
function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Validates and parses a port number
 */
function validatePort(key: string, required: boolean = true): number {
  const value = process.env[key];

  if (!value) {
    if (required) {
      throw new EnvironmentValidationError(`Missing required environment variable: ${key}`);
    }
    return 0;
  }

  const port = parseInt(value, 10);
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new EnvironmentValidationError(
      `Invalid port number for ${key}: ${value}. Must be between 1 and 65535.`,
    );
  }

  return port;
}

/**
 * Validates JWT_SECRET strength
 */
function validateJWTSecret(secret: string): void {
  if (secret.length < 32) {
    throw new EnvironmentValidationError(
      'JWT_SECRET must be at least 32 characters long for security. ' +
        'Generate one with: openssl rand -base64 32',
    );
  }

  // Check for common weak secrets
  const weakSecrets = [
    'secret',
    'password',
    'change-me',
    'replace-this',
    'your-secret-here',
    'jwt-secret',
  ];

  if (weakSecrets.some((weak) => secret.toLowerCase().includes(weak))) {
    throw new EnvironmentValidationError(
      'JWT_SECRET appears to use a weak or default value. ' +
        'Generate a strong secret with: openssl rand -base64 32',
    );
  }
}

/**
 * Validates NODE_ENV value
 */
function validateNodeEnv(env: string): void {
  const validEnvironments = ['development', 'production', 'test', 'staging'];

  if (!validEnvironments.includes(env)) {
    throw new EnvironmentValidationError(
      `Invalid NODE_ENV: ${env}. Must be one of: ${validEnvironments.join(', ')}`,
    );
  }
}

/**
 * Validates all required environment variables
 * Should be called before starting the application
 */
export function validateEnvironment(): EnvConfig {
  try {
    // Required variables
    const NODE_ENV = requireEnv('NODE_ENV');
    validateNodeEnv(NODE_ENV);

    const PORT = validatePort('PORT');

    const POSTGRES_HOST = requireEnv('POSTGRES_HOST');
    const POSTGRES_PORT = validatePort('POSTGRES_PORT');
    const POSTGRES_DB = requireEnv('POSTGRES_DB');
    const POSTGRES_USER = requireEnv('POSTGRES_USER');
    const POSTGRES_PASSWORD = requireEnv('POSTGRES_PASSWORD');

    const JWT_SECRET = requireEnv('JWT_SECRET');
    validateJWTSecret(JWT_SECRET);

    // Optional variables with defaults
    const JWT_EXPIRES = optionalEnv('JWT_EXPIRES', '1h');
    const CORS_ORIGIN = optionalEnv('CORS_ORIGIN', '*');
    const LOG_LEVEL = optionalEnv('LOG_LEVEL', 'info');

    // Optional numeric values
    const PG_MAX_CLIENTS = process.env.PG_MAX_CLIENTS
      ? parseInt(process.env.PG_MAX_CLIENTS, 10)
      : 10;

    const DISABLE_RATE_LIMITING = process.env.DISABLE_RATE_LIMITING || 'false';

    // Warn about insecure configurations in production
    if (NODE_ENV === 'production') {
      if (CORS_ORIGIN === '*') {
        console.warn(
          'WARNING: CORS_ORIGIN is set to "*" in production. ' +
            'This is insecure. Set it to your frontend domain.',
        );
      }

      if (POSTGRES_PASSWORD.length < 16) {
        console.warn(
          'WARNING: POSTGRES_PASSWORD is shorter than 16 characters. ' +
            'Consider using a stronger password for production.',
        );
      }
    }

    return {
      NODE_ENV,
      PORT,
      POSTGRES_HOST,
      POSTGRES_PORT,
      POSTGRES_DB,
      POSTGRES_USER,
      POSTGRES_PASSWORD,
      JWT_SECRET,
      JWT_EXPIRES,
      CORS_ORIGIN,
      LOG_LEVEL,
      PG_MAX_CLIENTS,
      DISABLE_RATE_LIMITING,
    };
  } catch (error) {
    if (error instanceof EnvironmentValidationError) {
      // In test environment, throw the error instead of exiting
      if (process.env.NODE_ENV === 'test' || process.env.JEST_WORKER_ID !== undefined) {
        throw error;
      }

      console.error('\nEnvironment Validation Error:\n');
      console.error(error.message);
      console.error('\nPlease check your .env file and ensure all required variables are set.');
      console.error('See .env.example for reference.\n');
      process.exit(1);
    }
    throw error;
  }
}
