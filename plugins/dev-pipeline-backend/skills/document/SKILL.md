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

### 0. Load Context (MANDATORY — before anything else)

Read these files using the Read tool. Do NOT proceed until all are loaded:

1. **Read** `${PLUGIN_ROOT}/references/domain-agent-map.md` — agent assignments for DOCUMENT phase
2. **Read** `${PLUGIN_ROOT}/references/inner-loop-reference.md` — stage mechanics and enforcement rules
3. **Read** `${PLUGIN_ROOT}/references/codebase-context-block.md` — standard context for subagent prompts
4. **Read** `${PLUGIN_ROOT}/references/wave-plan-template.md` — template for wave execution plans

Extract from domain-agent-map.md for DOCUMENT:
- MANDATORY agents: `rails-expert` (consistency verification)
- CONDITIONAL agents: `api-documenter` (when `api-design` domain tagged)
- Check Domain Combination Patterns against MANIFEST tags

These agents MUST be addressed in the Architect stage — either dispatched or explicitly skipped with reason.

**Echo-Back (MANDATORY — verbatim LOCKED decisions):**

After loading context, echo back ALL LOCKED decisions from the Decision Ledger:

```
Loaded context from PLAN:
- LOCKED decisions ([N] total — ALL listed):
  - U-01: [verbatim decision text]
  - U-02: [verbatim decision text]
  - A-01: [verbatim decision text]
  - ... (every LOCKED entry, no ellipsis, no summarizing)
- Execution mode: [Expansion/Hold/Reduction]
- Tasks: [N] across [N] waves

Decision count verification: MANIFEST ledger shows [N] LOCKED entries. Echo-back lists [N]. [MATCH / MISMATCH]
```

If echo-back count does not match MANIFEST Decision Ledger LOCKED count: re-read MANIFEST and the bridge. Count mismatch means context was not fully loaded. Do not proceed until counts match.

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

### 0. Verify Context Loaded (MANDATORY)

Confirm `domain-agent-map.md` was Read in Discuss. If not, Read it now using the Read tool.
List ALL agents defined for DOCUMENT in domain-agent-map.md: `rails-expert`, `api-documenter`.
Each agent MUST appear in the Orchestration Log as either:
- **Dispatched** — with prompt and success criteria
- **Skipped** — with explicit reason (e.g., "no api-design domain = skip api-documenter")

Also check the **Domain Combination Patterns** table. If MANIFEST domains match any combination, apply extra considerations.

### 2.1 Prompt Generation (MANDATORY)

**D04 ENFORCEMENT:** Follow the D04 Enforcement Protocol from `inner-loop-reference.md`. Every subagent prompt MUST go through `/prompt-generator`. Log status in the Orchestration Log section of this artifact.

Use `/prompt-generator` to craft every subagent prompt. No exceptions.

### 2.2 Doc Inventory with Agent Assignments

| Doc | Agent Type | Notes |
|-----|-----------|-------|
| `00_MASTER_PLAN.md` | `documentation-engineer` | Executive summary, architecture, phases |
| `api/API_CONTRACT.md` | `documentation-engineer` | Endpoint specs, request/response, auth, errors |
| `tasks/TASK_01..N.md` | `prompt-engineer` | Behavior-slice task files — vertical slices, not file-type tasks |
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
- **Master Plan:** Business requirements, architecture overview, decision log, migration plan, task list, success criteria. **Diagrams MUST use D2 syntax** (rendered to SVG via `d2 <file>.d2 <file>.svg --layout=elk`). Store `.d2` + `.svg` in `docs/[Feature]/.dev/document/diagrams/`. Include: service dependency diagram, data flow diagram, migration chain diagram (if >2 migrations), model relationship diagram (if new models). Fallback to ASCII if `d2` unavailable.
- **API Contract:** Endpoint specs with request/response, validation rules, status codes, error formats per `API_ERROR_RESPONSE_CONTRACT.md`, auth patterns
- **Task Files:** Duration 1-3hr behavior slices, wave assignment, dependencies, exact file paths, acceptance criteria, suggested approach hints, relevant locked decisions
- **Wave Plans:** Task assignments, strategy, duration, completion criteria, wave dependencies
- **Status Files:** All tasks listed "Not Started" with wave and duration

Overall: every PLAN requirement has a task, every task in exactly one wave, cross-references consistent, tasks are 1-3hr behavior slices (not file-type tasks), migration steps covered, API contract matches task endpoints, every LOCKED decision ID from the Decision Ledger appears in at least one task file.

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

Task files MUST follow the template in `${PLUGIN_ROOT}/../shared/references/task-template.md`.

**Behavior-Slice Tasks:** Each task represents a vertical slice of user-visible behavior, NOT a single file type (model, controller, service). A behavior slice groups all files needed to deliver one testable behavior — e.g., "User can create a widget" includes the model, migration, service, controller endpoint, and tests together.

**Sizing:** 2-4 behavior-slice tasks per wave, 1-3 hours each. Group files that import/call each other into the same task. See shared task template for grouping principle.

**Suggested Approach:** Task files include a "Suggested Approach" section with hints, not mandatory TDD steps. Agents follow the BUILD skill's TDD guidance.

**Locked Decisions:** Extract ALL LOCKED decisions from `.dev/plan/execute-locked-decisions.md` that constrain THIS task's behavior. There is no upper limit per task. The coverage constraint (every LOCKED decision appears in at least one task) takes priority over keeping task files slim. After all tasks are created, verify that every LOCKED decision ID from the Decision Ledger appears in at least one task's 'Locked Decisions' or 'Acceptance Criteria' section. If any decision is undistributed, assign it to the most relevant task or create a dedicated task.

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

## Upstream Context
<!-- Lists completion logs from prior waves that agents in THIS wave MUST read before starting. -->
<!-- Wave 1: "None — first wave" -->
<!-- Wave 2+: List paths to prior wave task completion logs -->
- **Prior wave logs:** [None | `tasks/TASK_XX.md#completion-log`, `tasks/TASK_YY.md#completion-log`]
- **Key discoveries to carry forward:** [Filled by BUILD orchestrator after prior wave completes]
```

### 3.5 Dispatch rails-expert for Consistency Check (MANDATORY)

After all documentation subagents complete, dispatch `rails-expert` to verify document accuracy against the codebase:

**Purpose:** This is a VERIFICATION dispatch, not a creation dispatch. The documentation subagents write the docs; the `rails-expert` checks them.

**Verify:**
- File paths in task files exist on disk (or are plausible new paths for CREATE operations)
- Decision IDs referenced in tasks exist in the locked decision log
- Wave dependencies don't create circular references
- Agent assignments in wave files match `domain-agent-map.md` for the task types
- API contract endpoints are consistent with existing routes in `config/routes.rb`
- Migration sequencing in task files matches the migration plan from PLAN

**Input:** All docs produced in steps 3.1-3.4, plus codebase access (Read, Grep, Glob).
**Output:** Consistency report with PASS/FAIL per check and file:line evidence for failures.

If the `rails-expert` finds critical inconsistencies (wrong file paths, broken cross-references, circular dependencies): flag as issues in Review. Non-critical findings (minor naming inconsistencies, style suggestions) are warnings.

### 3.6 Stage Artifact

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

#### 4.2b LOCKED Decision Coverage (BLOCKING)

- Read the complete Decision Ledger from MANIFEST (all entries with Status = LOCKED)
- For each LOCKED decision ID (U-XX, A-XX, D-XX):
  - Search all task files in `docs/[Feature]/tasks/` for the decision ID
  - The ID must appear in either the "Locked Decisions" section or "Acceptance Criteria" section
- Flag undistributed LOCKED decisions as BLOCKING issues
- A decision that appears in zero task files is an UNDISTRIBUTED DECISION — it will never reach BUILD agents
- This check is independent from Requirement Coverage (4.2) — requirements and decisions are orthogonal
- **FAIL** the DOCUMENT Review if any LOCKED decision is undistributed

**Mechanical verification:**
```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js verify-decision-coverage docs/[Feature] --plugin backend
```
This check is BLOCKING — if it reports undistributed decisions, DOCUMENT Review cannot pass.

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

### 4.8 Dispatch Mandate for BUILD (MANDATORY in context bridge)

Include this section in the review artifact:

```markdown
## Dispatch Mandate for BUILD
Agents from domain-agent-map.md for BUILD:
- Per-task agents: `master-backend-ai-rails` (models/migrations), `rails-expert` (controllers/services/tests), `security-engineer` (auth/security tasks), `bug-hunter` (complex bugs)
- Review stage: `code-reviewer` (MANDATORY every wave), `security-engineer` (if auth/payments domains)
The BUILD Architect MUST address each agent per wave (dispatch or skip with reason in Orchestration Log).
```

### 4.9 Stage Artifact

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

# During Review 4.2b — LOCKED decision coverage (BLOCKING)
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js verify-decision-coverage docs/[feature] --plugin backend
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
| Tasks outside 1-3hr range | Split if too large, combine if too small into behavior slices |
| Cross-references broken | Review cohesion check catches this |
| Wave plans missing completion criteria | Every wave needs rspec + migration check + acceptance |
| Task files prescribe exact TDD steps instead of using Suggested Approach | Use "Suggested Approach" section with hints; BUILD skill provides TDD guidance |
| execute-docs-manifest.md incomplete | Must list ALL files with paths and summaries |
| Review auto-loops on failure | Surface to user — user decides next action |
| API contract written after implementation | API contract is produced in Execute, BEFORE BUILD |
| Migration plan gaps | Every schema change needs a migration task with rollback |
| Missing dual auth consideration | Tasks touching auth must specify User vs Student context |
| Creating one task per file type (model, controller, service) instead of behavior slices | Group all files for one testable behavior into a single task |
| LOCKED decision appears in zero task files (undistributed) | Every LOCKED decision must appear in at least one task. Decision coverage is checked in Review 4.2b — undistributed decisions are BLOCKING |
| Tasks smaller than 1 hour — combine into behavior slices | Merge related small tasks until each slice is 1-3 hours |
