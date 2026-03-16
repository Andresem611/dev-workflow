---
name: plan
description: Makes architecture decisions, creates task breakdowns, and defines wave groupings for a feature. Produces locked decision log and task list via the 4-stage inner loop. Triggers on /dev:plan or when /dev router advances past DISCOVER.
---

# /dev:plan — Architecture Decisions + Task Breakdown (v2.0)

Lock architecture decisions (with WHY + alternatives rejected), break work into tasks, group tasks into waves, and define acceptance criteria. Uses the 4-stage inner loop: Discuss, Architect, Execute, Review.

---

## Stage 1: Discuss — Architecture Direction

**Purpose:** Gather architecture preferences, constraints, and execution strategy from the user before planning begins.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry plan discuss <feature-dir> --plugin frontend
```

### Context Bridge

Read the previous phase's review artifact: `.dev/discover/review-design-approval.md`

Extract: confirmed requirements, reuse audit findings, codebase patterns, key decisions from DISCOVER.

### Mechanics (per inner-loop-reference.md Section 2.1)

Use `AskUserQuestion` for EVERY question. One question at a time. NEVER batch multiple questions into a single prompt. No cap on questions — the user says "enough" or "move on" to proceed.

**WHAT questions** — The work itself:
- Component architecture preferences (atomic, feature-based, page-based)?
- State management approach (Context, Zustand, Redux, local state)?
- API integration patterns (React Query, SWR, custom hooks)?
- Backend dependencies — are all APIs ready?
- Known constraints (performance budgets, bundle size limits, browser support)?
- Accessibility requirements beyond WCAG 2.1 AA baseline?

**HOW meta-questions** — Execution strategy:
- "Should I dispatch parallel architect agents or a focused sequential approach?"
- "Want a challenger agent to stress-test architecture decisions?"
- "How should we group waves — by layer (types/API/state/UI) or by feature slice?"
- "How strict should review be for architecture decisions?"

**Optional research pre-step:** If the user opts in for a codebase scan, dispatch an Explore agent to analyze existing architecture patterns, then resume questioning with findings.

**Doneness Definition (MANDATORY — ask before leaving Discuss):**
- "What does 'done' look like for this feature? What should a reviewer check?"
- "Are there specific acceptance criteria — visual, behavioral, performance, accessibility?"
- "What should the verifier be able to confirm is working when this is complete?"

The orchestrator MUST ask at least 1 doneness question before advancing to Architect. These answers feed directly into the requirements artifact produced in the next stage.

### Artifact

`.dev/plan/discuss-architecture-direction.md` — Captures all Q&A, architecture preferences, meta-decisions on execution depth.

### After Completion

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output plan discuss <feature-dir> --plugin frontend
```

---

## Stage 2: Architect — Decision Framework

**Purpose:** Plan the subagent assignments, define decision categories, success criteria, and task breakdown format.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry plan architect <feature-dir> --plugin frontend
```

### Mechanics (per inner-loop-reference.md Section 2.2)

**D04 ENFORCEMENT:** Follow the D04 Enforcement Protocol from `inner-loop-reference.md`. Every subagent prompt MUST go through `/prompt-generator`. Log status in the Orchestration Log section of this artifact.

**MANDATORY:** Use `/prompt-generator` to craft every subagent prompt. Prompt quality IS architecture.

### Subagent Definitions

| Field | Description |
|-------|-------------|
| **Agent type** | `architecture-reviewer` (decisions), `frontend-developer` (task breakdown), optional `challenger` (stress-test) |
| **Prompt** | Crafted via `/prompt-generator` |
| **Success criteria** | What the subagent output must contain |
| **Input context** | Discuss artifact + DISCOVER review artifact + MANIFEST |
| **Execution order** | Parallel vs sequential, dependencies between agents |

### Decision Categories

Subagents must address: component architecture, state management, API patterns, styling approach, routing, and dependencies.

### Success Criteria

Define what the combined Execute output must achieve:
- Every decision has WHY + alternatives rejected (no exceptions)
- Every confirmed requirement from DISCOVER has a corresponding task
- Waves are logical — no circular dependencies, dependencies respected
- Backend blockers identified and flagged with expected contracts
- Task breakdown follows 30min-2.5hr sizing rule

### Task Breakdown Format

Each task must include:

| Field | Description |
|-------|-------------|
| **Task ID** | Sequential: T01, T02, T03... |
| **Description** | What the task accomplishes |
| **File paths** | Exact paths to create, modify, and test |
| **Acceptance criteria** | Clear done-definition for the task |
| **Wave number** | Which wave this task belongs to |
| **Agent type** | Which subagent type executes this task in BUILD |

**MANDATORY: Requirements Artifact**

The Architect MUST produce `requirements.md` in the feature docs directory using the template at `references/requirements-template.md`.

Requirements are derived from:
- Domain tags (from INTAKE MANIFEST)
- User answers to doneness questions (from Discuss stage)
- Design decisions and constraints identified during architecture

Each requirement MUST be:
- Identified with a category-number ID (e.g., `UI-01`, `A11Y-03`)
- Testable — if you can't write a verification check, rewrite it
- Mapped to a wave/task in the traceability table

The requirements doc is the HARD CONTRACT that VALIDATE verifies against. Without it, VALIDATE has nothing to check except "do tests pass" — which is insufficient.

### Artifact

`.dev/plan/architect-decision-framework.md` — Subagent assignments, decision categories, success criteria, task breakdown format, execution order. Must include the Orchestration Log section.

`.dev/plan/requirements.md` — Checkable requirements with category IDs, verification methods, and traceability to waves/tasks.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output plan architect <feature-dir> --plugin frontend
```

---

## Stage 3: Execute — Locked Decisions + Task Breakdown

**Purpose:** Dispatch subagents to produce the locked decision log, task list, wave groupings, acceptance criteria, and backend dependency status.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry plan execute <feature-dir> --plugin frontend
```

### Mechanics (per inner-loop-reference.md Section 2.3)

**MANDATORY:** Dispatch subagents. The orchestrator NEVER executes work inline.

For each subagent defined in Architect:
1. Dispatch using Agent tool with the `/prompt-generator`-crafted prompt
2. Wait for completion
3. Collect results
4. Check against per-subagent success criteria
5. Log result (pass/fail, deviations, artifacts produced)

### Required Outputs

Execute must produce ALL six of these sections (five planning sections + diagrams):

#### 1. Locked Decision Log

Table format. See Decision Log Format section below for full spec.

```markdown
| ID | Decision | Choice | WHY | Alternatives Rejected |
|----|----------|--------|-----|----------------------|
| D01 | State management | Zustand | Lightweight, fits project patterns | Redux (overkill), Context (re-render issues) |
```

**WHY is mandatory.** A decision without WHY is a guess. Cite codebase files as evidence.

#### 2. Task List

Per task: ID, description, file paths to create/modify, acceptance criteria, wave number, assigned agent type.

```markdown
| ID | Description | Files | Acceptance Criteria | Wave | Agent |
|----|-------------|-------|-------------------|------|-------|
| T01 | Define types | create: types/feature.ts | All API types covered | W1 | frontend-developer |
```

**Sizing:** 30min-2.5hr per task. Split if larger, combine if under 20min.
**Ordering:** Types, API, State, Components, Pages, Tests, Polish.

#### 3. Wave Groupings

```markdown
| Wave | Tasks | Parallel? | Depends On |
|------|-------|-----------|------------|
| W1 | T01 (types), T02 (API) | Yes | -- |
| W2 | T03 (state), T04 (context) | Yes | W1 |
```

Tasks within a wave run in parallel. Waves run sequentially. One file = one task = one wave assignment.

#### 4. Acceptance Criteria

Overall feature done-definition: locked decisions implemented, API integrations handle loading/error/empty states, responsive, WCAG 2.1 AA compliant, plus feature-specific criteria from DISCOVER.

#### 5. Backend Dependency Status

```markdown
| Endpoint | Method | Expected Request | Expected Response | Status |
|----------|--------|-----------------|-------------------|--------|
| /api/v1/bookings | POST | { student_id, slot_id } | { booking: { id } } | MISSING |
```

If ANY endpoint is MISSING: flag as blocker, record expected contracts, surface in Review for user decision (proceed with mocks vs PAUSE).

#### 6. Architecture Diagrams (ASCII)

For any non-trivial feature, subagents MUST produce ASCII diagrams:

- **Data flow diagram** — How data moves through new components (required if feature has >2 components)
- **State machine** — For components with >3 states (required if feature has stateful UI)
- **Dependency graph** — Before/after showing new coupling (required if feature touches >4 files)

These diagrams go in the Execute artifact AND should be embedded as inline comments in the corresponding implementation files during BUILD. Stale diagrams are worse than no diagrams — if BUILD modifies a diagrammed flow, the diagram MUST be updated in the same wave.

**MANDATORY: must_haves in Wave Files**

Each wave file produced by Execute MUST include a `must_haves` section:

```markdown
## must_haves
- **truths**: [User-observable behaviors that must be true when this wave is done]
- **artifacts**: [Files that must exist and be substantive, not stubs]
- **key_links**: [Connections between components that must be wired]
```

These are consumed by VALIDATE for goal-backward verification. Truths without must_haves = unverifiable work.

### Artifact

`.dev/plan/execute-locked-decisions.md` — All five sections: decision log, task list, wave groupings, acceptance criteria, backend dependency status. Each wave includes `must_haves` for verification.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output plan execute <feature-dir> --plugin frontend
```

---

## Stage 4: Review — Plan Approval

**Purpose:** Validate Execute output against success criteria, surface gaps, get user approval.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry plan review <feature-dir> --plugin frontend
```

### Mechanics (per inner-loop-reference.md Section 2.4)

### Validation Checks

Run each check. For each: evidence-based pass/fail.

1. **Every decision has WHY + alternatives rejected** — scan decision log, reject entries missing either field
2. **Every requirement from DISCOVER has a corresponding task** — cross-reference confirmed requirements against task list
3. **Wave groupings are logical** — no circular dependencies, dependencies between waves respected, no two tasks in the same wave touching the same file
4. **Backend blockers identified and flagged** — missing endpoints have expected contracts documented
5. **Task sizing** — no task estimated above 2.5hr, no task below 20min
6. **Requirements artifact checks:**
   - [ ] `requirements.md` exists with checkable requirement IDs
   - [ ] Every requirement is testable (has a verification method)
   - [ ] Traceability table maps all requirements to waves/tasks
   - [ ] Wave files include `must_haves` blocks
   - [ ] No unmapped requirements (coverage = 100%)

### Run Validation Tools

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output plan execute <feature-dir> --plugin frontend
```

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest <feature-dir> --plugin frontend
```

### Eng Review Gate

After running validation checks but before presenting results, offer a comprehensive engineering review via `AskUserQuestion`:

> "Plan validation complete. Want a comprehensive engineering review before locking?"
>
> We recommend **A** for complex features (>4 waves, new subsystems, external integrations), **B** for straightforward work:
>
> - **A) Eng Review** — Full architecture + error/rescue map + test diagram + failure modes + performance review. Invokes `/plan-eng-review` against the Execute outputs. Catches edge cases, silent failures, and architectural smells before BUILD starts.
> - **B) Skip** — Accept plan based on validation checks alone.
> - **C) Quick failure check** — Just failure mode analysis: for each new codepath, one realistic production failure scenario + is it tested/handled/visible? Lighter than full eng review.

If user selects A: invoke `Skill(plan-eng-review)` with the Execute artifact as context. After the review completes, return here and present the plan summary below.

If user selects C: run the quick failure check inline, then present the plan summary.

### NOT in Scope (MANDATORY)

Before presenting the plan summary, produce a "NOT in scope" section listing work that was considered during DISCOVER/PLAN and explicitly deferred. One-line rationale per item. This section MUST appear in the review artifact.

If no items were deferred, state: "No scope deferrals identified — all DISCOVER requirements are addressed in this plan."

This section acts as a guardrail during BUILD — anything listed here is intentionally excluded and should NOT be added by subagents.

### Cross-Stack Confirmation

Review the architecture decisions for backend dependencies:

1. Check MANIFEST for `Cross-Stack: backend` tag from INTAKE
2. Review locked decisions — do any require backend changes? (new endpoints, auth changes, new models, webhooks)
3. If cross-stack work is confirmed: ensure the review artifact documents what the backend pipeline needs to build
4. If cross-stack tag is missing but architecture reveals backend needs: add the tag now and document the dependency

Cross-stack work does NOT block the frontend pipeline — it flags that backend work should be coordinated (either already done or needs a separate `/dev` run on the backend).

### Surface Gaps

Use `AskUserQuestion` for any gaps found. Present the plan summary:

```
## /dev:plan — Architecture Review

**Feature:** [name]

### Locked Decisions
| ID | Decision | Choice | WHY (short) |
|----|----------|--------|-------------|
| D01 | ... | ... | ... |

### Plan Summary
- Tasks: [N] across [N] waves
- Backend status: All endpoints exist | [N] endpoints MISSING
- Acceptance criteria: [N] items defined

### Validation
- [ ] Every decision has WHY: [PASS/FAIL]
- [ ] Every requirement has a task: [PASS/FAIL]
- [ ] Wave groupings logical: [PASS/FAIL]
- [ ] Backend blockers flagged: [PASS/FAIL]
- [ ] requirements.md exists with checkable IDs: [PASS/FAIL]
- [ ] All requirements testable: [PASS/FAIL]
- [ ] Traceability covers all requirements: [PASS/FAIL]
- [ ] Wave must_haves present: [PASS/FAIL]

Options:
1. **Accept** — proceed to DESIGN
2. **Retry Execute** — re-dispatch subagents with adjustments
3. **Back to Architect** — redesign the execution plan
4. **Back to Discuss** — revisit architecture direction
```

**User decides.** No auto-accepting (D08).

### On Accept

1. Update MANIFEST phase progress: PLAN = complete
2. Write review artifact with bridge context for DESIGN

### Notion Update

After acceptance, update the Dev Tracker card with architecture decisions. Read the Card ID from MANIFEST's `## Notion Integration > Card ID`.

1. **Update card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: Card ID from MANIFEST
   - Properties: Notes = append locked architecture decisions summary (decision IDs, choices, and WHY), Last Updated = today's ISO date

2. Display: `📋 Notion: Updated notes — "[Feature Name]" (architecture decisions locked)`

**Notion Protocol:** Follow the Retry + Warning Protocol in `references/notion-integration.md`.
- Phase type: Downstream (status update — check Card ID first)
- Target status: (notes update, no status change)
- Persist warning in: `.dev/plan/review-plan-approval.md`

Display `Next Up` block and **STOP**:

```
---
▶ Next Up

Phase: DESIGN — Visual design spec + component design

`/dev:design`

/clear first -> fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke DESIGN. Do not offer "continue in same session".

Frontend ALWAYS routes to DESIGN after PLAN (D15). There is no conditional skip.

### Artifact

`.dev/plan/review-plan-approval.md` — Validation verdicts with evidence, user decision, locked decisions summary, wave plan summary, backend dependency status, bridge context for DESIGN.

This artifact IS the context bridge. DESIGN reads it to understand architecture decisions.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output plan review <feature-dir> --plugin frontend
```

---

## Decision Log Format

Every architecture decision MUST follow this format:

```markdown
| ID | Decision | Choice | WHY | Alternatives Rejected |
|----|----------|--------|-----|----------------------|
| D01 | State management | Zustand | Lightweight, no boilerplate, fits project patterns | Redux (overkill), Context (re-render issues) |
```

Rules:
- **WHY is mandatory.** No exceptions. A decision without WHY is a guess.
- **Alternatives Rejected is mandatory.** Forces deliberate thinking over defaults.
- **Cite codebase evidence** where possible — reference real file paths as precedent.
- Decisions are LOCKED after Review approval. Changes require re-entering PLAN.

---

## Directory Structure

```
docs/[Feature_Name]/
└── .dev/
    ├── MANIFEST.md
    ├── discover/
    │   └── review-design-approval.md    <- context bridge IN
    └── plan/
        ├── discuss-architecture-direction.md
        ├── architect-decision-framework.md
        ├── requirements.md                   <- HARD CONTRACT for VALIDATE
        ├── execute-locked-decisions.md
        └── review-plan-approval.md           <- context bridge OUT (to DESIGN)
```

No `prompt-transitions/` directory. The `review-plan-approval.md` serves as the context bridge to DESIGN.

---

## Common Mistakes

| Mistake | Prevention |
|---------|------------|
| Decisions without WHY | Every decision MUST include reasoning — reject entries missing it |
| Missing alternatives rejected | Forces deliberate thinking — reject entries missing it |
| Tasks without acceptance criteria | Every task needs a clear done-definition |
| Tasks without exact file paths | Subagents create wrong files without paths — every task lists create/modify/test |
| Tasks larger than 2.5 hours | Split. If it feels like one task, it is two |
| Bridging to DOCUMENT instead of DESIGN | Frontend: PLAN always routes to DESIGN (D15) |
| Waves with hidden dependencies | One file = one task = one wave assignment — no conflicts |
| Architecture without codebase evidence | Every choice should cite a real file path as precedent |
| Batching questions in Discuss | One `AskUserQuestion` at a time (D02) |
| Creating decisions inline in Execute | MUST dispatch subagent (D03) |
| Skipping `/prompt-generator` in Architect | Mandatory for every Architect stage (D04) |
| Auto-accepting in Review | User decides — surface via `AskUserQuestion` (D08) |
| Auto-invoking next phase after Review | Display `Next Up` block and STOP |
| Creating `prompt-transitions/` directory | v1.x pattern removed — `review-*.md` IS the context bridge |
| Skipping doneness questions in Discuss | At least 1 doneness question is MANDATORY before advancing |
| No requirements.md produced in Architect | requirements.md is the HARD CONTRACT for VALIDATE — without it, verification is insufficient |
| Wave files missing must_haves | Every wave needs truths, artifacts, key_links for goal-backward verification |

---

## Quick Reference

```
Discuss:  AskUserQuestion (WHAT + HOW meta + doneness) -> discuss-architecture-direction.md
Architect: /prompt-generator -> architect-decision-framework.md + requirements.md
Execute:  Subagents produce 5 outputs + must_haves -> execute-locked-decisions.md
Review:   Validate (incl. requirements checks) + user confirms -> review-plan-approval.md

Execute outputs:
  1. Locked Decision Log (WHY + alternatives rejected)
  2. Task List (ID, files, acceptance criteria, wave, agent)
  3. Wave Groupings (parallel tasks, sequential waves)
  4. Acceptance Criteria (feature-level done-definition)
  5. Backend Dependency Status (EXISTS/MISSING per endpoint)

PLAN always routes to DESIGN (D15). No conditional skip.
No tiers. No prompt-transitions/. review-*.md = context bridge.
```
