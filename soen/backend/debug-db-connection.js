
import mongoose from 'mongoose';
import 'dotenv/config.js';

const uri = process.env.MONGODB_URI;

console.log("Testing connection...");

if (!uri) {
    console.error("❌ MONGODB_URI is missing in .env");
    process.exit(1);
}

mongoose.connect(uri)
    .then(() => {
        console.log("✅ MongoDB Connection Successful!");
        console.log("Database Name:", mongoose.connection.name);
        console.log("Host:", mongoose.connection.host);
        process.exit(0);
    })
    .catch((err) => {
        console.error("❌ MongoDB Connection Failed:");
        console.error(err.message);
        process.exit(1);
    });
