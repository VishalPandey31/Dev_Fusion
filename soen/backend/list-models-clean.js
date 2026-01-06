import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config.js';
import fs from 'fs';

async function listModels() {
    console.log("Listing Models...");
    const key = process.env.GOOGLE_AI_KEY;
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        let output = "";
        if (data.models) {
            output += "AVAILABLE MODELS:\n";
            data.models.forEach(m => {
                output += `Name: ${m.name}\n`;
                output += `SupportedMethods: ${JSON.stringify(m.supportedGenerationMethods)}\n`;
                output += "-------------------\n";
            });
        } else {
            output += "NO MODELS FOUND. error: " + JSON.stringify(data);
        }

        fs.writeFileSync('clean_models.txt', output);
        console.log("Done. Check clean_models.txt");

    } catch (error) {
        console.log("FAILED to list models:", error.message);
    }
}

listModels();
