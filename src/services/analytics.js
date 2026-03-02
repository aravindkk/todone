import { storage } from "../lib/storage";

const GA_MEASUREMENT_ID = 'G-PL0J61LPVL';
const GA_API_SECRET = 'wjvqYFctSvGAxl1MHd7WpA';
const CLIENT_ID_KEY = 'todone_ga_client_id';

// GA4 Measurement Protocol Endpoint
const GA_ENDPOINT = `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`;

// Generate or retrieve a consistent Client ID
async function getOrCreateClientId() {
    let clientId = await storage.get(CLIENT_ID_KEY, null);
    if (!clientId) {
        // Generate a pseudo-random UUID v4
        clientId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36);
        await storage.set(CLIENT_ID_KEY, clientId);
    }
    return clientId;
}

// Send an event to GA4
async function sendGAEvent(eventName, params = {}) {
    try {
        const clientId = await getOrCreateClientId();

        const payload = {
            client_id: clientId,
            user_id: clientId, // Use clientId as user_id for cross-device tracking if they authenticate later, or just persistent ID now
            events: [{
                name: eventName,
                params: {
                    ...params,
                    // Optionally add common parameters here (e.g., version, language)
                    app_version: chrome?.runtime?.getManifest()?.version || '1.0.0',
                    platform: 'chrome_extension'
                }
            }]
        };

        const response = await fetch(GA_ENDPOINT, {
            method: 'POST',
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            console.error('Failed to send GA event:', response.status);
        }
    } catch (e) {
        console.error('Error sending GA event:', e);
    }
}

export const analytics = {
    trackAppOpened: () => sendGAEvent('app_opened'),

    trackTaskAdded: (isAiSuggested = false) => sendGAEvent('task_added', {
        is_ai_suggested: isAiSuggested
    }),

    trackTasksAddedBatch: (count) => sendGAEvent('tasks_added_batch', {
        count: count
    }),

    trackTaskCompleted: () => sendGAEvent('task_completed'),

    trackFocusSessionFinished: (durationMinutes) => sendGAEvent('focus_session_finished', {
        duration_minutes: durationMinutes
    }),

    trackAiChatUsed: () => sendGAEvent('ai_chat_used'),

    // Feature 19: Enhanced Tracking
    trackItemDeleted: () => sendGAEvent('task_deleted'),

    trackItemUpdated: (hasNotes) => sendGAEvent('task_updated', { has_notes: hasNotes }),

    trackItemMovedToTomorrow: (moveCount) => sendGAEvent('task_moved_tomorrow', { move_count: moveCount }),

    trackNewInstall: () => sendGAEvent('new_install'),

    trackActiveDay: () => sendGAEvent('active_day')
};
