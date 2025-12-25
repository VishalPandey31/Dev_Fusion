import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

async function listModels() {
    if (!process.env.GOOGLE_AI_KEY) {
        console.log("GOOGLE_AI_KEY is missing/empty");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
        // List models code or try gemini-1.0-pro
        const modelsToTest = ["gemini-flash-latest"];

        for (const modelName of modelsToTest) {
            // ... existing loop structure
            console.log(`Testing model: ${modelName}`);
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent("Hello via test script");
                console.log(`SUCCESS: ${modelName} worked! Response: ${result.response.text()}`);
                return;
            } catch (error) {
                console.log(`FAILED: ${modelName} - ${error.message}`);
            }
        }
    } catch (error) {
        console.error("Global error:", error);
    }
}

listModels();
