import mongoose from 'mongoose';
import User from './models/user.model.js';
import dotenv from 'dotenv';
import connect from './db/db.js';

dotenv.config();

const email = process.argv[2];

if (!email) {
    console.error("Please provide an email address: node verify-admin.js <email>");
    process.exit(1);
}

connect().then(async () => {
    try {
        const user = await User.findOne({ email });
        if (!user) {
            console.error("User not found: " + email);
            process.exit(1);
        }

        if (!user.isAdmin) {
            console.error("User is not an Admin");
            process.exit(1);
        }

        user.isVerifiedAdmin = true;
        await user.save();

        console.log(`SUCCESS: Admin ${email} has been MANUALLY VERIFIED.`);
        process.exit(0);

    } catch (err) {
        console.error(err);
        process.exit(1);
    }
});
