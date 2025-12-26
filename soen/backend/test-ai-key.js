
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from 'dotenv';
dotenv.config();

const run = async () => {
    console.log("Testing Gemini API...");
    if (!process.env.GOOGLE_AI_KEY) {
        console.error("GOOGLE_AI_KEY missing!");
        return;
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_KEY);
        // Using same model as in ai.service.js
        const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

        const prompt = "Hello, tell me a joke.";
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();
        console.log("Success! Response:", text);

    } catch (error) {
        console.error("API Error:", error.message);
        if (error.response) {
            console.error("Details:", JSON.stringify(error.response, null, 2));
        }
    }
}

run();
