import { GoogleGenerativeAI } from "@google/generative-ai";

// Using the key we found earlier
const key = "AIzaSyAtcRs7An5yJCyRSmbdDJzNS50GMxxPyNQ";

async function listModels() {
    console.log("Fetching available models...");
    try {
        const genAI = new GoogleGenerativeAI(key);
        // We use the model manager to list models
        // Note: In newer SDK versions, this might be accessed differently, 
        // but let's try the standard way first or a direct fetch if SDK hides it.

        // Actually, for specific debugging, let's try to just hit the API endpoint using fetch if SDK fails,
        // but let's try the SDK method first if it exists. 
        // Docs say: const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        // The error suggests checking ListModels. 
        // There isn't a direct helper in the main class always visible.

        // Let's try to infer from a raw fetch which is often more reliable for debugging 404s
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
        const data = await response.json();

        if (data.models) {
            console.log("✅ Available Models:");
            data.models.forEach(m => {
                if (m.name.includes("gemini")) {
                    console.log(`- ${m.name.replace('models/', '')}`);
                }
            });
        } else {
            console.log("❌ No models found in response:", data);
        }

    } catch (error) {
        console.error("❌ Failed to list models.");
        console.error("Error:", error.message);
    }
}

listModels();
