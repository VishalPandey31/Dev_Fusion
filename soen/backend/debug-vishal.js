import mongoose from 'mongoose';
import User from './models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

const email = "vishal@gmail.com";

const debugUser = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb://0.0.0.0:27017/devFusion";
        await mongoose.connect(uri);
        console.log("Connected.");

        const user = await User.findOne({ email });
        if (!user) {
            console.log("User NOT FOUND.");
        } else {
            console.log("User found.");
            console.log("isAdmin:", user.isAdmin);
            console.log("isApproved:", user.isApproved);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
};

debugUser();
