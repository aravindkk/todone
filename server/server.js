import { GoogleGenerativeAI } from '@google/generative-ai';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors({
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 100 });
app.use(limiter);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const TODONE_SYSTEM_INSTRUCTION = `You are Todone AI, a supportive productivity coach.
Your personality: Warm, brief, and actionable.
Guidelines:
- Keep responses under 3 sentences.
- Focus on small wins.
- When breaking down tasks, provide 2-5 concrete subtasks.
- Each subtask must be completable in under 1 hour`;

function getModel() {
    // Use gemini-2.5-flash as it is the most robust current model
    // Note: systemInstruction is passed but if it fails we might need to prepend manually.
    // Let's try prepending manually to be safe against older SDKs/Models.
    return genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 5000, // Increased to prevent truncation
            responseMimeType: "application/json"
        },
    });
}

// Endpoint: Evaluate task
app.post('/api/evaluate-task', async (req, res) => {
    try {
        const { taskDescription } = req.body;
        const model = getModel(); // Use standard config
        // Prepend system instruction
        const prompt = `${TODONE_SYSTEM_INSTRUCTION}\n\nEvaluate: "${taskDescription}"
Is this task specific and achievable in <1 hour?
Respond with JSON only:
{
  "isSpecific": boolean,
  "canCompleteInOneHour": boolean,
  "clarificationQuestion": "question if not specific",
  "suggestion": [
    {"description": "specific subtask 1", "estimatedMinutes": 30},
    {"description": "specific subtask 2", "estimatedMinutes": 45}
  ]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("Raw Gemini Response (Eval):", text); // Debug logging
        let jsonStr = text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        try {
            const data = JSON.parse(jsonStr);
            if (data.suggestion && !Array.isArray(data.suggestion)) { // Fix: ensure array
                data.suggestion = [{ description: data.suggestion, estimatedMinutes: 15 }];
            }
            res.json(data);
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.error("Failed Text:", text);
            throw new Error("Failed to parse JSON response");
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'Failed to evaluate task' });
    }
});

// Endpoint: Break down task
app.post('/api/break-down-task', async (req, res) => {
    try {
        const { taskDescription } = req.body;
        const model = getModel();
        const prompt = `${TODONE_SYSTEM_INSTRUCTION}\n\nThe user has this task: "${taskDescription}"

This task is too large. Break it down into 2-5 specific, actionable subtasks.
Each subtask must:
- Take less than 1 hour to complete
- Have a clear, measurable outcome

Respond with JSON only:
{
  "encouragement": "brief encouraging message",
  "subtasks": [
    {"description": "specific subtask 1", "estimatedMinutes": 30},
    {"description": "specific subtask 2", "estimatedMinutes": 45}
  ]
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("Raw Gemini Response:", text); // Debug logging
        let jsonStr = text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        try {
            res.json(JSON.parse(jsonStr));
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.error("Failed Text:", text);
            throw new Error("Failed to parse JSON response");
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'Failed to break down task' });
    }
});

// Endpoint: Stuck task intervention
app.post('/api/stuck-intervention', async (req, res) => {
    try {
        const { taskDescription, daysStuck, timesMoved } = req.body;
        const model = getModel();
        const prompt = `${TODONE_SYSTEM_INSTRUCTION}\n\nThe user is stuck on this task: "${taskDescription}"
- Stuck for ${daysStuck} days
- Moved/postponed ${timesMoved} times

Provide ONE insightful, empathetic question to help them identify what's blocking them.
Then suggest ONE specific action they could take right now.

Respond with JSON only:
{
  "empathyStatement": "acknowledge their struggle briefly",
  "diagnosticQuestion": "one question to identify the block",
  "suggestedAction": "one concrete micro-action they could take now",
  "recommendedHelper": "type of person who could help"
}`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("Raw Gemini Response:", text); // Debug logging
        let jsonStr = text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
            jsonStr = jsonMatch[0];
        }

        try {
            res.json(JSON.parse(jsonStr));
        } catch (e) {
            console.error("JSON Parse Error:", e);
            console.error("Failed Text:", text);
            throw new Error("Failed to parse JSON response");
        }
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'Failed to generate intervention' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Todone AI backend running on port ${PORT}`);
});
