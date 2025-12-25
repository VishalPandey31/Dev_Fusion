import 'dotenv/config';
import { generateResult } from './services/ai.service.js';

async function testAiResponse() {
    console.log("Starting AI test...");
    const start = Date.now();

    const prompt = "Hi";
    const maxAttempts = 2;
    let attempts = 0;

    try {
        while (attempts < maxAttempts) {
            try {
                console.log(`Attempt ${attempts + 1} at ${(Date.now() - start) / 1000}s`);
                const result = await generateResult(prompt);
                console.log("Success!");
                console.log("Result:", result);
                break;
            } catch (err) {
                console.log(`Error on attempt ${attempts + 1}:`, err.message);
                attempts++;
                if (err.message && (err.message.includes('429') || err.message.includes('Quota exceeded'))) {
                    if (attempts < maxAttempts) {
                        console.log("Retrying in 5s...");
                        await new Promise(resolve => setTimeout(resolve, 5000));
                        continue;
                    }
                }
                throw err;
            }
        }
    } catch (finalError) {
        console.error("Final Error after logic:", finalError.message);
    }

    console.log(`Total duration: ${(Date.now() - start) / 1000}s`);
}

testAiResponse();
