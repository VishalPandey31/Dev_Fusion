import mongoose from 'mongoose';
import User from './models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

const email = "vishal@gmail.com";

const checkAdminStatus = async () => {
    try {
        // Log the URI being used (masking password if present)
        const uri = process.env.MONGODB_URI || "mongodb://0.0.0.0:27017/devFusion";
        console.log("Connecting to:", uri.replace(/:\/\/.*@/, '://***@'));

        await mongoose.connect(uri);
        console.log("Connected to DB.");

        const user = await User.findOne({ email });
        if (!user) {
            console.log("User NOT FOUND.");
        } else {
            console.log(`User: ${user.email}`);
            console.log(`isAdmin: ${user.isAdmin}`);
            console.log(`isVerifiedAdmin: ${user.isVerifiedAdmin}`);
            console.log(`_id: ${user._id}`);

            // Force update
            console.log("Force verifying admin...");
            user.isAdmin = true;
            user.isVerifiedAdmin = true; // Crucial for new rigorous logic
            await user.save();
            console.log("Verified and Promoted.");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.connection.close();
    }
};

checkAdminStatus();
