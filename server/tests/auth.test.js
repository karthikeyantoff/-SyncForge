import { describe, it, expect } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

describe('Auth Endpoints & Validation', () => {
  const validUser = {
    name: 'Karthikeyan T',
    email: 'karthikeyan@example.com',
    password: 'SyncForge2026!',
    confirmPassword: 'SyncForge2026!',
  };

  it('registers a new user and sets auth cookie with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send(validUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.name).toBe('Karthikeyan T');
    expect(res.body.user.email).toBe('karthikeyan@example.com');
    expect(res.body.user.passwordHash).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('rejects registration when name is too short or contains invalid characters', async () => {
    const shortRes = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, name: 'A', email: 'short@example.com' });

    expect(shortRes.status).toBe(400);
    expect(shortRes.body.error).toMatch(/at least 2 characters/i);

    const invalidCharRes = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, name: 'Karthi123$', email: 'invalidname@example.com' });

    expect(invalidCharRes.status).toBe(400);
    expect(invalidCharRes.body.error).toMatch(/alphabetic letters/i);
  });

  it('rejects registration with malformed email', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'notanemail' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/valid email/i);
  });

  it('rejects registration with weak passwords', async () => {
    // Less than 8 chars
    const shortPassRes = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'shortpass@example.com', password: 'Pass1!', confirmPassword: 'Pass1!' });
    expect(shortPassRes.status).toBe(400);
    expect(shortPassRes.body.error).toMatch(/at least 8 characters/i);

    // Missing special character
    const noSpecialRes = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'nospecial@example.com', password: 'Password123', confirmPassword: 'Password123' });
    expect(noSpecialRes.status).toBe(400);
    expect(noSpecialRes.body.error).toMatch(/special character/i);
  });

  it('rejects password confirmation mismatch', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'mismatch@example.com', confirmPassword: 'DifferentPassword123!' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/passwords do not match/i);
  });

  it('rejects duplicate email with 409', async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'duplicate@example.com' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...validUser, email: 'duplicate@example.com' });

    expect(res.status).toBe(409);
    expect(res.body.error).toMatch(/already registered|already exists/i);
  });

  it('authenticates user and returns profile on /api/auth/me', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Logged In User',
        email: 'login@example.com',
        password: 'SyncForge2026!',
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
