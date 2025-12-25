import * as ai from '../services/ai.service.js';


let lastCall = 0;

export const getResult = async (req, res) => {
    if (Date.now() - lastCall < 2000) {
        return res.status(429).send("Please wait a moment before asking again.");
    }
    lastCall = Date.now();

    try {
        const { prompt } = req.query;
        const result = await ai.generateResult(prompt);
        res.send(result);
    } catch (error) {
        console.error("AI Error:", error);
        // Rule: Never show system messages, reply politely
        if (error.status === 429 || error.message.includes('429') || error.message.includes('Quota exceeded')) {
            return res.status(429).send("Please wait a moment before sending another request.");
        }
        res.status(500).send({ message: "Please wait a moment before sending another request." });
    }
}