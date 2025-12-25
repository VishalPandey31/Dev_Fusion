import mongoose from 'mongoose';
import User from './models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

// We need to approve 'vishal@gmail.com' and 'test@1gmail.com'
const emails = ["vishal@gmail.com", "test@1gmail.com"];

const approveUsers = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb://0.0.0.0:27017/devFusion";
        await mongoose.connect(uri);
        console.log("MongoDB Connected");

        for (const email of emails) {
            let user = await User.findOne({ email });
            if (user) {
                user.isApproved = true;
                await user.save();
                console.log(`User ${email} approved.`);
            } else {
                console.log(`User ${email} not found.`);
            }
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await mongoose.connection.close();
    }
};

approveUsers();
