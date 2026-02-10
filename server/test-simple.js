
// Basic test script to run against the running server
async function runTests() {
    const BASE_URL = 'http://localhost:3000/api'; // Ensure this matches server port
    console.log('Starting Backend Tests...');

    const logResult = (name, response, data) => {
        console.log(`\n--- ${name} ---`);
        console.log(`Status: ${response.status}`);
        // console.log('Response:', JSON.stringify(data, null, 2)); // Too verbose?
        if (response.ok) {
            console.log("SUCCESS");
        } else {
            console.log("FAILURE: " + JSON.stringify(data));
        }
    };

    try {
        // 1. Test Task Evaluation
        console.log('\nTesting: Evaluate Task');
        const evalRes = await fetch(`${BASE_URL}/evaluate-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskDescription: 'Improve my running pace' })
        });
        const evalData = await evalRes.json();
        logResult('Evaluate Task', evalRes, evalData);

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

runTests();
