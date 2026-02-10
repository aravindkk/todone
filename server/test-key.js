// server/test-key.js
import { GoogleGenerativeAI } from '@google/generative-ai';

// TODO: Replace with your actual API key
const API_KEY = 'AIzaSyDIsAXpFVHhRWxrwYrdmVxa6XrZxPUQ31w';

async function testKey() {
    console.log(`Testing key: ${API_KEY.substring(0, 10)}... (Length: ${API_KEY.length})`);

    if (API_KEY === 'YOUR_KEY_HERE') {
        console.error('ERROR: Please replace YOUR_KEY_HERE with your actual API key.');
        return;
    }

    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });

    try {
        console.log('Sending request to Gemini...');
        const result = await model.generateContent('Hello, are you working?');
        console.log('Response received!');
        console.log(result.response.text());
        console.log('SUCCESS: API Key is valid and working.');
    } catch (error) {
        console.error('FAILURE: API request failed.');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        if (error.response) {
            console.error('Error details:', JSON.stringify(error.response, null, 2));
        }
    }
}

testKey();
