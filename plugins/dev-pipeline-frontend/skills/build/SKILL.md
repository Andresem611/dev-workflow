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
6. **Include LOCKED decisions in every agent prompt (v4.0 — two-tier).** Every BUILD agent prompt MUST include:
   - **Tier 1 (task-specific):** The LOCKED decisions listed in this task's "Locked Decisions" section — these directly constrain this task. Highlight them prominently at the top.
   - **Tier 2 (full ledger — safety net):** ALL remaining LOCKED items from the Decision Ledger in MANIFEST, listed under a "Full LOCKED Decision Ledger" section. This prevents agents from contradicting decisions that weren't assigned to their specific task.

   Format in the agent prompt:
   ```
   ## LOCKED Decisions — THIS TASK (DO NOT OVERRIDE)
   - U-01: [decision text] ← directly constrains this task
   - U-03: [decision text] ← directly constrains this task

   ## LOCKED Decisions — FULL LEDGER (safety net — do not contradict)
   - U-02: [decision text]
   - U-04: [decision text]
   - ... (all remaining LOCKED items from MANIFEST)
   ```
   See `references/decision-ledger-template.md`.
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
3. `Read(docs/[feature]/.dev/MANIFEST.md)` → extract: current wave number, domains, decision log. **Read the Decision Ledger section from MANIFEST. Extract ALL LOCKED decision IDs and their text. This full list will be injected into every agent prompt as Tier 2 (safety net).**
4. `Read(references/domain-agent-map.md)` → extract: correct agent types for this wave's domain tags
5. `Read(references/agent-prompt-template.md)` → extract: prompt structure for agent dispatches
6. `Read(references/codebase-context-block.md)` → extract: standard context block to embed in all agent prompts
7. `Glob(docs/[feature]/.dev/plan/diagrams/*.d2)` + `Glob(docs/[feature]/.dev/document/diagrams/*.d2)` → if D2 diagrams exist, include their file paths in agent prompts as architecture context
8. **Completion logs from prior wave (Wave 2+ only):** Read the `## Completion Log` section from every task file completed in the previous wave. Extract: deviations, discoveries, and files touched. These become upstream context for this wave's agents.
   - `Read(docs/[feature]/tasks/TASK_XX.md)` for each task completed in wave N-1 → extract Completion Log section
   - Compile a "Prior Wave Discoveries" summary (max 10 bullet points) to embed in agent prompts

If any file is missing, STOP and surface the gap to the user.

**Advisory decision coverage check:**
```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js verify-decision-coverage docs/[Feature] --plugin frontend
```
If undistributed decisions found, surface to user via AskUserQuestion but do not block BUILD.

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

When crafting each agent prompt, include Tier 1 (task-specific LOCKED decisions from the task file) AND Tier 2 (full LOCKED decision ledger from MANIFEST). The Tier 2 list was extracted in Step 0. Use the two-tier format from Hard Rule 6.

For each task in this wave, define:

| Field | Description |
|-------|-------------|
| **Agent type** | From Agent Selection (3-tier priority below) |
| **Prompt** | Crafted via `/prompt-generator` |
| **File paths** | Exact files to create/modify/test |
| **LOCKED decisions (two-tier)** | Tier 1: task-specific LOCKED decisions from task file. Tier 2: all remaining LOCKED items from MANIFEST Decision Ledger (extracted in Step 0). |
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
4. **Component/endpoint overlap check:** If two tasks reference the same component import path or API endpoint (even in different files), default to **sequential**. Compare import paths and endpoint references across all task `## Files` sections.

This gate prevents the most common parallel-dispatch failure: two agents modifying the same file with conflicting changes.

### Multi-Domain Behavior-Slice Routing

Behavior-slice tasks may span multiple domain types (e.g., a task that includes page component + hook + API integration + test). For multi-domain tasks:

1. **Primary domain agent:** Select the agent for the task's PRIMARY domain (the core behavior). If the task is "UserProfile page" with component + hook + API call, the primary domain is `pages/components` → agent is `next-js-developer`.

2. **Secondary concerns in prompt:** Include secondary domain constraints in the agent's prompt, don't dispatch separate agents. Example: "This task includes routing changes (update app router), state management (use existing Zustand store pattern), and API integration (use existing lib/*-api.ts pattern)."

3. **When to split:** If a behavior-slice task has TWO equally complex domains (e.g., a complex data visualization component that also requires a substantial API client refactor), consider splitting into two behavior slices. This is the exception, not the rule.

The existing domain-agent-map.md single-domain routing still applies for tasks that only touch one domain.

### Batch-Eligible Task Classification

If 2+ tasks in this wave apply the same change pattern to different files (e.g., add prop type, apply design system fix, add accessibility attribute, standardize component pattern), mark them as `batch-eligible` in the execution plan. In Execute, dispatch ONE agent for the batch with all file paths instead of separate agents per task.

Criteria:
- Same type of change
- Different target files
- No inter-task dependencies

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

## Stage 4: Review — 4-Layer Verify-Fix Loop (Per Wave)

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry build review <feature-dir> --plugin frontend --wave N
```

Run all four layers in order. Each layer must PASS before advancing. If a layer fails, fix and re-run THAT layer — do not skip ahead.

### Layer 1: Mechanical Checks

```bash
npm run type-check    # tsc --noEmit
npm run lint          # ESLint
```

Both must pass. If either fails, self-fix with one retry before escalating.

### Layer 2: verify-must-haves

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js verify-must-haves <feature-dir> --plugin frontend --wave N
```

This checks:
1. Every file in `must_haves.artifacts` exists on disk
2. Component/page references in `must_haves.key_links` resolve to existing files
3. No anti-stub patterns (`TODO`, `placeholder`, `() => {}`, `console.log`) in listed artifacts

**If FAIL:** Fix missing artifacts or stubs, then re-run Layer 2. Do not proceed to Layer 3.

**If PASS:** Proceed to Layer 3.

**API_CONTRACT.md re-verification (per wave):**

If the wave touches `lib/*-api.ts` OR MANIFEST has `cross-stack: backend` flag set:

1. Read `<feature>/api/API_CONTRACT.md`.
2. Run `node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js verify-must-haves <feature> --plugin frontend --wave N`.
3. The tool's auto-append behavior (lines 907–953 in tools.js) discovers any backend routes the wave referenced but didn't list in API_CONTRACT.md. Inspect the result's `auto_appended` field.
4. If `auto_appended > 0`, emit **CONTRACT DRIFT** warning:
   > **CONTRACT DRIFT detected:** wave touched <N> backend routes not listed in API_CONTRACT.md. Auto-appended: <list>. Reviewer must update API_CONTRACT.md to reflect actual routes before VALIDATE Section 3.6 runs.

**Mode propagation:**
- Reduction: trigger applies (mechanical); skip the inline reviewer ack (auto-log only).
- Hold: full reviewer ack.
- Expansion: + git-blame each auto-appended route to identify which task introduced it.

### Layer 3: code-reviewer (Independent Semantic Review)

Dispatch `code-reviewer` agent to review all files changed in this wave. This agent has NO context from the build process.

**Input:** `git diff` for this wave's changed files + the wave's `must_haves` block (pass EXACT text — do NOT summarize)
**NOT provided:** Build artifacts, execute results, architect prompts, or any context from earlier stages

**Focus areas (frontend-specific):**
- Design system compliance (color tokens, typography rules, component patterns)
- Component composition patterns (prop drilling, context usage, render optimization)
- Accessibility (ARIA attributes, keyboard navigation, focus management, semantic HTML)
- State management correctness (React Context boundaries, hook dependencies, re-render prevention)
- Import/export hygiene (barrel exports, circular dependencies, tree-shaking)

**Issue Classification — the code-reviewer MUST tag every finding:**

| Tag | Meaning | Action |
|-----|---------|--------|
| **CRITICAL + PATTERN** | Systemic issue across multiple files | Fix ALL instances now — one fix, batch apply |
| **CRITICAL + UNIQUE** | One-off critical issue in a single location | Fix this specific instance now |
| **NON-CRITICAL** | Style, minor pattern deviation, naming suggestion | Log in review artifact — do NOT fix now |

**Blocking rule:** Only CRITICAL findings block the wave. NON-CRITICAL findings are logged but do not trigger fixes or retries.

**Prompt pattern:**
```
You are independently reviewing code you did NOT build. You have no context about how this code was written.

Here are the must_haves for Wave [N]:
[paste must_haves block from wave file]

For each truth: verify it is actually true in the codebase. Check the actual code, not just file existence.
For each artifact: verify it exists AND is substantive (not a stub or placeholder).
For each key_link: verify the connection is wired (component imports, route definitions, state connections, etc.).

Also review for: design system compliance, component patterns, accessibility, state management correctness, and import hygiene.

Tag every finding as CRITICAL+PATTERN, CRITICAL+UNIQUE, or NON-CRITICAL.
Report PASS/FAIL per must_have item with file:line evidence. Be skeptical — assume nothing works until you verify it.
```

### Layer 4: /simplify (Mode-Gated)

**Gate:** Check `references/mode-propagation-reference.md`. Only run /simplify if execution mode is HOLD or EXPANSION. Skip for REDUCTION.

**Mechanism:**
1. `git stash` before running /simplify
2. Invoke `/simplify` on all files changed in this wave with `--plugin frontend`
3. Review /simplify's proposed changes
4. If changes improve code: keep them. If /simplify introduces regressions or breaks must_haves: `git stash pop` to revert and log the reason

**Why git stash:** /simplify may refactor working code into something that breaks type-check or must_haves. The stash provides a clean revert path without re-dispatching agents.

### Optional Additional Checks (User Decides in Discuss)

Based on HOW answers from Discuss, optionally dispatch:

| Check | Agent | When |
|-------|-------|------|
| Design system compliance | `ui-designer` | MANIFEST domains include `design-system` |
| Test coverage assessment | `test-automator` | User opted for coverage check |
| Accessibility audit | `accessibility-tester` | MANIFEST domains include `accessibility` |

### Verification Checklist

- [ ] Layer 1: `npm run type-check` passes
- [ ] Layer 1: `npm run lint` passes
- [ ] Layer 2: `verify-must-haves` tool gate passed (zero issues)
- [ ] Layer 3: `code-reviewer` completed — all CRITICAL findings resolved
- [ ] Layer 3: NON-CRITICAL findings logged in review artifact
- [ ] Layer 4: `/simplify` run (or skipped for REDUCTION mode) — result logged
- [ ] Wave's `must_haves` truths are satisfied by the implementation
- [ ] All artifacts listed in must_haves exist and are substantive (not stubs)
- [ ] Key links in must_haves are wired (components connected, not orphaned)
- [ ] Requirement IDs for this wave are on track to be satisfied

### Validation Tool

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output build review <feature-dir> --plugin frontend --wave N
```

### Surfacing Gaps

Use `AskUserQuestion` to present: task summary, failures/deviations, type-check and lint results, code-reviewer findings (CRITICAL vs NON-CRITICAL), /simplify results, optional check results, recommendations for next wave.

### User Decision (No Auto-Looping — D08)

User picks one:

| Option | When to Use |
|--------|-------------|
| **Accept wave** | All layers pass, output is satisfactory |
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

Contains: 4-layer results (mechanical, must_haves, code-reviewer findings with classification, /simplify outcome), verdicts, deviations, user decision. For the final wave, this artifact IS the context bridge to VALIDATE.

---

## Between Waves

After a wave is accepted and before starting the next:

### 1. Checkpoint State (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js checkpoint-state <feature-dir> --scope wave --plugin frontend
```

If FAIL, fix listed issues before proceeding.

### 2. Update Tracking Files

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js update-wave-tracking <feature-dir> --plugin frontend --wave N
```

This updates MANIFEST, 01_IMPLEMENTATION_STATUS.md, CURRENT_STATUS.md, next wave's Upstream Context, and verifies all task completion logs are filled. If any completion logs are empty, fill them now from `execute-build-results.md`.

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
| Skipping type-check/lint in Review (Layer 1) | Mandatory for every wave, regardless of user preferences |
| Fixing NON-CRITICAL code-reviewer findings | Only CRITICAL findings block — log NON-CRITICAL and move on |
| Skipping /simplify in HOLD/EXPANSION mode | Layer 4 is mandatory unless REDUCTION mode — use git stash for safety |
| Not classifying batch-eligible tasks | If 2+ tasks share a change pattern, batch them — one agent, all files |
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
| Dispatching 3 agents for one behavior-slice task (one per domain) | Use primary domain agent with secondary concerns in prompt |
| Assigning agent by first file in task instead of primary behavior | Read the task Goal to determine primary domain |

---

## Quick Reference

| Item | Location / Value |
|------|-----------------|
| Wave artifacts | `.dev/build/wave-NN/{discuss,architect,execute,review}-*.md` |
| Entry validation | `validate-stage-entry build discuss <dir> --plugin frontend --wave N` |
| Output validation | `validate-stage-output build review <dir> --plugin frontend --wave N` |
| Checkpoint | `checkpoint-state <dir> --scope wave --plugin frontend` |
| Wave tracking update | `update-wave-tracking <dir> --plugin frontend --wave N` |
| Context bridge IN | `.dev/document/review-documentation-quality.md` (first wave only) |
| Context bridge OUT | Final wave's `.dev/build/wave-NN/review-code-quality.md` |
| Strike tracking | Per feature, persists across waves, resets never |
| Agent selection | BUILD Agent Map table above |
| Prompt crafting | `/prompt-generator` — mandatory for every subagent |
| Next phase | VALIDATE (`dev-pipeline-frontend:validate`) |
