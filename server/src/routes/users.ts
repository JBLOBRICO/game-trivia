import { Router, Request, Response } from 'express';
import { db } from '../models/db';
import { authMiddleware } from './auth';

const router = Router();

// Get own profile
router.get('/me', authMiddleware, (req: Request, res: Response) => {
  const user = (req as any).user;
  const stmt = db.prepare('SELECT id, username, avatar, xp, coins, created_at FROM users WHERE id = ?');
  const data = stmt.get(user.id);
  if (!data) return res.status(404).json({ error: 'User not found' });
  res.json({ user: data });
});

// Get another user's stats/profile
router.get('/profile/:username', authMiddleware, (req: Request, res: Response) => {
  const { username } = req.params;
  const stmt = db.prepare('SELECT id, username, avatar, xp, coins, created_at FROM users WHERE username = ?');
  const data = stmt.get(username);
  if (!data) return res.status(404).json({ error: 'User not found' });
  // Could also fetch achievements, stats, etc.
  res.json({ user: data });
});

export default router;
