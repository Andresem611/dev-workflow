# BUILD Phase Overhaul — Design Document

**Date:** 2026-03-30
**Status:** Approved (eng review complete, outside voice incorporated)
**Target:** dev-pipeline-backend plugin v4.0.0 (thoven-dev marketplace, aligning with frontend v4.0.0)
**Rollback:** Revert to v3.3.1 via settings.json version pin

## Problem Statement

Audit of 5 completed features (Google Calendar, Unified Conflict Service, Partner Credit, Classroom Todo, Summer Academy) revealed that the BUILD phase has broken plumbing, missing coordination mechanisms, and a phantom verification gate.

### Evidence

**Broken plumbing:**
- `verify-must-haves` referenced 3x in build skill, not implemented in `dev-pipeline-tools.js`
- Shared `inner-loop-reference.md` referenced by backend supplement but file doesn't exist
- Local v1 skill files in `.claude/skills/dev/` contradict installed v3.3.1 plugin

**Coordination failures (from real builds):**
- Google Calendar W4: Webhook URL mismatch between waves (W1 hardcoded `/api/v1/webhooks/google_calendar`, W4 placed route at `/webhooks/google_calendar`) — caught by security reviewer
- Google Calendar W2: Cancelled event ordering bug (nil-time guard fired before cancelled-event check) — caught by code reviewer
- Unified Conflict Service: BookingApprovalService not migrated to unified service, IntroAvailabilityService dropped session conflicts, N+1 query (288 queries/grid)

**Verification gaps:**
- `verify-must-haves` tool never runs (phantom command)
- API contract written once in DOCUMENT, never verified during BUILD
- 3 of 5 features have incomplete artifact trails (60-100% of wave artifacts missing)
- RSpec deferred to Replit across ALL features (no local DB in worktrees)

## Plan Overview

Three phases, shipped incrementally. Plugin version pinned for rollback.

```
Phase 1: Broken Plumbing          (Items 1-3, parallel)
Phase 2: Coordination Stack       (Items 4-6, designed together, shipped together)
Phase 3: Computer Use Spike       (Item 7, design only, implement later)
```

## Phase 1: Broken Plumbing

### Item 1: Implement verify-must-haves in dev-pipeline-tools.js

Add 5th command to `shared/tools/dev-pipeline-tools.js` following the existing commander pattern (validate-stage-entry, validate-stage-output, checkpoint-state, validate-manifest).

**Command:** `node dev-pipeline-tools.js verify-must-haves <feature-dir> --plugin backend --wave N`

**Checks:**
1. File existence — every path in `must_haves.artifacts` exists on disk
2. Route existence — routes in `must_haves.key_links` exist in `config/routes.rb`
3. Spec block check — spec files have at least one `it`/`describe` block
4. Anti-stub patterns — no `TODO`, `FIXME`, `raise NotImplementedError`, `placeholder` in created files

**Exit codes:**
- 0: all checks pass
- 1: one or more checks fail (prints failures to stdout)

**Location:** `shared/tools/dev-pipeline-tools.js` (additive, ~60-80 lines)

### Item 2: Ship shared inner-loop-reference.md

Create the canonical reference file that both backend and frontend supplements point to.

**Location:** Plugin `shared/references/inner-loop-reference.md`

**Contains:**
- D04 enforcement protocol (prompt-generator hard gate)
- Stage mechanics (Discuss/Architect/Execute/Review)
- Transition rules (review bridges, context passing)
- AskUserQuestion enforcement rules
- Mandatory subagent dispatch rules

Backend and frontend `references/inner-loop-reference.md` files become supplements that import this shared base.

### Item 3: Delete stale local v1 skill files

**Delete:** All files in `.claude/skills/dev/` that duplicate v3.3.1 plugin functionality:
- `build.md` (v1 RESEARCH/EXECUTE/DOCUMENT/GATE pattern)
- `SKILL.md` (v1 router with tier system)
- `discover.md`, `plan.md`, `document.md`, `validate.md`, `ship.md`, `handover.md`, `pause.md`, `intake.md`

**Keep:** `references/` directory (codebase-context-block.md, etc.) — these are project-specific, not plugin-duplicated.

**Pre-check:** Grep codebase for references to local skill paths before deletion. Update any references to point to plugin paths.

## Phase 2: Coordination Stack

Items 4, 5, and 6 are designed as one coherent system and shipped together. The verify-fix loop accounts for Agent Teams context. The living contract works with or without teams. The orchestrator owns contract updates regardless of execution strategy.

### Item 4: Verify-Fix Loop

Replace the one-shot Review gate with a retry loop.

```
Execute Wave (parallel subagents, default)
    |
Verify:
  Layer 1: bundle exec rspec (mechanical)
  Layer 2: verify-must-haves (mechanical)
  Layer 3: code-reviewer agent (semantic)
    |
  PASS --> Update completion logs --> Next wave
  FAIL --> Fix loop
    |
Fix (Retry 1):
  Resume SAME agent via SendMessage
  Context: verification failure details only
  "Your code at file:line has [issue]. Fix it."
    |
Re-verify (same 3 layers)
    |
  PASS --> Next wave
  FAIL --> Fix (Retry 2, same agent)
    |
Re-verify
    |
  PASS --> Next wave
  FAIL --> Escalate to /dev:pause
    User options: manual fix, revise plan, pause feature
```

**Design decisions:**
- Same-agent retry (cheapest, has build context)
- 2-retry cap, then escalate (matches existing 3-strike rule)
- Context window overflow mitigation: if agent's response quality degrades noticeably on retry, dispatch a fresh agent instead (heuristic, not token-count-based)

**Under Agent Teams:** When a wave uses Agent Teams (opt-in), the verify-fix loop runs against the team's collective output. Individual teammate failures are handled by the team lead first. Only whole-wave verification failures trigger the retry loop.

### Item 5: Living API Contract

`API_CONTRACT.md` becomes a living artifact updated during BUILD.

**Format:** Structured markdown tables (parseable by verify-must-haves via regex):

```markdown
## API Contract (living)

| Endpoint | Method | Auth | Status | Response Shape | Added By |
|----------|--------|------|--------|----------------|----------|
| /api/v1/calendar/events | GET | Bearer | 200 | {data: [{id, title, start, end}]} | Wave 2 (T09) |
| /api/v1/calendar/sync | POST | Bearer | 202 | {message: "sync started"} | Wave 3 (T12) |

Last verified: Wave 4 review
```

**Update responsibility: ORCHESTRATOR, not agents.**

After each wave completes, the orchestrator:
1. Reads `config/routes.rb` for new/changed routes
2. Reads serializer files for response shapes
3. Diffs against current API_CONTRACT.md
4. Updates the contract with new/changed endpoints
5. Notes which wave/task added each entry

This eliminates the parallel-write problem entirely. Agents build code. The orchestrator tracks what was built.

**Verification:** `verify-must-haves` cross-references contract endpoints against `config/routes.rb`. Mismatches fail the verification gate.

**Handover consumption:** `/dev:handover` reads the living contract instead of generating one from scratch. The contract is already verified against actual code, so handover drift is eliminated.

### Item 6: Agent Teams Opt-In

Agent Teams activation is user opt-in per wave during the Discuss stage.

**Default:** Standard parallel subagent dispatch (unchanged from v3.3.1).

**Discuss stage addition (meta-question 5):**

```
"This wave has [N] parallel tasks.
 Tasks [X] and [Y] share [service/model/table].
 Use Agent Teams for real-time coordination? (default: no)

 A) No — standard subagent dispatch (faster, cheaper)
 B) Yes — Agent Teams (shared task list, teammates message each other)
"
```

**When Agent Teams is active for a wave:**
- Team lead = orchestrator (main Claude Code session)
- Teammates = one per task (or grouped tasks)
- Shared task list = wave plan tasks
- Communication: teammates announce file changes via team messaging
- TeammateIdle hook: triggers completion log update
- TaskCompleted hook: orchestrator updates living contract

**When Agent Teams is NOT active (default):**
- Standard Agent tool dispatch (current behavior)
- Completion logs for inter-wave context (current behavior)
- Sequential Awareness Gate for pre-flight overlap check (current behavior)
- Verify-fix loop for post-flight catch (new in this plan)

**Both modes use the same verify-fix loop and living contract.** The coordination stack is designed to work with or without teams.

## Phase 3: Computer Use Verification (Design Only)

Design the architecture for Anthropic Computer Use API integration in the VALIDATE phase. Implementation deferred until Phase 1 + Phase 2 are working.

### Architecture

```
VALIDATE Phase — Computer Use Verification (Layer 3)

+---------------------------------------------+
|           Docker Container (Xvfb)            |
|                                              |
|   +----------+   +--------------------+     |
|   | Rails app |   | Virtual Display    |     |
|   | port 3001 |   | 1024x768          |     |
|   +----------+   +--------------------+     |
|                                              |
|   +--------------------------------------+  |
|   | Verification Agent (claude -p)       |  |
|   | Tools: computer_20251124 + bash      |  |
|   | Beta: computer-use-2025-11-24        |  |
|   |                                      |  |
|   | 1. Screenshot homepage               |  |
|   | 2. Navigate to new endpoint          |  |
|   | 3. Verify response renders           |  |
|   | 4. Check console for errors          |  |
|   | 5. Screenshot evidence -> artifacts/ |  |
|   +--------------------------------------+  |
+---------------------------------------------+
                    |
         Anthropic API (beta header)
         Requires ANTHROPIC_API_KEY
```

### When it runs

VALIDATE phase only. Not during BUILD (no running server, no database in worktrees).

### Layer integration

```
VALIDATE verification stack:
  Layer 1: bundle exec rspec (full suite)        — existing
  Layer 2: security-engineer agent                — existing
  Layer 3: Computer Use visual verification       — NEW (future)
    - Navigate must_haves endpoints in browser
    - Screenshot each page state
    - Verify no console errors
    - Save screenshots to .dev/validate/screenshots/
    - Pass/fail report in validate artifacts
```

### Requirements for implementation

- Dockerfile: Xvfb + Ruby/Rails + PostgreSQL + Chrome/Firefox
- Python or TypeScript agent loop using Anthropic SDK
- Beta header: `computer-use-2025-11-24`
- Tool definition: `computer_20251124` with `display_width_px: 1024, display_height_px: 768`
- Verification script reads must_haves endpoints and navigates to each
- Screenshot artifacts saved to `.dev/validate/screenshots/`
- Integration with VALIDATE skill as optional Layer 3 (user opt-in)

### Token cost

- 466-499 tokens system prompt overhead
- 735 tokens per tool definition
- Screenshot images follow Vision pricing
- Estimate: ~$0.50-1.00 per VALIDATE run (5-10 screenshots)

## Rollback Strategy

Ship as plugin v4.0.0. Pin version in settings.json:

```json
{
  "plugins": {
    "dev-pipeline-backend@thoven-dev": {
      "version": "4.0.0"
    }
  }
}
```

If any item breaks the pipeline mid-feature, revert to v3.3.1 by changing the version number. No data migration, no code changes. Instant rollback.

## Execution Plan

### Phase 1 (parallel, no dependencies)

| Item | Work | Estimated CC Time |
|------|------|-------------------|
| 1. verify-must-haves | Add command to dev-pipeline-tools.js (~60-80 lines) | ~15 min |
| 2. inner-loop-reference | Create shared reference, update supplements | ~15 min |
| 3. Stale file cleanup | Grep for references, delete files | ~10 min |

### Phase 2 (designed together, shipped together)

| Item | Work | Estimated CC Time |
|------|------|-------------------|
| 4. Verify-fix loop | Modify build skill Execute/Review stages | ~30 min |
| 5. Living contract | Add orchestrator contract update step, modify verify-must-haves | ~20 min |
| 6. Agent Teams opt-in | Add Discuss meta-question, team dispatch path, hooks | ~30 min |

### Phase 3 (separate spike)

| Item | Work | Estimated CC Time |
|------|------|-------------------|
| 7. Computer Use design | This section of this document (done) | ~0 min |

**Total estimated CC time:** ~2 hours
**First test:** Summer Academy feature (currently at DOCUMENT, heading to BUILD)

## NOT in Scope

- **Model routing (Haiku/Sonnet for simple tasks)** — User fine with Opus for now. Revisit when token cost becomes a concern.
- **claude-peers-mcp** — Shelved. 9 days old, silent message loss bug, broken worktree scope. Agent Teams solves the same problem natively.
- **OMC/Ruflo framework adoption** — Patterns stolen (verify-fix loop, orchestrator-owned contracts), not the frameworks.
- **Frontend pipeline changes** — Backend BUILD only. Frontend pipeline gets same improvements when shared inner-loop-reference ships.
- **Serial-first default** — Considered and rejected. Parallelism stays for speed. Coordination stack (verify-fix + living contract + Agent Teams opt-in) addresses coordination bugs.
- **Computer Use implementation** — Design only in this plan. Implement after Phase 1 + 2 are validated.
- **Artifact completeness enforcement** — Captured as TODO for follow-up. The verify-fix loop fixes the root cause going forward.

## What Already Exists (Reused, Not Rebuilt)

- **Completion log system** — Inter-wave context passing via `## Completion Log` in task files. Unchanged.
- **Sequential Awareness Gate** — Pre-flight file/table/migration overlap check. Unchanged.
- **code-reviewer + qa-expert dispatch** — Semantic review in Review stage. Augmented by verify-fix loop.
- **API_CONTRACT.md** — DOCUMENT phase artifact. Upgraded to living artifact.
- **CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS** — Already enabled in settings.json.
- **dev-pipeline-tools.js** — 672-line tool with 4 commands. Gets 5th command (verify-must-haves).

## Ecosystem Research (for context)

Patterns evaluated from the agentic coding ecosystem (2026-03-30):

| Tool | Stars | Pattern Taken |
|------|-------|---------------|
| oh-my-claudecode | 17.5k | Staged pipeline with verify-fix loops |
| Ruflo | 28.6k | Orchestrator-owned contract updates, drift prevention |
| wshobson/agents | 32.6k | Progressive context disclosure (agents get minimal context, expand on demand) |
| Claude Code Agent Teams | Official | Shared task list, inter-agent messaging, lifecycle hooks |
| Claude Code Headless SDK | Official | `claude -p` for scriptable orchestration |
| Anthropic Computer Use | Official | Screenshot + mouse/keyboard control for visual verification |

## Open Questions

1. **Context window overflow on verify-fix retry** — If an agent used most of its context during build, the retry may degrade. Current mitigation: heuristic detection, fallback to fresh agent. May need refinement after real-world testing.
2. **Agent Teams token cost** — No production data on how much more expensive team dispatch is vs subagents. First test will establish baseline.
3. **Computer Use Docker setup** — Exact Dockerfile composition TBD during implementation. Reference implementation at `github.com/anthropics/anthropic-quickstarts/tree/main/computer-use-demo`.
