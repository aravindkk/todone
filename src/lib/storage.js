export const storage = {
    get: async (key, defaultValue) => {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
            const result = await chrome.storage.local.get([key]);
            return result[key] || defaultValue;
        }
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : defaultValue;
    },

    set: async (key, value) => {
        if (typeof chrome !== "undefined" && chrome.storage && chrome.storage.local) {
            await chrome.storage.local.set({ [key]: value });
            return;
        }
        localStorage.setItem(key, JSON.stringify(value));
    }
};
