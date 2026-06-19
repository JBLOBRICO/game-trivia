import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { getDatabase } from './db/database';
import { authRouter } from './routes/auth';
import { statsRouter } from './routes/stats';
import { registerSocketHandlers } from './socket/gameHandler';

// Load env variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*', // Allow all origins for dev simplicity, can refine in prod
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRouter);
app.use('/api/stats', statsRouter);

// Serve static assets in production
const clientBuildPath = path.join(__dirname, '../client/dist');
app.use(express.static(clientBuildPath));

app.get('*', (req, res) => {
  // If request falls through, send back React app
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Boot Database and start listening
async function bootstrap() {
  try {
    console.log('Connecting to SQLite Database...');
    await getDatabase();
    console.log('Database connected and schemas verified.');

    registerSocketHandlers(io);
    console.log('Socket.IO event handlers registered.');

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to bootstrap server:', error);
    process.exit(1);
  }
}

bootstrap();
