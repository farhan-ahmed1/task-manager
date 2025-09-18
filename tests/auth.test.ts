import request from 'supertest';

// Ensure tests have a JWT secret before app modules are loaded
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const app = require('../src/index').default;

type MockUser = { id: string; email: string; password_hash?: string };

jest.mock('../src/db/repository', () => ({
  createUser: jest.fn(async (email: string, passwordHash: string, name?: string) => ({
    id: 'uid-1',
    email,
    name,
  })),
  getUserByEmail: jest.fn(async (..._args: [string]) => {
    void _args;
    return null;
  }),
  getUserById: jest.fn(async (id: string) => ({ id, email: 'test@example.com' })),
}));

// eslint-disable-next-line @typescript-eslint/no-var-requires
const repo = require('../src/db/repository');
const _mockCreateUser: jest.Mock = repo.createUser;
const mockGetUserByEmail: jest.Mock<Promise<MockUser | null>, [string]> = repo.getUserByEmail;
const _mockGetUserById: jest.Mock = repo.getUserById;
void _mockCreateUser;
void _mockGetUserById;

jest.mock('../src/utils/hash', () => ({
  hashPassword: jest.fn(async (p: string) => 'hashed-' + p),
  comparePassword: jest.fn(async (p: string, h: string) => h === 'hashed-' + p),
}));

describe('Auth routes', () => {
  it('registers a user', async () => {
    const res = await request(app)
      .post('/auth/register')
      .send({ email: 'new@example.com', password: 'password123', name: 'New' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ email: 'new@example.com', name: 'New' });
  });

  it('logs in a user and accesses protected route', async () => {
    // adjust mock to return a user with password_hash
    mockGetUserByEmail.mockImplementationOnce(async (email: string) => ({
      id: 'uid-1',
      email,
      password_hash: 'hashed-password123',
    }));

    const login = await request(app)
      .post('/auth/login')
      .send({ email: 'test@example.com', password: 'password123' });
    expect(login.status).toBe(200);
    expect(login.body.token).toBeDefined();

    const token = login.body.token;
    const me = await request(app).get('/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBeDefined();
  });
});
