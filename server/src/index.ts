import express, { Request, Response, NextFunction } from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { getDatabase } from '../db/database';
import { authRouter } from '../routes/auth';
import { statsRouter } from '../routes/stats';
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
app.use('/api/stats', statsRouter);

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Serve static frontend build if exists
// Burahin o i-comment out ito:
// const staticPath = path.resolve(__dirname, '../../client/dist');
// app.use(express.static(staticPath));
// app.get('*', (req: Request, res: Response) => {
//   res.sendFile(path.join(staticPath, 'index.html'));
// });
app.get('/', (req: Request, res: Response) => {
  res.send('Trivia Game Backend is Online!');
});
// Socket.IO setup
registerSocketHandlers(io);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
