---
name: build
description: Use when dev-pipeline:build is invoked or MANIFEST shows BUILD phase. Executes tier-driven task waves with auto-escalation on errors.
---

# dev-pipeline:build — Tier-Driven Task Execution

Execute implementation waves from DOCUMENT phase plans. Inner loop per wave: RESEARCH, EXECUTE, DOCUMENT, GATE.

## Inner Loop

```
┌─► RESEARCH → EXECUTE → DOCUMENT → GATE ─┐
│                                           │
└───── next wave ◄─────────────────────────┘
```

---

## 1. RESEARCH (Per Wave)

Read these files before each wave:

1. **MANIFEST** (`docs/[feature]/.dev/MANIFEST.md`) — current wave, completed tasks, tier, domains
2. **Wave execution plan** — from `waves/` directory (e.g., `docs/[feature]/waves/WAVE_01.md`), written during DOCUMENT phase
3. **Transition files** (`prompt-transitions/`) — decisions and context from prior phases
4. **01_IMPLEMENTATION_STATUS.md** — what's already done

Confirm: which tasks are in this wave, what are their dependencies, what's the tier?

---

## 2. EXECUTE (Tier-Driven)

### KNOWN Tier — Sequential Solo

Execute tasks one at a time, no subagents. You do the work directly.

```
Task 1 → verify → Task 2 → verify → ...
```

### COMBINATION Tier — Wave-Parallel Subagents

Dispatch all tasks in the current wave as parallel subagents via Agent tool in a SINGLE message.

```
Agent call 1: "Implement [Task A]. Context: [paste from wave plan]"
Agent call 2: "Implement [Task B]. Context: [paste from wave plan]"
```

Each subagent prompt MUST include:
- Task file path and acceptance criteria
- Relevant architecture decisions from MANIFEST decision log
- Files to create/modify (from wave plan)
- Thoven coding rules: API calls via `lib/*-api.ts`, no `orange-*` classes, `amber-500` for orange

### NOVEL Tier — Expert-Reviewed Waves

Same as COMBINATION dispatch, but after each wave completes, dispatch a code-reviewer agent:

```
Agent: code-reviewer
Prompt: "Review wave [N] changes for [feature]. Check: architecture compliance,
edge cases, design system adherence. Files changed: [list]. Decision log: [paste]."
```

Do NOT proceed to next wave until reviewer findings are addressed.

---

## 3. Auto-Escalation (Error Handling)

When a task fails verification (type-check, lint, runtime error):

```
Error occurs
  │
  ├─ Simple? (typo, missing import, wrong prop) → Self-fix, 1 retry max
  │
  └─ Complex? (logic error, state bug, race condition)
     │
     ├─ Classify bug type (use investigate categories):
     │   Simple UI │ API │ State │ Performance │ Intermittent │ Unknown
     │
     ├─ Dispatch investigation agents:
     │   ┌─────────────────────┬──────────────────────┐
     │   │ Bug Type            │ Agents               │
     │   ├─────────────────────┼──────────────────────┤
     │   │ Simple UI           │ code-explorer        │
     │   │ API/backend         │ debug-specialist     │
     │   │ State management    │ BOTH in parallel     │
     │   │ Performance         │ debug-specialist     │
     │   │ Intermittent/Unknown│ BOTH in parallel     │
     │   └─────────────────────┴──────────────────────┘
     │
     ├─ Synthesize findings → apply fix
     │
     └─ Fixed? → Resume. Not fixed? → Increment strike counter.
```

### 3-Strikes Rule

Track strikes PER FEATURE (not per task). After 3 failed fix attempts:

**STOP. Present all 3 attempts and why each failed. Then offer:**

1. **Guide fix manually** — User provides direction, you implement
2. **Revise plan** — Return to PLAN phase (re-architecture the approach)
3. **Pause feature entirely** — Invoke dev-pipeline:pause with full context

Do NOT attempt a 4th fix without explicit user direction.

### Investigation Agent Prompts

**debug-specialist** (for complex errors during BUILD):
```
Investigate this BUILD failure in the Thoven codebase:

TASK: [task name and file]
ERROR: [exact error output]
CONTEXT: [what was being implemented]
FILES CHANGED: [list modified files]

1. Find root cause with file:line references
2. Check if error is in new code or pre-existing
3. Propose 2 fix approaches with trade-offs

CODEBASE: Next.js 14, React 18, Tailwind CSS 4.1, API via lib/*-api.ts
```

---

## 4. DOCUMENT (After Each Task)

Update these files after every completed task:

| File | Update |
|------|--------|
| **MANIFEST** | Task status (done/failed), current wave progress, strike count |
| **01_IMPLEMENTATION_STATUS.md** | Mark task complete, note any deviations |
| **CURRENT_STATUS.md** | Current state for session resumability |

If investigation was triggered, also log:
- Bug classification and root cause
- Fix applied and reasoning
- Whether pattern should be added to common-errors.md

**After final wave completes**, generate transition file:
- `prompt-transitions/build-to-validate.md` — summarize: tasks completed, any deviations from plan, investigation results, files changed, domains touched

---

## 5. GATE: G5 — Wave Completion

### Auto-pass (KNOWN tier)
Verify passes (type-check + lint) → auto-advance to next wave.

### Mandatory review (COMBINATION + NOVEL tiers)

Present wave completion summary:

```markdown
## Wave [N] Complete

### Tasks Completed
- [x] Task A — [brief result]
- [x] Task B — [brief result]

### Verification
- Type-check: PASS/FAIL
- Lint: PASS/FAIL
- [NOVEL only] Code review: findings addressed

### Issues Encountered
- [any escalations, strikes, deviations from plan]

### Next Wave Preview
- Task C, Task D (wave N+1)

**Options:** Continue to wave [N+1] / Revise plan / Pause
```

---

## 6. Frontend Verification

Run after EVERY wave (all tiers):

```bash
npm run type-check    # tsc --noEmit
npm run lint          # ESLint
```

Both must pass before wave is marked complete. If either fails, treat as a simple error (self-fix, 1 retry) before escalating.

### Design System Compliance (domain: `design-system`)

If MANIFEST domains include `design-system`, check after each wave:
- No `orange-*` classes (use `amber-500` / `--color-thoven-orange`)
- `font-display` (Fredoka) only on `h1`/`h2` — everything else `font-sans` (Montserrat)
- 3D button pattern follows design system spec
- New components follow existing patterns in `components/ui/`

---

## 7. Session Boundary Recommendations

BUILD phases can be long. Recommend session breaks when:

- **3+ waves completed** — context is getting heavy
- **After a complex escalation** — fresh context prevents compounding errors
- **Wave boundary** — natural breakpoint with state saved in MANIFEST

Before breaking: ensure MANIFEST, CURRENT_STATUS.md, and 01_IMPLEMENTATION_STATUS.md are fully updated. The next session resumes from MANIFEST state via `/dev`.

---

## Common Mistakes

| Mistake | Why It Fails | Prevention |
|---------|-------------|------------|
| Dispatching subagents for KNOWN tier | Wastes context on simple tasks | Check MANIFEST tier before executing |
| Skipping type-check between waves | Errors compound across waves | Always run verify after every wave |
| Retrying same fix approach on strike 2-3 | Same approach won't suddenly work | Each retry must use a DIFFERENT strategy |
| Not including decision log in subagent prompts | Subagents make contradicting architecture choices | Paste relevant decisions from MANIFEST |
| Fixing symptoms instead of root cause during escalation | Bug resurfaces in next wave | Use investigate classification + agents |
| Continuing after 3 strikes | Likely architectural issue, not local | STOP and present options to user |
| Not updating MANIFEST after each task | Session break loses progress | Document immediately, not in batch |
| Skipping code-reviewer for NOVEL tier | High-risk code ships unreviewed | Reviewer is mandatory per wave for NOVEL |
