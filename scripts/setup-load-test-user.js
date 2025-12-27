#!/usr/bin/env node

/**
 * Setup Load Test User
 * Creates a test user for load testing scenarios
 */

import pg from 'pg';
import bcrypt from 'bcryptjs';
import { config } from 'dotenv';

config();

const { Pool } = pg;

const TEST_USER = {
  email: 'loadtest@example.com',
  password: 'password123',
  name: 'Load Test User'
};

async function setupTestUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    console.log('🔧 Setting up load test user...\n');

    // Check if user already exists
    const checkQuery = 'SELECT id, email FROM users WHERE email = $1';
    const existingUser = await pool.query(checkQuery, [TEST_USER.email]);

    if (existingUser.rows.length > 0) {
      console.log(`✓ Test user already exists: ${TEST_USER.email}`);
      console.log(`  User ID: ${existingUser.rows[0].id}\n`);
    } else {
      // Create the user
      const hashedPassword = await bcrypt.hash(TEST_USER.password, 10);
      const insertQuery = `
        INSERT INTO users (email, password_hash, name)
        VALUES ($1, $2, $3)
        RETURNING id, email, name, created_at
      `;
      
      const result = await pool.query(insertQuery, [
        TEST_USER.email,
        hashedPassword,
        TEST_USER.name
      ]);

      const user = result.rows[0];
      console.log('✓ Test user created successfully!');
      console.log(`  Email: ${user.email}`);
      console.log(`  Name: ${user.name}`);
      console.log(`  User ID: ${user.id}`);
      console.log(`  Created: ${user.created_at}\n`);
    }

    console.log('📝 Load test credentials:');
    console.log(`  Email: ${TEST_USER.email}`);
    console.log(`  Password: ${TEST_USER.password}\n`);
    
    console.log('✅ Load test user is ready!');
    console.log('   Run: npm run perf:test\n');

  } catch (error) {
    console.error('❌ Error setting up test user:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

setupTestUser();
