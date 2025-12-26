
import mongoose from 'mongoose';
import User from './models/user.model.js';
import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
dotenv.config();

const email = 'vishal@gmail.com';
const newPin = '12345678';
const newPassword = 'password123'; // Optional: Reset password too to be sure

const resetCreds = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Connected");

        const user = await User.findOne({ email });

        if (!user) {
            console.log(`User ${email} NOT FOUND.`);
            process.exit(1);
        }

        const hashedPin = await bcrypt.hash(newPin, 10);
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.adminPin = hashedPin;
        user.password = hashedPassword;

        await user.save();
        console.log(`Success: Updated PIN to '${newPin}' and Password to '${newPassword}' for ${email}`);

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await mongoose.connection.close();
    }
};

resetCreds();
