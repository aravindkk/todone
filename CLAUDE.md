# CLAUDE.md — ClariTask

## Project Identity
- **App**: ClariTask (Chrome Extension, Manifest V3 — overrides new tab)
- **Version**: 1.0.2 (`public/manifest.json`)
- **Backend**: `https://todone-six.vercel.app` (Vercel project `prj_sXhTbsi4QYHcg7V5mw0hODSeLHCD`, team `team_O1lpXHSot8tstWtTvCTFrDvs`)

## Stack
React 19.2 + Vite + Tailwind CSS · @dnd-kit · Lucide React · Node/Express 4.18 · Gemini 2.0 Flash Lite · Chrome Storage API · GA4 Measurement Protocol

## Key Files
- `src/components/Dashboard.jsx` — main orchestrator (~11k lines), all state + task logic
- `src/services/ai.js` — HTTP client for `/api/*` endpoints; DEV hits `localhost:3000`, PROD hits Vercel
- `server/server.js` — all Express routes + Gemini calls; see file for API shapes
- `src/lib/storage.js` — Chrome Storage + localStorage fallback (all reads async)
- `bugs.md` — bug tracker (`[Open]`, `[Done]`, `[Redo]`, `[Verified]`)
- `Features.md` — feature backlog

## Build & Deploy
```bash
# Dev
cd server && npm run dev        # backend
npm run build                   # frontend (required after every change; no hot reload)
# chrome://extensions → reload

# Deploy backend
cd server && vercel --prod
```

## Known Gotchas (do not regress)

**Timer accuracy**: Chrome throttles `setInterval` in inactive tabs. Use `Date.now()` delta on each tick — never increment a counter.

**Audio**: `new Audio(url)` fails in extensions. Use Web Audio API with `OscillatorNode` + `GainNode` directly. Requires prior user interaction (autoplay policy).

**Dates**: Always use local date (`new Date().toLocaleDateString('en-CA')` → `YYYY-MM-DD`), never UTC. Task sections key off local date.

**Storage**: `storage.js` is async. Always `await storage.get(key)` — never mix sync/async patterns.

**Focus mode**: Shows top task from today's active list at the moment Focus is clicked. Not the globally pinned task.

**Task links**: Task text supports `[label](url)` markdown. Render as `<a>` with text "link".

**DnD**: Drag-and-drop reorders within sections only. Cross-section drag is not supported.

**Gemini model**: `gemini-2.0-flash-lite` — intentional for cost/latency. Change in `getModel()` in `server/server.js`.

## Testing Checklist
1. `npm run build` — no errors
2. `npm run lint` — passes
3. Load unpacked in Chrome, open new tab
4. Verify bug/feature works
5. No regressions: task add/complete/delete, focus mode, streak, chat

## Workflow
- Update `bugs.md` / `Features.md` when closing/opening issues
- Update `README.md` if user-facing behavior changes
