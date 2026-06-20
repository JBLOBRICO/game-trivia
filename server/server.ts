
import fs from 'fs';
console.log('--- DEBUGGING FILE SYSTEM ---');
console.log('Current working directory:', process.cwd());
console.log('Files in root:', fs.readdirSync(process.cwd()));
// Kung may 'client' folder, tignan ang laman:
if (fs.existsSync('./client')) {
  console.log('Files in ./client:', fs.readdirSync('./client'));
}
console.log('-----------------------------');
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

// Siguraduhin na ang mga path ay may .js extension para sa NodeNext resolution
// server.ts
import { getDatabase } from './src/db/database.js'; // Magdagdag ng .js
import { authRouter } from './src/routes/auth.js';   // Magdagdag ng .js
import { statsRouter } from './src/routes/stats.js';   // Magdagdag ng .js
import { registerSocketHandlers } from './src/socket/gameHandler.js'; // Magdagdag ng .js

dotenv.config();

const app = express();
const server = http.createServer(app);

// Setup Socket.io
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

// Middlewares
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/stats', statsRouter);

// Static files (Client/Frontend)
// Ginagamit ang process.cwd() para laging tama ang root path sa Render
// Baguhin ang linyang ito:
const clientBuildPath = path.join(process.cwd(), '..', 'client', 'dist');

// I-verify kung nasaan talaga ang folder
console.log('DEBUG: Looking for static files at:', path.resolve(clientBuildPath));

app.use(express.static(clientBuildPath));

// Fallback para sa SPA (Single Page Application)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuildPath, 'index.html'));
  } else {
    res.status(404).json({ error: 'API endpoint not found' });
  }
});

// Bootstrap function
async function bootstrap() {
  try {
    console.log('Connecting to SQLite Database...');
    await getDatabase();
    console.log('Database connected.');

    // Initialize socket handlers
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