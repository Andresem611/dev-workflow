---
name: pause
description: Pauses feature development mid-pipeline. Captures full context for resumption — current phase, stage, completed work, remaining work, blockers. No inner loop. Triggers on /dev:pause or "pause", "stop for now", "pick this up later".
---

# /dev:pause — Pause Pipeline with Handoff

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
1. Run `/dev` — router will detect MANIFEST with pause state
2. Read this file for context
3. Read `.dev/[current-phase]/[latest-artifact].md` for stage state
4. Continue from [stage] in [phase]

### Domain-Specific Resume Checks
- Verify dev server starts cleanly (`npm run dev`)
- Check for stale `node_modules` (`npm install` if lock file changed)
- Confirm no TypeScript errors (`npm run type-check`)
- Review any upstream design system changes since pause

## Key Decisions Made
[Summary of locked decisions from MANIFEST decision log, if available]

## Files Modified This Session
[List of files created or modified with brief descriptions]
```

---

## Step 3: Notion Update

Update the Dev Tracker card with pause context. Read the Card ID from MANIFEST's `## Notion Integration > Card ID`.

1. **Update card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: Card ID from MANIFEST
   - Properties: Notes = append "Paused at [phase]/[stage] on [date]. Reason: [blocker or user-initiated]. Resume from [phase]:[stage].", Last Updated = today's ISO date

2. Display: `📋 Notion: Updated notes — "[Feature Name]" (paused at [phase]/[stage])`

**Notion Protocol:** Follow the Retry + Warning Protocol in `references/notion-integration.md`.
- Phase type: Downstream (status update — check Card ID first)
- Target status: (notes update, no status change)
- Persist warning in: `.dev/pause-handoff.md`

## Step 4: Update MANIFEST

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

## Step 5: Checkpoint

Run the checkpoint tool to persist state:

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js checkpoint-state <feature-dir> --scope phase --plugin frontend
```

---

## Step 6: WIP Commit

Stage pause-handoff artifacts and any in-progress feature edits, then create a WIP commit. NEVER blanket-stage with `-A` or `.` — pause must capture in-progress work for resume but cannot stage arbitrary files (potential secrets).

```bash
# Stage pause-handoff artifacts (not arbitrary files)
git add .dev/

# If feature files were modified during the active wave (must capture for resume):
# User reviews modified files and stages explicitly
FILES_LIST=$(git status --porcelain | awk '$1 ~ /^[MARD?]/ {print $2}' | grep -v '^\.dev/')
TOTAL=$(echo "$FILES_LIST" | grep -c '.')
echo "Showing all $TOTAL files modified this session:"
echo "$FILES_LIST"
# Untracked (?) files are intentionally included — pause must capture
# newly-created feature files for resume. Deletions (D) and renames (R)
# are also captured so the resume state matches working-directory state.
echo "Stage these files? (y/N) — pause must capture in-progress feature edits"
# If user confirms YES, stage each file explicitly:
echo "$FILES_LIST" | while read -r f; do
  [ -n "$f" ] && git add "$f"
done
```

Commit message format:

```
WIP: [Feature Name] — paused at [phase]/[stage]

Pause handoff written. Resume with /dev.

Publication Status: Not Published

Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

---

### Step 7 — Artifact-vs-Code Consistency (warn, non-blocking)

After environment freshness checks (Step 5/6) pass, run:

```bash
PAUSE_COMMIT=$(grep '^pause-commit:' .dev/pause-handoff.md | cut -d: -f2 | tr -d ' ')
git diff --stat "${PAUSE_COMMIT}..HEAD" -- src/ 2>/dev/null
```

If output is non-empty: surface to user (warn, non-blocking):

> **Code drifted during pause.** `git diff --stat` shows changes since pause-commit:
>
> <stat>
>
> Re-load context before continuing. The `.dev/build/<phase>` artifacts may not reflect current src/ state. Run `/dev:document` review pass or revisit affected wave files.

If output is empty: log "Step 7: no src/ drift since pause-commit" and continue.

This step does NOT block resume — pause checkpoint is recoverable from. The warning gives the user the opportunity to re-load before BUILD/VALIDATE consume stale artifacts.

---

## Step 8: Confirm

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
