#!/usr/bin/env node

/**
 * Load Test Validation Script
 * Validates the environment is ready for load testing
 */

import http from 'http';
import { readFile } from 'fs/promises';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const TARGET_URL = process.env.TEST_TARGET_URL || 'http://localhost:3000';
const TEST_DATA_PATH = join(__dirname, '../performance/test-data.csv');

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkHealth(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 80,
      path: '/health',
      method: 'GET',
      timeout: 5000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ success: true, data: JSON.parse(data) });
        } else {
          resolve({ success: false, statusCode: res.statusCode });
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });

    req.end();
  });
}

async function validateTestData() {
  try {
    const content = await readFile(TEST_DATA_PATH, 'utf-8');
    const lines = content.trim().split('\n');
    
    if (lines.length < 2) {
      return { valid: false, message: 'Test data file is empty or has only headers' };
    }

    const headers = lines[0].split(',');
    const requiredHeaders = ['email', 'password', 'taskTitle', 'projectName'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

    if (missingHeaders.length > 0) {
      return { 
        valid: false, 
        message: `Missing required headers: ${missingHeaders.join(', ')}` 
      };
    }

    return { 
      valid: true, 
      message: `Found ${lines.length - 1} test data rows` 
    };
  } catch (error) {
    return { 
      valid: false, 
      message: `Cannot read test data file: ${error.message}` 
    };
  }
}

async function checkArtillery() {
  try {
    const { execSync } = await import('child_process');
    // Try npx first (works with local installations)
    try {
      const version = execSync('npx artillery --version 2>&1 | grep "Artillery:"', { encoding: 'utf-8' }).trim();
      return { installed: true, version: version.replace('Artillery: ', '') };
    } catch {
      // Fall back to global installation
      const version = execSync('artillery --version 2>&1 | grep "Artillery:"', { encoding: 'utf-8' }).trim();
      return { installed: true, version: version.replace('Artillery: ', '') };
    }
  } catch (error) {
    return { installed: false };
  }
}

async function main() {
  log('\n🔍 Load Testing Environment Validation\n', 'blue');
  log(`Target URL: ${TARGET_URL}\n`);

  let allChecksPass = true;

  // Check 1: Artillery installation
  log('1. Checking Artillery installation...', 'yellow');
  const artilleryCheck = await checkArtillery();
  if (artilleryCheck.installed) {
    log(`   ✓ Artillery is installed (${artilleryCheck.version})`, 'green');
  } else {
    log('   ✗ Artillery is not installed', 'red');
    log('     Install with: npm install', 'yellow');
    allChecksPass = false;
  }

  // Check 2: Test data file
  log('\n2. Validating test data file...', 'yellow');
  const testDataCheck = await validateTestData();
  if (testDataCheck.valid) {
    log(`   ✓ ${testDataCheck.message}`, 'green');
  } else {
    log(`   ✗ ${testDataCheck.message}`, 'red');
    allChecksPass = false;
  }

  // Check 3: Target health check
  log('\n3. Checking target availability...', 'yellow');
  try {
    const health = await checkHealth(TARGET_URL);
    if (health.success) {
      log(`   ✓ Target is healthy and responding`, 'green');
      log(`     Status: ${health.data.status}`, 'blue');
      if (health.data.database) {
        log(`     Database: ${health.data.database}`, 'blue');
      }
    } else {
      log(`   ✗ Target returned status code: ${health.statusCode}`, 'red');
      allChecksPass = false;
    }
  } catch (error) {
    log(`   ✗ Cannot reach target: ${error.message}`, 'red');
    log('     Make sure the application is running', 'yellow');
    allChecksPass = false;
  }

  // Summary
  log('\n' + '='.repeat(50), 'blue');
  if (allChecksPass) {
    log('✓ All checks passed! Ready for load testing', 'green');
    log('\nRun load tests with:', 'blue');
    log('  npm run perf:test:smoke    # Quick smoke test', 'yellow');
    log('  npm run perf:test          # Full load test', 'yellow');
    log('  npm run perf:test:report   # Test with HTML report', 'yellow');
    process.exit(0);
  } else {
    log('✗ Some checks failed. Fix the issues above before running load tests.', 'red');
    process.exit(1);
  }
}

main().catch((error) => {
  log(`\n✗ Validation error: ${error.message}`, 'red');
  process.exit(1);
});
