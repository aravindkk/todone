# CLAUDE.md — ClariTask Project Context

This file is the starting point for every Claude Code session on this project. Read it before making any changes.

---

## Project Identity

- **App name**: ClariTask (previously "Todone", renamed in v1.0.x)
- **Type**: Chrome Extension (Manifest V3) — overrides the new tab page
- **Working directory**: `/home/aravind/.gemini/antigravity/scratch/todone`
- **Current version**: 1.0.2 (`public/manifest.json`)
- **Production backend**: `https://todone-six.vercel.app`
- **Vercel project ID**: `prj_sXhTbsi4QYHcg7V5mw0hODSeLHCD`
- **Vercel team**: `team_O1lpXHSot8tstWtTvCTFrDvs`

---

## Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19.2, Vite 7.3, Tailwind CSS 3.4 |
| Drag & drop | @dnd-kit/core + @dnd-kit/sortable |
| Icons | Lucide React |
| Sound | Web Audio API (synthesized, no files) |
| Backend | Node.js + Express 4.18 |
| AI | Google Gemini 2.0 Flash Lite (`gemini-2.0-flash-lite`) |
| Storage | Chrome Storage API, with localStorage fallback |
| Analytics | Google Analytics 4 via Measurement Protocol |
| Deploy | Vercel (backend only; frontend = Chrome Web Store / load unpacked) |

---

## Key File Map

### Frontend (src/)

| File | Role |
|------|------|
| `src/components/Dashboard.jsx` | **Main orchestrator** — all state, modals, task logic. ~11k lines. |
| `src/components/FocusMode.jsx` | Full-screen Pomodoro focus timer |
| `src/components/ai/ChatModal.jsx` | AI chat interface |
| `src/components/ai/InterventionModal.jsx` | "Feeling stuck" intervention flow |
| `src/components/ai/BreakdownModal.jsx` | Task breakdown suggestions |
| `src/components/ai/ClarificationModal.jsx` | Task clarification prompts |
| `src/components/AccomplishmentsModal.jsx` | Streak + activity + stats view |
| `src/components/NewUserOnboarding.jsx` | First-run name capture |
| `src/components/RatingPrompt.jsx` | Chrome Web Store rating prompt (3/7/14/30 day milestones) |
| `src/components/DailyRecapModal.jsx` | Morning summary of yesterday |
| `src/components/FridaySummaryModal.jsx` | Weekly Friday summary + mood rating |
| `src/components/MentorshipModal.jsx` | Mentor suggestion when 10+ related tasks |
| `src/services/ai.js` | HTTP client for all `/api/*` AI calls |
| `src/services/analytics.js` | GA4 Measurement Protocol event tracking |
| `src/lib/storage.js` | Chrome Storage + localStorage fallback wrapper |
| `src/hooks/useTasks.js` | Task CRUD state hook |
| `src/background.js` | Service worker — sets uninstall survey URL |
| `public/manifest.json` | Chrome Extension Manifest V3 |

### Backend (server/)

| File | Role |
|------|------|
| `server/server.js` | All Express routes + Gemini AI calls |
| `server/.env` | `GEMINI_API_KEY`, `PORT=3000`, `ALLOWED_ORIGINS=*` |
| `server/vercel.json` | Vercel routing config |
| `server/.vercel/project.json` | Vercel project + team IDs |

---

## Backend API Reference

All endpoints: `POST`, JSON body, return JSON.

| Endpoint | Input fields | Response shape |
|----------|-------------|----------------|
| `/api/evaluate-task` | `task`, `userContext` | `{ type, elaboratePrompt, suggestion[] }` |
| `/api/break-down-task` | `task`, `userContext` | `{ encouragement, subtasks[] }` |
| `/api/stuck-intervention` | `task`, `daysStuck`, `timesMoved`, `userContext` | `{ empathyStatement, suggestedTasks[] }` |
| `/api/chat-help` | `message`, `conversationHistory[]`, `taskContext`, `userContext` | `{ message, suggestedTasks[] }` |
| `/api/history-recap` | `tasks[]`, `userContext` | `{ recap }` |
| `/api/activity-insights` | `tasks[]`, `userContext` | `{ insight }` |
| `/api/daily-recap` | `yesterdayTasks[]`, `userContext` | `{ recap }` |

**evaluate-task** `type` values: `TOO_VAGUE`, `TOO_BIG`, `GOOD`

**userContext** shape passed to all endpoints:
```js
{ userName, streak, stats: { completed30Days, totalCompleted }, localDate }
```

**Rate limits**:
- Global: 100 req / 15 min (express-rate-limit)
- Per user AI: 50 calls / day (server-side, keyed by `userId` in request body)
- Client receives 429 → `ai.js` returns `{ rateLimited: true }` → UI shows warning

---

## AI Service (src/services/ai.js)

```js
const API_BASE = import.meta.env.DEV
  ? 'http://localhost:3000/api'
  : 'https://todone-six.vercel.app/api';
```

All functions follow pattern: call endpoint → handle 429 → return data. Helper `withLocalDate(context)` adds `localDate: 'YYYY-MM-DD'` to every context object.

`shouldIntervene(taskText, existingTasks)` — client-side check for distraction keywords ("youtube", "netflix", "scroll", "procrastinate", etc.) and duplicate task detection. Returns `{ shouldIntervene, reason }`.

---

## Storage Schema (Chrome Storage / localStorage)

All reads/writes go through `src/lib/storage.js`. Keys used throughout:

| Key | Type | Purpose |
|-----|------|---------|
| `tasks` | Task[] | All tasks (source of truth) |
| `userName` | string | User's name from onboarding |
| `userId` | string | UUID for analytics + rate limiting |
| `gaClientId` | string | GA4 client ID |
| `installDate` | ISO string | First install date |
| `showCompleted` | bool | Show/hide completed tasks (persisted) |
| `lastDailyRecapDate` | YYYY-MM-DD | Prevent duplicate recap on same day |
| `lastFridaySummaryDate` | YYYY-MM-DD | Prevent duplicate Friday summary |
| `ratingPromptState` | object | Milestone tracking for rating prompts |
| `weeklyRatings` | object[] | User mood ratings per Friday |

### Task object shape

```js
{
  id: string,           // crypto.randomUUID()
  text: string,         // Task description (may contain markdown links)
  date: 'YYYY-MM-DD',   // Due date (local)
  completed: boolean,
  completedAt: ISO string | null,
  createdAt: ISO string,
  pinned: boolean,
  order: number,        // for drag-and-drop
  timesMoved: number,   // times moved to tomorrow
  timeSpent: number,    // ms of active focus timer
  notes: string,        // user notes
  aiResponses: object,  // saved AI responses for this task
}
```

---

## Dashboard State Overview

`Dashboard.jsx` manages all top-level state. Key state vars:

| State | Purpose |
|-------|---------|
| `tasks` (from useTasks) | All tasks |
| `showCompleted` | Toggle, loaded from storage on mount |
| `focusTaskId` | Which task is in focus mode |
| `chatModal` | `{ open, task }` |
| `aiModal` | `{ type, task, data }` for breakdown/clarification/intervention |
| `editModal` | `{ open, task }` |
| `notesModal` | `{ open, task }` |
| `showMentorship` | bool — shown after 10+ tasks in 3 days |
| `showSortPrompt` | bool — shown with 3+ open tasks |
| `dailyRecap` | `{ show, data }` |
| `fridaySummary` | `{ show, data }` |
| `celebration` | `{ show, taskText, timeSpent }` |
| `showRating` | bool |

Task display order (for each section):
1. Pinned tasks
2. Active (uncompleted) tasks
3. Completed tasks

---

## Build & Deploy Workflow

### Development

```bash
# Terminal 1 — backend
cd server && npm run dev

# Terminal 2 — build frontend (must rebuild to see changes in extension)
npm run build
# Then go to chrome://extensions → reload the extension
```

### Deploy backend to Vercel

```bash
cd server
vercel --prod
```

### Chrome Web Store

Built `dist/` folder is the extension package. Zip and upload to Chrome Web Store dashboard.

---

## Analytics Events (src/services/analytics.js)

GA4 Measurement ID: `G-PL0J61LPVL`

| Event | Extra params |
|-------|-------------|
| `new_install` | — |
| `app_opened` | — |
| `active_day` | — |
| `task_added` | `is_ai_suggested` |
| `tasks_added_batch` | `count` |
| `task_completed` | — |
| `task_deleted` | — |
| `task_updated` | `has_notes` |
| `task_moved_tomorrow` | `move_count` |
| `focus_session_finished` | `duration_minutes` |
| `ai_chat_used` | — |

Default params on every event: `app_version`, `platform: 'chrome_extension'`

---

## Bug Tracker Summary

See `bugs.md` for full details. Status markers: `[Done]`, `[Open]`, `[Redo]`, `[Verified]`.

### Currently Open

| # | Summary |
|---|---------|
| 27 | Chat → create tasks from chatbot suggestions (Redo-2) |
| 28 | Micro task add button: show only once, change to "Added" |
| 29 | Remove 2/5/25 min timer icons from task list; play button → focus mode |
| 30 | Timer done: moving text in tab title + alarm sound (NotSupportedError) |
| 54 | Unacked modals/dialogs should persist across new tabs |
| 55 | "Add tasks" button count is buggy (shows wrong count) |
| 56 | Focus mode button shows "Pause" instead of "Start" initially |
| 57 | AI chat icon looks amateurish |
| 59 | Game Plan modal (was built, then removed — may revisit) |
| 60 | Show streak in modal title; remove task count stats |
| 61 | Streak view: show % of tasks moved + what types, below activity log |

### Open Features

See `Features.md` for full backlog. Open items: #5, #6, #7, #8, #9, #10, #12, #13, #14, #15, #16, #17, #18, #19, #20.

High-priority open features:
- #14: Confetti on task completion + time-spent message (completion celebration exists but confetti may need improvement)
- #12: First-install intro (≤5 tasks/day principle)
- #13: Warning when 6th task added

---

## Known Gotchas & Learnings

### Timer accuracy across tabs
Bug #40: Chrome throttles `setInterval` in inactive tabs. Fix uses `Date.now()` delta to compute elapsed time on each tick rather than incrementing a counter. Critical — do not regress this.

### Audio in Chrome extensions
Bug #26/#30: `new Audio(url)` and `AudioContext` with OscillatorNode both fail with `NotSupportedError` in certain Chrome versions. Current workaround uses Web Audio API with `OscillatorNode` + `GainNode` directly (no file loading). The three-note chime on task completion uses this pattern. If audio breaks again, check Chrome's autoplay policy and whether user interaction has occurred first.

### Date logic — always use local time
Bug #52: Task sections (Today/Tomorrow/Later) must use local date (`new Date().toLocaleDateString('en-CA')` → `YYYY-MM-DD`), never UTC. Completed tasks should appear in the section matching their `completedAt` date, not today.

### showCompleted persistence
Bug #53: `showCompleted` state must be initialized from storage on mount, not hardcoded. It's a user preference and must survive new tab opens.

### Focus mode — which task shows
Bug #38/#46: Focus mode should show the top task from today's active (uncompleted, unpinned unless pinned for today) list at the time Focus is clicked. Not a "pinned" task from a different date.

### Task link rendering
Bug #41/#42: Task text supports markdown-style links `[label](url)`. Rendered as `<a>` with text "link" (not full URL). Both in list view and Focus mode.

### Drag and drop + date sections
Bug #47: DnD Kit is used for reordering within sections. Moving to tomorrow is done via the "Move to Tomorrow" button (sets `date`), not drag. Drag-and-drop across sections is not supported — don't add it without explicit request.

### Chrome Storage vs localStorage
`src/lib/storage.js` tries `chrome.storage.local` first (async), falls back to `localStorage` (sync). All reads are async — use `await storage.get(key)`. Don't mix sync/async access patterns.

### Build required for every change
The Chrome extension loads from `dist/`. Every code change requires `npm run build` + reload in `chrome://extensions`. There is no hot reload for extensions.

### Gemini model
Current model: `gemini-2.0-flash-lite`. If you need to change it, update `getModel()` in `server/server.js`. The model choice is intentional — lower cost and latency for the high call volume.

---

## Code Style Conventions

- **Small, focused components** — if a component grows beyond ~200 lines, consider splitting
- **Early returns** over nested conditionals
- **No unnecessary comments** — code should be self-evident
- **Tailwind only** for styling — no inline style objects unless dynamic values require it
- **No over-engineering** — resist adding abstraction layers unless genuinely reused 3+ times
- **Dates always as `YYYY-MM-DD` strings** in storage and comparisons

---

## Testing Checklist (before calling a task done)

1. `npm run build` succeeds without errors
2. `npm run lint` passes
3. Load unpacked in Chrome, open new tab
4. Verify the specific bug/feature works
5. Check no regressions in: task add/complete/delete, focus mode, streak, chat

---

## Preferences

- Ask before committing to git
- Update `bugs.md` or `Features.md` when closing/opening issues
- After every major change, update README.md if user-facing behavior changed
