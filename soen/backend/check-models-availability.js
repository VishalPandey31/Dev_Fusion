import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    if (!process.env.GOOGLE_AI_KEY) {
        console.error("GOOGLE_AI_KEY missing!");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
        // List models
        // Note: SDK might not expose listModels directly on genAI instance depending on version, 
        // but typically it's a manager method. 
        // Actually, looking at docs, it's usually via API or specific calls. 
        // Let's try to just get a model and run it, or if there is a list method.
        // For @google/generative-ai, we can typically rely on known models.
        // But let's verify if `gemini-1.5-flash` works or `gemini-pro` works.

        console.log("Checking gemini-1.5-flash...");
        try {
            const model1 = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const res1 = await model1.generateContent("Test");
            console.log("gemini-1.5-flash is AVAILABLE.");
        } catch (e) {
            console.log("gemini-1.5-flash FAILED: " + e.message);
        }

        console.log("Checking gemini-pro...");
        try {
            const model2 = genAI.getGenerativeModel({ model: "gemini-pro" });
            const res2 = await model2.generateContent("Test");
            console.log("gemini-pro is AVAILABLE.");
        } catch (e) {
            console.log("gemini-pro FAILED: " + e.message);
        }

        console.log("Checking gemini-flash-latest...");
        try {
            // This was used previously
            const model3 = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
            const res3 = await model3.generateContent("Test");
            console.log("gemini-flash-latest is AVAILABLE.");
        } catch (e) {
            console.log("gemini-flash-latest FAILED: " + e.message);
        }

    } catch (error) {
        console.error("General Error:", error);
    }
}

run();
