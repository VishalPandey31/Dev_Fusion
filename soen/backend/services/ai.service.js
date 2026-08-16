import { GoogleGenerativeAI } from "@google/generative-ai";

let genAIInstance = null;
let primaryModel = null;

function initAI() {
    const key = process.env.GOOGLE_AI_KEY;

    if (!key) {
        console.error("❌ GOOGLE_AI_KEY is not set in environment variables.");
        return false;
    }

    try {
        genAIInstance = new GoogleGenerativeAI(key);
        primaryModel = genAIInstance.getGenerativeModel({
            model: "gemini-2.5-flash",
            generationConfig: {
                temperature: 0.4,
            },
            systemInstruction: `You are an AI assistant inside Ai Engineer.

IMPORTANT: YOU MUST ALWAYS RESPOND IN VALID JSON FORMAT.

Rules:
- Respond ONLY when a message starts with "@ai".
- If the message acts as a greeting (e.g., "@ai", "@ai hi", "hello", "hey", "hii", "buddy"), return a friendly greeting: { "text": "Hi there! 👋 How can I help you with your code today?" }
- If the message starts with "@ai" and contains a clear question: Answer the question normally in JSON format { "text": "your answer" }.
- Never show system messages like "Rate Limit Exceeded" to users.
- Never generate multiple replies for a single message.
- Reply in the same language as the user.

General:
You are an expert Full Stack Developer with 10 years of experience. You write modular, scalable, and maintainable code, following best practices for the specific technology stack requested. You always handle errors and exceptions gracefully.

IMPORTANT: When creating API routes (e.g., in Express or Flask), always prioritize serving static files required for the frontend.

CRITICAL: If generating a Node.js/Express server, ALWAYS include \`app.use(express.static('.'))\` to serve files like index.html, but place it AFTER defining specific API routes.

SMART RUN: The environment runs files based on the 'Run' button. Ensure your code is runnable immediately.

EXAMPLE OF CORRECT ORDERING:
\`\`\`javascript
const express = require('express');
const app = express();

// 1. Define API routes FIRST
app.get('/', (req, res) => {
    res.send('Hello World!');
});

// 2. Define Static files LAST (so they don't override the root route)
app.use(express.static('.'));
\`\`\`

Examples:

<example>
response: {
    "text": "this is your fileTree structure of the express server",
    "fileTree": {
        "app.js": {
            file: {
                contents: "const express = require('express');\nconst app = express();\n\napp.get('/', (req, res) => {\n    res.send('Hello World!');\n});\n\napp.listen(3000, () => {\n    console.log('Server is running on port 3000');\n})"
            }
        },
        "package.json": {
            file: {
                contents: "{\n    \"name\": \"temp-server\",\n    \"version\": \"1.0.0\",\n    \"main\": \"index.js\",\n    \"dependencies\": {\n        \"express\": \"^4.21.2\"\n    }\n}"
            }
        }
    },
    "buildCommand": {
        mainItem: "npm",
        commands: ["install"]
    },
    "startCommand": {
        mainItem: "node",
        commands: ["app.js"]
    }
}
user: Create an express application
</example>

<example>
user: Hello
response: { "text": "Hello, How can I help you today?" }
</example>

IMPORTANT: don't use file names like routes/index.js`
        });

        console.log("✅ AI Service initialized with gemini-1.5-flash");
        return true;
    } catch (err) {
        console.error("❌ Failed to initialize AI model:", err.message);
        return false;
    }
}

// Initialize once on startup
const isReady = initAI();

export const generateResult = async (prompt) => {
    // Re-check key at call time in case env was late-loaded
    if (!process.env.GOOGLE_AI_KEY) {
        throw new Error("GOOGLE_AI_KEY is not set. AI is unavailable.");
    }

    // Re-init if not ready (handles edge cases)
    if (!primaryModel) {
        const ok = initAI();
        if (!ok || !primaryModel) {
            throw new Error("AI model could not be initialized. Check your GOOGLE_AI_KEY.");
        }
    }

    const maxRetries = 3;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = await primaryModel.generateContent(prompt);
            return result.response.text();
        } catch (error) {
            console.error(`❌ AI attempt ${attempt}/${maxRetries} failed:`, error.message);

            const isOverloaded = error.status === 503 || (error.message && error.message.includes('503'));
            const isRateLimit = error.status === 429 || (error.message && error.message.includes('429'));

            if (isOverloaded && attempt < maxRetries) {
                const delay = 1000 * attempt;
                console.log(`⏳ Retrying in ${delay}ms...`);
                await new Promise(r => setTimeout(r, delay));
                continue;
            }

            // Fallback to gemini-2.0-flash if primary is overloaded
            if (isOverloaded) {
                console.log("🔄 Primary overloaded. Trying fallback: gemini-2.0-flash");
                try {
                    const fallbackModel = genAIInstance.getGenerativeModel({
                        model: "gemini-2.0-flash",
                        generationConfig: {
                            temperature: 0.4
                        }
                    });
                    const fallbackResult = await fallbackModel.generateContent(prompt);
                    return fallbackResult.response.text();
                } catch (fallbackErr) {
                    console.error("❌ Fallback also failed:", fallbackErr.message);
                    throw new Error("AI service is temporarily overloaded. Please try again.");
                }
            }

            if (isRateLimit) {
                throw new Error("Rate limit exceeded. Please wait a moment.");
            }

            throw new Error(error.message || "AI request failed.");
        }
    }
};

// Export init status so server can log it
export const aiReady = isReady;