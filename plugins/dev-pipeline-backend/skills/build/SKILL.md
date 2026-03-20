---
name: build
description: Executes implementation tasks wave-by-wave for a backend feature. Runs the 4-stage inner loop per wave with backend-specific agents, RSpec verification, and dual-database migration handling. Triggers on dev-pipeline-backend:build or when /dev router advances past DOCUMENT.
---

# /dev:build — Wave-by-Wave Implementation

Execute implementation tasks wave by wave. Each wave runs its own full 4-stage inner loop: Discuss, Architect, Execute, Review. Subagents are dispatched for every task — the orchestrator never builds inline.

## Inner Loop (Per Wave)

```
For each wave (wave-01, wave-02, ..., wave-NN):

  ┌─► Discuss → Architect → Execute → Review ─┐
  │                                             │
  │   checkpoint-state, optional /clear         │
  │                                             │
  └──────── next wave ◄────────────────────────┘

After final wave: Review bridges to VALIDATE
```

The inner loop runs ONCE PER WAVE, not once for the entire phase. This is decision D14 from the inner loop reference. Each wave gets its own subdirectory under `.dev/build/wave-NN/`.

---

## Stage 1: Discuss — Implementation Path (Per Wave)

### 0. Load Context (MANDATORY — before anything else)

Read these files using the Read tool. Do NOT proceed until all are loaded:

1. **Read** `${PLUGIN_ROOT}/references/domain-agent-map.md` — agent assignments for BUILD phase
2. **Read** `${PLUGIN_ROOT}/references/inner-loop-reference.md` — stage mechanics and enforcement rules
3. **Read** `${PLUGIN_ROOT}/references/codebase-context-block.md` — standard context for subagent prompts
4. `Glob(docs/[feature]/.dev/plan/diagrams/*.d2)` + `Glob(docs/[feature]/.dev/document/diagrams/*.d2)` → if D2 diagrams exist, include their file paths in agent prompts as architecture context
4. **Read** `${PLUGIN_ROOT}/references/agent-prompt-template.md` — fallback template if `/prompt-generator` unavailable

Extract from domain-agent-map.md for BUILD:
- Task-type agents: `master-backend-ai-rails` (models/migrations), `rails-expert` (controllers/services/tests), `security-engineer` (auth/security), `bug-hunter` (complex bugs)
- Review stage agents: `code-reviewer` (MANDATORY every wave), `security-engineer` (when auth/payments domains)
- Check Domain Combination Patterns against MANIFEST tags

These agents MUST be addressed in the Architect stage — either dispatched or explicitly skipped with reason.

**MANDATORY: Load Requirements Context**

Before starting any wave, load `requirements.md` from the feature docs directory. This is the hard contract defining "done" — every build task must work toward satisfying these requirements. Pass relevant requirement IDs to build agents so they know what they're building toward.

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry build discuss <feature-dir> --plugin backend --wave N
```

If FAIL, fix missing prerequisites before proceeding.

### Context Reading

**First wave only:** Read `.dev/document/review-documentation-quality.md` (context bridge from DOCUMENT). If missing, read MANIFEST + wave plans to reconstruct context.

### Notion Update (First Wave Only)

Move the Dev Tracker card to "Backend Dev". Reference `references/notion-integration.md` for property names and MCP tool patterns.

**Notion Protocol:** Follow the Retry + Warning Protocol in `references/notion-integration.md`.
- Phase type: Downstream (status update — check Card ID first)
- Target status: `Backend Dev`
- Persist warning in: `.dev/build/wave-01/discuss-implementation-path.md`

1. Read the Notion card page ID from MANIFEST's `## Notion Integration > Card ID`
2. **Update Dev Tracker card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: card ID from MANIFEST
   - Properties: Status = `Backend Dev`, Last Updated = today's ISO date
3. Display status summary:

```
📋 Notion: Moved — "[Feature Name]" → Backend Dev
```

**All waves:** Read before starting each wave.

| File | Extract |
|------|---------|
| `.dev/MANIFEST.md` | Current wave, completed tasks, domains, decision log |
| `waves/WAVE_NN.md` | Tasks, agent assignments, dependencies, completion criteria |
| `01_IMPLEMENTATION_STATUS.md` | What is already done |
| Previous wave's `review-code-quality.md` | Issues, deviations, lessons (skip for wave-01) |

### Questioning

Use `AskUserQuestion` for every question. One question at a time. No cap — user says "enough" to proceed.

**WHAT questions** — the work itself:

- Implementation approach for the tasks in this wave
- Test strategy (TDD strict, tests after, skip for now)
- Migration strategy (data backfills, zero-downtime concerns)
- Service layer design (new services vs extending existing ones)
- Known gotchas from previous waves or codebase

**HOW meta-questions** — execution strategy:

- "Parallel or sequential agents for this wave?"
- "Code review between individual tasks or end of wave?"
- "TDD strict or flexible for this wave?"
- "Session break after this wave or continue?"
- "Security review needed for this wave? (recommended if auth/payments touched)"

**Automatic Research Pre-Step (MANDATORY for BUILD):**

Before asking WHAT questions, dispatch an Explore agent scoped to this wave's files:

```
Dispatch: Explore subagent
Purpose: Scan files that will change in Wave [N] for recent modifications, current state
Scope: Exact file paths from wave plan, plus nearby files in same directories
```

Resume questioning with findings. This confirms file paths, finds recent changes by other waves, and prevents stale assumptions about current codebase state.

### Artifact

```
.dev/build/wave-NN/discuss-implementation-path.md
```

Captures: all Q&A, locked decisions for this wave, execution preferences.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output build discuss <feature-dir> --plugin backend --wave N
```

---

## Stage 2: Architect — Subagent Prompts (Per Wave)

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry build architect <feature-dir> --plugin backend --wave N
```

### 0. Verify Context Loaded (MANDATORY)

Confirm `domain-agent-map.md` was Read in Discuss. If not, Read it now using the Read tool.
For this wave's tasks, identify which agents from the BUILD Agent Map apply.
Each agent MUST appear in the Orchestration Log as either:
- **Dispatched** — with prompt and success criteria
- **Skipped** — with explicit reason

Also check the **Domain Combination Patterns** table. If MANIFEST domains match any combination (e.g., `auth + students` = COPPA), apply extra considerations to relevant task prompts.

### Prompt Crafting (MANDATORY)

**D04 ENFORCEMENT:** Follow the D04 Enforcement Protocol from `inner-loop-reference.md`. Every subagent prompt MUST go through `/prompt-generator`. Log status in the Orchestration Log section of this artifact.

Use `/prompt-generator` to craft EVERY subagent prompt. No exceptions. Prompt quality determines build quality.

For each task in this wave, define:

| Field | Description |
|-------|-------------|
| **Agent type** | From BUILD Agent Map (see below) |
| **Prompt** | Crafted via `/prompt-generator` |
| **File paths** | Exact files to create/modify/test |
| **Codebase context block** | Relevant architecture, patterns, existing code references |
| **Architecture diagrams** | D2/SVG diagram paths from PLAN/DOCUMENT phases (data flow, service dependencies, state machines, migration chains) — include in prompt so agent has visual architecture context |
| **Success criteria** | What the subagent output must contain and pass |
| **Escalation rules** | What happens if the task fails |

### Execution Plan

Define execution order based on Discuss decisions: **parallel** (independent tasks in a single message), **sequential** (dependent tasks wait for predecessors), or **hybrid**.

### Codebase Context Block

Every subagent prompt MUST include: architecture decisions from MANIFEST, relevant file paths and patterns, backend coding rules (service layer in `app/services/`, dual auth system, `archived_at` soft deletes, UUID primary keys), and Thoven-specific constraints if applicable.

### Migration Planning

For waves with migration tasks: integrate `/safe-migrate` into the subagent prompt, define dual-database execution order (dev first, then production), specify rollback strategy, and flag zero-downtime concerns.

### Security Planning

When MANIFEST domains include `auth`, `payments`, `student_data`, or `coppa`: add `security-engineer` dispatch, include `/security-review` in auth-touching task prompts, and define security acceptance criteria (no mass assignment, proper authorization, COPPA compliance).

### Artifact

```
.dev/build/wave-NN/architect-subagent-prompts.md
```

Contains: all subagent assignments, prompts, execution order, success criteria, escalation rules. Must include the Orchestration Log section.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output build architect <feature-dir> --plugin backend --wave N
```

---

## Stage 3: Execute — Build Tasks (Per Wave)

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry build execute <feature-dir> --plugin backend --wave N
```

**MANDATORY: Pass must_haves to Build Agents**

When crafting the subagent prompt for Execute, include:
1. The `must_haves` block from the current wave file (truths, artifacts, key_links) — **pass the EXACT text, do NOT summarize or paraphrase**
2. The requirement IDs this wave covers (from traceability table in requirements.md) — **copy verbatim**
3. This instruction: "Your implementation is verified against these must_haves. Stubs, placeholders, and TODO comments will be flagged as failures. Every truth must be demonstrably true in the code you write. RSpec specs must exist for every testable requirement."

**WARNING:** The orchestrator MUST copy-paste must_haves and requirements verbatim into the subagent prompt. Summarizing loses specificity — "API returns correct data" is useless vs "API-01: GET /api/v1/bookings returns 200 with paginated JSON including id, student_id, teacher_id, scheduled_at". The verification agent checks against the EXACT text.

### Dispatch Rules

**MANDATORY:** Dispatch subagents for every task. The orchestrator NEVER executes work inline (decision D03).

For each task: dispatch via Agent tool, wait for completion, check against success criteria, log result (pass/fail, files changed, deviations).

**Parallel dispatch:** If Architect marked tasks as independent, dispatch ALL in a SINGLE message using multiple Agent tool calls.

**Failure handling:** Log the failure, continue dispatching remaining tasks, surface ALL failures in Review. Retries happen after Review via 3-strike escalation.

### Auto-Invoke Tools by Task Type

| Task Type | Auto-Invoke | When |
|-----------|-------------|------|
| Migration | `/safe-migrate` | BEFORE running migration |
| Mailer | `/email` | Mailer creation or modification |
| Background Job | Read `.claude/docs/BACKGROUND_JOBS.md` | Job conventions and queue assignment |
| Auth/Security | `/security-review` | Tasks touching authentication or authorization |

### Migration Execution (Dual Database)

When a task includes database migrations, always migrate dev first, then production:

```bash
rails db:migrate                          # Development (helium)
rails db:migrate:status                   # Verify dev
RAILS_ENV=production rails db:migrate    # Production (Neon)
RAILS_ENV=production rails db:migrate:status  # Verify production
```

Both databases MUST be in sync before marking the task complete. If production migration fails, log the failure and surface in Review — do NOT rollback without user approval.

### Result Recording

For each completed subagent, record: files created/modified (exact paths), test results, migration status (both databases), deviations from plan, escalations triggered.

### Artifact

```
.dev/build/wave-NN/execute-build-results.md
```

Contains: per-task results, files changed, migration status, deviations, failures.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output build execute <feature-dir> --plugin backend --wave N
```

---

## Stage 4: Review — Code Quality (Per Wave)

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry build review <feature-dir> --plugin backend --wave N
```

### Mandatory Checks (Every Wave)

These run regardless of user preferences from Discuss:

```bash
bundle exec rspec
```

RSpec MUST pass. If it fails, treat as a simple error — self-fix with one retry before escalating.

### must_haves Verification Gate (Every Wave)

**MANDATORY.** Run the mechanical verification tool before any semantic checks:

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js verify-must-haves <feature-dir> --plugin backend --wave N
```

This checks:
1. Every file in `must_haves.artifacts` exists on disk
2. Routes in `must_haves.key_links` exist in `config/routes.rb`
3. Spec files have at least one `it`/`describe` block (not empty)
4. No anti-stub patterns (`TODO`, `FIXME`, `raise NotImplementedError`, `placeholder`) in listed artifacts

**If FAIL:** Treat as a blocking issue in Review. The orchestrator must fix missing artifacts or stubs before proceeding.

**If PASS:** Proceed to independent semantic verification.

### Independent Semantic Verification (Every Wave)

After the verification gate passes, dispatch an independent verification agent. This agent has NO context from the build process — it reads the must_haves and independently checks the codebase.

**Agent:** `qa-expert`
**Input:** The wave's `must_haves` block (truths, artifacts, key_links) + codebase access (Read, Grep, Glob)
**NOT provided:** Build artifacts, execute results, architect prompts, or any context from earlier stages

**Prompt pattern:**
```
You are independently verifying work you did NOT build. You have no context about how this code was written.

Here are the must_haves for Wave [N]:
[paste must_haves block from wave file]

For each truth: verify it is actually true in the codebase. Check the actual code, not just file existence.
For each artifact: verify it exists AND is substantive (not a stub or placeholder).
For each key_link: verify the connection is wired (controller calls service, route maps to controller, etc.).

Report PASS/FAIL per item with file:line evidence. Be skeptical — assume nothing works until you verify it.
```

**Results:** Feed into the Review verdict. Semantic verification failures are surfaced to the user but are NOT auto-blocking — the user decides whether to accept or fix.

### Migration Verification (When Applicable)

If this wave included migrations, verify both databases show all migrations as "up". Any discrepancy is a blocking issue.

### Validation Tool

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output build review <feature-dir> --plugin backend --wave N
```

### Code Quality Review (MANDATORY — Every Wave)

Dispatch `code-reviewer` agent to review all files changed in this wave:
- **Focus:** N+1 queries, convention adherence, auth boundary integrity, production safety, soft delete filtering, safe navigation
- **Input:** `git diff` for this wave's changed files + the wave's `must_haves` block
- **Blocking if:** CRITICAL issues found (security vulnerabilities, auth system mixing, broken soft deletes, missing authorization checks)
- **Non-blocking:** Style suggestions, minor pattern deviations, naming conventions

Pass the EXACT `must_haves` text to the code-reviewer — do NOT summarize or paraphrase.

### Optional Checks (User Decides in Discuss)

Based on HOW answers from Discuss, optionally run:

| Check | Agent | When |
|-------|-------|------|
| Security audit | `security-engineer` | MANIFEST domains include `auth`, `payments`, `student_data`, `coppa` |
| N+1 query check | `performance-engineer` | Wave added new Active Record queries or associations |
| Test coverage assessment | `rails-expert` | User opted for coverage check |

### N+1 Query Prevention

Review ALL new controller actions and service methods for N+1 queries: missing `includes`/`eager_load`/`preload`, queries inside loops, scopes without eager loading. Any N+1 found is a blocking issue.

### Verification Checklist

Verify every wave: files match Architect plan, all tasks completed or failures logged, RSpec passes, no N+1 queries in new code, migrations applied on both databases, deviations documented.

**must_haves Verification (MANDATORY):**

- [ ] Wave's `must_haves` truths are satisfied by the implementation
- [ ] All artifacts listed in must_haves exist and are substantive (not stubs)
- [ ] Key links in must_haves are wired (controller→service→model connections verified)
- [ ] RSpec specs exist for testable requirements in this wave
- [ ] Requirement IDs for this wave are on track to be satisfied
- [ ] `verify-must-haves` tool gate passed (zero issues)
- [ ] Independent `qa-expert` verification completed

### Architecture Diagram Updates (CONDITIONAL)

If any diagram from PLAN was affected by this wave's changes (e.g., data flow modified, new state added, new service connections), display the UPDATED diagram inline via `AskUserQuestion` and confirm the user approves the change. Compare against the original diagram in `execute-locked-decisions.md`.

If no diagrams were affected, skip this step.

### Surfacing Gaps

Use `AskUserQuestion` to present: task summary, failures/deviations, RSpec results, migration verification results, code-reviewer findings, optional check results, recommendations for next wave.

### User Decision (No Auto-Looping — D08)

User picks one:

| Option | When to Use |
|--------|-------------|
| **Accept wave** | All checks pass, output is satisfactory |
| **Retry Execute** | Re-dispatch failed tasks with adjusted prompts |
| **Back to Architect** | Redesign subagent prompts for this wave |
| **Back to Discuss** | Revisit implementation approach for this wave |

### Artifact

```
.dev/build/wave-NN/review-code-quality.md
```

Contains: check results, verdicts, deviations, user decision. For the final wave, this artifact IS the context bridge to VALIDATE.

---

## Between Waves

After a wave is accepted and before starting the next:

### 1. Checkpoint State (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js checkpoint-state <feature-dir> --scope wave --plugin backend
```

If FAIL, fix listed issues before proceeding.

### 2. Update Tracking Files

| File | Update |
|------|--------|
| **MANIFEST** | `current_wave`, `build_progress`, task completion status, strike count |
| **01_IMPLEMENTATION_STATUS.md** | Mark completed tasks, note deviations |
| **CURRENT_STATUS.md** | Current wave, what is done, what remains |

### 3. Notion Update (Between Waves)

Update the Dev Tracker card with wave progress. Reference `references/notion-integration.md` for property names and MCP tool patterns.

**Notion Protocol:** Follow the Retry + Warning Protocol in `references/notion-integration.md`.
- Phase type: Downstream (status update — check Card ID first)
- Target status: (notes update, no status change)
- Persist warning in: `.dev/build/wave-NN/review-code-quality.md`

1. Read the Notion card page ID from MANIFEST's `## Notion Integration > Card ID`
2. **Update Dev Tracker card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: card ID from MANIFEST
   - Properties: Notes = append wave progress (e.g., "Wave X/Y complete — [summary of completed tasks]"), Last Updated = today's ISO date
3. Display status summary:

```
📋 Notion: Updated notes — "[Feature Name]" (Wave X/Y complete)
```

### 4. Session Break (Recommended)

Recommend `/clear` between waves for fresh context (especially after 3+ waves or complex escalations). Next session resumes from MANIFEST via `/dev`.

---

## After Final Wave

When the last wave's Review is accepted:

### 1. Final Checkpoint

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js checkpoint-state <feature-dir> --scope phase --plugin backend
```

### 2. Validate MANIFEST

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest <feature-dir> --plugin backend
```

If FAIL, update MANIFEST before ending.

### 3. Context Bridge

The final wave's `review-code-quality.md` serves as the context bridge to VALIDATE. It must contain: summary of all waves, cumulative deviations, files created/modified, migration history (both databases), outstanding issues, and recommended validation focus areas.

**Dispatch Mandate for VALIDATE (MANDATORY in final wave's context bridge):**

```markdown
## Dispatch Mandate for VALIDATE
Agents from domain-agent-map.md for VALIDATE:
- MANDATORY: `rails-expert` (independent verifier — clean context, no build history)
- CONDITIONAL: `security-engineer` (if auth/payments/students domains), `master-backend-ai-rails` (if performance domain), `legal-compliance-checker` (if students/coppa domains), `postgres-pro` (if performance/database domains), `api-documenter` (if api-design domain)
The VALIDATE Architect MUST address each agent (dispatch or skip with reason in Orchestration Log).
```

### 4. Transition

Display and STOP:

```
---

### Next Up

Phase: VALIDATE — RSpec full suite, security audit, domain checks

`/dev:validate`

/clear first -> fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke VALIDATE.

---

## BUILD Agent Map

See `references/domain-agent-map.md` for agent assignments per task type.

Select agent during Architect based on task type. When a task spans multiple types, use the primary type's agent and include secondary concerns in the prompt.

---

## Error Escalation (3-Strike Rule)

Track strikes PER FEATURE, not per task. Strikes persist across waves.

```
Task fails in Review
  |
  +-- Strike 1: Retry with adjusted prompt
  |     Adjust the subagent prompt based on failure analysis.
  |     Dispatch same agent type with refined instructions.
  |
  +-- Strike 2: Dispatch bug-hunter for investigation
  |     Agent: bug-hunter
  |     Prompt: Include exact error, files changed, task context.
  |     Synthesize findings, apply fix with different strategy.
  |
  +-- Strike 3: STOP. Present all 3 attempts and why each failed.
        Offer options to user:
          1. Guide fix manually — user provides direction
          2. Revise plan — return to PLAN phase
          3. Pause feature entirely — invoke /dev:pause
```

Do NOT attempt a 4th fix without explicit user direction. Each retry MUST use a different strategy.

### Investigation Prompt Template (Strike 2)

```
Investigate BUILD failure in Thoven backend:
TASK: [task name]  ERROR: [exact output]  FILES CHANGED: [list]
PREVIOUS ATTEMPT: [what was tried in strike 1 and why it failed]

1. Root cause with file:line references
2. New code vs pre-existing issue
3. Two fix approaches with trade-offs — recommend one

CODEBASE: Rails 7.2.2 API-only, PostgreSQL/UUIDs, dual auth, service layer, Solid Queue, RSpec
```

---

## Directory Structure

```
docs/[Feature]/.dev/build/
├── wave-01/
│   ├── discuss-implementation-path.md
│   ├── architect-subagent-prompts.md
│   ├── execute-build-results.md
│   └── review-code-quality.md
├── wave-02/
│   └── ...
└── wave-NN/
    └── ...
```

---

## Common Mistakes

| Mistake | Prevention |
|---------|------------|
| Running inner loop once for all waves | Inner loop runs PER WAVE — each wave gets Discuss/Architect/Execute/Review |
| Executing tasks inline instead of dispatching | MUST dispatch subagents for every task — orchestrator never builds |
| Skipping RSpec in Review | MANDATORY for every wave, regardless of user preferences |
| Running migration on one database only | ALWAYS run on both helium (dev) and Neon (production) |
| Not running `/safe-migrate` before migrations | EVERY migration goes through `/safe-migrate` first |
| Not checkpointing between waves | Always run `checkpoint-state` before `/clear` or starting next wave |
| Skipping `/prompt-generator` in Architect | MANDATORY for every subagent prompt — no shortcuts |
| Repeating same fix strategy on strike 2-3 | Each retry must use a DIFFERENT approach |
| Continuing after 3 strikes | STOP and present options — likely an architectural issue |
| Not updating tracking files between waves | Update MANIFEST, IMPLEMENTATION_STATUS, CURRENT_STATUS after every wave |
| Forgetting previous wave context | Read prior wave's `review-code-quality.md` in Discuss |
| Final wave missing bridge content | Last review must contain cumulative summary for VALIDATE |
| Introducing N+1 queries | Check every new AR query for eager loading in Review |
| Skipping security check on auth/payments | Dispatch `security-engineer` whenever sensitive domains are touched |

---

## Quick Reference

| Item | Location / Value |
|------|-----------------|
| Wave artifacts | `.dev/build/wave-NN/{discuss,architect,execute,review}-*.md` |
| Entry validation | `validate-stage-entry build discuss <dir> --plugin backend --wave N` |
| Output validation | `validate-stage-output build review <dir> --plugin backend --wave N` |
| Checkpoint | `checkpoint-state <dir> --scope wave --plugin backend` |
| Context bridge IN | `.dev/document/review-documentation-quality.md` (first wave only) |
| Context bridge OUT | Final wave's `.dev/build/wave-NN/review-code-quality.md` |
| Strike tracking | Per feature, persists across waves, resets never |
| Agent selection | BUILD Agent Map table above |
| Prompt crafting | `/prompt-generator` — mandatory for every subagent |
| RSpec command | `bundle exec rspec` — mandatory every wave |
| Dev migration | `rails db:migrate` |
| Prod migration | `RAILS_ENV=production rails db:migrate` |
| Next phase | VALIDATE (`dev-pipeline-backend:validate`) |
