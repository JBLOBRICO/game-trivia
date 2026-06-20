"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./db/database");
const auth_1 = require("./routes/auth");
const stats_1 = require("./routes/stats");
const gameHandler_1 = require("./socket/gameHandler");
// Load env variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const server = http_1.default.createServer(app);
const io = new socket_io_1.Server(server, {
    cors: {
        origin: '*', // Allow all origins for dev simplicity, can refine in prod
        methods: ['GET', 'POST']
    }
});
const PORT = process.env.PORT || 5000;
// Middleware
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.authRouter);
app.use('/api/stats', stats_1.statsRouter);
// Serve static assets in production
const clientBuildPath = path_1.default.join(__dirname, '../client/dist');
app.use(express_1.default.static(clientBuildPath));
app.get('*', (req, res) => {
    // If request falls through, send back React app
    if (!req.path.startsWith('/api')) {
        res.sendFile(path_1.default.join(clientBuildPath, 'index.html'));
    }
    else {
        res.status(404).json({ error: 'API endpoint not found' });
    }
});
// Boot Database and start listening
async function bootstrap() {
    try {
        console.log('Connecting to SQLite Database...');
        await (0, database_1.getDatabase)();
        console.log('Database connected and schemas verified.');
        (0, gameHandler_1.registerSocketHandlers)(io);
        console.log('Socket.IO event handlers registered.');
        server.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to bootstrap server:', error);
        process.exit(1);
    }
}
bootstrap();
