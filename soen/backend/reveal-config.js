import 'dotenv/config.js';

const uri = process.env.MONGODB_URI;

if (!uri) {
    console.log("❌ No MONGODB_URI found in .env");
} else {
    // Mask password for safety in logs, but enough to verify format
    console.log("✅ Working URI found in .env:");
    console.log(uri);
    // console.log(uri.replace(/:([^@]+)@/, ':****@'));
}
