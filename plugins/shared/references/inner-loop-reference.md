# Inner Loop Reference — 4-Stage Pattern

Canonical reference for the Discuss → Architect → Execute → Review inner loop used by all phase skill files in dev-pipeline-frontend and dev-pipeline-backend v2.0.

Every phase runs the same 4 stages. Same structure, different meaning per phase — like how every team in a company has standups but discusses fundamentally different things.

---

## 1. Stage Definitions

| Stage | Analogy | Purpose |
|-------|---------|---------|
| **Discuss** | Team sits down, talks through the problem | Gather requirements, constraints, preferences via structured questioning |
| **Architect** | Lead plans the approach, assigns work | Craft subagent prompts, define success criteria, plan execution order |
| **Execute** | Team members do the work | Dispatch subagents, collect results, produce artifacts |
| **Review** | Team lead reviews output | Check against success criteria, surface gaps, get user decision |

---

## 2. Stage Mechanics

### 2.1 Discuss

**Step 0: Load Context (MANDATORY — before anything else)**

Before entry validation, before questions, before ANY other work, Read these files using the Read tool. Do NOT proceed until all are loaded:

1. **Read** `${PLUGIN_ROOT}/references/domain-agent-map.md` — agent assignments for this phase
2. **Read** `${PLUGIN_ROOT}/references/inner-loop-reference.md` — stage mechanics and enforcement rules (this file — skip if already in context)
3. **Read** `${PLUGIN_ROOT}/references/codebase-context-block.md` — standard context for subagent prompts

Extract from domain-agent-map.md for THIS phase:
- Which agents are MANDATORY for this phase
- Which agents are CONDITIONAL (and their triggers)
- Which domain combinations apply based on MANIFEST tags

These agents MUST be addressed in the Architect stage — either dispatched or explicitly skipped with reason logged in the Orchestration Log.

**Tool:** `AskUserQuestion` for EVERY question. One question at a time. NEVER batch multiple questions into a single prompt.

**No cap on questions.** The user says "enough" or "move on" to proceed. The orchestrator does not decide when questioning is sufficient.

**Two question types:**

| Type | Asks About | Examples |
|------|-----------|----------|
| **WHAT** | The work itself | Requirements, constraints, preferences, references, prior art |
| **HOW** (meta) | Execution strategy | "How deep should we go on [aspect]?", "Parallel agents or focused sequential?", "Full [audit type] or quick check?", "Boardroom debate or focused research?", "How strict should review be?" |

The user is the team lead. They control depth and direction through HOW answers.

**Automatic Research Pre-Step (DISCOVER, PLAN, BUILD):**

Before asking WHAT questions, dispatch an Explore agent scoped to this phase's domain:
- **DISCOVER:** Scan models, services, controllers for feature-relevant patterns
- **PLAN:** Scan for architectural precedents relevant to design decisions
- **BUILD (per wave):** Scan files that will change in this wave for recent modifications

The orchestrator uses Explore findings to ask BETTER questions — questions informed by codebase reality rather than asked "blind."

**For VALIDATE and SHIP:** Skip auto-research (context bridge from previous phase is sufficient). User can still opt in manually.

**Stage artifact:** `discuss-<descriptive-name>.md` — captures all Q&A, locked decisions, and user preferences.

### 2.2 Architect

**Step 0: Verify Context Loaded (MANDATORY)**

Confirm `domain-agent-map.md` was Read in Discuss. If not, Read it now using the Read tool.
List ALL agents defined for this phase in domain-agent-map.md.
Each agent MUST appear in the Orchestration Log as either:
- **Dispatched** — with prompt and success criteria
- **Skipped** — with explicit reason (e.g., "domain not tagged in MANIFEST", "no data model changes")

Also check the **Domain Combination Patterns** table in domain-agent-map.md. If the MANIFEST domains match any combination pattern, apply the extra considerations listed.

**MANDATORY:** Use `/prompt-generator` skill to craft every subagent prompt. Prompt quality IS architecture.

Define for each subagent:

| Field | Description |
|-------|-------------|
| **Agent type** | From domain-agent-map.md or phase-specific agent table |
| **Prompt** | Crafted via `/prompt-generator` |
| **Success criteria** | What the subagent output must contain |
| **Input context** | Files and docs to feed the subagent |
| **Execution order** | Parallel vs sequential, dependencies between agents |

Define for the phase overall:
- Overall success criteria (what the combined output must achieve)
- Escalation rules (what happens if a subagent fails)

**Stage artifact:** `architect-<descriptive-name>.md` — the execution plan with all subagent assignments. Must include an Orchestration Log section (see D04 Enforcement Protocol in Section 9).

### 2.3 Execute

**MANDATORY:** Dispatch subagents. The orchestrator NEVER executes work inline.

For each subagent defined in Architect:
1. Dispatch using Agent tool with the crafted prompt
2. Wait for completion
3. Collect results
4. Check against per-subagent success criteria
5. Log result (pass/fail, deviations, artifacts produced)

**Failure handling:** If a subagent fails, log the failure, continue with remaining agents, surface all failures in Review.

**Parallelism:** Multiple subagents can run in parallel if Architect marked them as independent.

**Stage artifact:** `execute-<descriptive-name>.md` — results from all dispatched subagents.

### 2.4 Review

Check Execute output against Architect's success criteria. For each criterion: evidence-based pass/fail.

Surface any gaps or failures to user via `AskUserQuestion`.

**User decides next action (NO auto-looping):**

| Option | When to Use |
|--------|-------------|
| **Retry Execute** | Re-dispatch failed subagents with adjusted prompts |
| **Back to Architect** | Redesign the execution plan |
| **Back to Discuss** | Revisit requirements or direction |
| **Accept** | Approve and move to next phase |

If accepted: update MANIFEST with phase status, produce review artifact.

**Stage artifact:** `review-<descriptive-name>.md` — verdicts, evidence, user decision. This artifact IS the context bridge to the next phase (see Section 7).

---

## 3. Stage Transition Rules

| Transition | Prerequisites |
|-----------|---------------|
| Phase Discuss starts | MANIFEST exists, previous phase's `review-*.md` exists (or phase is INTAKE), phase not already complete |
| Discuss → Architect | `discuss-*.md` exists in phase directory |
| Architect → Execute | `architect-*.md` exists, contains subagent assignments + success criteria + execution order |
| Execute → Review | `execute-*.md` exists, planned artifacts exist on disk |
| Review → next phase | `review-*.md` exists, pass/fail verdict present, MANIFEST updated with phase status |

---

## 4. Artifact Naming Convention

**Pattern:** `<stage>-<descriptive-name>.md`

Names are phase-specific and descriptive. Never generic.

| Phase | Discuss | Architect | Execute | Review |
|-------|---------|-----------|---------|--------|
| INTAKE | `discuss-classification.md` | `architect-manifest-plan.md` | `execute-manifest-created.md` | `review-classification-confirmed.md` |
| DISCOVER | `discuss-requirements.md` | `architect-exploration-plan.md` | `execute-design-doc.md` | `review-design-approval.md` |
| PLAN | `discuss-architecture-direction.md` | `architect-decision-framework.md` | `execute-locked-decisions.md` | `review-plan-approval.md` |
| DESIGN | `discuss-visual-direction.md` | `architect-design-plan.md` | `execute-design-spec.md` | `review-design-compliance.md` |
| DOCUMENT | `discuss-documentation-scope.md` | `architect-documentation-plan.md` | `execute-docs-manifest.md` | `review-documentation-quality.md` |
| BUILD | `discuss-implementation-path.md` | `architect-subagent-prompts.md` | `execute-build-results.md` | `review-code-quality.md` |
| VALIDATE | `discuss-validation-strategy.md` | `architect-validation-plan.md` | `execute-validation-results.md` | `review-ship-readiness.md` |
| SHIP | `discuss-release-scope.md` | `architect-release-plan.md` | `execute-release-output.md` | `review-release-confirmation.md` |

Each phase skill file defines its own artifact names. The names above are defaults from the design doc.

---

## 5. Directory Structure

```
docs/[Feature]/.dev/
├── MANIFEST.md
├── intake/
│   ├── discuss-classification.md
│   ├── architect-manifest-plan.md
│   ├── execute-manifest-created.md
│   └── review-classification-confirmed.md
├── discover/
│   └── ...
├── plan/
│   └── ...
├── design/          (frontend only, always runs)
│   └── ...
├── document/
│   └── ...
├── build/
│   ├── wave-01/
│   │   ├── discuss-implementation-path.md
│   │   ├── architect-subagent-prompts.md
│   │   ├── execute-build-results.md
│   │   └── review-code-quality.md
│   └── wave-NN/
│       └── ...
├── validate/
│   └── ...
└── ship/
    └── ...
```

Each phase gets its own subdirectory. Agents only read their phase directory, reducing context bloat.

---

## 6. Tool Integration

Call these at the specified points. Tool location: `${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js`

| When | Command |
|------|---------|
| Before entering any stage | `validate-stage-entry <phase> <stage> <feature-dir> --plugin frontend\|backend` |
| After completing any stage | `validate-stage-output <phase> <stage> <feature-dir> --plugin frontend\|backend` |
| Before session breaks | `checkpoint-state <feature-dir> --scope wave\|phase --plugin frontend\|backend` |
| After MANIFEST changes | `validate-manifest <feature-dir> --plugin frontend\|backend` |

---

## 7. Context Bridge Pattern

The `review-*.md` of each phase serves as the context bridge to the next phase. There is NO separate `prompt-transitions/` directory.

When starting a new phase's Discuss stage, read the previous phase's `review-*.md` for context.

**Review artifacts must contain:**
- Summary of what was decided or produced
- Caveats or warnings for the next phase
- Recommended focus areas

---

## 8. Exceptions

### 8.1 PAUSE — No Inner Loop

PAUSE is an operational interrupt, not a development phase. It follows a GSD-style state dump:

1. **Capture:** current phase, current stage within that phase, what is done, what remains, blockers
2. **Write:** `pause-handoff.md` in `.dev/` root with resume instructions
3. **Update:** MANIFEST with pause context block (current phase, stage, wave if BUILD)
4. **Commit:** WIP commit with all state files
5. **Confirm:** User verifies handoff is complete

### 8.2 BUILD — Per-Wave Inner Loop

BUILD runs the 4-stage inner loop once PER WAVE, not once for the whole phase.

- Each wave gets its own subdirectory: `.dev/build/wave-01/`, `.dev/build/wave-02/`, etc.
- Each wave has its own Discuss → Architect → Execute → Review cycle
- User decides depth per wave via Discuss meta-questions
- MANIFEST tracks current wave number
- Session breaks between waves use `checkpoint-state` with `--scope wave`

---

## 9. Key Decisions

These decisions from the design doc govern the inner loop. Referenced by ID throughout skill files.

| ID | Decision | Rule |
|----|----------|------|
| D01 | Inner loop stages | Discuss → Architect → Execute → Review |
| D02 | Question mechanic | AskUserQuestion for every question, one at a time |
| D03 | Subagent dispatch | Mandatory in Execute — orchestrator never executes inline |
| D04 | Prompt crafting | `/prompt-generator` in every Architect stage (see D04 Enforcement Protocol below) |
| D05 | Tier system | Removed — user decides depth via Discuss meta-questions |
| D06 | User role | Team lead — Discuss asks WHAT and HOW |
| D07 | Question cap | No cap — user says "enough" |
| D08 | Review failure | Surface to user — no auto-looping |
| D09 | Research pre-step | Optional, user opts in during Discuss |
| D14 | BUILD structure | Inner loop per wave |
| D16 | PAUSE | Operational, no inner loop |

---

## 10. D04 Enforcement Protocol

The orchestrator MUST follow this sequence in every Architect stage:

1. **Attempt** `/prompt-generator` for every subagent prompt
2. **If unavailable** (skill not loaded, MCP issue): WARN the user, **Read** `${PLUGIN_ROOT}/references/agent-prompt-template.md` using the Read tool, craft prompt using that template as fallback, log "prompt-generator: UNAVAILABLE — used fallback template" in Architect artifact
3. **If user says "skip"**: Explain: "Prompt quality determines subagent output quality. Poor prompts produce shallow work that requires manual correction." Ask once more. If user insists: proceed, log "prompt-generator: USER-SKIPPED" in Architect artifact
4. **Never silently skip** — every Architect artifact must document prompt-generator status

### Orchestration Log (MANDATORY in every Architect artifact)

Every `architect-*.md` file MUST include this section:

```markdown
## Orchestration Log
- **Agents selected:** [list with domain justification]
- **Map compliance:** [for each agent in domain-agent-map.md for this phase:]
  - [agent-name]: dispatched — [1-line justification]
  - [agent-name]: skipped — [explicit reason why not needed]
- **Prompt generator:** used / unavailable (fallback) / user-skipped
- **Cross-stack signals:** none / detected ([details])
- **Multi-domain dispatch:** N/A / parallel ([agents listed])
- **Domain combinations detected:** none / [list matched combinations + extra considerations applied]
```

**Map compliance is the enforcement mechanism.** Every agent listed for this phase in `domain-agent-map.md` MUST appear — either dispatched or skipped with reason. Silent omission is not allowed. If an agent from the map is missing from the Orchestration Log, the Architect artifact is incomplete.

---

## 11. Inner Loop Visual Tracking via TaskCreate

The orchestrator MUST create TaskCreate entries for each inner loop stage at the start of every phase (or every wave for BUILD). This provides visual accountability, self-regulation, and progress tracking across `/clear` breaks.

### 11.1 The Rule

1. At phase start (or wave start for BUILD), create 4 TaskCreate entries — one per stage
2. Mark `in_progress` when entering the stage
3. Mark `completed` when the stage artifact is written to disk
4. If a stage is re-entered (e.g., Review sends back to Execute), mark the new attempt `in_progress` again

### 11.2 Stage Name Lookup Table

Use this table for TaskCreate subjects and activeForm text:

| Phase | Discuss | Architect | Execute | Review |
|-------|---------|-----------|---------|--------|
| INTAKE | Classification | Manifest Plan | Manifest Created | Classification Confirmed |
| DISCOVER | Feature Requirements | Exploration Plan | Design Doc | Design Approval |
| DESIGN | Visual Direction | Design Plan | Design Spec | Design Compliance |
| PLAN | Architecture Direction | Decision Framework | Locked Decisions | Plan Approval |
| DOCUMENT | Documentation Scope | Documentation Plan | Docs Manifest | Documentation Quality |
| BUILD (per wave) | Implementation Path | Subagent Prompts | Build Tasks | Verify-Fix Loop |
| VALIDATE | Validation Strategy | Validation Plan | Validation Results | Ship Readiness |
| SHIP | Release Scope | Release Plan | Release Output | Release Confirmation |

### 11.3 TaskCreate Pattern

```
TaskCreate("[PHASE] / Discuss — [Name from table]", activeForm: "Discussing [name]...")
TaskCreate("[PHASE] / Architect — [Name from table]", activeForm: "Architecting [name]...")
TaskCreate("[PHASE] / Execute — [Name from table]", activeForm: "Executing [name]...")
TaskCreate("[PHASE] / Review — [Name from table]", activeForm: "Reviewing [name]...")
```

**Example — DISCOVER phase:**
```
TaskCreate("DISCOVER / Discuss — Feature Requirements", activeForm: "Discussing feature requirements...")
TaskCreate("DISCOVER / Architect — Exploration Plan", activeForm: "Architecting exploration plan...")
TaskCreate("DISCOVER / Execute — Design Doc", activeForm: "Executing design doc...")
TaskCreate("DISCOVER / Review — Design Approval", activeForm: "Reviewing design approval...")
```

### 11.4 Phase-Specific Gate Tasks

**DESIGN** adds two extra gate tasks (from v4.1.0 approval gates):
```
TaskCreate("DESIGN / Gate 1 — Layout Mockup Approved", activeForm: "Awaiting layout approval...")
TaskCreate("DESIGN / Gate 2 — Final Approval", activeForm: "Awaiting final design approval...")
```

Gate tasks are marked `completed` when the user approves via AskUserQuestion. They are marked `in_progress` when the approval question is presented.

### 11.5 BUILD Per-Wave Pattern

BUILD creates a fresh set of 4 stage tasks for EACH wave:

```
TaskCreate("BUILD W1 / Discuss — Implementation Path", activeForm: "Discussing W1 implementation...")
TaskCreate("BUILD W1 / Architect — Subagent Prompts", activeForm: "Architecting W1 prompts...")
TaskCreate("BUILD W1 / Execute — Build Tasks", activeForm: "Executing W1 build tasks...")
TaskCreate("BUILD W1 / Review — Verify-Fix Loop", activeForm: "Reviewing W1 verify-fix...")
```

For wave 2: `BUILD W2 / Discuss — Implementation Path`, etc.

### 11.6 Why This Matters

- **Visual accountability:** User sees pending stages in their task list — impossible to silently skip
- **Self-regulation:** Orchestrator follows its own task list rather than free-forming
- **Progress tracking:** Tasks persist across `/clear` breaks — resuming sessions can check TaskList for state
- **Gate visibility:** DESIGN approval gates appear as distinct tracked tasks
