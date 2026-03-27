# ClariTask — AI Todo Coach

A Chrome extension that replaces the new tab page with an AI-powered task manager and productivity coach. Built with React, Vite, Tailwind CSS, and Google Gemini AI.

---

## What It Does

ClariTask turns every new tab into a focused workspace for managing your day. Key capabilities:

- **Smart task entry** — AI evaluates tasks as you type. Vague tasks get clarified. Oversized tasks get broken down into sub-tasks completable in under an hour.
- **Daily structure** — Tasks are organized into Today, Tomorrow, and Later sections. Drag and drop to reorder.
- **Focus mode** — Full-screen focus on one task with a Pomodoro-style timer (5, 10, or 25 minutes). Tab title changes when timer ends.
- **AI chat** — Built-in chatbot can help you think through any task, suggest micro-tasks, and create them directly in your list.
- **Streak tracking** — Earn a streak by completing 3+ tasks per day. Visual activity log (last 30 days), task completion stats, and insights into what types of tasks you tend to finish quickly vs. struggle with.
- **Daily & weekly recaps** — Morning summary of yesterday's progress (weekdays only). Friday summary of the week with mood rating.
- **Celebrations** — Confetti and a completion sound when you finish a task.
- **Personalization** — AI knows your name, streak, completion rate, and task history. Interventions and suggestions adapt over time.
- **Rate limiting** — 50 AI calls per user per day, tracked server-side.

---

## Architecture

```
┌─────────────────────────────────────────┐
│        Chrome Extension (frontend)       │
│                                         │
│   React 19 + Vite + Tailwind CSS        │
│   ┌─────────────────────────────────┐   │
│   │  Dashboard.jsx (main orchestr.) │   │
│   │  ├── TaskInput / TaskCard       │   │
│   │  ├── FocusMode                  │   │
│   │  ├── ChatModal / ai/*           │   │
│   │  ├── StreakCounter              │   │
│   │  ├── AccomplishmentsModal       │   │
│   │  └── Modals (recap, friday...)  │   │
│   └─────────────────────────────────┘   │
│   src/services/ai.js ──────────────────►│
│   src/services/analytics.js (GA4)       │
│   src/lib/storage.js (Chrome + LS)      │
└────────────────────┬────────────────────┘
                     │ HTTPS API calls
                     ▼
┌─────────────────────────────────────────┐
│         Express Backend (server/)        │
│                                         │
│   Node.js + Express 4.18               │
│   Google Generative AI SDK (Gemini)    │
│   Rate limiting: 50 AI calls/user/day  │
│                                         │
│   Deployed on Vercel                   │
│   https://todone-six.vercel.app        │
└─────────────────────────────────────────┘
```

### Frontend (Chrome Extension)

| Path | Purpose |
|------|---------|
| `src/components/Dashboard.jsx` | Main app orchestrator — all state, modals, task logic |
| `src/components/FocusMode.jsx` | Full-screen focus timer |
| `src/components/ai/ChatModal.jsx` | AI chat interface |
| `src/components/ai/InterventionModal.jsx` | "Feeling stuck" flow |
| `src/components/ai/BreakdownModal.jsx` | Task breakdown suggestions |
| `src/services/ai.js` | HTTP client for all AI API calls |
| `src/services/analytics.js` | Google Analytics 4 via Measurement Protocol |
| `src/lib/storage.js` | Chrome Storage API with localStorage fallback |
| `src/hooks/useTasks.js` | Task CRUD state management |
| `src/background.js` | Service worker (uninstall survey URL) |
| `public/manifest.json` | Chrome Extension Manifest V3 |

### Backend (server/)

| Path | Purpose |
|------|---------|
| `server/server.js` | Express app with all `/api/*` endpoints |
| `server/.env` | `GEMINI_API_KEY`, `PORT`, `ALLOWED_ORIGINS` |
| `server/vercel.json` | Vercel deployment config |
| `server/.vercel/project.json` | Vercel project ID and team |

### API Endpoints

| Endpoint | What it does |
|----------|-------------|
| `POST /api/evaluate-task` | Classify task as TOO_VAGUE, TOO_BIG, or GOOD |
| `POST /api/break-down-task` | Generate 2–5 concrete subtasks |
| `POST /api/stuck-intervention` | Help user get unstuck (uses daysStuck, timesMoved) |
| `POST /api/chat-help` | Freeform AI chat with task context |
| `POST /api/history-recap` | 7-day task history summary |
| `POST /api/activity-insights` | Productivity pattern insights |
| `POST /api/daily-recap` | Morning summary of yesterday |

All endpoints receive user context: `userName`, `streak`, `stats`, `localDate`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| UI Framework | React 19.2 |
| Build Tool | Vite 7.3 |
| Styling | Tailwind CSS 3.4 |
| Drag & Drop | @dnd-kit/core + sortable |
| Icons | Lucide React |
| Sound | Web Audio API (no external files) |
| AI Model | Google Gemini 2.0 Flash Lite |
| Backend | Node.js + Express 4.18 |
| Rate Limiting | express-rate-limit |
| Analytics | Google Analytics 4 (Measurement Protocol) |
| Deployment | Vercel (backend) |

---

## Local Setup

### Prerequisites

- Node.js 18+
- A Google Gemini API key — get one at [Google AI Studio](https://aistudio.google.com/)
- Chrome browser

### 1. Clone and install dependencies

```bash
git clone <repo-url>
cd todone

# Install frontend dependencies
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 2. Configure the backend

```bash
cd server
cp .env.example .env   # or create .env manually
```

Edit `server/.env`:

```env
GEMINI_API_KEY=your_api_key_here
PORT=3000
ALLOWED_ORIGINS=*
```

### 3. Start the backend

```bash
cd server
npm run dev
```

Server runs at `http://localhost:3000`.

### 4. Build the extension

```bash
# In project root
npm run build
```

This outputs the built extension to `dist/`.

### 5. Load the extension in Chrome

1. Open Chrome and go to `chrome://extensions`
2. Enable **Developer mode** (top right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

Open a new tab — ClariTask should appear.

### Development workflow

The extension reads from `dist/`, so you need to rebuild after changes:

```bash
npm run build
# Then reload the extension in chrome://extensions
```

For faster iteration during development, the frontend's `ai.js` automatically points to `http://localhost:3000/api` when running in dev mode (based on `import.meta.env.DEV`).

---

## Configuration

### AI behavior (server/server.js)

- **Model**: `gemini-2.0-flash-lite`
- **Temperature**: 0.7
- **Max tokens**: 200 per response
- **Daily limit**: 50 AI calls per user (tracked by client-generated UUID stored in Chrome Storage)

### Analytics (src/services/analytics.js)

Uses GA4 Measurement Protocol. Events tracked:
- `app_opened`, `new_install`, `active_day`
- `task_added`, `task_completed`, `task_deleted`, `task_updated`, `task_moved_tomorrow`
- `tasks_added_batch`, `focus_session_finished`, `ai_chat_used`

### Storage

All user data is stored locally in Chrome Storage (`chrome.storage.local`) with `localStorage` as fallback. Nothing is sent to the server except anonymized analytics and AI prompts. No task data leaves the browser.

---

## Production Deployment

The backend is deployed to Vercel. To redeploy:

```bash
cd server
vercel --prod
```

The frontend is a static Chrome extension — distribute via the Chrome Web Store or load unpacked for testing.

**Production API URL**: `https://todone-six.vercel.app/api`

---

## Project Status

Current version: **1.0.2**

See `bugs.md` for open issues and `Features.md` for the feature backlog.
