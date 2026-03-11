# Frontend Session Boundary Alignment

## What This Is

The backend investigated how GSD handles session boundaries before implementing its own fix. This document shares those findings so the frontend can align on the same pattern. The goal: both `dev-pipeline-frontend` and `dev-pipeline-backend` use an identical gate-close pattern, since this part of the pipeline isn't repo-specific.

---

## What GSD Actually Does (the reference implementation)

GSD treats every phase as a fully independent CLI invocation. When a phase completes, the output looks like:

```
---
▶ Next Up

Phase 03.3.1: Tiled visual map design pass

/gsd:plan-phase 03.3.1

/clear first → fresh context window
```

There is no tier-based matrix. No "required vs recommended" distinction. No continuation prompt file to copy-paste. The phase ends, the next command is displayed, and the user runs `/clear` then invokes the command. The command itself knows how to bootstrap context because the skill's opening section reads state from disk (STATE.md, ROADMAP.md, SUMMARY files).

Key GSD principles:
- **Sessions are mortal** — all state persists to disk in human-readable files
- **Phase transitions are structural stops**, not decision points
- **`/clear` is offered at every boundary** — not conditionally gated by tier
- **No continuation prompt files** — the command + state files are sufficient

---

## How the Frontend's Current Fix Diverges

The frontend added three things that GSD deliberately doesn't have:

**1. Tier-based break enforcement matrix** — a table mapping each gate × tier to required/recommended/never-break. This makes the gate a decision point ("should I stop here or continue?"). GSD never asks — it always stops.

**2. `continuation-prompts/` directory** — lightweight prompt files written at each gate for copy-pasting into a fresh session. These duplicate context already present in the transition files (`prompt-transitions/`).

**3. "Continue in same session" option for KNOWN tier** — GSD doesn't offer this. Every phase ends regardless of complexity. KNOWN phases are just faster, so the break costs almost nothing.

The divergence: the gate is still a routing decision point ("break or continue?") rather than a hard stop. The fix added a layer on top of the existing transition system instead of making the existing system work like GSD.

---

## The Aligned Pattern (What the Backend Implemented)

### Gate Close (every phase, every tier)

After the user approves at a gate:

1. Update MANIFEST (existing behavior — unchanged)
2. Write transition file to `prompt-transitions/` (existing behavior — unchanged)
3. Display and stop:

```
---
▶ Next Up

Phase: PLAN — Architecture decisions + task breakdown

`dev-pipeline-frontend:plan`

/clear first → fresh context window
```

4. Do not invoke the next phase. Session ends here.

### Phase Open (every phase)

Each skill's RESEARCH section already reads MANIFEST + transition file. No changes needed — just verify each skill does this on entry.

### BUILD per-wave handling

After every 3 waves (COMBINATION/NOVEL): display next wave command + `/clear`. After 3-strike escalation: same. KNOWN tier: waves continue within session (fast, sequential, low context).

### What to remove from frontend skills

- **`continuation-prompts/` references and generation logic** — transition files already carry this context
- **Tier-based break enforcement matrix** — every gate is a hard stop
- **"Continue in same session" option** — remove from all gates

### What stays unchanged

- Inner loop (RESEARCH → EXECUTE → DOCUMENT → GATE) — untouched
- Gate approval options (Approve / Revise / Pause) — unchanged
- Transition file generation (`prompt-transitions/`) — this is the enhancement over raw GSD
- MANIFEST state management — unchanged
- Tier-driven behavior within phases (boardroom depth, agent dispatch, etc.) — unchanged

---

## Why Transition Files Stay (The One Enhancement Over GSD)

GSD phases are loosely coupled — Phase 1 and Phase 2 share context through generic state files. Each phase reads what happened and figures out what's relevant.

Feature development phases are tightly coupled. DISCOVER produces design options and domain findings. PLAN needs those *specific* outputs as structured input. PLAN produces locked decisions and wave groupings. DOCUMENT needs the *exact* decision log. Each phase's output is the next phase's structured input.

GSD's SUMMARY.md captures **what was done**. Our transition files capture **what the next phase needs to consume**. The transition file pre-curates the context so the fresh session loads faster, uses less window, and starts with exactly the right information. This is the one enhancement over GSD. Everything else follows GSD exactly.

---

## Frontend Action Items

Reference: `plugins/dev-pipeline-frontend/skills/*/SKILL.md`

- [ ] Each skill's GATE section: end with `▶ Next Up` block instead of routing
- [ ] Each skill's TRANSITION section: replace "invoke next phase" with "end session"
- [ ] Remove `continuation-prompts/` references and generation logic
- [ ] Remove tier-based break enforcement matrix
- [ ] Remove "continue in same session" option from gates
- [ ] Verify each skill's RESEARCH section reads MANIFEST + transition file on entry
- [ ] BUILD skill: add per-wave break pattern (every 3 waves for COMBINATION/NOVEL)
