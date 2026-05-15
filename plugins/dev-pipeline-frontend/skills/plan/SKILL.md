---
name: plan
description: Makes architecture decisions, creates task breakdowns, and defines wave groupings for a feature. Informed by DESIGN spec, reads DESIGN bridge. Produces locked decision log and task list via the 4-stage inner loop. Triggers on /dev:plan or when /dev router advances past DESIGN.
---

# /dev:plan — Architecture Decisions + Task Breakdown (v4.0 — Informed by DESIGN)

Lock architecture decisions (with WHY + alternatives rejected), break work into tasks, group tasks into waves, and define acceptance criteria. Uses the 4-stage inner loop: Discuss, Architect, Execute, Review.

## Hard Rules

1. **Read before acting.** Use the Read tool on context bridges, MANIFEST, and domain-agent-map before Discuss. Architecture decisions made from memory cause wrong patterns and rework in BUILD.
2. **Read domain-agent-map before agent dispatch.** Use `Read(references/domain-agent-map.md)` during Architect to select the right specialist agents for this feature's domains — not just the default code-architect.
3. **Use agent-prompt-template for dispatches.** Follow `references/agent-prompt-template.md`. Include decision log context, file paths, and must_haves.
4. **Show visual mockups inline.** When discussing component hierarchies, state flows, or page structures, render D2 or ASCII diagrams in chat and confirm via AskUserQuestion with preview (D17). Prefer D2 syntax — it renders to SVG via `d2` CLI and is readable as text.

## GROUND — Stage 0 (Architecture Grounding)

Before entering Discuss, dispatch an Explore agent to understand the current codebase state for this feature's domains:

```
Agent tool:
  subagent_type: "Explore"
  prompt: "Analyze Thoven frontend architecture for [feature domains from MANIFEST]:
    1. Current state management patterns (contexts/, hooks/, store/)
    2. API layer structure (lib/*-api.ts) for related endpoints
    3. Component patterns for similar features
    4. Route structure in app/ for related pages
    Report: architecture constraints, patterns to follow, patterns to avoid"
```

---

## Stage 1: Discuss — Architecture Direction

**Purpose:** Gather architecture preferences, constraints, and execution strategy from the user before planning begins.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry plan discuss <feature-dir> --plugin frontend
```

### MANDATORY CONTEXT LOADING — Step 0

Use the Read tool on each file. Do not proceed to WHAT questions until all reads complete.

1. `Read(.dev/design/review-design-compliance.md)` → extract: design spec, component inventory, visual direction, responsive strategy, backend requirements status, LOCKED decisions
2. `Read(references/domain-agent-map.md)` → extract: agent assignments for PLAN phase, specialist agents per domain
3. `Read(references/requirements-template.md)` → extract: requirement ID format, must_haves structure
4. `Read(references/inner-loop-reference.md)` → extract: D04, D14, D15 decision rules
5. `Read(references/codebase-context-block.md)` → extract: stack details, design system rules
6. `Read(references/bridge-template.md)` → extract: structured bridge format, echo-back protocol
7. `Read(references/decision-ledger-template.md)` → extract: ledger format, LOCKED decisions to respect
8. `Read(references/mode-propagation-reference.md)` → extract: depth settings for current execution mode

If any file is missing, STOP and surface the gap to the user.

**Echo-Back (v4.0):** After loading, echo back LOCKED decisions and design context:

```
Loaded context from DESIGN:
- [N] LOCKED decisions: U-01 (description), U-02 (description), ...
- Execution mode: [Expansion/Hold/Reduction]
- Component inventory: [N] new, [N] reused, [N] extended
- Backend status: [all exist / contract stub at .dev/design/backend-contract-stub.md]
- Design spec: .dev/design/execute-design-spec.md
```

If echo-back is incomplete → re-read bridge.

### Mechanics (per inner-loop-reference.md Section 2.1)

Use `AskUserQuestion` for EVERY question. One question at a time. NEVER batch multiple questions into a single prompt. No cap on questions — the user says "enough" or "move on" to proceed.

**WHAT questions** — The work itself:
- Component architecture preferences (atomic, feature-based, page-based)?
- State management approach (Context, Zustand, Redux, local state)?
- API integration patterns (React Query, SWR, custom hooks)?
- Backend dependencies — are all APIs ready?
- Known constraints (performance budgets, bundle size limits, browser support)?
- Accessibility requirements beyond WCAG 2.1 AA baseline?
- "The design spec shows [N] new components — how should we organize them? (atomic, feature-based, page-based)"
- "The design has these interactions: [from spec] — what state management approach fits?"
- "Backend status is [exists/mocked] — how does that affect our task breakdown?"

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

#### Architect Step 0: Verify Context Loaded

Before designing agent prompts, confirm:
- [ ] `domain-agent-map.md` was Read in Step 0 — list ALL agents from the map for this phase as either "dispatched" or "skipped (reason)"
- [ ] Domain Combination Patterns checked — read the Domain Combination Patterns table from domain-agent-map.md and apply any extra considerations (e.g., `routing + auth-ui` = test both authenticated and unauthenticated access)
- [ ] Previous phase review artifact was Read — decisions and context carried forward
- [ ] DESIGN_SPEC was Read — component inventory and interaction patterns inform agent prompts
- [ ] Execution mode from Decision Ledger determines agent depth (see mode-propagation-reference.md)
- [ ] All LOCKED decisions addressed in architecture plan — none silently dropped
- [ ] Architecture decisions don't contradict DESIGN_SPEC constraints (responsive breakpoints, motion patterns, interactive state models, accessibility commitments)

This verification appears in the Orchestration Log under `Map compliance`.

### Subagent Definitions

| Field | Description |
|-------|-------------|
| **Agent type** | `code-reviewer` (decisions), `frontend-developer` (task breakdown), optional `challenger` (stress-test) |
| **Prompt** | Crafted via `/prompt-generator` |
| **Success criteria** | What the subagent output must contain |
| **Input context** | Discuss artifact + DISCOVER review artifact + MANIFEST |
| **Execution order** | Parallel vs sequential, dependencies between agents |

### Decision Categories

Subagents must address: component architecture, state management, API patterns, styling approach, routing, and dependencies. **If the DESIGN_SPEC identified animation/motion patterns**, also address motion (see Motion-Aware Task Assignment below).

### Motion-Aware Task Assignment

If the DESIGN_SPEC (read from the DESIGN bridge) identified animation/motion primitives, assign motion-implementation tasks to the specific GSAP specialist matching the interaction:

| DESIGN_SPEC motion type | Task Agent assignment |
|---|---|
| Scroll-triggered reveals, parallax, pin/unpin | `gsap-scrolltrigger` |
| Multi-step orchestrated sequences | `gsap-timeline` |
| React-specific (useGSAP, context, cleanup) | `gsap-react` |
| Performance budgets / will-change / FLIP | `gsap-performance` |
| Base tweens / easings / stagger | `gsap-core` |
| Plugin-specific (Flip, Draggable, MorphSVG) | `gsap-plugins` |
| Next.js App Router / SSR-aware | `gsap-frameworks` |
| Utility math (clamp, mapRange, interpolate) | `gsap-utils` |

If no motion in DESIGN_SPEC, skip this section silently. If GSAP skills are not installed in the project, recommend installing the specific skill needed rather than falling back to framer-motion without surfacing the choice to the user.

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

**v4.0: Design-Informed Tasks.** Each task in the task list should reference specific components from the DESIGN_SPEC. The design spec provides: exact component names, interaction patterns, state requirements, and responsive behavior. Use these to make task descriptions concrete rather than abstract.

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

#### 6. Architecture Diagrams (D2 + ASCII)

For any non-trivial feature, subagents MUST produce architecture diagrams using **D2 syntax** (preferred) or ASCII:

- **Data flow diagram** — How data moves through new components (required if feature has >2 components)
- **State machine** — For components with >3 states (required if feature has stateful UI)
- **Dependency graph** — Before/after showing new coupling (required if feature touches >4 files)

**D2 rendering (when `d2` CLI is available):**
After producing diagrams in D2 syntax, render to SVG:
```bash
d2 docs/[Feature]/.dev/plan/diagrams/<name>.d2 docs/[Feature]/.dev/plan/diagrams/<name>.svg --layout=elk
```
Store both `.d2` source and `.svg` output in `docs/[Feature]/.dev/plan/diagrams/`. Reference the SVGs in task files and wave files so BUILD agents have visual context.

**Fallback:** If `d2` is not installed, produce ASCII diagrams inline (previous behavior). D2 source files are still valuable as text — they're readable without rendering.

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
7. **Design coverage** — every component in DESIGN_SPEC has at least one corresponding task
8. **LOCKED decision compliance** — no LOCKED decisions from the ledger were contradicted or dropped

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

**v4.0 note:** Backend status was already determined in DESIGN Review. If a contract stub exists at `.dev/design/backend-contract-stub.md`, PLAN should use it for mock data typing in the task breakdown.

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
1. **Accept** — proceed to DOCUMENT
2. **Retry Execute** — re-dispatch subagents with adjustments
3. **Back to Architect** — redesign the execution plan
4. **Back to Discuss** — revisit architecture direction
```

**User decides.** No auto-accepting (D08).

### On Accept

1. Update MANIFEST phase progress: PLAN = complete
2. Write review artifact with bridge context for DOCUMENT using `references/bridge-template.md` format

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

#### Dispatch Mandate for Next Phase

The review artifact's context bridge MUST include a "Dispatch Mandate" section listing:
- **Mandatory agents** from domain-agent-map.md for the NEXT phase
- **Conditional agents** with their trigger conditions
- **Skipped agents** with reason

The next phase's Architect must address each listed agent — silent omission is not allowed.

Display `Next Up` block and **STOP**:

```
---
▶ Next Up

Phase: DOCUMENT — 5-layer docs + wave execution plans

`/dev:document`

/clear first -> fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke DOCUMENT. Do not offer "continue in same session".

Frontend ALWAYS routes to DOCUMENT after PLAN. There is no conditional skip.

### Artifact

`.dev/plan/review-plan-approval.md` — Validation verdicts with evidence, user decision, locked decisions summary, wave plan summary, backend dependency status, bridge context for DOCUMENT. Must use `references/bridge-template.md` format.

This artifact IS the context bridge. DOCUMENT reads it to understand architecture decisions.

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
    ├── design/
    │   └── review-design-compliance.md  <- context bridge IN
    └── plan/
        ├── discuss-architecture-direction.md
        ├── architect-decision-framework.md
        ├── requirements.md                   <- HARD CONTRACT for VALIDATE
        ├── execute-locked-decisions.md
        └── review-plan-approval.md           <- context bridge OUT (to DOCUMENT)
```

No `prompt-transitions/` directory. The `review-plan-approval.md` serves as the context bridge to DOCUMENT.

---

## Common Mistakes

| Mistake | Prevention |
|---------|------------|
| Decisions without WHY | Every decision MUST include reasoning — reject entries missing it |
| Missing alternatives rejected | Forces deliberate thinking — reject entries missing it |
| Tasks without acceptance criteria | Every task needs a clear done-definition |
| Tasks without exact file paths | Subagents create wrong files without paths — every task lists create/modify/test |
| Tasks larger than 2.5 hours | Split. If it feels like one task, it is two |
| Ignoring DESIGN_SPEC in architecture | Architecture decisions disconnected from actual UI | Every architecture choice must reference DESIGN_SPEC components |
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
| Reading discover bridge instead of design | v4.0: PLAN reads DESIGN bridge | Context bridge is `.dev/design/review-design-compliance.md` |
| Abstract task descriptions | Tasks say "create component" without referencing actual design | Reference DESIGN_SPEC component names and interaction patterns |
| Dropping LOCKED decisions in task breakdown | User scope items not mapped to tasks | Every LOCKED IN-scope item must have a corresponding task |
| Ignoring execution mode depth | All plans run at same depth | Check mode-propagation-reference.md for PLAN depth settings |

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

PLAN always routes to DOCUMENT. No conditional skip.
No tiers. No prompt-transitions/. review-*.md = context bridge.
```
