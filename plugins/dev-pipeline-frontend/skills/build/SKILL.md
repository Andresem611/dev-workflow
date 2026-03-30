---
name: build
description: Executes implementation tasks wave-by-wave for a feature. Runs the 4-stage inner loop per wave — each wave gets its own Discuss/Architect/Execute/Review cycle. Dispatches specialized agents per task type. Triggers on /dev:build or when /dev router advances past DOCUMENT.
---

# /dev:build — Wave-by-Wave Implementation

Execute implementation tasks wave by wave. Each wave runs its own full 4-stage inner loop: Discuss, Architect, Execute, Review. Subagents are dispatched for every task — the orchestrator never builds inline.

## Hard Rules

1. **Read before every wave.** Use the Read tool on MANIFEST, wave file, requirements.md, and domain-agent-map before each wave — not just the first. The codebase changes between waves. Stale reads cause conflicting implementations.
2. **Dispatch agents for all Execute work.** Inline execution contaminates your review context. If you wrote the code, you can't objectively verify it in Review. The subagent writes with fresh eyes; you review with fresh eyes. This is what makes the verification layer trustworthy.
3. **Read domain-agent-map before dispatching.** Use `Read(references/domain-agent-map.md)` to select the right specialist for each task's domain — not just `frontend-developer` for everything.
4. **Use agent-prompt-template for every dispatch.** Follow `references/agent-prompt-template.md`. Include: codebase context block, decision log entries, must_haves from requirements.md, exact file paths, verification criteria.
5. **Include must_haves in every agent prompt.** Paste the specific must_haves from requirements.md that this task addresses. Without them, the agent can't verify its own output.
6. **Include LOCKED decisions in every agent prompt (v4.0).** Every BUILD agent prompt MUST include a "LOCKED Decisions (DO NOT OVERRIDE)" section listing all LOCKED items from the Decision Ledger. This prevents agents from making scope changes that contradict user decisions. See `references/decision-ledger-template.md`.
7. **Respect execution mode depth (v4.0).** Check `references/mode-propagation-reference.md` for BUILD depth settings. REDUCTION = 1 agent per task, quick review. HOLD = per domain-map. EXPANSION = per domain + independent reviewer.

### Anti-Rationalization Checklist (before Execute)

If you catch yourself thinking any of these, STOP and dispatch the agent instead:

| Thought | Reality |
|---------|---------|
| "This task is too simple for a subagent" | Dispatch anyway. Simplicity is not the criterion — independent verification is. |
| "I already know what code to write" | You know what you REMEMBER. The agent will read the actual files. |
| "It's faster to do it inline" | Speed is not the goal. Review integrity is. |
| "I'll just do this one task inline and dispatch the rest" | One inline task creates precedent for the next. Dispatch all. |
| "The agent will just do what I would do" | Then the review will confirm that. If it wouldn't, you just caught a bug. |

### GROUND — Per-Wave Codebase State Check

Before executing any wave, dispatch an Explore agent to verify the current state of files this wave will modify:

```
Agent tool:
  subagent_type: "Explore"
  prompt: "Check current state of files for Wave [N] of [feature]:
    Files to check: [list from wave plan]
    1. Do they exist? What's their current content?
    2. Any changes since previous wave?
    3. Any conflicts with previous wave output?
    Report: 5-line state summary"
```

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

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry build discuss <feature-dir> --plugin frontend --wave N
```

If FAIL, fix missing prerequisites before proceeding.

**MANDATORY: Load Requirements Context**

Before starting any wave, load `requirements.md` from the feature docs directory. This is the hard contract defining "done" — every build task must work toward satisfying these requirements. Pass relevant requirement IDs to build agents so they know what they're building toward.

### MANDATORY CONTEXT LOADING — Step 0 (Every Wave)

Use the Read tool on each file before this wave. Do not proceed until all reads complete.

1. `Read(docs/[feature]/requirements.md)` → extract: must_haves for this wave's tasks, requirement IDs
2. `Read(docs/[feature]/waves/WAVE_NN.md)` → extract: tasks, agent assignments, dependencies, completion criteria
3. `Read(docs/[feature]/.dev/MANIFEST.md)` → extract: current wave number, domains, decision log
4. `Read(references/domain-agent-map.md)` → extract: correct agent types for this wave's domain tags
5. `Read(references/agent-prompt-template.md)` → extract: prompt structure for agent dispatches
6. `Read(references/codebase-context-block.md)` → extract: standard context block to embed in all agent prompts
7. `Glob(docs/[feature]/.dev/plan/diagrams/*.d2)` + `Glob(docs/[feature]/.dev/document/diagrams/*.d2)` → if D2 diagrams exist, include their file paths in agent prompts as architecture context
8. **Completion logs from prior wave (Wave 2+ only):** Read the `## Completion Log` section from every task file completed in the previous wave. Extract: deviations, discoveries, and files touched. These become upstream context for this wave's agents.
   - `Read(docs/[feature]/tasks/TASK_XX.md)` for each task completed in wave N-1 → extract Completion Log section
   - Compile a "Prior Wave Discoveries" summary (max 10 bullet points) to embed in agent prompts

If any file is missing, STOP and surface the gap to the user.

### Context Reading

### Notion Update (First Wave Only)

On the first wave, move the Dev Tracker card to "Frontend Dev". Read the Card ID from MANIFEST's `## Notion Integration > Card ID`.

1. **Update card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: Card ID from MANIFEST
   - Properties: Status = `Frontend Dev`, Last Updated = today's ISO date

2. Display: `📋 Notion: Moved — "[Feature Name]" → Frontend Dev`

**Notion Protocol:** Follow the Retry + Warning Protocol in `references/notion-integration.md`.
- Phase type: Downstream (status update — check Card ID first)
- Target status: `Frontend Dev`
- Persist warning in: `.dev/build/wave-01/discuss-implementation-path.md`

**First wave only:** Read `.dev/document/review-documentation-quality.md` (context bridge from DOCUMENT). If missing, read MANIFEST + wave plans to reconstruct context.

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
- Coding standards or conventions to follow
- Test strategy (TDD strict, tests after, skip for now)
- Known gotchas from previous waves or codebase

**HOW meta-questions** — execution strategy:

- "Parallel or sequential agents for this wave?"
- "Code review between individual tasks or end of wave?"
- "TDD strict or flexible for this wave?"
- "Session break after this wave or continue?"
- "Any tasks you want to handle manually instead of subagent dispatch?"

**Optional research pre-step:** User can request codebase exploration before continuing. If opted in, dispatch an Explore agent to scan relevant code, then resume questioning with findings.

### Artifact

```
.dev/build/wave-NN/discuss-implementation-path.md
```

Captures: all Q&A, locked decisions for this wave, execution preferences.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output build discuss <feature-dir> --plugin frontend --wave N
```

---

## Stage 2: Architect — Subagent Prompts (Per Wave)

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry build architect <feature-dir> --plugin frontend --wave N
```

### Prompt Crafting (MANDATORY)

**D04 ENFORCEMENT:** Follow the D04 Enforcement Protocol from `inner-loop-reference.md`. Every subagent prompt MUST go through `/prompt-generator`. Log status in the Orchestration Log section of this artifact.

Use `/prompt-generator` to craft EVERY subagent prompt. No exceptions. Prompt quality determines build quality.

#### Architect Step 0: Verify Context Loaded

Before designing agent prompts, confirm:
- [ ] `domain-agent-map.md` was Read in Step 0 — list ALL agents from the map for this phase as either "dispatched" or "skipped (reason)"
- [ ] Domain Combination Patterns checked — read the Domain Combination Patterns table from domain-agent-map.md and apply any extra considerations (e.g., `routing + auth-ui` = test both authenticated and unauthenticated access)
- [ ] Previous phase review artifact was Read — decisions and context carried forward

This verification appears in the Orchestration Log under `Map compliance`.

#### BUILD Architect: Template Loading

Before crafting agent prompts:
- `Read(references/agent-prompt-template.md)` — use this structure for every agent prompt
- If `/prompt-generator` unavailable: the template IS the fallback (D04)

For each task in this wave, define:

| Field | Description |
|-------|-------------|
| **Agent type** | From Agent Selection (3-tier priority below) |
| **Prompt** | Crafted via `/prompt-generator` |
| **File paths** | Exact files to create/modify/test |
| **Codebase context block** | Relevant architecture, patterns, existing code references |
| **Architecture diagrams** | D2/SVG diagram paths from PLAN/DOCUMENT phases (data flow, component tree, state flow) — include in prompt so agent has visual architecture context |
| **Upstream context** | Completion log discoveries from prior wave tasks + completion logs from earlier sequential tasks in same wave. Compile as "Prior Discoveries" bullet list in prompt. |
| **Success criteria** | What the subagent output must contain and pass |
| **Escalation rules** | What happens if the task fails |

### Agent Selection (3-Tier Priority)

Select the agent for each task using this priority order:

**Tier 1 — Task-level hint** (highest priority): If the task file contains an `agent:` field, use that agent.

**Tier 2 — Keyword routing** (check task description, first match wins):

| Task mentions... | Dispatch agent |
|-----------------|----------------|
| page.tsx, layout.tsx, route, middleware, SSR, RSC, server component, generateMetadata, ISR | `next-js-developer` |
| interface, type definition, generic, tsconfig, discriminated union, branded type, type guard | `typescript-pro` |
| React.memo, useMemo, useCallback, re-render, Context optimization, Suspense, useTransition | `react-specialist` |
| ARIA, keyboard nav, screen reader, WCAG, focus management, alt text, contrast ratio | `accessibility-tester` |
| API design, endpoint contract, OpenAPI, versioning, pagination design | `api-designer` |
| lib/*-api.ts, fetch wrapper, API implementation | `frontend-developer` |
| Framer Motion, animation, CSS transition, spring | `ui-designer` |
| Bug investigation, race condition, debugging | `debug-specialist` |

**Tier 3 — Domain default** (fallback): Use the BUILD Agents column from `references/domain-agent-map.md` for the task's domain. If no domain match, default to `frontend-developer`.

### Execution Plan

Define execution order based on Discuss decisions: **parallel** (independent tasks in a single message), **sequential** (dependent tasks wait for predecessors), or **hybrid**.

#### Sequential Awareness Gate (MANDATORY)

Before marking tasks as parallel, check for shared state:

1. **File overlap check:** Compare the `## Files` sections of all tasks in this wave. If ANY two tasks modify the same file, default to **sequential** execution.
2. **State overlap check:** If tasks share React Context, global state, or the same API endpoint, default to **sequential**.
3. **Override:** User can explicitly override to parallel in Discuss if they accept the risk. Log the override reason.

This gate prevents the most common parallel-dispatch failure: two agents modifying the same file with conflicting changes.

### Codebase Context Block

Every subagent prompt MUST include: architecture decisions from MANIFEST, relevant file paths and patterns, frontend coding rules (`lib/*-api.ts` for API calls, `amber-500` not `orange-*`, `font-display` only on `h1`/`h2`), and design system constraints if applicable.

### Artifact

```
.dev/build/wave-NN/architect-subagent-prompts.md
```

Contains: all subagent assignments, prompts, execution order, success criteria, escalation rules. Must include the Orchestration Log section.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output build architect <feature-dir> --plugin frontend --wave N
```

---

## Stage 3: Execute — Build Tasks (Per Wave)

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry build execute <feature-dir> --plugin frontend --wave N
```

**MANDATORY: Pass must_haves to Build Agents**

When crafting the subagent prompt for Execute, include:
1. The `must_haves` block from the current wave file (truths, artifacts, key_links)
2. The requirement IDs this wave covers (from traceability table in requirements.md)
3. This instruction: "Your implementation is verified against these must_haves. Stubs, placeholders, and TODO comments will be flagged as failures. Every truth must be demonstrably true in the code you write."

**Exact must_haves passthrough rule:** Copy-paste must_haves and requirements from requirements.md VERBATIM into subagent prompts. Summarizing is prohibited — the agent needs the exact wording to verify its own output against the contract.

### Dispatch Rules

**MANDATORY:** Dispatch subagents for every task. The orchestrator NEVER executes work inline (decision D03).

For each task: dispatch via Agent tool, wait for completion, check against success criteria, log result (pass/fail, files changed, deviations).

**Parallel dispatch:** If Architect marked tasks as independent, dispatch ALL in a SINGLE message using multiple Agent tool calls.

**Failure handling:** Log the failure, continue dispatching remaining tasks, surface ALL failures in Review. Do NOT retry during Execute — retries happen after Review via 3-strike escalation.

### Completion Log Update (MANDATORY — after each agent completes)

After each subagent finishes (pass or fail), the orchestrator MUST update the task file's `## Completion Log` section:

```markdown
| Field | Value |
|-------|-------|
| **Status** | Done / Failed / Partial |
| **Planned** | [1-line summary of what the task spec said to do] |
| **Actual** | [1-line summary of what was actually done] |
| **Deviations** | [What differed from plan — "None" if exact match] |
| **Discoveries** | [Anything the agent found that other agents should know — type mismatches, missing APIs, naming conventions, shared state gotchas] |
| **Files touched** | [Exact paths created/modified] |
```

**Why this matters:** When Wave 3 agents start, they read Wave 2's completion logs. Without this step, discoveries die with the agent that found them. The 30 seconds to write this log saves hours of debugging when downstream agents repeat the same mistakes.

**For sequential tasks within a wave:** After Task A completes and its completion log is written, include Task A's Discoveries in Task B's agent prompt before dispatching Task B.

### Result Recording

For each completed subagent, record: files created/modified (exact paths), test results, deviations from plan, escalations triggered.

### Artifact

```
.dev/build/wave-NN/execute-build-results.md
```

Contains: per-task results, files changed, deviations, failures.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output build execute <feature-dir> --plugin frontend --wave N
```

---

## Stage 4: Review — Code Quality (Per Wave)

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry build review <feature-dir> --plugin frontend --wave N
```

### Mandatory Checks (Every Wave)

These run regardless of user preferences from Discuss:

```bash
npm run type-check    # tsc --noEmit (if TypeScript)
npm run lint          # ESLint
```

Both must pass. If either fails, treat as a simple error — self-fix with one retry before escalating.

### must_haves Verification Gate (Every Wave)

**MANDATORY.** Run the mechanical verification tool before any semantic checks:

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js verify-must-haves <feature-dir> --plugin frontend --wave N
```

This checks:
1. Every file in `must_haves.artifacts` exists on disk
2. Component/page references in `must_haves.key_links` resolve to existing files
3. No anti-stub patterns (`TODO`, `placeholder`, `() => {}`, `console.log`) in listed artifacts

**If FAIL:** Treat as a blocking issue in Review. The orchestrator must fix missing artifacts or stubs before proceeding.

**If PASS:** Proceed to independent semantic verification.

### Independent Semantic Verification (Every Wave)

After the verification gate passes, dispatch an independent verification agent. This agent has NO context from the build process — it reads the must_haves and independently checks the codebase.

**Agent:** `code-reviewer`
**Input:** The wave's `must_haves` block (truths, artifacts, key_links) + codebase access (Read, Grep, Glob)
**NOT provided:** Build artifacts, execute results, architect prompts, or any context from earlier stages

**Prompt pattern:**
```
You are independently verifying work you did NOT build. You have no context about how this code was written.

Here are the must_haves for Wave [N]:
[paste must_haves block from wave file]

For each truth: verify it is actually true in the codebase. Check the actual code, not just file existence.
For each artifact: verify it exists AND is substantive (not a stub or placeholder).
For each key_link: verify the connection is wired (component imports, route definitions, state connections, etc.).

Report PASS/FAIL per item with file:line evidence. Be skeptical — assume nothing works until you verify it.
```

**Results:** Feed into the Review verdict. Semantic verification failures are surfaced to the user but are NOT auto-blocking — the user decides whether to accept or fix.

### Validation Tool

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output build review <feature-dir> --plugin frontend --wave N
```

### Optional Checks (User Decides in Discuss)

Based on HOW answers from Discuss, optionally run:

**Mandatory: code-reviewer dispatch** — Dispatch `code-reviewer` agent every wave to review all changes. This catches N+1 queries, convention violations, and auth boundary issues that automated tests miss. Not optional.

| Check | Agent | When |
|-------|-------|------|
| Code review | `code-reviewer` | Every wave (mandatory) |
| Design system compliance | `ui-designer` | MANIFEST domains include `design-system` |
| Test coverage assessment | `test-automator` | User opted for coverage check |
| Accessibility audit | `accessibility-tester` | MANIFEST domains include `accessibility` |

### Verification Checklist

Verify every wave: files match Architect plan, all tasks completed or failures logged, type-check passes, lint passes, tests pass (if written), no regressions, deviations documented.

- [ ] Wave's `must_haves` truths are satisfied by the implementation
- [ ] All artifacts listed in must_haves exist and are substantive (not stubs)
- [ ] Key links in must_haves are wired (components connected, not orphaned)
- [ ] Requirement IDs for this wave are on track to be satisfied
- [ ] `verify-must-haves` tool gate passed (zero issues)
- [ ] Independent `code-reviewer` verification completed

### Surfacing Gaps

Use `AskUserQuestion` to present: task summary, failures/deviations, type-check and lint results, optional check results, recommendations for next wave.

### User Decision (No Auto-Looping — D08)

User picks one:

| Option | When to Use |
|--------|-------------|
| **Accept wave** | All checks pass, output is satisfactory |
| **Retry Execute** | Re-dispatch failed tasks with adjusted prompts |
| **Back to Architect** | Redesign subagent prompts for this wave |
| **Back to Discuss** | Revisit implementation approach for this wave |

#### Dispatch Mandate for Next Phase

The review artifact's context bridge MUST include a "Dispatch Mandate" section listing:
- **Mandatory agents** from domain-agent-map.md for the NEXT phase
- **Conditional agents** with their trigger conditions
- **Skipped agents** with reason

The next phase's Architect must address each listed agent — silent omission is not allowed.

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
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js checkpoint-state <feature-dir> --scope wave --plugin frontend
```

If FAIL, fix listed issues before proceeding.

### 2. Update Tracking Files

| File | Update |
|------|--------|
| **MANIFEST** | `current_wave`, `build_progress`, task completion status, strike count |
| **01_IMPLEMENTATION_STATUS.md** | Mark completed tasks, note deviations |
| **CURRENT_STATUS.md** | Current wave, what is done, what remains |
| **Wave file `## Upstream Context`** | Update the NEXT wave's file: fill `Key discoveries to carry forward` with discoveries from this wave's completion logs |
| **Task completion logs** | Verify all tasks in this wave have their `## Completion Log` filled. If any are empty, fill them now from `execute-build-results.md`. |

### Notion Update (Between Waves)

After updating tracking files, update the Dev Tracker card with wave progress. Read the Card ID from MANIFEST's `## Notion Integration > Card ID`.

1. **Update card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: Card ID from MANIFEST
   - Properties: Notes = append wave progress (e.g., "Wave 2/3 complete — [summary of tasks completed]"), Last Updated = today's ISO date

2. Display: `📋 Notion: Updated notes — "[Feature Name]" (Wave X/Y complete)`

**Notion Protocol:** Follow the Retry + Warning Protocol in `references/notion-integration.md`.
- Phase type: Downstream (status update — check Card ID first)
- Target status: (notes update, no status change)
- Persist warning in: `.dev/build/wave-NN/review-code-quality.md`

### 3. Session Break (Recommended)

Recommend `/clear` between waves for fresh context, especially after 3+ waves, complex escalations, or heavy context. Next session resumes from MANIFEST state via `/dev`.

---

## After Final Wave

When the last wave's Review is accepted:

### 1. Final Checkpoint

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js checkpoint-state <feature-dir> --scope phase --plugin frontend
```

### 2. Validate MANIFEST

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest <feature-dir> --plugin frontend
```

If FAIL, update MANIFEST before ending.

### 3. Context Bridge

The final wave's `review-code-quality.md` serves as the context bridge to VALIDATE. It must contain: summary of all waves and tasks, cumulative deviations, files created/modified across all waves, outstanding issues, and recommended validation focus areas.

### 4. Transition

Display the Next Up block and STOP:

```
---

### Next Up

Phase: VALIDATE — Type-check, lint, QA, domain audits

`/dev:validate`

/clear first -> fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke VALIDATE.

---

## BUILD Agent Map

See `references/domain-agent-map.md` for agent assignments per task type.

Select agent type during Architect stage based on the task. When a task spans multiple types, use the primary type's agent and include secondary concerns in the prompt.

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

Do NOT attempt a 4th fix without explicit user direction. Each retry MUST use a different strategy — repeating the same approach will not produce a different result.

### Investigation Prompt Template (Strike 2)

```
Investigate this BUILD failure in the Thoven frontend codebase:

TASK: [task name and file]
ERROR: [exact error output]
CONTEXT: [what was being implemented]
FILES CHANGED: [list modified files]
PREVIOUS FIX ATTEMPT: [what was tried in strike 1 and why it failed]

1. Find root cause with file:line references
2. Check if error is in new code or pre-existing
3. Propose 2 fix approaches with trade-offs
4. Recommend which approach and why

CODEBASE: Next.js 14, React 18, Tailwind CSS 4.1, API via lib/*-api.ts
```

---

## Design System Compliance

If MANIFEST domains include `design-system`, the Review stage checks:

- No `orange-*` Tailwind classes (use `amber-500` / `--color-thoven-orange`)
- `font-display` (Fredoka) only on `h1`/`h2` — everything else `font-sans` (Montserrat)
- 3D button pattern: `shadow-[0_4px_0_0_rgb(217,119,6)]`, no borders
- Spring animations: `stiffness: 500, damping: 35, mass: 0.6`
- New components follow existing patterns in `components/ui/`

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
| Skipping type-check/lint in Review | Mandatory for every wave, regardless of user preferences |
| Not checkpointing between waves | Always run `checkpoint-state` before `/clear` or starting next wave |
| Skipping `/prompt-generator` in Architect | MANDATORY for every subagent prompt — no shortcuts |
| Repeating same fix strategy on strike 2-3 | Each retry must use a DIFFERENT approach |
| Continuing after 3 strikes | STOP and present options — likely an architectural issue |
| Not updating tracking files between waves | Update MANIFEST, IMPLEMENTATION_STATUS, CURRENT_STATUS after every wave |
| Forgetting previous wave context | Read prior wave's `review-code-quality.md` in Discuss |
| Final wave missing bridge content | Last review must contain cumulative summary for VALIDATE |
| Not writing completion logs after tasks | MANDATORY — update task file's Completion Log after every agent completes |
| Not reading prior wave completion logs | Step 0 requires reading completion logs from prior wave's tasks |
| Parallel dispatch when tasks share files | Sequential Awareness Gate — check file overlap before marking parallel |

---

## Quick Reference

| Item | Location / Value |
|------|-----------------|
| Wave artifacts | `.dev/build/wave-NN/{discuss,architect,execute,review}-*.md` |
| Entry validation | `validate-stage-entry build discuss <dir> --plugin frontend --wave N` |
| Output validation | `validate-stage-output build review <dir> --plugin frontend --wave N` |
| Checkpoint | `checkpoint-state <dir> --scope wave --plugin frontend` |
| Context bridge IN | `.dev/document/review-documentation-quality.md` (first wave only) |
| Context bridge OUT | Final wave's `.dev/build/wave-NN/review-code-quality.md` |
| Strike tracking | Per feature, persists across waves, resets never |
| Agent selection | BUILD Agent Map table above |
| Prompt crafting | `/prompt-generator` — mandatory for every subagent |
| Next phase | VALIDATE (`dev-pipeline-frontend:validate`) |
