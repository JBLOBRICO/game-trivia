import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';

// To these:
// Replace your old imports in server.ts with these:
// server.ts
import { getDatabase } from './src/db/database.js';
import { authRouter } from './src/routes/auth.js';
import { statsRouter } from './src/routes/stats.js';
import { registerSocketHandlers } from './src/socket/gameHandler.js';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRouter);
app.use('/api/stats', statsRouter);

const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

async function bootstrap() {
  try {
    console.log('Connecting to SQLite Database...');
    await getDatabase();
    console.log('Database connected.');

    registerSocketHandlers(io);

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to bootstrap server:', error);
    process.exit(1);
  }
}

bootstrap();