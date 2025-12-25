import mongoose from 'mongoose';
import User from './models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

const email = process.argv[2];

if (!email) {
    console.log("Usage: node create-admin.js <email>");
    process.exit(1);
}

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || "mongodb://127.0.0.1:27017/devFusion"); // Fallback if env not set
        console.log("MongoDB Connected");
    } catch (err) {
        console.error("DB Connection Error:", err.message);
        process.exit(1);
    }
};

const makeAdmin = async () => {
    await connectDB();
    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.log(`User with email ${email} not found.`);
            process.exit(1);
        }

        user.isAdmin = true;
        await user.save();
        console.log(`Success: User ${email} is now an Administrator.`);
    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
};

makeAdmin();
