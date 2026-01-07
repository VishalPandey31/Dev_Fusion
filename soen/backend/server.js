import 'dotenv/config.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

// Routes
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import adminRoutes from './routes/admin.routes.js';

// Models & Services
import projectModel from './models/project.model.js';
import messageModel from './models/message.model.js';
import sessionModel from './models/session.model.js';
import { generateResult } from './services/ai.service.js';

const app = express();
// Trigger restart


// Crash Logging
import fs from 'fs';
process.on('uncaughtException', (err) => {
    fs.appendFileSync('crash.log', `[${new Date().toISOString()}] Uncaught Exception: ${err.message}\n${err.stack}\n`);
    console.error('Uncaught Exception:', err);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    fs.appendFileSync('crash.log', `[${new Date().toISOString()}] Unhandled Rejection: ${reason}\n`);
    console.error('Unhandled Rejection:', reason);
    // Don't exit on rejection, but nice to know
});

/* =======================
   MIDDLEWARES
======================= */
app.use(cors({
    origin: [
        'http://localhost:5173',
        'https://devfusion-auto-8049.surge.sh',
        'https://vishal-dev-fusion.surge.sh'
    ],
    credentials: true
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

/* =======================
   ROUTES
======================= */
app.get('/', (req, res) => {
    res.send('SERVER IS LIVE');
});

app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);
app.use('/admin', adminRoutes);

app.get('/test-db', (req, res) => {
    const states = {
        0: 'disconnected',
        1: 'connected',
        2: 'connecting',
        3: 'disconnecting',
        99: 'uninitialized',
    };
    res.json({
        message: 'TEST ROUTE WORKING',
        dbState: states[mongoose.connection.readyState] || 'unknown',
        readyState: mongoose.connection.readyState,
        host: mongoose.connection.host,
        dbName: mongoose.connection.name
    });
});

/* =======================
   HTTP + SOCKET SERVER
======================= */
const server = http.createServer(app);

const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ['GET', 'POST']
    }
});

/* =======================
   SOCKET AUTH MIDDLEWARE
======================= */
io.use(async (socket, next) => {
    try {
        const token =
            socket.handshake.auth?.token ||
            socket.handshake.headers.authorization?.split(' ')[1];

        const projectId = socket.handshake.query.projectId;

        if (!token || !projectId) {
            return next(new Error('Authentication error'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        if (!decoded) {
            return next(new Error('Invalid token'));
        }

        const project = await projectModel.findById(projectId);
        if (!project) {
            return next(new Error('Project not found'));
        }

        socket.user = decoded;
        socket.project = project;
        next();
    } catch (error) {
        next(error);
    }
});

/* =======================
   SOCKET EVENTS
======================= */
io.on('connection', async (socket) => {
    console.log('User connected');

    const roomId = socket.project._id.toString();
    socket.join(roomId);

    let sessionId = null;

    // START SESSION
    try {
        const session = await sessionModel.create({
            projectId: socket.project._id,
            userId: socket.user._id || socket.user.id,
            loginTime: new Date()
        });
        sessionId = session._id;
    } catch (err) {
        console.error('Session creation failed:', err.message);
    }

    socket.on('project-message', async (data) => {
        const message = data.message || '';

        socket.broadcast.to(roomId).emit('project-message', data);

        // Save user message
        try {
            await messageModel.create({
                projectId: socket.project._id,
                sender: data.sender,
                message,
                timestamp: data.timestamp || new Date()
            });
        } catch (err) {
            console.error('Message save failed:', err.message);
        }

        // AI mention
        if (message.includes('@ai')) {
            console.log('🤖 AI Mention detected:', message);
            const prompt = message.replace('@ai', '').trim();
            console.log('🤖 Sending prompt to AI service:', prompt);

            try {
                const result = await generateResult(prompt);
                console.log('🤖 AI Result received:', result.substring(0, 50) + '...');

                const aiMessage = {
                    message: result,
                    sender: { _id: 'ai', email: 'AI' },
                    timestamp: new Date()
                };

                io.to(roomId).emit('project-message', aiMessage);
                console.log('🤖 AI Message emitted to room:', roomId);

                await messageModel.create({
                    projectId: socket.project._id,
                    sender: aiMessage.sender,
                    message: aiMessage.message,
                    timestamp: aiMessage.timestamp
                });
                console.log('🤖 AI Message saved to DB');

            } catch (error) {
                console.error('❌ AI Error in socket handler:', error.message);
                console.error(error.stack);
                io.to(roomId).emit('project-message', {
                    message: 'AI is currently unavailable.',
                    sender: { _id: 'ai', email: 'AI' },
                    timestamp: new Date()
                });
            }
        }
    });

    socket.on('disconnect', async () => {
        console.log('User disconnected');
        socket.leave(roomId);

        // END SESSION
        if (sessionId) {
            try {
                const session = await sessionModel.findById(sessionId);
                if (session) {
                    const logoutTime = new Date();
                    const duration = (logoutTime - session.loginTime) / 1000;

                    await sessionModel.findByIdAndUpdate(sessionId, {
                        logoutTime,
                        duration
                    });
                }
            } catch (err) {
                console.error('Session close failed:', err.message);
            }
        }
    });
});


/* =======================
   SERVER START (CLOUD RUN)
======================= */
// MongoDB connect BEFORE server starts
const PORT = process.env.PORT || 3000;
const mongoUri = process.env.MONGODB_URI;

if (!mongoUri) {
    console.error('⚠️ MONGODB_URI is missing! Server cannot start.');
    process.exit(1);
}

// Connection Events
mongoose.connection.on('connected', () => {
    console.log('Mongoose connected to DB Cluster');
});

mongoose.connection.on('error', (err) => {
    console.error('Mongoose connection error:', err.message);
});

mongoose.connection.on('disconnected', () => {
    console.log('Mongoose Disconnected');
});

const connectDB = async () => {
    try {
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000 // Keep this short for fail-fast
        });
        console.log('✅ MongoDB Connected');
        startServer();
    } catch (err) {
        console.error('❌ MongoDB Connection Error:', err.message);
        process.exit(1);
    }
};

const startServer = () => {
    server.listen(PORT, '0.0.0.0', () => {
        console.log(`Server running on port ${PORT}`);
    });
};

connectDB();

