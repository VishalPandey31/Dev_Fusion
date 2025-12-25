import mongoose from 'mongoose';
import User from './models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

const email = "vishal@gmail.com";
const password = "password";

const fixUser = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb://0.0.0.0:27017/devFusion";
        await mongoose.connect(uri);
        console.log("Connected.");

        let user = await User.findOne({ email });
        if (!user) {
            console.log("Creating vishal@gmail.com...");
            user = await User.create({
                email,
                password,
                isAdmin: true,
                isApproved: true
            });
            console.log("Created, promoted, and approved.");
        } else {
            console.log("User exists. Updating...");
            user.isAdmin = true;
            user.isApproved = true;
            await user.save();
            console.log("Updated.");
        }
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
};

fixUser();
