import 'dotenv/config';
import http from 'http';
import express from 'express';
// import app from './app.js'; // Commented out
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import projectModel from './models/project.model.js';
import sessionModel from './models/session.model.js';
// import { generateResult } from './services/ai.service.js';

console.log('Imports successful so far');

import app from './app.js'; // This imports routes, db, etc.

console.log('App imported');

import { generateResult } from './services/ai.service.js';

console.log('AI Service imported');

const port = 3001;
const server = http.createServer(app);
server.listen(port, () => {
    console.log(`Test Server running on port ${port}`);
    process.exit(0);
});
