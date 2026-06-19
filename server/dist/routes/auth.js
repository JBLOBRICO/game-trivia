import { Router } from 'express';
import { db } from '../models/db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';
const JWT_EXPIRES = '7d';
// Helper to generate token
function generateToken(userId, username) {
    return jwt.sign({ sub: userId, username }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
}
// Register
router.post('/register', async (req, res) => {
    const { username, password, avatar } = req.body;
    if (!username || !password || !avatar) {
        return res.status(400).json({ error: 'Missing fields.' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
    if (existing) {
        return res.status(409).json({ error: 'Username already taken.' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    // Insert user and get inserted ID via callback
    db.run('INSERT INTO users (username, password_hash, avatar) VALUES (?,?,?)', [username, passwordHash, avatar], function (err) {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: 'Database error' });
        }
        const userId = this.lastID;
        const token = generateToken(userId, username);
        res.json({ token, user: { id: userId, username, avatar, xp: 0, coins: 20 } });
    });
});
// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) {
        return res.status(400).json({ error: 'Missing fields.' });
    }
    const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
    if (!user) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
        return res.status(401).json({ error: 'Invalid credentials.' });
    }
    const token = generateToken(user.id, user.username);
    res.json({ token, user: { id: user.id, username: user.username, avatar: user.avatar, xp: user.xp, coins: user.coins } });
});
// Middleware to verify token
export function authMiddleware(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader)
        return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];
    try {
        const payload = jwt.verify(token, JWT_SECRET);
        // attach user info
        req.user = { id: payload.sub, username: payload.username };
        next();
    }
    catch (err) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}
export default router;
