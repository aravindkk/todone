import puppeteer from 'puppeteer';
import path from 'path';

(async () => {
    console.log("Launching browser...");
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    const page = await browser.newPage();
    await page.setViewport({ width: 1200, height: 800 });

    console.log("Navigating to app...");
    await page.goto('http://localhost:5173');

    console.log("Injecting dummy data...");
    const dummyTasks = [
        { id: '1', description: 'Review Q3 strategy deck', completed: false, createdAt: new Date().toISOString() },
        { id: '2', description: 'Schedule team sync', completed: false, createdAt: new Date().toISOString() },
        { id: '3', description: 'Design new onboarding screens', completed: false, createdAt: new Date().toISOString() },
        { id: '4', description: 'Write API documentation', completed: false, moveCount: 3, createdAt: new Date().toISOString() },
        { id: '5', description: 'Email client feedback', completed: true, completedAt: new Date().toISOString(), createdAt: new Date(Date.now() - 86400000).toISOString() }
    ];

    await page.evaluate((tasks) => {
        localStorage.setItem('todo_tasks', JSON.stringify(tasks));
        localStorage.setItem('todo_streak', JSON.stringify({ count: 12, lastUpdated: new Date().toLocaleDateString(), isFrozen: false }));
        localStorage.setItem('todo_user_name', '"Friend"');
    }, dummyTasks);

    console.log("Reloading app...");
    await page.goto('http://localhost:5173', { waitUntil: 'networkidle0' });
    await new Promise(r => setTimeout(r, 1000));

    const outDir = '/home/aravind/.gemini/antigravity/brain/51a63304-d17a-4aa7-b65a-7e38e3f46646';

    console.log("Capturing Dashboard...");
    await page.screenshot({ path: path.join(outDir, 'screenshot_dashboard.png') });

    console.log("Capturing Chat Modal...");
    // Open chat for first task
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const chatBtn = btns.find(b => b.innerHTML.includes('lucide-message-circle'));
        if (chatBtn) chatBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, 'screenshot_chat.png') });

    console.log("Capturing Focus Mode...");
    console.log("Capturing Focus Mode...");
    // Close chat and open focus mode
    await page.evaluate(() => {
        const closeBtns = Array.from(document.querySelectorAll('button'));
        const closeBtn = closeBtns.find(b => b.innerHTML.includes('lucide-x'));
        if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const focusBtn = btns.find(b => b.innerHTML.includes('lucide-radio'));
        if (focusBtn) focusBtn.click();
    });
    await new Promise(r => setTimeout(r, 1000));
    await page.screenshot({ path: path.join(outDir, 'screenshot_focus.png') });

    console.log("Capturing Breakdown Modal...");
    // Close focus and open breakdown
    await page.evaluate(() => {
        const closeBtns = Array.from(document.querySelectorAll('button'));
        const closeBtn = closeBtns.find(b => b.innerHTML.includes('lucide-x'));
        if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const breakdownBtn = btns.find(b => b.innerHTML.includes('lucide-list-ordered'));
        if (breakdownBtn) breakdownBtn.click();
    });
    await new Promise(r => setTimeout(r, 4000)); // wait for AI response
    await page.screenshot({ path: path.join(outDir, 'screenshot_breakdown.png') });

    console.log("Capturing Intervention Modal...");
    // Close breakdown
    await page.evaluate(() => {
        const closeBtns = Array.from(document.querySelectorAll('button'));
        const closeBtn = closeBtns.find(b => b.innerHTML.includes('lucide-x'));
        if (closeBtn) closeBtn.click();
    });
    await new Promise(r => setTimeout(r, 500));
    // Click move to tomorrow on the 4th task
    await page.evaluate(() => {
        const btns = Array.from(document.querySelectorAll('button'));
        const moveBtns = btns.filter(b => b.innerHTML.includes('lucide-arrow-right'));
        if (moveBtns.length > 2) moveBtns[3].click(); // 4th task
    });
    await new Promise(r => setTimeout(r, 4000)); // wait for AI response
    await page.screenshot({ path: path.join(outDir, 'screenshot_intervention.png') });

    await browser.close();
    console.log("Screenshots captured successfully!");
})();
