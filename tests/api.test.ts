import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { db } from '../src/db/database.js';

describe('Part 1: API Integration Tests', () => {
  afterAll(async () => {
    await db.destroy();
  });

  // Test user creation (POST /users)
  it('creates a user and returns 201', async () => {
    const res = await request(app)
      .post('/users')
      .set('X-User-Id', '1')
      .send({ name: 'Ada Lovelace', email: `ada.${Date.now()}@example.com` });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('id');
    expect(res.body.name).toBe('Ada Lovelace');
  });

  // Test ticket creation (POST /tickets)
  it('creates a ticket and returns 201', async () => {
    const userRes = await request(app)
      .post('/users')
      .set('X-User-Id', '1')
      .send({ name: 'Ticket Creator', email: `creator.${Date.now()}@example.com` });
    const userId = userRes.body.id;

    const res = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(userId))
      .send({ title: 'Fix login bug', description: 'Users cannot log in' });

    expect(res.status).toBe(201);
    expect(res.body.creator_id).toBe(userId);
    expect(res.body.status).toBe('TODO');
  });

  // Test auth middleware rejection (401 when X-User-Id is missing or invalid)
  it('rejects requests missing the X-User-Id header with 401', async () => {
    const res = await request(app).post('/tickets').send({ title: 'No auth ticket' });

    expect(res.status).toBe(401);
  });

  it('rejects requests with an invalid X-User-Id header with 401', async () => {
    const res = await request(app)
      .post('/tickets')
      .set('X-User-Id', 'not-a-number')
      .send({ title: 'Bad header ticket' });

    expect(res.status).toBe(401);
  });

  // Test 404 responses for non-existent users and tickets
  it('returns 404 for a non-existent user', async () => {
    const res = await request(app).get('/users/999999999');
    expect(res.status).toBe(404);
  });

  it('returns 404 for a non-existent ticket', async () => {
    const res = await request(app).get('/tickets/999999999');
    expect(res.status).toBe(404);
  });

  // Test pagination and filtering on GET /tickets
  it('supports pagination and status filtering on GET /tickets', async () => {
    const userRes = await request(app)
      .post('/users')
      .set('X-User-Id', '1')
      .send({ name: 'Pagination Tester', email: `pager.${Date.now()}@example.com` });
    const userId = userRes.body.id;

    await request(app)
      .post('/tickets')
      .set('X-User-Id', String(userId))
      .send({ title: 'Ticket A' });
    await request(app)
      .post('/tickets')
      .set('X-User-Id', String(userId))
      .send({ title: 'Ticket B' });

    const pagedRes = await request(app).get('/tickets?limit=1&offset=0');
    expect(pagedRes.status).toBe(200);
    expect(Array.isArray(pagedRes.body)).toBe(true);
    expect(pagedRes.body.length).toBe(1);

    const filteredRes = await request(app).get('/tickets?status=TODO');
    expect(filteredRes.status).toBe(200);
    expect(
      filteredRes.body.every((ticket: { status: string }) => ticket.status === 'TODO'),
    ).toBe(true);
  });
});