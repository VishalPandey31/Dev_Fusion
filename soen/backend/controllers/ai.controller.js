import userModel from '../models/user.model.js';
import * as ai from '../services/ai.service.js';


let lastCall = 0;

export const getResult = async (req, res) => {
    if (Date.now() - lastCall < 2000) {
        return res.status(429).send("Please wait a moment before asking again.");
    }
    lastCall = Date.now();

    try {
        const { prompt } = req.query;
        let finalPrompt = prompt;

        // Feature 2: User Preference Memory
        // Fetch fresh user data to get preferences
        if (req.user && (req.user.id || req.user._id)) {
            const userId = req.user.id || req.user._id;
            const user = await userModel.findById(userId);

            if (user && user.preferences) {
                const { preferredStack, codeStyle, language } = user.preferences;
                const langInstruction = language === 'Hinglish'
                    ? "Reply in a mix of Hindi and English (Hinglish) as if explaining to an Indian friend. Keep technical terms in English."
                    : "Reply in standard English.";

                const prefString = `\n\n[System Note: User Preference - Stack: ${preferredStack || 'Standard'}, Style: ${codeStyle || 'Standard'}. ${langInstruction} Please adapt code output accordingly.]`;
                finalPrompt += prefString;
            }
        }

        const result = await ai.generateResult(finalPrompt);
        res.send(result);
    } catch (error) {
        console.error("AI Error:", error);
        if (error.status === 429 || error.message.includes('429') || error.message.includes('Quota exceeded')) {
            return res.status(429).send("Please wait a moment before sending another request.");
        }
        res.status(500).send({ message: error.message || "Internal Server Error" });
    }
}

export const generateCodeFeedback = async (req, res) => {
    try {
        const { code } = req.body;
        if (!code) return res.status(400).send("No code provided");

        let prompt = `
        You are an expert coding tutor. Analyze the following code for a beginner developer.
        1. Rate it as "Beginner", "Intermediate", or "Advanced".
        2. Provide exactly 3 short, actionable improvement tips.

        Format your response as a valid JSON object with NO extra text:
        {
            "rating": "Beginner | Intermediate | Advanced",
            "tips": ["Tip 1...", "Tip 2...", "Tip 3..."]
        }

        Code to analyze:
        ${code.substring(0, 5000)}
        `;

        // Fetch User Preference for Language
        let targetLanguage = req.body.language || 'English';

        // Fallback to user prefs if not provided in body
        if (!req.body.language && req.user && (req.user.id || req.user._id)) {
            const userId = req.user.id || req.user._id;
            const user = await userModel.findById(userId);
            if (user && user.preferences) {
                targetLanguage = user.preferences.language || 'English';
            }
        }

        if (targetLanguage === 'Hinglish') {
            prompt += `\n\n[IMPORTANT: Write the 'tips' in Hinglish (Hindi+English mix) in a friendly "Bhai" style. Start explanation with "Dekh bhai..." if possible. Keep 'rating' in English.]`;
        }

        const result = await ai.generateResult(prompt);
        console.log("DEBUG: Raw AI Response:", result);

        // Sanitize: Attempt to extract JSON object using regex
        const jsonMatch = result.match(/\{[\s\S]*\}/);
        const cleanResult = jsonMatch ? jsonMatch[0] : result.replace(/\\\`\\\`\\\`json\\n?|\\\`\\\`\\\`/g, '').trim();

        const jsonResponse = JSON.parse(cleanResult);

        res.json(jsonResponse);

    } catch (error) {
        console.error("AI Feedback Error:", error);
        if (error.status === 429 || error.message.includes('429')) {
            return res.status(429).send("Too many requests. Please wait.");
        }
        res.status(500).send(error.message || "Failed to generate feedback");
    }
}

import ErrorLog from '../models/errorLog.model.js';

export const getSmartFix = async (req, res) => {
    try {
        const { errorMessage } = req.body;
        if (!errorMessage) return res.status(400).send("Error message is required");

        // 1. Check Memory (DB)
        // We use a simple regex or exact match. For "Smart" matching, we'd need embeddings, but simple partial match is "safe" beginner feature.
        // Let's match if the log contains this error message.
        // Actually, to mimic "Recalling", exact match on the core error string is best.
        // We also check for correct language match
        let targetLanguage = req.body.language || 'English';
        if (!req.body.language && req.user && req.user.preferences) {
            targetLanguage = req.user.preferences.language || 'English';
        }

        const cachedError = await ErrorLog.findOne({ errorMessage: errorMessage, language: targetLanguage });

        if (cachedError) {
            // Update frequency
            cachedError.frequency += 1;
            cachedError.lastOccurred = Date.now();
            await cachedError.save();

            // Self-healing: Check if cached suggestion is raw JSON and clean it
            let cleanFix = cachedError.fixSuggestion;
            if (cleanFix.trim().startsWith('{') || cleanFix.includes('```json')) {
                try {
                    const jsonMatch = cleanFix.match(/\{[\s\S]*\}/);
                    const jsonStr = jsonMatch ? jsonMatch[0] : cleanFix.replace(/\\\`\\\`\\\`json\\n?|\\\`\\\`\\\`/g, '').trim();
                    const parsed = JSON.parse(jsonStr);
                    if (parsed.text) {
                        cleanFix = parsed.text;
                        // Update DB with clean version
                        cachedError.fixSuggestion = cleanFix;
                        await cachedError.save();
                    }
                } catch (e) {
                    console.warn("Failed to clean cached JSON:", e);
                }
            }

            return res.json({
                fix: cleanFix,
                source: "Memory (Recalled from past incidents)",
                frequency: cachedError.frequency
            });
        }

        // 2. Ask AI - FORCE simple text response or handle JSON structure
        let prompt = `
        You are an automated error fixer.
        Error Message: "${errorMessage}"
        
        Provide a concise solution/fix. 
        Format:
        1. Explanation (1-2 sentences)
        2. Code fix (if applicable)

        IMPORTANT: If you return JSON, ensure the "text" field contains the explanation and code.
        `;

        // Fetch User Preference for Language - ALREADY SET ABOVE
        // let targetLanguage = 'English'; 
        // Logic moved up to support cache check

        if (targetLanguage === 'Hinglish') {
            prompt += `\n\n[SYSTEM: You are a friendly senior developer ("Bhai"). Explain the solution in a conversational mix of Hindi and English (Hinglish). Start with "Dekh bhai..." or similar. Ensure the 'text' field in the JSON response contains this Hinglish explanation. Keep code and technical terms in English.]`;
        }

        const rawResult = await ai.generateResult(prompt);

        // 3. Parse Result if it's JSON
        let explanation = rawResult;
        try {
            const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
            const cleanResult = jsonMatch ? jsonMatch[0] : rawResult.replace(/\\\`\\\`\\\`json\\n?|\\\`\\\`\\\`/g, '').trim();
            const json = JSON.parse(cleanResult);
            if (json.text) {
                explanation = json.text;
            }
        } catch (e) {
            console.warn("Failed to parse Smart Fix JSON, using raw text:", e);
        }

        // 4. Save to Memory
        await ErrorLog.create({
            errorMessage: errorMessage,
            fixSuggestion: explanation,
            language: targetLanguage
        });

        res.json({
            fix: explanation,
            source: "AI (Generated fresh)"
        });

    } catch (error) {
        console.error("Smart Fix Error:", error);
        if (error.status === 429 || error.message.includes('429')) {
            return res.status(429).send("Too many requests. Please wait.");
        }
        res.status(500).send(error.message || "Failed to find a fix");
    }
}