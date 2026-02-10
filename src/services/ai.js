const API_BASE_URL = 'http://localhost:3000/api';

export const aiService = {
    evaluateTask: async (taskDescription, userContext = {}) => {
        try {
            const response = await fetch(`${API_BASE_URL}/evaluate-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskDescription, userContext }),
            });
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
            return await response.json();
        } catch (error) {
            console.error('AI Service Error:', error);
            return { error: true };
        }
    }
};
