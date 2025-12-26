
import dotenv from 'dotenv';
dotenv.config();

console.log("Checking Environment Variables...");
if (process.env.GOOGLE_AI_KEY) {
    console.log("GOOGLE_AI_KEY Found:", process.env.GOOGLE_AI_KEY.substring(0, 5) + "..." + process.env.GOOGLE_AI_KEY.substring(process.env.GOOGLE_AI_KEY.length - 3));
    console.log("Length:", process.env.GOOGLE_AI_KEY.length);
} else {
    console.log("GOOGLE_AI_KEY is MISSING in process.env");
}
