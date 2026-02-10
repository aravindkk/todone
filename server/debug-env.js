import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;

console.log('--- Environment Variable Debug ---');
if (!key) {
    console.log('ERROR: GEMINI_API_KEY is undefined.');
} else {
    console.log(`Success: GEMINI_API_KEY is loaded.`);
    console.log(`Length: ${key.length}`);
    console.log(`First 5 chars: ${key.substring(0, 5)}`);
    console.log(`Last 5 chars: ${key.substring(key.length - 5)}`);
    console.log(`Specific check: Does it start with "AIza"? ${key.startsWith("AIza")}`);
}
console.log('--- End Debug ---');
