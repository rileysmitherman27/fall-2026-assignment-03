import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/index.js';
import { db } from '../src/db/database.js';

describe('Part 2: Time Logs Tests', () => {
  let userId: number;
  let ticketId: number;

  beforeAll(async () => {
    const userRes = await request(app)
      .post('/users')
      .set('X-User-Id', '1')
      .send({ name: 'Time Logger', email: `logger.${Date.now()}@example.com` });
    userId = userRes.body.id;

    const ticketRes = await request(app)
      .post('/tickets')
      .set('X-User-Id', String(userId))
      .send({ title: 'Ticket needing time tracking' });
    ticketId = ticketRes.body.id;
  });

  afterAll(async () => {
    await db.destroy();
  });

  // Log hours for a ticket (POST /tickets/:id/time)
  it('logs hours against a ticket and returns 201', async () => {
    const res = await request(app)
      .post(`/tickets/${ticketId}/time`)
      .set('X-User-Id', String(userId))
      .send({ hours: 2 });

    expect(res.status).toBe(201);
    expect(res.body.ticket_id).toBe(ticketId);
    expect(res.body.hours).toBe(2);
  });

  it('rejects time log creation without X-User-Id header (401)', async () => {
    const res = await request(app).post(`/tickets/${ticketId}/time`).send({ hours: 2 });

    expect(res.status).toBe(401);
  });

  // Fetch total hours for a ticket (GET /tickets/:id/time)
  it('fetches total hours for a ticket', async () => {
    const res = await request(app).get(`/tickets/${ticketId}/time`);

    expect(res.status).toBe(200);
    expect(res.body.ticket_id).toBe(ticketId);
    expect(res.body.total_hours).toBe(2);
  });

  it('returns 404 when fetching time totals for a non-existent ticket', async () => {
    const res = await request(app).get('/tickets/999999999/time');
    expect(res.status).toBe(404);
  });

  // Verify aggregation math
  it('correctly sums multiple time log entries', async () => {
    await request(app)
      .post(`/tickets/${ticketId}/time`)
      .set('X-User-Id', String(userId))
      .send({ hours: 3 });

    await request(app)
      .post(`/tickets/${ticketId}/time`)
      .set('X-User-Id', String(userId))
      .send({ hours: 1.5 });

    const res = await request(app).get(`/tickets/${ticketId}/time`);

    expect(res.status).toBe(200);
    // 2 (from first test) + 3 + 1.5 = 6.5
    expect(res.body.total_hours).toBe(6.5);
  });
});