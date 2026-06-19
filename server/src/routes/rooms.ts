import { Router, Request, Response } from 'express';
import { db } from '../models/db';
import { authMiddleware } from './auth';

const router = Router();

// TypeScript interfaces for DB rows
interface RoomRow {
  id: number;
  code: string;
  mode: string;
  host_user_id: number;
  status: string;
}
interface PlayerRow {
  room_id: number;
  user_id: number;
  avatar: string;
  character: string | null;
  ready: number;
}

// Helper to promisify db.get
function dbGet<T>(sql: string, params: any[] = []): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row as T);
    });
  });
}
// Helper to promisify db.run
function dbRun(sql: string, params: any[] = []): Promise<{ lastID: number }> {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (this: any, err: Error | null) {
      if (err) reject(err);
      else resolve({ lastID: this ? this.lastID : 0 });
    });
  });
}

// Generate a unique 6‑char room code
async function generateRoomCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const makeCode = () => {
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };
  while (true) {
    const code = makeCode();
    const existing = await dbGet<RoomRow>('SELECT id FROM rooms WHERE code = ?', [code]);
    if (!existing) return code;
  }
}

// Create a new private room
router.post('/create', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { gameMode } = req.body; // '1v1' | '2v2' | 'FFA'
    const user = (req as any).user;
    if (!gameMode) return res.status(400).json({ error: 'Missing gameMode' });
    const code = await generateRoomCode();
    // Insert room
    const { lastID: roomId } = await dbRun(
      'INSERT INTO rooms (code, mode, host_user_id, status) VALUES (?,?,?,?)',
      [code, gameMode, user.id, 'lobby']
    );
    // Insert host as first player
    await dbRun(
      'INSERT INTO room_players (room_id, user_id, avatar, character, ready) VALUES (?,?,?,?,?)',
      [roomId, user.id, user.avatar, null, 0]
    );
    res.json({ roomCode: code, roomId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Join an existing room
router.post('/join', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.body;
    const user = (req as any).user;
    if (!roomCode) return res.status(400).json({ error: 'Missing roomCode' });
    const room = await dbGet<RoomRow>('SELECT * FROM rooms WHERE code = ?', [roomCode]);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status !== 'lobby') return res.status(400).json({ error: 'Game already started' });
    // Check if already in room
    const exists = await dbGet<PlayerRow>('SELECT * FROM room_players WHERE room_id = ? AND user_id = ?', [
      room.id,
      user.id,
    ]);
    if (exists) return res.status(400).json({ error: 'Already joined' });
    // Count current players
    const countRow = await dbGet<{ cnt: number }>('SELECT COUNT(*) as cnt FROM room_players WHERE room_id = ?', [
      room.id,
    ]);
    const playerCount = countRow?.cnt ?? 0;
    let max = 4;
    switch (room.mode) {
      case '1v1':
        max = 2;
        break;
      case '2v2':
        max = 4;
        break;
      case 'FFA':
        max = 4;
        break;
    }
    if (playerCount >= max) return res.status(400).json({ error: 'Room is full' });
    // Add player
    await dbRun(
      'INSERT INTO room_players (room_id, user_id, avatar, character, ready) VALUES (?,?,?,?,?)',
      [room.id, user.id, user.avatar, null, 0]
    );
    res.json({ success: true, roomId: room.id, roomCode: room.code, mode: room.mode });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Set ready status
router.post('/ready', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { roomCode, ready } = req.body;
    const user = (req as any).user;
    const room = await dbGet<RoomRow>('SELECT * FROM rooms WHERE code = ?', [roomCode]);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    await dbRun('UPDATE room_players SET ready = ? WHERE room_id = ? AND user_id = ?', [
      ready ? 1 : 0,
      room.id,
      user.id,
    ]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

export default router;
