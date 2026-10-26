import { describe, it, expect, beforeEach } from '@jest/globals';
import request from 'supertest';
import { createApp } from '../src/app.js';

const app = createApp();

async function createUser(email, name = 'User') {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ name, email, password: 'SyncForge2026!' });
  return { token: res.body.token, user: res.body.user };
}

describe('Board Endpoints & RBAC', () => {
  let owner;
  let collaborator;
  let outsider;

  beforeEach(async () => {
    owner = await createUser('owner@syncforge.dev', 'Owner');
    collaborator = await createUser('collab@syncforge.dev', 'Collaborator');
    outsider = await createUser('outsider@syncforge.dev', 'Outsider');
  });

  it('creates board with default Kanban workflow template', async () => {
    const res = await request(app)
      .post('/api/boards')
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ title: 'Sprint 1 Workspace', template: true });

    expect(res.status).toBe(201);
    expect(res.body.board.title).toBe('Sprint 1 Workspace');
    expect(res.body.board.owner).toBeDefined();

    // Verify template lists were created
    const boardRes = await request(app)
      .get(`/api/boards/${res.body.board._id}`)
      .set('Authorization', `Bearer ${owner.token}`);

    expect(boardRes.status).toBe(200);
    expect(boardRes.body.lists.length).toBe(5);
    expect(boardRes.body.lists.map((l) => l.title)).toEqual([
      'Backlog',
      'To Do',
      'In Progress',
      'In Review',
      'Done',
    ]);
  });

  it('denies board access to non-members with 403', async () => {
    const board = (
      await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ title: 'Confidential Board' })
    ).body.board;

    const res = await request(app)
      .get(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${outsider.token}`);

    expect(res.status).toBe(403);
  });

  it('allows owner to add member with viewer role, and blocks viewer mutations', async () => {
    const board = (
      await request(app)
        .post('/api/boards')
        .set('Authorization', `Bearer ${owner.token}`)
        .send({ title: 'Design System' })
    ).body.board;

    // Add collaborator as viewer
    const addRes = await request(app)
      .post(`/api/boards/${board._id}/members`)
      .set('Authorization', `Bearer ${owner.token}`)
      .send({ email: collaborator.user.email, role: 'viewer' });

    expect(addRes.status).toBe(201);

    // Viewer can read board
    const viewRes = await request(app)
      .get(`/api/boards/${board._id}`)
      .set('Authorization', `Bearer ${collaborator.token}`);
    expect(viewRes.status).toBe(200);

    // Viewer is blocked from adding a list (403)
    const listRes = await request(app)
      .post(`/api/boards/${board._id}/lists`)
      .set('Authorization', `Bearer ${collaborator.token}`)
      .send({ title: 'New Column' });
    expect(listRes.status).toBe(403);
  });
});
