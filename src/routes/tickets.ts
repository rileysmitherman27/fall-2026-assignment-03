import { Router, Request, Response } from 'express';
import {
  getAllTickets,
  getTicketById,
  createTicket,
  updateTicketStatus,
} from '../dal/tickets.js';
import { insertTimeLog, getTotalHoursForTicket } from '../dal/timeLogs.js';
import { requireUserId } from '../middleware/auth.js';

const router = Router();

function parsePositiveInt(value: unknown): number | undefined {
  if (typeof value !== 'string') return undefined;
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : undefined;
}

// TODO: Student implementation - Part 1: Ticket Routes
// GET /tickets
router.get('/', async (req: Request, res: Response) => {
  const limit = parsePositiveInt(req.query.limit);
  const offset = parsePositiveInt(req.query.offset);
  const status = typeof req.query.status === 'string' ? req.query.status : undefined;

  const tickets = await getAllTickets({ limit, offset, status });
  res.status(200).json(tickets);
});

// GET /tickets/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const ticket = await getTicketById(id);

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  res.status(200).json(ticket);
});

// POST /tickets
router.post('/', requireUserId, async (req: Request, res: Response) => {
  const { title, description } = req.body ?? {};

  if (typeof title !== 'string' || title.trim() === '') {
    res.status(400).json({ error: '"title" is required' });
    return;
  }

  const creatorId = res.locals.userId as number;

  const ticket = await createTicket({
    title,
    description: typeof description === 'string' ? description : null,
    creator_id: creatorId,
  });

  res.status(201).json(ticket);
});

// PATCH /tickets/:id/status
router.patch('/:id/status', requireUserId, async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const { status } = req.body ?? {};

  if (!Number.isInteger(id)) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  if (typeof status !== 'string' || status.trim() === '') {
    res.status(400).json({ error: '"status" is required' });
    return;
  }

  const ticket = await updateTicketStatus(id, status);

  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  res.status(200).json(ticket);
});

// TODO: Student implementation - Part 2: Time Log Routes
// POST /tickets/:id/time
router.post('/:id/time', requireUserId, async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);
  const { hours } = req.body ?? {};

  if (!Number.isInteger(ticketId)) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  if (typeof hours !== 'number' || !Number.isFinite(hours) || hours <= 0) {
    res.status(400).json({ error: '"hours" must be a positive number' });
    return;
  }

  const ticket = await getTicketById(ticketId);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const userId = res.locals.userId as number;
  const timeLog = await insertTimeLog(ticketId, userId, hours);

  res.status(201).json(timeLog);
});

// GET /tickets/:id/time
router.get('/:id/time', async (req: Request, res: Response) => {
  const ticketId = Number(req.params.id);

  if (!Number.isInteger(ticketId)) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const ticket = await getTicketById(ticketId);
  if (!ticket) {
    res.status(404).json({ error: 'Ticket not found' });
    return;
  }

  const totalHours = await getTotalHoursForTicket(ticketId);

  res.status(200).json({ ticket_id: ticketId, total_hours: totalHours });
});

export default router;