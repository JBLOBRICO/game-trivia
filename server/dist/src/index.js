"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./db/database");
const auth_1 = require("./routes/auth");
const stats_1 = require("./routes/stats");
const gameHandler_1 = require("./socket/gameHandler");
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Initialize DB (creates tables if missing)
(0, database_1.getDatabase)().then(() => console.log('✅ Database initialized')).catch(console.error);
// API routes
app.use('/api/auth', auth_1.authRouter);
app.use('/api/stats', stats_1.statsRouter);
// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok' });
});
// Serve static frontend build if exists
// Burahin o i-comment out ito:
// const staticPath = path.resolve(__dirname, '../../client/dist');
// app.use(express.static(staticPath));
// app.get('*', (req: Request, res: Response) => {
//   res.sendFile(path.join(staticPath, 'index.html'));
// });
app.get('/', (req, res) => {
    res.send('Trivia Game Backend is Online!');
});
// Socket.IO setup
(0, gameHandler_1.registerSocketHandlers)(io);
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🚀 Server listening on http://localhost:${PORT}`);
});
