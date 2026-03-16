---
name: document
description: Produces all documentation artifacts for a backend feature — master plan, task files, wave files, API contract, and implementation status. Triggers on dev-pipeline-backend:document or when /dev router advances past PLAN.
---

# /dev:document — Documentation & Wave Planning

Produce all planning documentation needed for BUILD. Dispatches multiple subagents to create 7 doc types, then verifies cohesion before handing off.

## Inner Loop: Discuss > Architect > Execute > Review

Reference: `${PLUGIN_ROOT}/../shared/references/inner-loop-reference.md`

---

## Stage 1: Discuss — Documentation Scope

### 1.1 Read Context Bridge

```
docs/[Feature]/.dev/plan/review-plan-approval.md
```

Extract: locked design decisions, migration plan, API surface, architecture decisions from PLAN, task list and wave groupings. If this file does not exist, STOP — PLAN must complete first.

### 1.2 Structured Questioning

**Tool:** `AskUserQuestion` for EVERY question. One at a time. No batching.

**WHAT questions:**
- Which docs need the most detail? Any special documentation needs?
- What level of detail for task files? (high-level vs step-by-step)
- Any existing docs to incorporate? How granular should wave planning be?
- Are there migration safety concerns to document?

**HOW meta-questions:**
- "How many subagents for documentation? Separate agent per doc or batch?"
- "How should we verify cohesion across docs?"
- "Want a prompt-engineer for task file quality?"
- "Full codebase scan for existing patterns or rely on PLAN findings only?"

No cap on questions. User says "enough" or "move on" to proceed.

### 1.3 Stage Artifact

Write `docs/[Feature]/.dev/document/discuss-documentation-scope.md` — all Q&A, locked decisions, user preferences.

---

## Stage 2: Architect — Documentation Plan

### 2.1 Prompt Generation (MANDATORY)

**D04 ENFORCEMENT:** Follow the D04 Enforcement Protocol from `inner-loop-reference.md`. Every subagent prompt MUST go through `/prompt-generator`. Log status in the Orchestration Log section of this artifact.

Use `/prompt-generator` to craft every subagent prompt. No exceptions.

### 2.2 Doc Inventory with Agent Assignments

| Doc | Agent Type | Notes |
|-----|-----------|-------|
| `00_MASTER_PLAN.md` | `documentation-engineer` | Executive summary, architecture, phases |
| `api/API_CONTRACT.md` | `documentation-engineer` | Endpoint specs, request/response, auth, errors |
| `tasks/TASK_01..N.md` | `prompt-engineer` | Task files need good prompts for BUILD |
| `waves/WAVE_01..N.md` | `documentation-engineer` | Wave execution plans with task assignments |
| `01_IMPLEMENTATION_STATUS.md` | `documentation-engineer` | Task tracking table |
| `CURRENT_STATUS.md` | `documentation-engineer` | Quick status reference |

### 2.3 Execution Order

```
Phase 1 (parallel):  doc-engineer → 00_MASTER_PLAN.md  |  doc-engineer → api/API_CONTRACT.md
Phase 2 (sequential): prompt-engineer → tasks/TASK_01..N.md (needs master plan + API contract context)
Phase 3 (sequential): doc-engineer → waves/WAVE_01..N.md, STATUS files
```

Adjust based on user preferences from Discuss.

### 2.4 Success Criteria

Per-subagent:
- **Master Plan:** Business requirements, architecture overview, decision log, migration plan, task list, success criteria
- **API Contract:** Endpoint specs with request/response, validation rules, status codes, error formats per `API_ERROR_RESPONSE_CONTRACT.md`, auth patterns
- **Task Files:** Duration 30min-2.5hr, wave assignment, dependencies, exact file paths, acceptance criteria, TDD steps
- **Wave Plans:** Task assignments, strategy, duration, completion criteria, wave dependencies
- **Status Files:** All tasks listed "Not Started" with wave and duration

Overall: every PLAN requirement has a task, every task in exactly one wave, cross-references consistent, no task outside 20min-2.5hr range, migration steps covered, API contract matches task endpoints.

### 2.5 Stage Artifact

Write `docs/[Feature]/.dev/document/architect-documentation-plan.md` — full inventory, execution order, success criteria, escalation rules, subagent prompts. Must include the Orchestration Log section.

---

## Stage 3: Execute — Produce All Docs

### 3.1 Dispatch Rules

**MANDATORY:** Dispatch subagents via Agent tool. Orchestrator NEVER writes docs inline.

For each subagent: dispatch with crafted prompt, collect results, check against success criteria, log pass/fail. If a subagent fails: log failure, continue with remaining agents, surface in Review.

### 3.2 Output Files

All docs go to `docs/[Feature]/`:

```
docs/[Feature]/
├── 00_MASTER_PLAN.md              <- architecture, requirements, decision log, migration plan
├── 01_IMPLEMENTATION_STATUS.md    <- tracking table, all "Not Started"
├── CURRENT_STATUS.md              <- quick status snapshot
├── api/
│   └── API_CONTRACT.md            <- endpoint specs, request/response, auth, errors
├── tasks/
│   └── TASK_01_xxx.md .. TASK_NN_xxx.md
└── waves/
    └── WAVE_01.md .. WAVE_NN.md
```

### 3.3 Task File Structure

```markdown
# Task NN: [Name]
**Duration:** [30min-2.5hr]  **Wave:** [N]  **Dependencies:** [Task IDs or "None"]

## Files
- **Create:** `app/services/exact_path.rb`
- **Modify:** `app/models/existing_model.rb` (lines ~XX-YY)
- **Test:** `spec/services/exact_path_spec.rb`
- **Migration:** `db/migrate/YYYYMMDDHHMMSS_description.rb` (if applicable)

## Acceptance Criteria
- [ ] [Specific, testable criterion]
- [ ] RSpec tests pass
- [ ] No N+1 queries introduced
- [ ] Migration reversible

## Implementation Steps (TDD)
1. Write failing spec -> 2. Verify failure -> 3. Implement -> 4. Verify pass -> 5. Refactor -> 6. Commit
```

**Sizing:** >2.5hr split, <20min combine. Sweet spot 30min-2.5hr.

### 3.4 Wave File Structure

```markdown
# Wave N: [Name]
**Tasks:** TASK_01, TASK_02  **Strategy:** [sequential | parallel-subagents]  **Duration:** [hours]

## Subagent Assignments
| Task | Agent Type | Key Instruction |
|------|-----------|-----------------|

## Completion Criteria
- [ ] All task acceptance criteria met
- [ ] `bundle exec rspec` passes
- [ ] No pending migrations
- [ ] No regressions in existing tests

## Dependencies
- **Requires:** [Previous wave(s) or "None"]
- **Unlocks:** [Next wave(s)]
```

### 3.5 Stage Artifact

Write `docs/[Feature]/.dev/document/execute-docs-manifest.md` — lists ALL files produced:

```markdown
## Files Produced
| # | File | Path | Summary |
|---|------|------|---------|
| 1 | Master Plan | docs/[Feature]/00_MASTER_PLAN.md | [1-line] |
| 2 | API Contract | docs/[Feature]/api/API_CONTRACT.md | [1-line] |
| ... | ... | ... | ... |

## Subagent Results
| Agent | Doc(s) Produced | Status | Deviations |
|-------|----------------|--------|------------|

## Totals
- **Tasks:** [N]  **Waves:** [N]  **Estimated hours:** [X]
```

---

## Stage 4: Review — Documentation Quality

### 4.1 Cohesion Check

- Master plan task list matches actual task files (count, names, order)
- Every task references a valid wave; every wave references only existing tasks
- API contract endpoints match what task files reference
- Migration steps in master plan have corresponding task files
- Service layer patterns referenced consistently across docs

### 4.2 Task Coverage

- Map every PLAN requirement to one or more task files
- Flag requirements with no corresponding task
- Flag tasks with no traceable requirement

### 4.3 Wave Plan Completeness

- Every task in exactly one wave
- Dependencies form a valid DAG (no cycles)
- Each wave has completion criteria
- Durations within sizing rules

### 4.4 Migration Plan Coverage

- Every schema change has a migration task with rollback strategy
- Migration order respects foreign key dependencies
- Data migration steps separated from schema migrations

### 4.5 API Contract Completeness

- Every endpoint has request/response examples with types
- Auth patterns specified (User auth, Student auth, public)
- Error handling defined with status codes and response format
- Endpoints match what task files will implement

### 4.6 Surface Gaps

Use `AskUserQuestion` to present findings:

```
Documentation review found [N] issues:
1. [Issue] — [critical/warning/info]
...
Options: Retry Execute | Back to Architect | Back to Discuss | Accept
```

User decides. No auto-looping (D08).

### 4.7 MANIFEST Update

On acceptance, update MANIFEST:

```yaml
phase: DOCUMENT
status: complete
artifacts:
  master_plan: docs/[Feature]/00_MASTER_PLAN.md
  api_contract: docs/[Feature]/api/API_CONTRACT.md
  tasks: docs/[Feature]/tasks/
  waves: docs/[Feature]/waves/
  status_tracker: docs/[Feature]/01_IMPLEMENTATION_STATUS.md
  current_status: docs/[Feature]/CURRENT_STATUS.md
task_count: [N]  wave_count: [N]  total_estimated_hours: [X]
```

### 4.8 Stage Artifact

Write `docs/[Feature]/.dev/document/review-documentation-quality.md` — bridges to BUILD:

```markdown
## Documentation Review Summary
**Verdict:** [Pass / Pass with warnings / Fail]
**Tasks:** [N] across [N] waves  **Estimated hours:** [X]

## Cohesion Check
| Check | Status | Notes |
|-------|--------|-------|
| Master plan <> task files | Pass/Fail | |
| Task files <> wave plans | Pass/Fail | |
| API contract <> task files | Pass/Fail | |
| Migration plan <> task files | Pass/Fail | |

## Task Coverage
- Requirements covered: [N/N]
- Gaps: [list or "None"]

## Warnings for BUILD
- [Caveats, known gaps, areas needing attention]

## Recommended BUILD Focus
- Wave 1 tasks: [list]
- Wave 1 strategy: [sequential/parallel]
- Key risk areas: [list]
```

---

## Tool Integration

```bash
# Before any stage
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry document <stage> docs/[feature] --plugin backend
# After any stage
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output document <stage> docs/[feature] --plugin backend
# After MANIFEST changes
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest docs/[feature] --plugin backend
```

---

## After Review Acceptance

### Notion Update

Update the Dev Tracker card with wave count and task summary. Reference `references/notion-integration.md` for property names and MCP tool patterns.

**Notion Protocol:** Follow the Retry + Warning Protocol in `references/notion-integration.md`.
- Phase type: Downstream (status update — check Card ID first)
- Target status: (notes update, no status change)
- Persist warning in: `.dev/document/review-documentation-quality.md`

1. Read the Notion card page ID from MANIFEST's `## Notion Integration > Card ID`
2. **Update Dev Tracker card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: card ID from MANIFEST
   - Properties: Notes = append wave count and task summary (e.g., "DOCUMENT complete: X waves, Y tasks, Z estimated hours"), Last Updated = today's ISO date
3. Display status summary:

```
📋 Notion: Updated notes — "[Feature Name]" (X waves, Y tasks planned)
```

Present summary, then display:

```
---
> Next Up

Phase: BUILD — Wave-by-wave task execution
`/dev:build`

/clear first — fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke BUILD.

---

## Output Doc Inventory

| Doc | Purpose | Agent |
|-----|---------|-------|
| 00_MASTER_PLAN.md | Executive summary, architecture, migration plan, phase overview | documentation-engineer |
| api/API_CONTRACT.md | Endpoint specs, request/response, auth, errors, validation | documentation-engineer |
| tasks/TASK_NN_xxx.md | Individual task specs with acceptance criteria | prompt-engineer |
| waves/WAVE_NN.md | Wave execution plans with task assignments | documentation-engineer |
| 01_IMPLEMENTATION_STATUS.md | Task tracking table | documentation-engineer |
| CURRENT_STATUS.md | Quick status reference | documentation-engineer |

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Writing docs inline instead of dispatching | Execute MUST dispatch subagents |
| Tasks missing exact file paths | Every task needs create/modify/test/migration paths |
| Tasks outside 20min-2.5hr range | Split if too large, combine if too small |
| Cross-references broken | Review cohesion check catches this |
| Wave plans missing completion criteria | Every wave needs rspec + migration check + acceptance |
| Task files lack TDD steps | Add: failing spec > verify > implement > verify > commit |
| execute-docs-manifest.md incomplete | Must list ALL files with paths and summaries |
| Review auto-loops on failure | Surface to user — user decides next action |
| API contract written after implementation | API contract is produced in Execute, BEFORE BUILD |
| Migration plan gaps | Every schema change needs a migration task with rollback |
| Missing dual auth consideration | Tasks touching auth must specify User vs Student context |
