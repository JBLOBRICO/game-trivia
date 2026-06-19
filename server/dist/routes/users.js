import { Router } from 'express';
import { db } from '../models/db.js';
import { authMiddleware } from './auth.js';
const router = Router();
// Get own profile
router.get('/me', authMiddleware, (req, res) => {
    const user = req.user;
    const stmt = db.prepare('SELECT id, username, avatar, xp, coins, created_at FROM users WHERE id = ?');
    const data = stmt.get(user.id);
    if (!data)
        return res.status(404).json({ error: 'User not found' });
    res.json({ user: data });
});
// Get another user's stats/profile
router.get('/profile/:username', authMiddleware, (req, res) => {
    const { username } = req.params;
    const stmt = db.prepare('SELECT id, username, avatar, xp, coins, created_at FROM users WHERE username = ?');
    const data = stmt.get(username);
    if (!data)
        return res.status(404).json({ error: 'User not found' });
    // Could also fetch achievements, stats, etc.
    res.json({ user: data });
});
export default router;
