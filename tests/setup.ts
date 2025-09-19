/**
 * Test setup file for Jest
 * Configures global test environment and utilities
 */

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';
process.env.JWT_EXPIRES = '1h';
process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_NAME = 'taskmanager_test';
process.env.DB_USER = 'postgres';
process.env.DB_PASSWORD = 'password';

// Global test timeout
jest.setTimeout(30000);

// Mock Redis for testing
jest.mock('ioredis', () => {
  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
    setex: jest.fn(),
    del: jest.fn(),
    incr: jest.fn(),
    expire: jest.fn(),
    quit: jest.fn(),
  };
  return jest.fn(() => mockRedis);
});

// Suppress console logs during tests unless explicitly needed
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

beforeAll(() => {
  console.log = jest.fn();
  console.error = jest.fn();
  console.warn = jest.fn();
});

afterAll(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
});

// Global test utilities
import jwt from 'jsonwebtoken';

export const testUtils = {
  createAuthToken: (userId: string): string => {
    const secret = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing';
    return jwt.sign({ sub: userId }, secret, { expiresIn: '1h' });
  },
  createMockUser: () => ({
    id: 'user-' + Math.random().toString(36).substring(2, 15),
    email: `test${Math.random().toString(36).substring(2, 5)}@example.com`,
    name: 'Test User',
  }),
  createMockTask: () => ({
    id: 'task-' + Math.random().toString(36).substring(2, 15),
    title: 'Test Task ' + Math.random().toString(36).substring(2, 8),
    description: 'Test task description',
  }),
  createMockProject: () => ({
    id: 'project-' + Math.random().toString(36).substring(2, 15),
    name: 'Test Project ' + Math.random().toString(36).substring(2, 8),
    description: 'Test project description',
  }),
};
