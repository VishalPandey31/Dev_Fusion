import mongoose from 'mongoose';

// REPLACE THIS STRING WITH YOUR EXACT CONNECTION STRING
const uri = "mongodb+srv://DevFusion:DevFusion3136@devfusion.owaq.mongodb.net/DevFusion?retryWrites=true&w=majority&appName=DevFusion";

async function testConnection() {
    console.log("Testing connection to:", uri.replace(/:([^@]+)@/, ':****@')); // Hide password in logs

    try {
        await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 });
        console.log("✅ SUCCESS! Connected to MongoDB.");
        console.log("ReadyState:", mongoose.connection.readyState);
        await mongoose.disconnect();
    } catch (err) {
        console.error("❌ FAILED to connect.");
        console.error("Error Name:", err.name);
        console.error("Error Message:", err.message);
        if (err.name === 'MongoServerError' && err.code === 8000) {
            console.error("Reason: Bad Authentication (Wrong Username or Password)");
        }
    }
}

testConnection();
