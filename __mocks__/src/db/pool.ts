/**
 * Manual Jest mock for src/db/pool.ts
 * 
 * This mock ensures we never hit a real database during tests
 * and provides proper TypeScript types for better test reliability.
 */

export type QueryResult<R = unknown> = { 
  rows: R[]; 
  rowCount: number; 
};

export type MockQuery = jest.Mock<
  Promise<QueryResult>, 
  [string | { text: string }, unknown[]?]
>;

// Create the mock query function with proper typing
const query: MockQuery = jest.fn();

// Mock pool object that matches the interface expected by repository.ts
const mockPool = { 
  query,
  connect: jest.fn(),
  end: jest.fn(),
  on: jest.fn(),
};

export default mockPool;