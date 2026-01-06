import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config.js';

async function listModels() {
    console.log("Listing Models...");
    const key = process.env.GOOGLE_AI_KEY;

    try {
        // We can't list models directly with the SDK easily in older versions, 
        // but let's try a direct fetch if the SDK fails, or assume the SDK has a way.
        // Actually the SDK doesn't expose ListModels easily in the high-level API.
        // So we will use the direct REST API via fetch.

        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        console.log("Fetching:", url.replace(key, "HIDDEN_KEY"));

        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log("AVAILABLE MODELS:");
            data.models.forEach(m => console.log("- " + m.name));
        } else {
            console.log("NO MODELS FOUND. Response:");
            console.log(JSON.stringify(data, null, 2));
        }

    } catch (error) {
        console.log("FAILED to list models.");
        console.log("MSG:", error.message);
    }
}

listModels();
