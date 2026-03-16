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

**Tool:** `AskUserQuestion` for EVERY question. One question at a time. NEVER batch multiple questions into a single prompt.

**No cap on questions.** The user says "enough" or "move on" to proceed. The orchestrator does not decide when questioning is sufficient.

**Two question types:**

| Type | Asks About | Examples |
|------|-----------|----------|
| **WHAT** | The work itself | Requirements, constraints, preferences, references, prior art |
| **HOW** (meta) | Execution strategy | "How deep should we go on [aspect]?", "Parallel agents or focused sequential?", "Full [audit type] or quick check?", "Boardroom debate or focused research?", "How strict should review be?" |

The user is the team lead. They control depth and direction through HOW answers.

**Optional research pre-step:** At any point during Discuss, the user can opt in for codebase research before continuing. If opted in, dispatch an Explore agent to scan relevant code, then resume questioning with findings.

**Stage artifact:** `discuss-<descriptive-name>.md` — captures all Q&A, locked decisions, and user preferences.

### 2.2 Architect

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
2. **If unavailable** (skill not loaded, MCP issue): WARN the user, craft prompt inline using `references/agent-prompt-template.md` as fallback, log "prompt-generator: UNAVAILABLE — used fallback template" in Architect artifact
3. **If user says "skip"**: Explain: "Prompt quality determines subagent output quality. Poor prompts produce shallow work that requires manual correction." Ask once more. If user insists: proceed, log "prompt-generator: USER-SKIPPED" in Architect artifact
4. **Never silently skip** — every Architect artifact must document prompt-generator status

### Orchestration Log (MANDATORY in every Architect artifact)

Every `architect-*.md` file MUST include this section:

```markdown
## Orchestration Log
- **Agents selected:** [list with domain justification]
- **Prompt generator:** used / unavailable (fallback) / user-skipped
- **Cross-stack signals:** none / detected ([details])
- **Multi-domain dispatch:** N/A / parallel ([agents listed])
```
