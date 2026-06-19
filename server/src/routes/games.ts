import { Router, Request, Response } from 'express';
import { getDatabase } from '../../db/database';
import { authMiddleware } from './auth';

const router = Router();

// Save a completed match (called by client after gameover)
router.post('/match', authMiddleware, async (req: Request, res: Response) => {
  const { roomCode, mode, winnerUsername, matchLog } = req.body;
  if (!roomCode || !mode || !winnerUsername) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  try {
    const db = await getDatabase();
    await db.run(
      'INSERT INTO match_history (game_mode, winner_username, players) VALUES (?, ?, ?)',
      [mode, winnerUsername, JSON.stringify(matchLog || {})]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get global leaderboard (top 10 by XP)
router.get('/leaderboard', async (req: Request, res: Response) => {
  try {
    const db = await getDatabase();
    const rows = await db.all('SELECT id, username, avatar, xp, coins FROM users ORDER BY xp DESC LIMIT 10');
    res.json({ leaderboard: rows });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

// Get match history for a user
router.get('/matches/:username', async (req: Request, res: Response) => {
  const { username } = req.params;
  try {
    const db = await getDatabase();
    const rows = await db.all(
      'SELECT * FROM match_history WHERE winner_username = ? ORDER BY played_at DESC LIMIT 20',
      username
    );
    res.json({ matches: rows });
  } catch (err) {
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
