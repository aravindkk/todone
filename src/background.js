// Background Service Worker for Todo
console.log('Todo background service worker started');

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Todo installed');
    // Set the uninstall URL to capture feedback when users decide to leave
    chrome.runtime.setUninstallURL('https://docs.google.com/forms/d/e/1FAIpQLSekL8n8Z7lP9r-zIDw8piuvcqvEJP5y1RTf7AzkpB35eEpKsg/viewform?usp=publish-editor');
});
