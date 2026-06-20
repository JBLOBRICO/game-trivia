import { Router, Request, Response } from 'express';
import { getDatabase } from '../db/database';
import { authenticateToken } from './auth';

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

// Generate a unique 6‑char room code
async function generateRoomCode(): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const makeCode = () => {
    let code = '';
    for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
    return code;
  };
  const db = await getDatabase();
  while (true) {
    const code = makeCode();
    const existing = await db.get<RoomRow>('SELECT id FROM rooms WHERE code = ?', [code]);
    if (!existing) return code;
  }
}

// Create a new room
router.post('/create', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { gameMode } = req.body;
    const user = (req as any).user;
    if (!gameMode) return res.status(400).json({ error: 'Missing gameMode' });
    const code = await generateRoomCode();

    const db = await getDatabase();
    // Insert room
    const result = await db.run(
      'INSERT INTO rooms (code, mode, host_user_id, status) VALUES (?, ?, ?, ?)',
      [code, gameMode, user.id, 'lobby']
    );
    const roomId = result.lastID;

    // Add host as player
    await db.run(
      'INSERT INTO room_players (room_id, user_id, avatar, ready) VALUES (?, ?, ?, ?)',
      [roomId, user.id, user.avatar || '🐱', 0]
    );

    res.status(201).json({ roomCode: code, roomId });
  } catch (err: any) {
    console.error('Create room error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Join an existing room
router.post('/join', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { roomCode } = req.body;
    const user = (req as any).user;
    if (!roomCode) return res.status(400).json({ error: 'Missing roomCode' });

    const db = await getDatabase();
    const room = await db.get<RoomRow>('SELECT * FROM rooms WHERE code = ?', [roomCode]);
    if (!room) return res.status(404).json({ error: 'Room not found' });
    if (room.status !== 'lobby') return res.status(400).json({ error: 'Game already started or finished' });

    // Check if player already in room
    const existingPlayer = await db.get<PlayerRow>(
      'SELECT * FROM room_players WHERE room_id = ? AND user_id = ?',
      [room.id, user.id]
    );

    if (!existingPlayer) {
      // Check max capacity based on mode
      const players = await db.all<PlayerRow[]>('SELECT * FROM room_players WHERE room_id = ?', [room.id]);
      let maxPlayers = 4;
      if (room.mode === '1v1') maxPlayers = 2;
      if (room.mode === 'Training') maxPlayers = 1;
      
      if (players.length >= maxPlayers) {
        return res.status(400).json({ error: 'Room is full' });
      }

      await db.run(
        'INSERT INTO room_players (room_id, user_id, avatar, ready) VALUES (?, ?, ?, ?)',
        [room.id, user.id, user.avatar || '🐱', 0]
      );
    }

    res.json({ message: 'Joined successfully', roomCode, roomId: room.id, mode: room.mode });
  } catch (err: any) {
    console.error('Join room error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Toggle Ready status
router.post('/ready', authenticateToken, async (req: Request, res: Response) => {
  try {
    const { roomCode, ready } = req.body;
    const user = (req as any).user;

    const db = await getDatabase();
    const room = await db.get<RoomRow>('SELECT * FROM rooms WHERE code = ?', [roomCode]);
    if (!room) return res.status(404).json({ error: 'Room not found' });

    await db.run(
      'UPDATE room_players SET ready = ? WHERE room_id = ? AND user_id = ?',
      [ready ? 1 : 0, room.id, user.id]
    );

    res.json({ message: 'Status updated' });
  } catch (err: any) {
    console.error('Ready toggle error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
