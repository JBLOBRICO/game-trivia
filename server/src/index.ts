import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { getDatabase } from '../db/database';
import authRouter from './routes/auth';
import roomsRouter from './routes/rooms';
import triviaRouter from './routes/trivia';
import usersRouter from './routes/users';
import gamesRouter from './routes/games';
import { registerSocketHandlers } from '../socket/gameHandler';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// Initialize DB (creates tables if missing)
getDatabase().then(() => console.log('✅ Database initialized')).catch(console.error);

// API routes
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomsRouter);
app.use('/api/trivia', triviaRouter);
app.use('/api/users', usersRouter);
app.use('/api/games', gamesRouter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Serve static frontend build if exists
const staticPath = path.resolve(__dirname, '../../client/dist');
app.use(express.static(staticPath));
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(staticPath, 'index.html'));
});

// Socket.IO setup
registerSocketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
