---
name: document
description: Produces all documentation artifacts for a feature — master plan, component architecture, reuse audit, integration guide, task files, wave files, and implementation status. Triggers on /dev:document or when /dev router advances past DESIGN.
---

# /dev:document — Documentation & Wave Planning

Produce all planning documentation needed for BUILD. Dispatches multiple subagents to create 8 doc types, then verifies cohesion before handing off.

## Hard Rules

1. **Read before acting.** Use the Read tool on context bridges, MANIFEST, requirements.md, and all prior phase outputs before writing any documentation. Writing from memory produces artifacts that conflict with locked decisions.
2. **Use agent-prompt-template for dispatches.** Follow `references/agent-prompt-template.md` for any documentation agents.
3. **Minimum content requirements for review artifacts.** Every review artifact and transition file must contain: feature summary, locked decisions carried forward, domain tags, specific instructions for the next phase, and at least 3 context items. A 2-line "Pass. No issues." is not acceptable — it leaves the next phase blind after `/clear`.

## Inner Loop: Discuss > Architect > Execute > Review

Reference: `${PLUGIN_ROOT}/../shared/references/inner-loop-reference.md`

---

## Stage 1: Discuss — Documentation Scope

### MANDATORY CONTEXT LOADING — Step 0

Use the Read tool on each file. Do not proceed until all reads complete.

1. `Read(.dev/plan/review-plan-approval.md)` → extract: locked architecture decisions, task list, wave groupings, backend dependency status
2. `Read(references/domain-agent-map.md)` → extract: agent assignments for DOCUMENT phase
3. `Read(.dev/MANIFEST.md)` → extract: domains, Decision Ledger (LOCKED/OPEN entries), execution mode
4. `Read(references/bridge-template.md)` → extract: structured bridge format for review artifact
5. `Read(references/mode-propagation-reference.md)` → extract: DOCUMENT depth settings for current mode

If any file is missing, STOP and surface the gap to the user.

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
docs/[Feature]/.dev/design/review-design-compliance.md
```

Extract: locked architecture decisions from PLAN, component inventory from DESIGN, reuse findings from DISCOVER, task list and wave groupings, LOCKED decisions from Decision Ledger. If this file does not exist, STOP — PLAN must complete first.

### 1.2 Structured Questioning

**Tool:** `AskUserQuestion` for EVERY question. One at a time. No batching.

**WHAT questions:**
- Which docs need the most detail? Any special documentation needs?
- What level of detail for task files? (high-level vs step-by-step)
- Any existing docs to incorporate? How granular should wave planning be?

**HOW meta-questions:**
- "How many subagents for documentation? Separate agent per doc or batch?"
- "How should we verify cohesion across docs?"
- "Want a prompt-engineer for task file quality?"
- "Full reuse audit scan or rely on DISCOVER findings only?"

No cap on questions. User says "enough" or "move on" to proceed.

### 1.3 Stage Artifact

Write `docs/[Feature]/.dev/document/discuss-documentation-scope.md` — all Q&A, locked decisions, user preferences.

---

## Stage 2: Architect — Documentation Plan

### 2.1 Prompt Generation (MANDATORY)

**D04 ENFORCEMENT:** Follow the D04 Enforcement Protocol from `inner-loop-reference.md`. Every subagent prompt MUST go through `/prompt-generator`. Log status in the Orchestration Log section of this artifact.

Use `/prompt-generator` to craft every subagent prompt. No exceptions.

#### Architect Step 0: Verify Context Loaded

Before designing agent prompts, confirm:
- [ ] `domain-agent-map.md` was Read in Step 0 — list ALL agents from the map for this phase as either "dispatched" or "skipped (reason)"
- [ ] Domain Combination Patterns checked — read the Domain Combination Patterns table from domain-agent-map.md and apply any extra considerations (e.g., `routing + auth-ui` = test both authenticated and unauthenticated access)
- [ ] Previous phase review artifact was Read — decisions and context carried forward

This verification appears in the Orchestration Log under `Map compliance`.

### 2.2 Doc Inventory with Agent Assignments

| Doc | Agent Type | Notes |
|-----|-----------|-------|
| `00_MASTER_PLAN.md` | `documentation-engineer` | Executive summary, architecture, phases |
| `COMPONENT_ARCHITECTURE.md` | `documentation-engineer` | Component hierarchy, state flow, props |
| `REUSE_AUDIT.md` | `Explore` (subagent_type) | Scan codebase for reuse opportunities |
| `FRONTEND_INTEGRATION_GUIDE.md` | `documentation-engineer` | API integration, backend deps, auth |
| `tasks/TASK_01..N.md` | `prompt-engineer` | Behavior-slice task files for BUILD |
| `waves/WAVE_01..N.md` | `documentation-engineer` | Wave execution plans with task assignments |
| `01_IMPLEMENTATION_STATUS.md` | `documentation-engineer` | Task tracking table |
| `CURRENT_STATUS.md` | `documentation-engineer` | Quick status reference |

### 2.3 Execution Order

```
Phase 1 (parallel):  Explore → REUSE_AUDIT.md  |  doc-engineer → 00_MASTER_PLAN.md
Phase 2 (parallel):  doc-engineer → COMPONENT_ARCHITECTURE.md  |  doc-engineer → INTEGRATION_GUIDE.md
Phase 3 (sequential): prompt-engineer → tasks/TASK_01..N.md (needs arch + reuse context)
Phase 4 (sequential): doc-engineer → waves/WAVE_01..N.md, STATUS files
```

Adjust based on user preferences from Discuss.

### 2.4 Success Criteria

Per-subagent:
- **Master Plan:** Business requirements, architecture overview, decision log table, task list, success criteria
- **Component Arch:** Component tree with exact file paths, TS props interfaces, state flow, data flow diagram. **Diagrams MUST use D2 syntax** (rendered to SVG via `d2 <file>.d2 <file>.svg --layout=elk`). Store `.d2` + `.svg` in `docs/[Feature]/.dev/document/diagrams/`. Include: component tree diagram, data flow diagram, and state flow diagram (if >3 states). Fallback to ASCII if `d2` unavailable.
- **Reuse Audit:** Four tables — Reuse As-Is, Can Extend, Not Suitable, New Code Required (with justification)
- **Integration Guide:** API endpoints with types, auth patterns, error handling, backend dependencies
- **Task Files:** Duration 1-3hr behavior slices, wave assignment, dependencies, exact file paths, acceptance criteria, suggested approach, relevant locked decisions
- **Wave Plans:** Task assignments, strategy, duration, completion criteria, wave dependencies
- **Status Files:** All tasks listed "Not Started" with wave and duration

Overall: every PLAN requirement has a task, every task in exactly one wave, cross-references consistent, tasks are 1-3hr behavior slices, every LOCKED decision ID from the Decision Ledger appears in at least one task file.

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
├── 00_MASTER_PLAN.md              ← architecture, requirements, decision log
├── COMPONENT_ARCHITECTURE.md      ← tree, props, state flow, data flow
├── REUSE_AUDIT.md                 ← reuse/extend/new tables
├── FRONTEND_INTEGRATION_GUIDE.md  ← API, auth, errors, backend deps
├── 01_IMPLEMENTATION_STATUS.md    ← tracking table, all "Not Started"
├── CURRENT_STATUS.md              ← quick status snapshot
├── tasks/
│   └── TASK_01_xxx.md .. TASK_NN_xxx.md
└── waves/
    └── WAVE_01.md .. WAVE_NN.md
```

### 3.3 Task File Structure

Task files MUST follow the template in `${PLUGIN_ROOT}/../shared/references/task-template.md`.

**Behavior-Slice Tasks:** Each task represents a vertical slice of user-visible behavior, NOT a file type. A behavior slice groups all files needed for one coherent behavior: component + hook + API integration + test. Example: "UserProfile page" = page component + `useUserProfile` hook + API call + tests — not separate tasks for "components", "hooks", "API layer".

Task files include a "Suggested Approach" section with hints, not mandatory TDD steps. Agents follow the BUILD skill's TDD guidance.

**Locked Decisions Extraction:** Extract ALL LOCKED decisions from `.dev/plan/execute-locked-decisions.md` that constrain THIS task's behavior. There is no upper limit per task. The coverage constraint (every LOCKED decision appears in at least one task) takes priority over keeping task files slim. After all tasks are created, verify that every LOCKED decision ID from the Decision Ledger appears in at least one task's 'Locked Decisions' or 'Acceptance Criteria' section. If any decision is undistributed, assign it to the most relevant task or create a dedicated task.

**Agent Assignment Guide** — auto-assign the `Agent:` field using keyword matching:

| Task involves... | Assign agent |
|-----------------|--------------|
| page.tsx, layout.tsx, route, middleware, SSR, RSC, generateMetadata | `next-js-developer` |
| TypeScript interfaces, generics, type definitions, branded types | `typescript-pro` |
| React.memo, useMemo, Context optimization, hooks, re-render fixes | `react-specialist` |
| ARIA, keyboard nav, screen reader, WCAG, focus management | `accessibility-tester` |
| API endpoint design, contract review, OpenAPI | `api-designer` |
| lib/*-api.ts implementation, fetch wrappers | `frontend-developer` |
| Framer Motion, animation, CSS transition | `ui-designer` |
| General UI components, styling, layout, forms | `frontend-developer` |

**Sizing:** 2-4 behavior-slice tasks per wave, 1-3 hours each. Group files that import/call each other into the same task. See shared task template for grouping principle.

### 3.4 Wave File Structure

```markdown
# Wave N: [Name]
**Tasks:** TASK_01, TASK_02  **Strategy:** [sequential | parallel-subagents]  **Duration:** [hours]

## Subagent Assignments
| Task | Agent Type | Key Instruction |
|------|-----------|-----------------|

## Completion Criteria
- [ ] All task acceptance criteria met
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
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

**test-anti-patterns block (appended to every wave's must_haves):**

When emitting `<feature>/waves/WAVE_NN.md`, append the following block at the end of the must_haves section:

```markdown
## test-anti-patterns

BUILD Layer 2 will scan this wave's tests for patterns documented in
`references/testing-anti-patterns.md` (WARN severity). Reviewer must
acknowledge each finding before the wave passes Layer 2.

Mode-propagation: Reduction: scan applies AP-T1 + AP-T2 + AP-T4 only (skip T3/T5 to keep noise low). Hold/Expansion: full 5-pattern scan. See `references/testing-anti-patterns.md` §Mode propagation.
```

Reference: `references/testing-anti-patterns.md`.

### 3.5 Test Authoring (TDD-first)

After task files (Section 3.3) and wave files (Section 3.4) are emitted but BEFORE BUILD entry, DOCUMENT generates a test file per task under `<feature>/tests/T-NN.test.ts(x)`.

**For each task in `<feature>/tasks/T-NN.md`:**

1. Read the task's must_haves from the wave file's `## must_haves` block.
2. Generate `<feature>/tests/T-NN.test.ts` matching the template at `references/test-file-template.md`. The frontmatter:
   - `@feature: <feature-name>` from MANIFEST metadata.
   - `@task: T-NN` from the task ID.
   - `@must-haves: [<each truth as a string>]` JSON-array.
   - `@sha256: <hash>` computed last over the file content with the `@sha256:` line itself replaced by an empty string (chicken-and-egg).
   - `@locked-at: <ISO timestamp>` of generation.
3. Generate one `it('...')` block per must-have truth, with `expect(/* TBD */).toBe(/* expected */)` placeholders. BUILD agents fill in the production-code-driven assertions later.
4. Compute hash via `node` `crypto.createHash("sha256")` to ensure cross-tool parity with `shasum -a 256` and the tools.js verifier.

**Strict-edit guardrail:** these files are locked. BUILD Layer 0 (Δ4 part 6) verifies the hash. BUILD agents must implement production code that satisfies the assertions; they MUST NOT edit the test file. If a test is provably wrong, run the override protocol at `references/test-immutability-protocol.md`.

**Mode propagation:**
- Reduction: skip Section 3.5 entirely (TDD-first overhead disproportionate to bug-fix-class features).
- Hold: emit one test per task; one `it()` block per must-have.
- Expansion: emit one test per task + a "negative case" test file per task (`<feature>/tests/T-NN.negative.test.ts`) covering the failure modes.

**Acceptance:** Every task in `<feature>/tasks/` has a corresponding `<feature>/tests/T-NN.test.ts` with valid frontmatter that passes `verify-test-immutability`.

### 3.5.1 Requirements Authoring (EARS within categorical prefixes, v5.0+)

**Requirements file authoring (EARS within categorical prefixes, v5.0+):**

When emitting `<feature>/requirements.md`, follow the template at `references/requirements-template.md`. Each bullet:

- Uses an existing categorical prefix (UI-NN / A11Y-NN / RSP-NN / INT-NN / API-NN / PERF-NN / STATE-NN / FORM-NN / ANIM-NN / SEO-NN / TRK-NN / AUTH-NN / DS-NN — see template for domain mapping).
- Uses one of four EARS sentence shapes (Ubiquitous / Event-driven / State-driven / Optional/conditional) with a clear `shall` verb form. See template §EARS Sentence Shapes.
- Has a corresponding row in MANIFEST `## Requirements Coverage` table for `verify-requirements-coverage` (Δ3) to operate.

EARS authoring is required for all v5.0+ features. Pre-v5.0 features remain on free-prose within categorical prefixes; existing requirements.md files are not retroactively migrated unless their feature undergoes a major iteration.

### 3.6 Stage Artifact

Write `docs/[Feature]/.dev/document/execute-docs-manifest.md` — lists ALL files produced:

```markdown
## Files Produced
| # | File | Path | Summary |
|---|------|------|---------|
| 1 | Master Plan | docs/[Feature]/00_MASTER_PLAN.md | [1-line] |
| 2 | Component Arch | docs/[Feature]/COMPONENT_ARCHITECTURE.md | [1-line] |
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
- Reuse audit findings reflected in task file "Reuse" fields
- Integration guide endpoints match what task files reference
- Component architecture paths match task file "Create" paths

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
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js verify-decision-coverage docs/[Feature] --plugin frontend
```
This check is BLOCKING — if it reports undistributed decisions, DOCUMENT Review cannot pass.

### 4.3 Wave Plan Completeness

- Every task in exactly one wave
- Dependencies form a valid DAG (no cycles)
- Each wave has completion criteria
- Durations within sizing rules

### 4.4 Integration Guide Verification

- API calls documented with request/response types
- Auth patterns specified
- Error handling defined
- Backend dependencies listed with status

### 4.5 Surface Gaps

Use `AskUserQuestion` to present findings:

```
Documentation review found [N] issues:
1. [Issue] — [critical/warning/info]
...
Options: Retry Execute | Back to Architect | Back to Discuss | Accept
```

User decides. No auto-looping (D08).

### 4.6 Notion Update

After acceptance, update the Dev Tracker card with wave/task summary. Read the Card ID from MANIFEST's `## Notion Integration > Card ID`.

1. **Update card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: Card ID from MANIFEST
   - Properties: Notes = append documentation summary (X waves, Y tasks planned, estimated hours, key wave descriptions), Last Updated = today's ISO date

2. Display: `📋 Notion: Updated notes — "[Feature Name]" (X waves, Y tasks planned)`

**Notion Protocol:** Follow the Retry + Warning Protocol in `references/notion-integration.md`.
- Phase type: Downstream (status update — check Card ID first)
- Target status: (notes update, no status change)
- Persist warning in: `.dev/document/review-documentation-quality.md`

### 4.7 MANIFEST Update

On acceptance, update MANIFEST:

```yaml
phase: DOCUMENT
status: complete
artifacts:
  master_plan: docs/[Feature]/00_MASTER_PLAN.md
  reuse_audit: docs/[Feature]/REUSE_AUDIT.md
  component_arch: docs/[Feature]/COMPONENT_ARCHITECTURE.md
  integration_guide: docs/[Feature]/FRONTEND_INTEGRATION_GUIDE.md
  tasks: docs/[Feature]/tasks/
  waves: docs/[Feature]/waves/
  status_tracker: docs/[Feature]/01_IMPLEMENTATION_STATUS.md
  current_status: docs/[Feature]/CURRENT_STATUS.md
task_count: [N]
wave_count: [N]
total_estimated_hours: [X]
```

#### Dispatch Mandate for Next Phase

The review artifact's context bridge MUST include a "Dispatch Mandate" section listing:
- **Mandatory agents** from domain-agent-map.md for the NEXT phase
- **Conditional agents** with their trigger conditions
- **Skipped agents** with reason

The next phase's Architect must address each listed agent — silent omission is not allowed.

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
| Reuse audit <> task files | Pass/Fail | |
| Integration guide <> tasks | Pass/Fail | |
| Component arch <> task files | Pass/Fail | |

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
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry document <stage> docs/[feature] --plugin frontend

# After any stage
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output document <stage> docs/[feature] --plugin frontend

# After MANIFEST changes
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest docs/[feature] --plugin frontend

# During Review 4.2b — LOCKED decision coverage (BLOCKING)
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js verify-decision-coverage docs/[feature] --plugin frontend
```

---

## After Review Acceptance

Present summary, then display:

```
---

### Next Up

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
| 00_MASTER_PLAN.md | Executive summary, architecture, phase overview | documentation-engineer |
| COMPONENT_ARCHITECTURE.md | Component hierarchy, state flow, props/interfaces | documentation-engineer |
| REUSE_AUDIT.md | Existing components to reuse vs build new | Explore |
| FRONTEND_INTEGRATION_GUIDE.md | API integration, backend deps, auth | documentation-engineer |
| tasks/TASK_NN_xxx.md | Behavior-slice task specs with acceptance criteria | prompt-engineer |
| waves/WAVE_NN.md | Wave execution plans with task assignments | documentation-engineer |
| 01_IMPLEMENTATION_STATUS.md | Task tracking table | documentation-engineer |
| CURRENT_STATUS.md | Quick status reference | documentation-engineer |

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Writing docs inline instead of dispatching | Execute MUST dispatch subagents |
| Tasks missing exact file paths | Every task needs create/modify/test/reuse paths |
| Tasks outside 1-3hr range | Split if too large, combine if too small into behavior slices |
| Reuse audit skipped | Mandatory — dispatch Explore agent |
| Cross-references broken | Review cohesion check catches this |
| Wave plans missing completion criteria | Every wave needs type-check + lint + acceptance |
| Task files prescribe exact TDD steps instead of using Suggested Approach | Use hints in Suggested Approach; BUILD skill owns TDD guidance |
| execute-docs-manifest.md incomplete | Must list ALL files with paths and summaries |
| Creating one task per file type (component task, hook task, API task) instead of behavior slices | Group component + hook + API + test into one behavior-slice task |
| LOCKED decision appears in zero task files (undistributed) | Every LOCKED decision must appear in at least one task. Decision coverage is checked in Review 4.2b — undistributed decisions are BLOCKING |
| Tasks smaller than 1 hour — too granular | Combine into behavior slices (1-3 hours each) |
| Review auto-loops on failure | Surface to user — user decides next action |
