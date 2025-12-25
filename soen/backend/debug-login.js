import mongoose from 'mongoose';
import User from './models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

const email = "test@1gmail.com"; // The email from the screenshot

const checkLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/devFusion");
        console.log("MongoDB Connected");

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log(`User ${email} NOT FOUND in database.`);
        } else {
            console.log(`User ${email} FOUND.`);
            console.log(`Is Admin: ${user.isAdmin}`);
            // We won't check password hash programmatically here to avoid complexity, 
            // but finding the user confirms DB is reachable and user exists.
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await mongoose.connection.close();
    }
};

checkLogin();
