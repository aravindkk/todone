const API_BASE_URL = 'http://localhost:3000/api';

const withLocalDate = (context = {}) => {
    const now = new Date();
    const localDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    return { ...context, localDate };
};

export const aiService = {
    evaluateTask: async (taskDescription, userContext = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}/evaluate-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskDescription, userContext: withLocalDate(userContext) }),
            });
            if (response.status === 429) return { rateLimited: true };
            return await response.json();
        } catch (error) {
            console.error('AI Service Error:', error);
            return { error: true };
        }
    },

    // Bug 59: Game Plan Generation
    generateGamePlan: async (userName, targetTasks, otherTasks, userContext = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}/generate-game-plan`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userName, targetTasks, otherTasks, userContext: withLocalDate(userContext) }),
            });
            if (response.status === 429) return { rateLimited: true };
            return await response.json();
        } catch (error) {
            console.error('AI Service Error:', error);
            return { error: true };
        }
    },

    breakDownTask: async (taskDescription, userContext = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}/break-down-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskDescription, userContext: withLocalDate(userContext) }),
            });
            if (response.status === 429) return { rateLimited: true };
            return await response.json();
        } catch (error) {
            console.error('AI Service Error:', error);
            return { error: true };
        }
    },

    getStuckIntervention: async (taskDescription, daysStuck, timesMoved, userContext = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}/stuck-intervention`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskDescription, daysStuck, timesMoved, userContext: withLocalDate(userContext) }),
            });
            if (response.status === 429) return { rateLimited: true };
            return await response.json();
        } catch (error) {
            console.error('AI Service Error:', error);
            return { error: true };
        }
    },

    chatHelp: async (taskDescription, chatHistory, userContext = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}/chat-help`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskDescription, chatHistory, userContext: withLocalDate(userContext) }),
            });
            if (response.status === 429) return { rateLimited: true };
            return await response.json();
        } catch (error) {
            console.error('AI Service Error:', error);
            return { error: true };
        }
    },

    getHistoryRecap: async (stats, userContext = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}/history-recap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stats, userContext: withLocalDate(userContext) }),
            });
            if (response.status === 429) return { rateLimited: true, recap: "Keep up the great work! Your detailed AI insights will return tomorrow." };
            return await response.json();
        } catch (error) {
            console.error('AI Service Error:', error);
            return { error: true };
        }
    },

    getActivityInsights: async (hourlyData, userContext = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}/activity-insights`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ hourlyData, userContext: withLocalDate(userContext) }),
            });
            if (response.status === 429) return { rateLimited: true, insight: "You have a solid routine going. Stay consistent!" };
            return await response.json();
        } catch (error) {
            console.error('AI Service Error:', error);
            return { error: true, message: "Couldn't generate insights" };
        }
    },

    getDailyRecap: async (tasks, previousDayName, userName) => {
        try {
            const response = await fetch(`${API_BASE_URL}/daily-recap`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tasks, previousDayName, userName, userContext: withLocalDate({ userName }) })
            });

            if (response.status === 429) return { rateLimited: true, message: "Daily AI limit reached." };

            const data = await response.json();
            return data.success ? data.recap : { error: true };
        } catch (error) {
            console.error("AI Daily Recap Error:", error);
            return { error: true, message: "Couldn't generate recap" };
        }
    },

    shouldIntervene: (taskDescription, activeTasks) => {
        const triggers = ["scroll", "youtube", "netflix", "social media", "watch tv", "procrastinate", "waste time", "stuck", "overwhelmed", "lazy"];
        const lowerDesc = taskDescription.toLowerCase();

        if (triggers.some(t => lowerDesc.includes(t))) {
            return {
                title: "Feeling Distracted?",
                message: "Are you sure this task aligns with your goals for today? Let's take a quick breath.",
                type: "distraction_warning"
            };
        }

        // If task is very similar to an existing active task
        if (activeTasks && activeTasks.some(t => t.toLowerCase() === lowerDesc)) {
            return {
                title: "Duplicate Task",
                message: "You already have a very similar task on your plate. Focus on that one first!",
                type: "duplicate_warning"
            };
        }

        return null;
    }
};
