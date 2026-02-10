// Background Service Worker for Todone
console.log('Todone background service worker started');

// Listen for installation
chrome.runtime.onInstalled.addListener(() => {
    console.log('Todone installed');
});
