# GitHub Issues

| # | Title | Status | URL |
|---|-------|--------|-----|
| #1 | Streak shows as 0 incorrectly | Fixed | https://github.com/aravindkk/todone/issues/1 |
| #2 | Formatting for personalized messages | Fixed | https://github.com/aravindkk/todone/issues/2 |
| #3 | Intrusive and annoying popup for task counts | Fixed | https://github.com/aravindkk/todone/issues/3 |
| #4 | Task disappears for a while causing user panic | Fixed | https://github.com/aravindkk/todone/issues/4 |
| #5 | Task movement bug | Fixed | https://github.com/aravindkk/todone/issues/5 |
| #6 | Timing of personalized messages | Fixed | https://github.com/aravindkk/todone/issues/6 |
| #7 | Feedback loop to emoji reaction by user | Fixed | https://github.com/aravindkk/todone/issues/7 |

---

## #1 — Streak shows as 0 incorrectly
**URL**: https://github.com/aravindkk/todone/issues/1

**Description**: The streak keeps showing 0 and is not properly computed even though I have completed tasks in the last 3 days.

**Status**: Fixed — Two bugs: (1) used UTC dates instead of local dates for comparison; (2) required 3 completed tasks/day to count — changed to 1. Fixed in `src/hooks/useTasks.js`.

---

## #2 — Formatting for personalized messages
**URL**: https://github.com/aravindkk/todone/issues/2

**Description**: The Good morning, friday etc messages are not formatted well and show the actual json to the user - which is jarring and poor.

**Screenshot**: https://github.com/user-attachments/assets/8ee9dfee-3092-4d3e-b4fd-4c2f3db1ddd4

**Status**: Fixed — `responseMimeType: "application/json"` was set on all Gemini model calls globally, forcing JSON output even for plain-text endpoints (`/daily-recap`, `/activity-insights`). Added `getTextModel()` without the JSON mime type for those endpoints. Fixed in `server/server.js`.

---

## #3 — Intrusive and annoying popup for task counts
**URL**: https://github.com/aravindkk/todone/issues/3

**Description**: The more than 5 tasks reminder one is too repetitive - maybe we should show it only once a day and not more.

**Status**: Fixed — Added a once-per-day guard in `handleAddTask` using `todo_task_limit_warning_date` in storage. Fixed in `src/components/Dashboard.jsx`.

---

## #4 — Task disappears for a while causing user panic
**URL**: https://github.com/aravindkk/todone/issues/4

**Description**: When the task is being processed before being added to the list, there is a lot of latency. Need better UI to show the user something is happening - or they might think the task just disappeared.

**Status**: Fixed — Added an animated skeleton placeholder row in the Today section while `isEvaluating` is true. Fixed in `src/components/Dashboard.jsx`.

---

## #5 — Task movement bug
**URL**: https://github.com/aravindkk/todone/issues/5

**Description**: Moving task to next day is not working sometimes. The task continues to stay for Today. If there is no tomorrow section in the view, then the task is not moving. Once there is some tomorrow section, the task moves to tomorrow.

**Status**: Fixed — (1) `handleMove` now normalises to local midnight before adding 1 day, preventing timezone-offset date skew; (2) `tomorrow` constant now uses `setDate(+1)` instead of `Date.now() + 86400000` (DST-safe). Fixed in `src/components/Dashboard.jsx`.

---

## #6 — Timing of personalized messages
**URL**: https://github.com/aravindkk/todone/issues/6

**Description**: Good morning message/popup came at 7 PM — the check should be time-of-day aware, not just date-based.

**Status**: Fixed — Added a time-of-day guard: recap only shows between 5 AM and 12 PM local time. Fixed in `src/components/Dashboard.jsx`.

---

## #7 — Feedback loop to emoji reaction by user
**URL**: https://github.com/aravindkk/todone/issues/7

**Description**: Show empathetic/appreciative/motivational feedback message when user clicks on an emoji for the Friday weekly wrap up.

**Status**: Fixed — After clicking an emoji, the modal now shows a tailored feedback message (sad/neutral/happy) with a "Have a great weekend!" close button instead of immediately dismissing. Fixed in `src/components/FridaySummaryModal.jsx`.
