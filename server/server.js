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
    // Use gemini-2.0-flash-lite as it is the most robust current model
    // Note: systemInstruction is passed but if it fails we might need to prepend manually.
    // Let's try prepending manually to be safe against older SDKs/Models.
    return genAI.getGenerativeModel({
        model: 'gemini-2.0-flash-lite',
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 200,
            responseMimeType: "application/json"
        },
    });
}

// Endpoint: Evaluate task
app.post('/api/evaluate-task', async (req, res) => {
    try {
        const { taskDescription, userContext } = req.body;
        const model = getModel();

        let contextStr = "";
        if (userContext) {
            if (userContext.userName) contextStr += `User: ${userContext.userName}. `;
            if (userContext.streak > 0) contextStr += `Streak: ${userContext.streak} days. `;
            if (userContext.stats) {
                contextStr += `completed ${userContext.stats.completed30Days} tasks in 30 days. `;
            }
        }

        // Prepend system instruction
        const prompt = `Context: ${contextStr}
Task: "${taskDescription}"
Specific & <1hr? JSON:
{ "isSpecific": bool, "canCompleteInOneHour": bool, "clarificationQuestion": "str?", "suggestion": [{"description": "str", "estimatedMinutes": int}] }
If specific, suggestion=[]. If not, 2-3 suggestions.`;

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
        const { taskDescription, userContext } = req.body;
        const model = getModel();

        let contextStr = "";
        if (userContext) {
            if (userContext.userName) contextStr += `User: ${userContext.userName}. `;
            if (userContext.streak > 0) contextStr += `Streak: ${userContext.streak} days. `;
            if (userContext.stats) {
                contextStr += `completed ${userContext.stats.completed30Days} tasks in 30 days. `;
            }
        }

        const prompt = `${contextStr}Task: "${taskDescription}"
Break into 2-5 subtasks (JSON Array of strings). Keep it simple.
Respond with JSON only:
{
  "encouragement": "brief encouraging message",
  "subtasks": [
    { "description": "specific subtask 1", "estimatedMinutes": 30 },
    { "description": "specific subtask 2", "estimatedMinutes": 45 }
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
        const { taskDescription, daysStuck, timesMoved, userContext } = req.body;
        const model = getModel();

        let contextStr = "";
        if (userContext) {
            if (userContext.userName) contextStr += `User: ${userContext.userName}. `;
            if (userContext.stats) {
                const total = userContext.stats.totalCompleted;
                if (total > 50) contextStr += `User is productive (completed ${total} tasks). `;
                else contextStr += `User is new/struggling. `;
            }
        }

        const prompt = `${contextStr}Task: "${taskDescription}" stuck for ${daysStuck} days, moved ${timesMoved} times.
Briefly motivate user and suggest one micro-step to unblock.
Respond with JSON only:
{
    "empathyStatement": "acknowledge their struggle briefly",
    "diagnosticQuestion": "one question to identify the block",
    "suggestedAction": "one concrete micro-action they could take now",
    "recommendedHelper": "type of person who could help (optional)"
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

// Endpoint: Chat Help
app.post('/api/chat-help', async (req, res) => {
    try {
        const { taskDescription, chatHistory, userContext } = req.body;
        const model = getModel();

        let contextStr = "";
        if (userContext) {
            if (userContext.userName) contextStr += `User Name: ${userContext.userName}. `;
            if (userContext.streak) contextStr += `Streak: ${userContext.streak} days. `;
            if (userContext.stats) {
                contextStr += `Completed ${userContext.stats.completed30Days} tasks recently. `;
            }
        }

        const historyStr = chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`).join('\n');

        const prompt = `${TODONE_SYSTEM_INSTRUCTION}
Context: ${contextStr}
Task Interaction: The user is chatting about a task "${taskDescription}".

Chat History:
${historyStr}

User: "${chatHistory[chatHistory.length - 1].content}"

Instructions:
1. Act as Todone AI (brief, helpful, encouraging).
2. If the user asks to create tasks (e.g., "Add a task to buy milk", "Break this down"), return a list of specific, actionable tasks in suggestedTasks.
3. Do NOT auto-create. Give the user the choice.

Output JSON format:
{
  "message": "string",
  "suggestedTasks": [ 
      { "description": "Task 1", "estimatedMinutes": 15 },
      { "description": "Task 2", "estimatedMinutes": 30 } 
  ] // OPTIONAL, only if relevant
}
`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("Raw Chat Response:", text);

        let jsonStr = text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[0];

        try {
            res.json(JSON.parse(jsonStr));
        } catch (e) {
            // Fallback for non-JSON response
            res.json({ message: text });
        }

    } catch (error) {
        console.error('Chat API Error:', error);
        res.status(500).json({ error: 'Failed to generate chat response' });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Todone AI backend running on port ${PORT} `);
});
