/**
 * Load Testing Configuration
 * Provides environment-based configuration for Artillery load tests
 */

const environments = {
  local: {
    target: 'http://localhost:3000',
    phases: {
      warmup: { duration: 30, arrivalRate: 1 },
      rampup: { duration: 60, arrivalRate: 1, rampTo: 5 },
      sustained: { duration: 120, arrivalRate: 5 },
      spike: { duration: 30, arrivalRate: 10 }
    },
    thresholds: {
      p95: 500,
      p99: 1000,
      max: 2000,
      requestRate: 50
    }
  },
  staging: {
    target: process.env.STAGING_API_URL || 'https://staging-api.example.com',
    phases: {
      warmup: { duration: 60, arrivalRate: 2 },
      rampup: { duration: 120, arrivalRate: 2, rampTo: 10 },
      sustained: { duration: 180, arrivalRate: 10 },
      spike: { duration: 60, arrivalRate: 20 }
    },
    thresholds: {
      p95: 400,
      p99: 800,
      max: 1500,
      requestRate: 100
    }
  },
  production: {
    target: process.env.PRODUCTION_API_URL || 'https://api.example.com',
    phases: {
      warmup: { duration: 120, arrivalRate: 5 },
      rampup: { duration: 180, arrivalRate: 5, rampTo: 20 },
      sustained: { duration: 300, arrivalRate: 20 },
      spike: { duration: 120, arrivalRate: 50 }
    },
    thresholds: {
      p95: 300,
      p99: 600,
      max: 1200,
      requestRate: 200
    }
  }
};

const env = process.env.TEST_ENV || 'local';
const config = environments[env];

if (!config) {
  console.error(`Unknown environment: ${env}`);
  process.exit(1);
}

console.log(`Load test configuration for: ${env.toUpperCase()}`);
console.log(`Target: ${config.target}`);

module.exports = config;
