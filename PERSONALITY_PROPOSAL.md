# ClariTask Personality Proposal

## The Problem

The bones are good — onboarding is warm, the AI system instruction says the right things, and modals like the Friday wrap-up feel human. But in the day-to-day flow, the experience feels transactional. The user adds a task, evaluates it, moves it, completes it — and the coach is mostly silent. A real productivity coach doesn't just process requests; they notice, celebrate, challenge, and check in.

The gap: **the coaching personality lives in the modals (which appear rarely) but disappears from the everyday task interactions (which happen constantly).**

---

## Proposed Personality Pillars

Before listing changes, here's the voice we're aiming for in every word:

| Pillar | What it means in practice |
|--------|--------------------------|
| **Warm but not sycophantic** | Celebrates genuinely, doesn't cheer for everything |
| **Honest but not harsh** | Calls out a task that keeps getting moved without shaming |
| **Focused on effort, not perfection** | Completing 2 tasks well beats adding 10 |
| **Talks like a person, not an app** | No "Task added successfully." — say something human |

---

## Proposed Changes

### 1. Task Completion Celebration (high impact, everyday)

**Current:** Task just gets crossed out. No acknowledgement.

**Proposed:** Show a small inline message beneath the completed task for 2–3 seconds.

Vary the message based on context:

| Context | Message |
|---------|---------|
| First task of the day | "First one down. That's the hardest part." |
| Task completed quickly (< 30 min) | "Quick win. 💪 Those add up." |
| Task that was moved 2+ times | "Finally got there. That one was stubborn." |
| Last open task for the day | "That's everything for today. Nicely done." |
| 3rd task in a row completed | "On a roll — keep that energy." |

These are static strings with a bit of logic, not AI calls — fast and free.

---

### 2. Task Input Placeholder — Rotate Daily

**Current:** Always "What do you need to get done?"

**Proposed:** Rotate through a small set of prompts that feel like a coach checking in:

- "What's the one thing that would make today a win?"
- "What's been sitting on your mind?"
- "What needs to move forward today?"
- "What would make you feel accomplished tonight?"
- "What's the next step?"

Pick one per day (seed from date so it's stable within a day, changes overnight).

---

### 3. "Moved N times" Badge — Give it a Voice

**Current:** Orange badge "Moved 4x" — factual, slightly shaming.

**Proposed:** Make the badge speak differently based on count:

| Move count | Badge text | Tone |
|------------|-----------|------|
| 1–2 | "Moved 2x" | Neutral, informational |
| 3 | "Stuck? AI can help →" | Gentle nudge, links to chat |
| 4+ | "Worth a closer look" | Coaching, non-judgmental |

At 3 moves, the badge becomes a tap target that opens the AI chat for that task directly.

---

### 4. Focus Mode — More Coach, Less Timer

**Current:** Task description + start/pause button. Silent during the session.

**Proposed:**
- **On start:** Show a one-line coaching prompt beneath the task. e.g. "No distractions for the next 25 minutes. You've got this." or "Just this one thing. Everything else can wait."
- **On completion:** Instead of neutral "Finish", show: "Done! How do you feel about that one?" with two quick taps: 😌 Easy / 😤 Tough. Log this quietly — could inform future AI coaching.

---

### 5. Task Limit Warning — Lead With the Win

**Current:** "Slow down a bit! It's great to focus on only 5 tasks in a day."

**Proposed:** Lead with celebration before the caution:

> "You've already got 5 solid tasks lined up — that's a full, focused day. Adding more risks spreading yourself thin. Still want to add this one?"

Same information, completely different emotional landing.

---

### 6. Daily Recap — Time-Aware Greeting

**Current:** Always "Good Morning!" regardless of context.

**Proposed:** Vary the header based on time (already checked for 5–12 AM, so this is always morning — but vary the energy):

| Day | Header |
|-----|--------|
| Monday | "New week, fresh start. Here's where you left off." |
| Regular weekday | "Good morning. Here's your yesterday." |
| After a no-task day | "No tasks yesterday — and that's fine. Today's a new one." |

---

### 7. Streak — Milestone Moments

**Current:** Shows number. "Consistency is key. Look how far you've come!"

**Proposed:** Celebrate specific milestones with a distinct message:

| Milestone | Message |
|-----------|---------|
| 3 days | "3 days in a row. The habit is starting." |
| 7 days | "A full week. You're building something real." |
| 14 days | "Two weeks of showing up. That's discipline." |
| 30 days | "30 days. Most people never get here. 🔥" |
| Streak broken (back to 1) | "Starting fresh. Every streak begins at 1." |

Show the milestone message as a toast when the streak ticks up, not just in the stats modal.

---

### 8. AI System Instruction — Sharpen the Coach Voice

**Current system instruction:**
```
You are ClariTask AI, a supportive productivity coach.
Your personality: Warm, brief, and actionable.
Guidelines:
- Keep responses under 3 sentences.
- Focus on small wins.
- When breaking down tasks, provide 2-5 concrete subtasks.
- Each subtask must be completable under 1 hour
```

**Proposed additions:**
```
- Never use corporate productivity jargon ("leverage", "synergy", "action items").
- Validate effort before giving advice — acknowledge what the user is trying to do.
- When a task is vague, be curious not critical. Ask one warm question.
- When breaking down a big task, lead with "Here's how I'd think about this:" not a bullet dump.
- Never make the user feel behind. There is no behind.
```

---

### 9. Empty State — Don't Waste the Moment

**Current:** "No tasks yet. You're free!"

**Proposed:** If the user has been active before (has task history), vary it:

| Context | Message |
|---------|---------|
| Morning, no tasks | "Clean slate. What's the one thing today?" |
| Afternoon, all done | "All clear. Rare and earned. Enjoy it." |
| New user | "You're free! Add your first task when ready." |

---

### 10. Chat Help — Validate Help-Seeking

**Current:** Chat opens, user types, AI responds. No acknowledgement of the act itself.

**Proposed:** Add a single welcome line when chat opens for the first time on a task:

> "Let's think through this together."

Short, warm, sets the collaborative tone before the user even types.

---

## What Not to Do

- **Don't add more modals.** The personality should come through in the existing moments, not new interruptions.
- **Don't use AI calls for static copy.** The completion messages, placeholder rotations, and milestone texts should all be local strings — no latency, no cost.
- **Don't over-celebrate.** Every action doesn't need a reaction. Silence after routine actions is fine. Make the moments that do get a reaction feel earned.
- **Don't change the onboarding.** It already nails the tone. Leave it.

---

## Implementation Order (suggested)

| Priority | Change | Effort |
|----------|--------|--------|
| 🔴 High | Task completion inline message | Low — static strings + simple logic |
| 🔴 High | Task limit warning copy | Trivial — 2 lines of copy |
| 🔴 High | AI system instruction additions | Trivial — edit server.js |
| 🟡 Medium | Moved badge voice + AI chat link at 3x | Low |
| 🟡 Medium | Input placeholder rotation | Low |
| 🟡 Medium | Streak milestone toasts | Medium |
| 🟢 Later | Focus mode coaching line + completion check-in | Medium |
| 🟢 Later | Daily recap day-aware header | Low |
| 🟢 Later | Empty state variations | Low |
| 🟢 Later | Chat "let's think through this together" | Trivial |
