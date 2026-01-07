import 'dotenv/config.js';

const key = process.env.GOOGLE_AI_KEY;

if (!key) {
    console.log("❌ No GOOGLE_AI_KEY found in .env");
} else {
    console.log("✅ GOOGLE_AI_KEY found:");
    console.log(key);
}
