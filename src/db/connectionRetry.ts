import pg from 'pg';
import { logger } from '../middleware/logging';

// Extract the Pool type from the pg module
type Pool = InstanceType<typeof pg.Pool>;

interface RetryConfig {
  maxRetries: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  connectionTimeoutMs: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 5,
  initialDelayMs: 1000, // 1 second
  maxDelayMs: 30000, // 30 seconds
  backoffMultiplier: 2,
  connectionTimeoutMs: 5000, // 5 seconds per attempt
};

/**
 * Sleep for a specified duration
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Calculate delay with exponential backoff
 */
function calculateDelay(attempt: number, config: RetryConfig): number {
  const delay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt - 1);
  return Math.min(delay, config.maxDelayMs);
}

/**
 * Test database connection with a simple query
 */
async function testConnection(pool: Pool, timeoutMs: number): Promise<void> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Connection test timeout')), timeoutMs);
  });

  const queryPromise = pool.query('SELECT 1 as connected');

  await Promise.race([queryPromise, timeoutPromise]);
}

/**
 * Connect to database with retry logic and exponential backoff
 *
 * @param pool - PostgreSQL connection pool
 * @param config - Optional retry configuration
 * @returns Promise that resolves when connection is established
 * @throws Error if connection fails after all retries
 */
export async function connectWithRetry(
  pool: Pool,
  config: Partial<RetryConfig> = {},
): Promise<void> {
  const retryConfig: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      logger.info(`Database connection attempt ${attempt}/${retryConfig.maxRetries}...`);

      await testConnection(pool, retryConfig.connectionTimeoutMs);

      logger.info('Database connection established successfully');
      return;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < retryConfig.maxRetries) {
        const delay = calculateDelay(attempt, retryConfig);
        logger.warn(
          `Database connection failed (attempt ${attempt}/${retryConfig.maxRetries}): ${lastError.message}. Retrying in ${delay}ms...`,
        );
        await sleep(delay);
      } else {
        logger.error(
          `Database connection failed after ${retryConfig.maxRetries} attempts: ${lastError.message}`,
        );
      }
    }
  }

  throw new Error(
    `Failed to connect to database after ${retryConfig.maxRetries} attempts: ${lastError?.message || 'Unknown error'}`,
  );
}

/**
 * Check if database connection is healthy
 *
 * @param pool - PostgreSQL connection pool
 * @returns Object with status and message
 */
export async function checkDatabaseHealth(
  pool: Pool,
): Promise<{ status: 'ok' | 'error'; message: string }> {
  try {
    await pool.query('SELECT 1');
    return { status: 'ok', message: 'Connected' };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Database connection failed';
    return { status: 'error', message };
  }
}
