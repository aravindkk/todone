// server/list-models-hardcoded.js
const API_KEY = 'YOUR_KEY_HERE';

async function listModels() {
    if (API_KEY === 'YOUR_KEY_HERE') {
        console.error('ERROR: Please replace YOUR_KEY_HERE with your actual API key.');
        return;
    }

    console.log(`Using Key: ${API_KEY.substring(0, 5)}...`);
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.models) {
            console.log('\n✅ AVAILABLE MODELS:');
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes('generateContent')) {
                    // Clean up the name "models/gemini-pro" -> "gemini-pro"
                    const name = m.name.replace('models/', '');
                    console.log(`- ${name}`);
                }
            });
            console.log('\nPlease pick one of these for server.js');
        } else {
            console.error('❌ ERROR Listing Models:', JSON.stringify(data, null, 2));
        }
    } catch (error) {
        console.error('❌ NETWORK ERROR:', error);
    }
}

listModels();
