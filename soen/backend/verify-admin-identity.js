import mongoose from 'mongoose';
import User from './models/user.model.js';
import dotenv from 'dotenv';
dotenv.config();

const email = process.argv[2];

if (!email) {
    console.log("Usage: node verify-admin.js <email>");
    process.exit(1);
}

const verifyAdmin = async () => {
    try {
        const uri = process.env.MONGODB_URI || "mongodb://0.0.0.0:27017/devFusion";
        await mongoose.connect(uri);
        console.log("Connected.");

        const user = await User.findOne({ email });
        if (!user) {
            console.log("User not found.");
            return;
        }

        console.log(`Verifying Admin: ${user.email}`);
        console.log(`Identity Proof Path: ${user.identityProof}`);

        user.isVerifiedAdmin = true;
        user.isApproved = true; // Also approve login
        await user.save();

        console.log("Admin Verified Successfully.");

    } catch (err) {
        console.error(err);
    } finally {
        await mongoose.connection.close();
    }
};

verifyAdmin();
