import 'dotenv/config';
import fs from 'fs';

async function checkModels() {
    const key = process.env.GOOGLE_AI_KEY;
    if (!key) {
        console.error("No GOOGLE_AI_KEY found in .env");
        return;
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    try {
        console.log("Fetching models from:", url.replace(key, "HIDDEN_KEY"));
        const response = await fetch(url);
        const data = await response.json();

        let output = "";
        if (data.models) {
            output += "Available Models:\n";
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    output += `- ${m.name}\n`;
                }
            });
        } else {
            output += "Error/No models found: " + JSON.stringify(data, null, 2);
        }
        fs.writeFileSync('models_list.txt', output);
        console.log("Written to models_list.txt");
    } catch (error) {
        console.error("Request failed:", error);
    }
}

checkModels();
