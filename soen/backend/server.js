import 'dotenv/config.js';
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';
import aiRoutes from './routes/ai.routes.js';
import adminRoutes from './routes/admin.routes.js';
import { generateResult } from './services/ai.service.js';

const app = express();


// Middleware
app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const PORT = 5000; // Hardcoded to separate from frontend port 3000

app.get('/', (req, res) => {
    res.send('SERVER IS LIVE');
});

app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/ai', aiRoutes);
app.use('/admin', adminRoutes);

app.get('/test-db', (req, res) => {
    res.json({
        message: 'TEST ROUTE WORKING',
        dbStatus: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'
    });
});

// 🚀 CRITICAL FIX: LISTEN FIRST, CONNECT LATER
// This ensures Cloud Run sees the server as "healthy" immediately.
// 🚀 CRITICAL FIX: LISTEN FIRST, CONNECT LATER
// This ensures Cloud Run sees the server as "healthy" immediately.
import http from 'http';
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import projectModel from './models/project.model.js';

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: '*',
        methods: ["GET", "POST"]
    }
});

import messageModel from './models/message.model.js';

io.use(async (socket, next) => {
    try {
        const token = socket.handshake.auth?.token || socket.handshake.headers.authorization?.split(' ')[1];
        const projectId = socket.handshake.query.projectId;

        if (!token) {
            return next(new Error('Authentication error'));
        }

        const project = await projectModel.findById(projectId);
        socket.project = project;

        if (!project) {
            return next(new Error('Project not found'));
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (!decoded) {
            return next(new Error('Authentication error'));
        }


        socket.user = decoded;

        next();
    } catch (error) {
        next(error);
    }
})

io.on('connection', socket => {
    socket.roomId = socket.project._id.toString();

    console.log('a user connected');

    socket.join(socket.roomId);

    socket.on('project-message', async data => {
        const message = data.message;

        const aiIsPresentInMessage = message.includes('@ai');
        socket.broadcast.to(socket.roomId).emit('project-message', data)

        // SAVE USER MESSAGE TO DB
        try {
            await messageModel.create({
                projectId: socket.project._id,
                sender: data.sender, // { _id, email }
                message: message,
                timestamp: data.timestamp || new Date()
            });
        } catch (err) {
            console.error("Failed to save user message:", err);
        }

        if (aiIsPresentInMessage) {


            const prompt = message.replace('@ai', '');

            try {
                const result = await generateResult(prompt);

                const aiMessageData = {
                    message: result,
                    sender: {
                        _id: 'ai',
                        email: 'AI'
                    },
                    timestamp: new Date()
                };

                io.to(socket.roomId).emit('project-message', aiMessageData);

                // SAVE AI MESSAGE TO DB
                await messageModel.create({
                    projectId: socket.project._id,
                    sender: aiMessageData.sender,
                    message: aiMessageData.message,
                    timestamp: aiMessageData.timestamp
                });

            } catch (error) {
                console.error("AI Generation failed:", error.message);
                io.to(socket.roomId).emit('project-message', {
                    message: "AI is currently unavailable (Missing API Key or Error). Please contact Admin.",
                    sender: { _id: 'ai', email: 'AI' },
                    timestamp: new Date()
                });
            }

            return;
        }


    });

    socket.on('disconnect', () => {
        console.log('user disconnected');
        socket.leave(socket.roomId);
    });
});

server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
    console.log("Registered Routes:");
    console.log("  POST /users/admin-login");
    // Print all registered routes for debugging
    app._router.stack.forEach(r => {
        if (r.route && r.route.path) {
            console.log(r.route.path)
        } else if (r.name === 'router') {
            // We can't easily retrieve the path prefix from the regex here without internal hacking
            // but we can at least see if routers are mounted
            console.log(`  [Router mounted] ${r.regexp}`);
        }
    })

    // Try connecting to MongoDB *after* server starts
    const uri = process.env.MONGODB_URI;
    if (uri) {
        console.log("Attempting MongoDB connection...");
        mongoose.connect(uri)
            .then(() => console.log('MongoDB Connected Successfully'))
            .catch(err => console.error('MongoDB Connection Failed (Server still running):', err.message));
    } else {
        console.error("⚠️ MONGODB_URI is missing in environment variables!");
    }
});
