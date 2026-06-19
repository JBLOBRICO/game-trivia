import { Router, Request, Response } from 'express';
import { getDatabase } from '../../db/database';
import { authMiddleware } from './auth';

const router = Router();

// Get own profile
router.get('/me', authMiddleware, async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const db = await getDatabase();
    const data = await db.get('SELECT id, username, avatar, xp, coins, created_at FROM users WHERE id = ?', user.id);
    if (!data) return res.status(404).json({ error: 'User not found' });
    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get another user's stats/profile
router.get('/profile/:username', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { username } = req.params;
    const db = await getDatabase();
    const data = await db.get('SELECT id, username, avatar, xp, coins, created_at FROM users WHERE username = ?', username);
    if (!data) return res.status(404).json({ error: 'User not found' });
    res.json({ user: data });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
