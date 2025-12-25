import 'dotenv/config';
import mongoose from 'mongoose';

const uri = process.env.MONGODB_URI;

console.log("---------------------------------------------------");
console.log("Testing MongoDB Connection...");
console.log(`URI defined: ${!!uri}`);
if (uri) {
    // Masking credentials for security in logs
    console.log(`URI: ${uri.replace(/:([^@]+)@/, ':****@')}`);
} else {
    console.error("ERROR: MONGODB_URI is not defined in .env");
    process.exit(1);
}
console.log("---------------------------------------------------");

mongoose.connect(uri)
    .then(() => {
        console.log("✅ SUCCESS: Connected to MongoDB!");
        console.log("Connection State:", mongoose.connection.readyState);
        // List collections to be 100% sure
        return mongoose.connection.db.listCollections().toArray();
    })
    .then((collections) => {
        console.log("Available Collections:");
        collections.forEach(c => console.log(` - ${c.name}`));
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ FAILED: Could not connect to MongoDB.");
        console.error("Error Name:", err.name);
        console.error("Error Message:", err.message);
        if (err.cause) console.error("Cause:", err.cause);
        process.exit(1);
    });
