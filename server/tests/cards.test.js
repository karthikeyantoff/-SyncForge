import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

async function createUser(email, name = 'User') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'password123' });
  return { token: res.body.token, user: res.body.user };
}

describe('Cards & Concurrency Control (OCC)', () => {
  let user;
  let board;
  let list;

  beforeEach(async () => {
    user = await createUser('dev@syncforge.dev', 'Lead Dev');
    const bRes = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Sprint Board', template: false });
    board = bRes.body.board;

    const lRes = await request(app)
      .post(`/api/boards/${board._id}/lists`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'To Do' });
    list = lRes.body.list;
  });

  it('creates card with metadata and default version 0', async () => {
    const res = await request(app)
      .post(`/api/lists/${list._id}/cards`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({
        title: 'Implement WebSocket Handshake',
        description: 'Verify JWT and room join authorization',
        priority: 'urgent',
        labels: [{ text: 'Backend', color: 'indigo' }],
      });

    expect(res.status).toBe(201);
    expect(res.body.card.title).toBe('Implement WebSocket Handshake');
    expect(res.body.card.priority).toBe('urgent');
    expect(res.body.card.version).toBe(0);
    expect(res.body.card.position).toBe(1000);
  });

  it('accepts edit when version matches and increments version counter', async () => {
    const card = (
      await request(app)
        .post(`/api/lists/${list._id}/cards`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: 'Initial Title' })
    ).body.card;

    const res = await request(app)
      .patch(`/api/cards/${card._id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Updated Title', version: 0 });

    expect(res.status).toBe(200);
    expect(res.body.card.title).toBe('Updated Title');
    expect(res.body.card.version).toBe(1);
  });

  it('detects concurrent edits and returns 409 Conflict with authoritative card', async () => {
    const card = (
      await request(app)
        .post(`/api/lists/${list._id}/cards`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: 'Base Title', description: 'Base Description' })
    ).body.card;

    // First user updates card to version 1
    await request(app)
      .patch(`/api/cards/${card._id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Alice Edit', version: 0 })
      .expect(200);

    // Second user attempts to edit using stale version 0
    const conflictRes = await request(app)
      .patch(`/api/cards/${card._id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Bob Conflicting Edit', version: 0 });

    expect(conflictRes.status).toBe(409);
    expect(conflictRes.body.error).toMatch(/modified by another collaborator/i);
    expect(conflictRes.body.card.title).toBe('Alice Edit');
    expect(conflictRes.body.card.version).toBe(1);
  });

  it('calculates fractional position between two cards in O(1)', async () => {
    const cardA = (
      await request(app)
        .post(`/api/lists/${list._id}/cards`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: 'Card 1' })
    ).body.card; // pos: 1000

    const cardB = (
      await request(app)
        .post(`/api/lists/${list._id}/cards`)
        .set('Authorization', `Bearer ${user.token}`)
        .send({ title: 'Card 2' })
    ).body.card; // pos: 2000

    // Move or insert between Card 1 and Card 2
    const midRes = await request(app)
      .patch(`/api/cards/${cardB._id}`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ before: cardA.position, after: cardB.position });

    expect(midRes.status).toBe(200);
    expect(midRes.body.card.position).toBe((cardA.position + cardB.position) / 2);
  });

  it('records activity history entries', async () => {
    await request(app)
      .post(`/api/lists/${list._id}/cards`)
      .set('Authorization', `Bearer ${user.token}`)
      .send({ title: 'Log Test Card' });

    const actRes = await request(app)
      .get(`/api/boards/${board._id}/activity`)
      .set('Authorization', `Bearer ${user.token}`);

    expect(actRes.status).toBe(200);
    expect(actRes.body.activities.length).toBeGreaterThan(0);
    expect(actRes.body.activities[0].type).toBe('card.created');
  });
});
