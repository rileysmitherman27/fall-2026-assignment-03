import { Router, Request, Response } from 'express';
import { getAllUsers, getUserById, createUser } from '../dal/users.js';
import { requireUserId } from '../middleware/auth.js';

const router = Router();

// TODO: Student implementation - Part 1: User Routes
// GET /users
router.get('/', async (_req: Request, res: Response) => {
  const users = await getAllUsers();
  res.status(200).json(users);
});

// GET /users/:id
router.get('/:id', async (req: Request, res: Response) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const user = await getUserById(id);

  if (!user) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.status(200).json(user);
});

// POST /users
router.post('/', requireUserId, async (req: Request, res: Response) => {
  const { name, email } = req.body ?? {};

  if (typeof name !== 'string' || typeof email !== 'string') {
    res.status(400).json({ error: '"name" and "email" are required strings' });
    return;
  }

  const user = await createUser({ name, email });
  res.status(201).json(user);
});

export default router;