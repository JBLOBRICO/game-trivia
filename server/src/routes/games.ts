import { Router, Request, Response } from 'express';
import { db } from '../models/db';
import { authMiddleware } from './auth';

const router = Router();

// Save a completed match (called by client after gameover)
router.post('/match', authMiddleware, (req: Request, res: Response) => {
  const { roomCode, mode, winnerUsername, matchLog } = req.body;
  if (!roomCode || !mode || !winnerUsername) {
    return res.status(400).json({ error: 'Missing fields' });
  }
  const stmt = db.prepare(
    'INSERT INTO matches (room_code, mode, winner_username, match_json) VALUES (?, ?, ?, ?)'
  );
  stmt.run(roomCode, mode, winnerUsername, JSON.stringify(matchLog || {}));
  res.json({ success: true });
});

// Get global leaderboard (top 10 by XP)
router.get('/leaderboard', (req: Request, res: Response) => {
  const rows = db
    .prepare('SELECT id, username, avatar, xp, coins, games_won FROM users ORDER BY xp DESC LIMIT 10')
    .all();
  res.json({ leaderboard: rows });
});

// Get match history for a user
router.get('/matches/:username', (req: Request, res: Response) => {
  const { username } = req.params;
  const rows = db
    .prepare(
      'SELECT * FROM matches WHERE winner_username = ? OR room_code IN (SELECT code FROM rooms WHERE id IN (SELECT room_id FROM room_players WHERE user_id = (SELECT id FROM users WHERE username = ?))) ORDER BY played_at DESC LIMIT 20'
    )
    .all(username, username);
  res.json({ matches: rows });
});

export default router;
