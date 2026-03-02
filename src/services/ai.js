const API_BASE_URL = 'https://todone-six.vercel.app/api';

export const aiService = {
    evaluateTask: async (taskDescription, userContext = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}/evaluate-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskDescription, userContext }),
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
                body: JSON.stringify({ taskDescription, userContext }),
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
                body: JSON.stringify({ taskDescription, daysStuck, timesMoved, userContext }),
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
                body: JSON.stringify({ taskDescription, chatHistory, userContext }),
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
                body: JSON.stringify({ stats, userContext }),
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
                body: JSON.stringify({ hourlyData, userContext }),
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
                body: JSON.stringify({ tasks, previousDayName, userName })
            });

            if (response.status === 429) return { rateLimited: true, message: "Daily AI limit reached." };

            const data = await response.json();
            return data.success ? data.recap : { error: true };
        } catch (error) {
            console.error("AI Daily Recap Error:", error);
            return { error: true, message: "Couldn't generate recap" };
        }
    }
};
