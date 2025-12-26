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

        let user = await User.findOne({ email });
        if (!user) {
            console.log("User NOT FOUND. Creating new Admin user...");
            const bcrypt = await import('bcrypt');
            const hashedPassword = await bcrypt.hash("password123", 10);
            const hashedPin = await bcrypt.hash("12345678", 10);

            user = await User.create({
                email,
                password: hashedPassword,
                isAdmin: true,
                isApproved: true,
                isVerifiedAdmin: true,
                adminPin: hashedPin,
                status: 'APPROVED'
            });
            console.log("Admin User Created Successfully!");
        } else {
            console.log(`User: ${user.email}`);
            console.log(`isAdmin: ${user.isAdmin}`);
            console.log(`isVerifiedAdmin: ${user.isVerifiedAdmin}`);
            console.log(`_id: ${user._id}`);

            // Force update
            console.log("Force verifying admin...");
            user.isAdmin = true;
            user.isApproved = true;
            user.isVerifiedAdmin = true;

            // RESET CREDENTIALS
            const bcrypt = await import('bcrypt');
            user.password = await bcrypt.hash("password123", 10);
            user.adminPin = await bcrypt.hash("12345678", 10);

            await user.save();
            console.log("Verified and Promoted.");
            console.log("New Password: password123");
            console.log("New PIN: 12345678");
        }
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await mongoose.connection.close();
    }
};

checkAdminStatus();
