import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

import userModel from './models/user.model.js';
import projectModel from './models/project.model.js';

const run = async () => {
    console.log("Connecting to MongoDB Atlas...");
    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI is missing in .env");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected successfully!");

        console.log("\n--- USERS ---");
        const users = await userModel.find({}, 'email isAdmin isApproved');
        if (users.length === 0) console.log("No users found.");
        users.forEach(u => {
            console.log(`- ${u.email} [Admin: ${u.isAdmin}, Approved: ${u.isApproved}]`);
        });

        console.log("\n--- PROJECTS ---");
        const projects = await projectModel.find({}, 'name users');
        if (projects.length === 0) console.log("No projects found.");
        projects.forEach(p => {
            console.log(`- ${p.name} (Members: ${p.users.length})`);
        });

        console.log("\nDone.");

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

run();
