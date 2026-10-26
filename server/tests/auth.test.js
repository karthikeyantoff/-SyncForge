import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Auth Endpoints', () => {
  it('registers a new user and sets auth cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Karthikeyan T',
        email: 'karthikeyan@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('Karthikeyan T');
    expect(res.body.user.email).toBe('karthikeyan@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects duplicate email with 409', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User 1',
        email: 'duplicate@example.com',
        password: 'password123',
      });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User 2',
        email: 'duplicate@example.com',
        password: 'password123',
      });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered|already exists/i);
  });

  it('authenticates user and returns profile on /api/auth/me', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Logged In User',
        email: 'login@example.com',
        password: 'password123',
      });

    const token = reg.body.token;

    const me = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(me.status).toBe(200);
    expect(me.body.user.email).toBe('login@example.com');
  });

  it('rejects unauthenticated requests to /api/auth/me with 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
