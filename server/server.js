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

// Feature 1: Limit AI API calls to 50 per user per day
const userDailyUsage = new Map(); // { userId: { count: number, date: string } }

function checkDailyLimit(req, res, next) {
    const userId = req.body?.userContext?.userName || req.ip;

    // Get local system time in YYYY-MM-DD format instead of UTC
    const now = new Date();
    let today = req.body?.userContext?.localDate || `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

    const usage = userDailyUsage.get(userId) || { count: 0, date: today };

    // Reset if it's a new day
    if (usage.date !== today) {
        usage.count = 0;
        usage.date = today;
    }

    if (usage.count >= 50) {
        return res.status(429).json({
            error: 'You have reached the limit for AI assistance for the day. This will reset tomorrow.'
        });
    }

    // Increment and next
    usage.count++;
    userDailyUsage.set(userId, usage);
    next();
}

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
app.post('/api/evaluate-task', checkDailyLimit, async (req, res) => {
    try {
        const { taskDescription, userContext, taskNotes } = req.body;
        const model = getModel();

        let contextStr = "";
        if (userContext) {
            if (userContext.userName) contextStr += `User: ${userContext.userName}. `;
            if (userContext.streak > 0) contextStr += `Streak: ${userContext.streak} days. `;
            if (userContext.stats) {
                contextStr += `completed ${userContext.stats.completed30Days} tasks in 30 days. `;
            }
        }

        let notesStr = "";
        if (taskNotes) notesStr += `User's contextual notes (past help/resources): ${taskNotes}. `;

        // Prepend system instruction
        const prompt = `Context: ${contextStr}${notesStr}
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
app.post('/api/break-down-task', checkDailyLimit, async (req, res) => {
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
app.post('/api/stuck-intervention', checkDailyLimit, async (req, res) => {
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
Briefly motivate user and suggest 1-2 micro-steps to unblock.
Respond with JSON only:
{
    "empathyStatement": "acknowledge their struggle briefly",
    "suggestedTasks": [ 
        { "description": "micro action 1", "estimatedMinutes": 2 },
        { "description": "micro action 2", "estimatedMinutes": 5 } 
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
        res.status(500).json({ error: 'Failed to generate intervention' });
    }
});

// Bug 59: Endpoint: Generate Game Plan
app.post('/api/generate-game-plan', checkDailyLimit, async (req, res) => {
    try {
        const { userName, targetTasks, otherTasks, userContext } = req.body;
        const model = getModel('gemini-2.5-flash');

        const localTimeInfo = userContext?.localDate ? `\nToday's Date: ${userContext.localDate}` : "";

        const prompt = `${TODONE_SYSTEM_INSTRUCTION}
You are an expert productivity coach.
User: ${userName || 'Friend'}
${localTimeInfo}

Top Priority Targets (these must be done today):
${targetTasks.map(t => `- ${t}`).join('\n')}

Other Tasks on their plate:
${otherTasks.length > 0 ? otherTasks.map(t => `- ${t}`).join('\n') : "(None)"}

Generate a "Game Plan" for the day. 
Address the user by name. Be encouraging, highly strategic, and concise.
Draft a timeline (Morning/Afternoon/Evening or Time-blocked) incorporating these tasks, heavily prioritizing the "Targets". 
Give a short tip on how to handle the other tasks.

Respond with pure text formatted with markdown (bold, bullet points, headers like "🎯 Your Targets", "🗓️ The Plan"). Do not wrap in JSON.
`;

        const result = await model.generateContent(prompt);
        const plan = result.response.text();
        res.json({ plan });
    } catch (error) {
        console.error('Gemini API Error:', error);
        res.status(500).json({ error: 'Failed to generate game plan' });
    }
});

// Endpoint: Chat Help
app.post('/api/chat-help', checkDailyLimit, async (req, res) => {
    try {
        const { taskDescription, chatHistory, userContext, taskNotes } = req.body;
        const model = getModel();

        let contextStr = "";
        if (userContext) {
            if (userContext.userName) contextStr += `User Name: ${userContext.userName}. `;
            if (userContext.streak) contextStr += `Streak: ${userContext.streak} days. `;
            if (userContext.stats) {
                contextStr += `Completed ${userContext.stats.completed30Days} tasks recently. `;
            }
        }

        let notesStr = "";
        if (taskNotes) notesStr += `User's contextual notes for this task (past help/resources): ${taskNotes}. `;

        const historyText = chatHistory.map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.content}`).join('\n');

        const prompt = `${TODONE_SYSTEM_INSTRUCTION}
Context: ${contextStr}${notesStr}
You are an expert productivity coach helping the user with this specific task: "${taskDescription}".
They are asking for help or advice.

Previous conversation about this task:
${historyText}

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

// Endpoint: Weekly History Recap
app.post('/api/history-recap', checkDailyLimit, async (req, res) => {
    try {
        const { stats, userContext } = req.body;
        const model = getModel();

        let contextStr = "";
        if (userContext?.userName) contextStr += `User: ${userContext.userName}. `;

        // stats is expected to be an array of { date, created, completed }
        const statsStr = JSON.stringify(stats);

        const prompt = `${contextStr}
Here are my task stats for the last 7 days: ${statsStr}.
Provide a single-sentence, warm, and highly encouraging recap of my week. Focus on the positive.
Respond with JSON only:
{ "recap": "string" }`;

        const result = await model.generateContent(prompt);
        const text = result.response.text();
        console.log("Raw History Recap Response:", text);

        let jsonStr = text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (jsonMatch) jsonStr = jsonMatch[0];

        try {
            res.json(JSON.parse(jsonStr));
        } catch (e) {
            res.json({ recap: text });
        }
    } catch (error) {
        console.error('History Recap Error:', error);
        res.status(500).json({ error: 'Failed to generate history recap' });
    }
});

// Endpoint: Activity Insights
app.post('/api/activity-insights', checkDailyLimit, async (req, res) => {
    try {
        const { hourlyData, userContext } = req.body;
        const model = getModel();

        const prompt = `${TODONE_SYSTEM_INSTRUCTION}
Context: User local time distribution of task creations and completions over the last 7 days.
Data: ${JSON.stringify(hourlyData)}

Provide 1-2 short, encouraging sentences of insight about when the user is most productive or active based on this local time data. Keep it conversational.`;

        const result = await model.generateContent(prompt);
        res.json({ insight: result.response.text(), success: true });
    } catch (error) {
        console.error("Activity Insights Error:", error);
        res.status(500).json({ error: "Failed to generate insights." });
    }
});

app.post('/api/daily-recap', checkDailyLimit, async (req, res) => {
    try {
        const { tasks, previousDayName, userName } = req.body;
        const model = getModel();

        let prompt = `${TODONE_SYSTEM_INSTRUCTION}
Context: The user (${userName || 'User'}) is opening the app for the first time today.
Task Data from the previous weekday (${previousDayName}):
`;

        if (tasks.length === 0) {
            prompt += `No tasks were completed or created.
Generate a warm, encouraging 1-2 sentence greeting hoping they have a fresh and productive day today. Do not mention the lack of tasks negatively.`;
        } else {
            prompt += `${JSON.stringify(tasks.map(t => ({ desc: t.description, completed: t.completed })))}
Generate a warm, encouraging 1-2 sentence summary of what they accomplished on ${previousDayName}. Keep it brief, uplifting, and ready them for today.`;
        }

        const result = await model.generateContent(prompt);
        res.json({ recap: result.response.text(), success: true });
    } catch (error) {
        console.error("Daily Recap Error:", error);
        res.status(500).json({ error: "Failed to generate recap." });
    }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`Todone AI backend running on port ${PORT} `);
    });
}

// Export the Express API
export default app;
