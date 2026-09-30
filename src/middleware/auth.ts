import { Request, Response, NextFunction } from 'express';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  // TODO: Student implementation - Part 1: Authentication Middleware
  // Store the authenticated userId on res.locals.userId
  const header = req.header('X-User-Id');

  if (header === undefined) {
    res.status(401).json({ error: 'Missing X-User-Id header' });
    return;
  }

  const userId = Number(header);

  if (!Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ error: 'X-User-Id header must be a valid number' });
    return;
  }

  res.locals.userId = us
}

export default authMiddleware;
