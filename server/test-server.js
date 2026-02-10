async function runTests() {
    const BASE_URL = 'http://localhost:3000/api';
    console.log('Starting Backend Tests...');

    // Helper to log results
    const logResult = (name, response, data) => {
        console.log(`\n--- ${name} ---`);
        console.log(`Status: ${response.status}`);
        console.log('Response:', JSON.stringify(data, null, 2));
    };

    try {
        // 1. Test Task Evaluation
        console.log('\nTesting: Evaluate Task');
        const evalRes = await fetch(`${BASE_URL}/evaluate-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskDescription: 'Build a rocket' })
        });
        const evalData = await evalRes.json();
        logResult('Evaluate Task', evalRes, evalData);

        // 2. Test Breakdown
        console.log('\nTesting: Break Down Task');
        const breakRes = await fetch(`${BASE_URL}/break-down-task`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ taskDescription: 'Write a novel' })
        });
        const breakData = await breakRes.json();
        logResult('Break Down Task', breakRes, breakData);

        // 3. Test Intervention
        console.log('\nTesting: Stuck Intervention');
        const stuckRes = await fetch(`${BASE_URL}/stuck-intervention`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                taskDescription: 'Call insurance company',
                daysStuck: 5,
                timesMoved: 4
            })
        });
        const stuckData = await stuckRes.json();
        logResult('Stuck Intervention', stuckRes, stuckData);

    } catch (error) {
        console.error('Test Failed:', error);
    }
}

runTests();
