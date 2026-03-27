# ClariTask — Sprint Log

A running record of development sessions. Each entry is a handover note for the next session.

---

## Sprint 2 — 2026-03-27

**Branch:** `personality` → merged to `main` via PR #8
**Status:** All 7 GitHub issues closed. Main is clean and deployed.

### What was done

#### Bug fixes (GitHub Issues #1–#7)

| Issue | Title | Fix |
|-------|-------|-----|
| #1 | Streak shows as 0 incorrectly | Rewrote `calculateStreak` to allow 2 skip days per Sun–Sat calendar week — Mon–Fri workers survive weekends naturally |
| #2 | Formatting for personalized messages | 7 rotating motivational placeholders in task input, seeded by `date.getDate() % 7` (stable within a day) |
| #3 | Intrusive popup for task counts | Rewrote `TaskLimitWarningModal` copy: "That's a full day already. / 5 solid tasks lined up..." |
| #4 | Task disappears causing user panic | Replaced shimmer-only state with inline spinner + "Evaluating task..." on every task add |
| #5 | Task movement bug | `handleMove` always advances from `max(scheduledDate, today)`; auto-rollover on load bumps past-due tasks to today |
| #6 | Timing of personalized messages | Day-aware greetings: "Happy Monday" / "Happy Friday" on those mornings |
| #7 | Feedback loop to emoji reaction | Friday summary modal shows a warm response message after emoji tap before closing |

#### Personality improvements (all on `personality` branch, merged via PR #8)

- **AI system instruction** (`server/server.js`) — Rewrote coach persona: direct, caring, no jargon, validates effort before advice, never makes the user feel behind
- **Context-aware completion toasts** (`Dashboard.jsx`) — 7 variants: first task, quick win (<30 min), on a roll (2+ today), stubborn task (moved 2x+), long-overdue, cleared everything, generic fallback
- **Streak milestone toasts** (`Dashboard.jsx`) — Fires when streak first crosses 3/7/14/30 days; uses `prevStreakRef` to avoid firing on initial load
- **Empty state copy** (`Dashboard.jsx`) — Three variants based on time of day + whether anything was completed today
- **Chat welcome line** (`Dashboard.jsx`) — Chat history pre-seeded with `{ role: 'ai', content: "Let's think through this together." }`
- **Focus mode coaching line** (`FocusMode.jsx`) — "Just this one thing. Everything else can wait." shown while timer is active
- **Moved badge → action link** (`TaskCard.jsx`) — 1–2x shows "Moved Nx"; 3x+ becomes clickable "Stuck? ClariTask can help →"
- **"AI" → "ClariTask"** — Replaced all user-facing "AI" references across TaskCard, ChatModal, RatingPrompt, OnboardingModal, NewUserOnboarding, TaskNotesModal

#### Security
- Deleted `server/test-key.js` (contained a hardcoded revoked API key) and `server/debug-env.js`
- Added both to `.gitignore`

#### Debug panel additions
- Added "Personality toasts" section: buttons for all 5 completion variants + 4 streak milestone toasts
- Added "Chat welcome line" section: per-task buttons to open chat and see the welcome message
- Toggle: `localStorage.setItem('claritask_debug', '1')` in Chrome console

### Key technical decisions

- **Streak skip logic**: Sun–Sat weeks (not Mon–Sun). Saturday and Sunday fall in *different* weeks so a Mon–Fri worker gets 1 skip per week on each day — both within budget. Up to 3 consecutive empty days in any single week breaks the streak.
- **`prevStreakRef`** pattern used instead of `useState` for streak milestone detection to avoid triggering on initial render.
- **`gh pr edit`** fails with Projects classic deprecation error — use `gh api repos/{owner}/{repo}/pulls/{n}` with `--method PATCH` instead.

### Current state of codebase

- **Version**: 1.0.2 (not bumped this sprint — personality is non-breaking)
- **Backend**: deployed at `https://todone-six.vercel.app` (no backend changes needed this sprint beyond server.js system instruction)
- **All GitHub issues**: closed (7/7)
- **Open branches**: `feature/new-user-onboarding` (untouched, pre-existing)

---

## Sprint 1 — 2026-03-27 (earlier session)

**Status:** Foundation fixes, security hardening, GitHub issues triaged.

### What was done

- Pulled all GitHub issues (#1–#7), stored in `GitHubIssues.md`
- Fixed leaked API key: removed `server/.env` from git tracking, rotated key in Vercel
- Added `app.set('trust proxy', 1)` to fix express-rate-limit `ValidationError` on Vercel
- Added `getTextModel()` (no `responseMimeType`) for plain-text endpoints (`/api/daily-recap`, `/api/activity-insights`) — previously all endpoints returned raw JSON objects due to global `responseMimeType: "application/json"`
- Fixed date consistency: all `scheduledDate` values now stored as local midnight (`setHours(0,0,0,0)`), never UTC
- Added auto-rollover in `loadTasks()`: uncompleted past-due tasks bump to today on app open
- Fixed `handleMove` to always advance from `max(scheduledDate, today)`
- Added inline "Evaluating task..." spinner to task list (visible on every add, not just first)
- Added debug popup panel gated by `localStorage.getItem('claritask_debug') === '1'`
- Added `PERSONALITY_PROPOSAL.md` with 10 improvement proposals
- Bumped to v1.0.2

### Key files changed
`server/server.js`, `src/hooks/useTasks.js`, `src/components/Dashboard.jsx`, `src/components/EditTaskModal.jsx`, `src/components/FridaySummaryModal.jsx`, `.gitignore`, `CLAUDE.md`

---

## What's next (suggested)

- **Deploy backend** — `server/server.js` system instruction was updated but backend hasn't been redeployed (`cd server && vercel --prod`)
- **Bump version** to 1.0.3 in `public/manifest.json` before next Chrome Web Store submission
- **`feature/new-user-onboarding` branch** — exists but was never reviewed or merged; assess whether it's still relevant
- **Features backlog** (`Features.md`) — #5 history bar charts, #9 notes per task, #17 daily recap day-aware headers are the highest-signal items
- **Test on Chrome Web Store build** before submitting — run full checklist in `CLAUDE.md`
