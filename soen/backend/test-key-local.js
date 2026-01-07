import 'dotenv/config';
import { GoogleGenerativeAI } from "@google/generative-ai";
const key = process.env.GOOGLE_AI_KEY;

if (!key) {
    console.error("❌ No GOOGLE_AI_KEY found in .env");
    process.exit(1);
}

async function testKey() {
    console.log("Testing Key:", key);
    try {
        const genAI = new GoogleGenerativeAI(key);
        const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
        const result = await model.generateContent("Say hello");
        console.log("✅ Key is WORKING!");
        console.log("Response:", result.response.text());
    } catch (error) {
        console.error("❌ Key FAILED.");
        console.error("Error:", error.message);
    }
}

testKey();
