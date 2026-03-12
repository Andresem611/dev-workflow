---
name: pause
description: Pauses backend feature development mid-pipeline. Captures full context for resumption — current phase, stage, completed work, remaining work, blockers. No inner loop. Triggers on dev-pipeline-backend:pause or "pause", "stop for now", "pick this up later".
---

# dev-pipeline-backend:pause — Pause Pipeline with Handoff

**NO INNER LOOP.** PAUSE is an operational interrupt, not a development phase. It does NOT run Discuss/Architect/Execute/Review. It follows a GSD-style state dump: capture state, write handoff, commit, confirm. That is all. (Design decision D16.)

Can be invoked from ANY phase at ANY stage. The capture step adapts to whatever phase/stage is currently active.

---

## Step 1: Capture State

Gather from MANIFEST and current session context:

| Field | Source | Example |
|-------|--------|---------|
| **Current phase** | MANIFEST + session | BUILD |
| **Current stage** | Session context | Execute |
| **Wave number** | MANIFEST (BUILD only) | wave-03 |
| **Completed phases** | MANIFEST phase statuses | INTAKE, DISCOVER, PLAN |
| **Completed stages in current phase** | Phase directory artifacts | Discuss, Architect |
| **Remaining stages** | Infer from completed | Review |
| **Remaining phases** | MANIFEST pipeline definition | VALIDATE, SHIP |
| **Blockers** | User or session context | "Waiting on API contract for /bookings" |
| **Key decisions made** | MANIFEST decision log | Locked decisions from PLAN |
| **Files created/modified** | Git status + session tracking | List of paths |

---

## Step 2: Write Handoff

Create `.dev/pause-handoff.md` in the feature's `.dev/` root directory:

```markdown
# Pause Handoff — [Feature Name]

**Paused At:** [Phase] / [Stage] / [Wave if BUILD]
**Paused On:** [YYYY-MM-DD HH:MM UTC]

## State Summary
- **Completed Phases:** [list]
- **Current Phase:** [phase] — [stage]
- **What's Done in Current Phase:** [list of completed stages and artifacts]
- **What Remains in Current Phase:** [remaining stages]
- **Remaining Phases:** [list]

## Blockers
[Any blockers preventing progress, or "None — user-initiated pause"]

## Resume Instructions
1. Run `dev-pipeline-backend:dev` — router will detect MANIFEST with pause state
2. Read this file for context
3. Read `.dev/[current-phase]/[latest-artifact].md` for stage state
4. Continue from [stage] in [phase]

### Domain-Specific Resume Checks
- Verify migration status on both databases (`rails db:migrate:status` + `RAILS_ENV=production rails db:migrate:status`)
- Check Solid Queue is running (`bundle exec rake solid_queue:start`)
- Confirm full RSpec suite passes (`bundle exec rspec`)
- Review any schema changes since pause (`git diff db/structure.sql`)

## Key Decisions Made
[Summary of locked decisions from MANIFEST decision log, if available]

## Files Modified This Session
[List of files created or modified with brief descriptions]
```

---

## Step 3: Update MANIFEST

Add pause context block to MANIFEST:

```markdown
## Pause Context
- **Status:** paused
- **Paused At:** [phase] / [stage]
- **Paused On:** [YYYY-MM-DD HH:MM UTC]
- **Resume From:** [phase]:[stage]
```

Set MANIFEST status field to `paused`.

---

## Step 4: Checkpoint

Run the checkpoint tool to persist state:

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js checkpoint-state <feature-dir> --scope phase --plugin backend
```

---

## Step 5: WIP Commit

Stage all changes and create a WIP commit:

```bash
git add -A
```

Commit message format:

```
WIP: [Feature Name] — paused at [phase]/[stage]

Pause handoff written. Resume with dev-pipeline-backend:dev.

Publication Status: Not Published

Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

## Step 6: Confirm

Use `AskUserQuestion` to confirm:

> "Pause handoff written to `.dev/pause-handoff.md`, MANIFEST updated, state checkpointed, and WIP committed. Verified?"

User confirms handoff is complete. **STOP.** Session ends here.

---

## Rules

- ALWAYS update MANIFEST with pause context before stopping
- ALWAYS write `pause-handoff.md` with structured resume instructions
- ALWAYS specify the exact next action — not just "continue BUILD" but "Resume Execute stage in BUILD wave-03, task 4"
- ALWAYS include locked decisions in handoff so they are not re-debated on resume
- ALWAYS list all artifact file paths with current state
- ALWAYS run checkpoint-state before committing
- NEVER leave a pause without a handoff file — context WILL be lost
- NEVER skip the WIP commit — uncommitted state is lost state
