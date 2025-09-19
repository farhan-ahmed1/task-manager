import request from 'supertest';
import app from '../src/index';

describe('GET /health', () => {
  it('returns comprehensive health information', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('version');
    expect(res.body).toHaveProperty('environment');
    expect(res.body).toHaveProperty('services');
    expect(res.body.services).toHaveProperty('rateLimit');
  });
});
