const API_BASE_URL = 'http://localhost:3000/api';

export const aiService = {
    evaluateTask: async (taskDescription) => {
        try {
            const response = await fetch(`${API_BASE_URL}/evaluate-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskDescription }),
            });
            return await response.json();
        } catch (error) {
            console.error('AI Service Error:', error);
            return { error: true };
        }
    },

    breakDownTask: async (taskDescription) => {
        try {
            const response = await fetch(`${API_BASE_URL}/break-down-task`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskDescription }),
            });
            return await response.json();
        } catch (error) {
            console.error('AI Service Error:', error);
            return { error: true };
        }
    },

    getStuckIntervention: async (taskDescription, daysStuck, timesMoved) => {
        try {
            const response = await fetch(`${API_BASE_URL}/stuck-intervention`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ taskDescription, daysStuck, timesMoved }),
            });
            return await response.json();
        } catch (error) {
            console.error('AI Service Error:', error);
            return { error: true };
        }
    }
};
