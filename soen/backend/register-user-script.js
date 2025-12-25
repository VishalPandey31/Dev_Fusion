import mongoose from 'mongoose';
import User from './models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

const email = "test@1gmail.com";
const password = "password"; // Default password for testing

const registerUser = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/devFusion");
        console.log("MongoDB Connected");

        let user = await User.findOne({ email });
        if (user) {
            console.log("User already exists.");
        } else {
            console.log("Creating new user...");
            user = await User.create({
                email,
                password,
                isAdmin: false // Will be promoted later
            });
            console.log("User created successfully.");
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await mongoose.connection.close();
    }
};

registerUser();
