// server/list-models.js
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

// Or hardcode for testing if .env fails
const API_KEY = process.env.GEMINI_API_KEY || 'YOUR_KEY_HERE';

async function listModels() {
    const genAI = new GoogleGenerativeAI(API_KEY);

    try {
        // Note: The Node SDK might not expose listModels directly on the main class easily in all versions, 
        // but let's try the standard way or fallback to a fetch if needed.
        // Actually, usually it's a separate manager or we can just try a known one.
        // Let's try to assume gemini-pro is the only safe bet or use a raw fetch to list models.

        // Using raw fetch to be sure
        console.log('Fetching available models via raw HTTP...');
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
        const data = await response.json();

        if (data.models) {
            console.log('Available Models:');
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    console.log(`- ${m.name} (Supported)`);
                } else {
                    console.log(`- ${m.name} (Not for generateContent)`);
                }
            });
        } else {
            console.log('No models found or error:', data);
        }

    } catch (error) {
        console.error('Error listing models:', error);
    }
}

listModels();
