import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

import userModel from './models/user.model.js';

const run = async () => {
    console.log("Connecting to MongoDB Atlas...");
    if (!process.env.MONGODB_URI) {
        console.error("❌ MONGODB_URI is missing in .env");
        return;
    }

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected successfully!");

        const email = "vishal@gmail.com";
        const newPassword = "password123";
        const newPin = "12345678";

        console.log(`Resetting credentials for: ${email}`);

        const user = await userModel.findOne({ email });

        if (!user) {
            console.error("❌ User not found!");
            return;
        }

        console.log("Found user:", user.email);

        user.password = newPassword; // Will be hashed by pre-save hook
        user.adminPin = await bcrypt.hash(newPin, 10);
        user.isAdmin = true;
        user.isVerifiedAdmin = true; // FORCE VERIFICATION
        user.isApproved = true;

        await user.save();

        console.log("\n✅ Credentials Updated Successfully!");
        console.log(`Email: ${email}`);
        console.log(`Password: ${newPassword}`);
        console.log(`Pin: ${newPin}`);
        console.log("Admin Verified: TRUE");

    } catch (error) {
        console.error("❌ Error:", error.message);
    } finally {
        await mongoose.disconnect();
    }
};

run();
