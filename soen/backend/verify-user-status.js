
import mongoose from 'mongoose';
import User from './models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

const email = 'vishal@gmail.com';

const checkUser = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB Connected");

        const user = await User.findOne({ email }).select('+password +adminPin');

        if (!user) {
            console.log(`User ${email} NOT FOUND.`);
        } else {
            console.log(`User Found: ${user.email}`);
            console.log(`isAdmin: ${user.isAdmin}`);
            console.log(`isVerifiedAdmin: ${user.isVerifiedAdmin}`);
            console.log(`isApproved: ${user.isApproved}`);
            console.log(`Has Password: ${!!user.password}`);
            console.log(`Has Admin PIN: ${!!user.adminPin}`);
            console.log(`Admin PIN Hash: ${user.adminPin ? user.adminPin.substring(0, 10) + '...' : 'NULL'}`);
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await mongoose.connection.close();
    }
};

checkUser();
