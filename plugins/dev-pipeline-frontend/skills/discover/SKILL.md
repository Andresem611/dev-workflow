---
name: discover
description: Explores requirements, brainstorms solutions, and researches existing patterns for a feature. Produces design doc and reuse audit via the 4-stage inner loop. Triggers on /dev:discover or when /dev router advances past INTAKE.
---

# /dev:discover — Brainstorm + Codebase Research

Explore UI requirements, user flows, interaction patterns, and component reuse. Produces a design doc and reuse audit.

**Inner loop:** Discuss → Architect → Execute → Review

## Hard Rules

1. **Read before acting.** Use the Read tool on every context bridge and MANIFEST file before Discuss. Operating from memory causes stale decisions and missed reuse opportunities.
2. **Dispatch agents for Execute work.** The orchestrator discusses and reviews — agents explore and audit. Inline execution contaminates your review context: if you searched the codebase, you can't objectively assess whether the search was thorough.
3. **Use agent-prompt-template for dispatches.** Follow `references/agent-prompt-template.md` for every agent prompt.
4. **Show visual mockups inline.** When discussing layouts, page flows, or component structures during brainstorming, render ASCII mockups in chat and confirm via AskUserQuestion with preview. The user should SEE the design, not open a file.
5. **Lead with recommendations.** Every AskUserQuestion should start with "We recommend [X] because [reason]" — give the user your informed opinion, not just open-ended questions (D17).

## GROUND — Stage 0 (Codebase Grounding)

Before entering Discuss, dispatch an Explore agent to ground the conversation in codebase reality. This prevents asking questions about patterns that don't exist or missing patterns that do.

```
Agent tool:
  subagent_type: "Explore"
  prompt: "Scan the Thoven frontend for patterns related to [feature from MANIFEST]:
    1. Similar UI patterns in components/
    2. Related API modules in lib/*-api.ts
    3. Existing hooks, contexts, types that overlap
    4. Past feature docs in docs/*/00_MASTER_PLAN.md
    Report: 10-line findings summary with exact file paths"
```

Use GROUND findings to inform Discuss questions. Skip GROUND only if: PAUSE resume, DEV router override, or user explicitly says "skip ground".

---

## Stage 1: Discuss — UI Requirements Discussion

### 0. Validate Entry (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry discover discuss <feature-dir> --plugin frontend
```

If FAIL → read error output and fix missing prerequisites before proceeding.
If PASS → continue.

### MANDATORY CONTEXT LOADING — Step 0

Use the Read tool on each file. Do not proceed to WHAT questions until all reads complete.

1. `Read(.dev/intake/review-classification-confirmed.md)` → extract: feature name, description, domains, entry mode, requirements from INTAKE
2. `Read(references/domain-agent-map.md)` → extract: agent assignments for DISCOVER phase, domain combination patterns
3. `Read(references/inner-loop-reference.md)` → extract: D02, D04, D06, D07, D09, D17, D18 decision rules
4. `Read(references/codebase-context-block.md)` → extract: stack details for agent prompts

If any file is missing, STOP and surface the gap to the user.

### Questioning Philosophy: Interrogation for Clarity

**Do not check boxes. Interrogate.**

The goal of Discuss is not to collect answers — it is to achieve *maximum clarity* about what we're building and WHY. Ask questions until every gap, ambiguity, and half-formed idea has been pressure-tested. The user says "enough" or "move on" to end — you do NOT decide you have enough.

**Rules:**
- **Never stop early.** If you sense ambiguity, unresolved tension, or a vague answer — ask a follow-up. "That makes sense, but what happens when...?" is always better than moving on.
- **Lead with WHY, then WHAT, then HOW.** Understanding *why* the user wants something unlocks better *what* questions. If the user says "add a calendar view," ask "Why a calendar? What problem are teachers hitting with the current list view?" — because the answer might reveal the real need is time-slot visibility, not a calendar.
- **Challenge soft answers.** "It should be easy to use" → "Easy for who? A teacher scheduling 15 students, or a parent booking one lesson? Those are different UX problems."
- **Use the boiling water test.** If the user says "make X," ask WHY they want X. If they say "because I'm making pasta," you can now suggest "should we also salt the water?" — the WHY unlocks adjacent insights the user hasn't articulated yet.
- **Surface your own confusion.** If something doesn't click, say so: "I don't fully understand how [A] connects to [B] — can you walk me through that?" Silence about confusion = bad downstream decisions.
- **This is a product thinking session, not a form.** The user is working through their own reasoning. Your questions should help them sharpen their thinking — like a PM grilling a feature spec before it goes to engineering.

### 2. Ask WHY Questions First (one at a time)

Before asking WHAT to build, understand WHY we're building it. Use `AskUserQuestion` for every question. One question per call. No batching. No cap — the user says "enough" or "move on" to end questioning (D02, D07).

**WHY questions** (ask these FIRST — they shape everything downstream):
- Why does this feature need to exist? What problem is it solving?
- Why now? What triggered this — user feedback, business goal, technical debt?
- Why this approach? Were alternatives considered and rejected?
- Who specifically benefits? What does their day look like without this feature?
- What does success look like? How would you know this feature is working?

**WHAT questions** (informed by WHY answers):
- UI requirements and acceptance criteria
- User flows and interaction patterns
- Component reuse needs and expectations
- Visual references or prior art
- Edge cases and error states
- Responsive behavior and accessibility needs

**Follow-up on every answer.** If the answer to a WHAT question is vague, circle back to WHY: "You said you want a filter dropdown — why a dropdown instead of tabs? What's the user trying to accomplish?"

### 3. Ask HOW Meta-Questions

HOW questions let the user control execution depth (D06):

| Question | What It Controls |
|----------|-----------------|
| "Should we run a boardroom debate on approach?" | Enables/disables boardroom in Execute (D18) |
| "Focused agents or broad exploration?" | Scope of codebase research |
| "How deep should the reuse audit go?" | Reuse audit thoroughness |
| "Want codebase research before we continue?" | Triggers optional research pre-step (D09) |
| "Any specific areas of the codebase to investigate?" | Targets Explore agent scope |

### 4. Optional Research Pre-Step (D09)

If user opts in during questioning, dispatch an Explore agent to scan for existing patterns before continuing:

```
Dispatch: Explore subagent
Purpose: Scan codebase for patterns related to [feature]
Scope: User-directed (broad or focused)
```

Resume Discuss questioning with findings. The research enriches remaining questions.

### Stage Artifact

Write: `.dev/discover/discuss-ui-requirements.md`

Contents:
- All Q&A pairs (WHAT and HOW)
- Locked decisions from user
- Research pre-step findings (if performed)
- User preferences for execution depth

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output discover discuss <feature-dir> --plugin frontend
```

---

## Stage 2: Architect — Exploration Plan

### 0. Validate Entry (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry discover architect <feature-dir> --plugin frontend
```

### 1. Craft Subagent Prompts (MANDATORY — D04)

**D04 ENFORCEMENT:** Follow the D04 Enforcement Protocol from `inner-loop-reference.md`. Every subagent prompt MUST go through `/prompt-generator`. Log status in the Orchestration Log section of this artifact.

Use `/prompt-generator` to craft every subagent prompt. Prompt quality IS architecture.

#### Architect Step 0: Verify Context Loaded

Before designing agent prompts, confirm:
- [ ] `domain-agent-map.md` was Read in Step 0 — list ALL agents from the map for this phase as either "dispatched" or "skipped (reason)"
- [ ] Domain Combination Patterns checked — read the Domain Combination Patterns table from domain-agent-map.md and apply any extra considerations (e.g., `routing + auth-ui` = test both authenticated and unauthenticated access)
- [ ] Previous phase review artifact was Read — decisions and context carried forward

This verification appears in the Orchestration Log under `Map compliance`.

### 2. Define Agents

| Agent | Type | Purpose | Required |
|-------|------|---------|----------|
| Explore | `subagent_type` | Scan codebase for existing patterns, similar components, reusable hooks/utils | Always |
| ui-designer | agent | Produce design doc: UI requirements, user flows, interaction patterns, component design | Always |
| Boardroom | debate | Strategic debate on approach with multiple perspectives | Only if user opted in (D18) |

### 3. Define Success Criteria

For each subagent:
- **Explore:** Must return exact file paths for every finding. Must classify each as REUSE / EXTEND / CREATE-NEW with justification.
- **ui-designer:** Must cover all user flows from Discuss, interaction patterns, component hierarchy, reuse recommendations informed by Explore findings.
- **Boardroom (if enabled):** Must produce synthesis with agreements, disagreements, and the room's lean.

Overall:
- Design doc covers every user flow identified in Discuss
- Reuse audit has zero "probably exists" entries — every item has a file path or "not found"
- All user requirements from Discuss are addressed

### 4. Define Execution Order

```
1. Explore agent (first — patterns inform design decisions)
2. ui-designer agent (second — uses Explore findings as input)
3. Boardroom debate (third, if enabled — strategic layer on top of research + design)
```

Explore and ui-designer are sequential (ui-designer depends on Explore output). Boardroom can run after both complete.

### Stage Artifact

Write: `.dev/discover/architect-exploration-plan.md`

Contents:
- Subagent assignments with crafted prompts
- Per-agent success criteria
- Overall success criteria
- Execution order and dependencies
- Escalation rules (what happens if an agent fails)
- Orchestration Log (prompt-generator status, agents selected, cross-stack signals)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output discover architect <feature-dir> --plugin frontend
```

---

## Stage 3: Execute — Design Doc + Reuse Audit

### 0. Validate Entry (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry discover execute <feature-dir> --plugin frontend
```

### 1. Dispatch Explore Agent (MANDATORY — D03)

Dispatch the Explore subagent with the prompt crafted in Architect. The orchestrator NEVER executes research inline.

Explore scans:
- `components/ui/`, `components/shared/` — UI primitives
- `components/parent/`, `components/teacher/`, `components/student/` — feature components
- `lib/*-api.ts` — API integration patterns
- `hooks/`, `contexts/` — custom hooks and state management
- `types/`, `lib/*-types.ts` — TypeScript interfaces
- Similar features — analogous UI patterns

Collect results. Check against Explore success criteria from Architect.

### Anti-Rationalization Checklist (Execute Stage)

Before moving to Review, verify you haven't rationalized away agent dispatch:

| Thought | Reality |
|---------|---------|
| "This is simple, I'll just search myself" | Even simple searches benefit from Explore agents — they search more thoroughly |
| "I already know the codebase" | You know what you REMEMBER. The codebase may have changed. Dispatch the agent. |
| "The reuse audit is obvious" | If obvious, the agent confirms quickly. If not, you just caught a missed component. |
| "I'll do it faster inline" | Speed is not the goal. Independence of verification is. |

### Reuse Decision Tree

```
Need a component/function/hook?
├── Does something similar exist in the codebase?
│   ├── YES → Can it be used as-is?
│   │   ├── YES → REUSE (record path + usage)
│   │   └── NO → Can it be extended without breaking consumers?
│   │       ├── YES → EXTEND (document changes needed)
│   │       └── NO → CREATE NEW (document why extension fails)
│   └── NO → CREATE NEW (document search performed)
```

### 2. Dispatch ui-designer Agent (MANDATORY — D03)

Dispatch with crafted prompt from Architect, Explore findings as input, and all Discuss requirements.

The ui-designer produces: UI requirements spec, user flow diagrams (**D2 syntax preferred** — render to SVG via `d2 <file>.d2 <file>.svg --layout=elk`, store in `docs/[Feature]/.dev/discover/diagrams/`, fallback to ASCII if `d2` unavailable), interaction patterns, component hierarchy with reuse decisions, error states, and responsive behavior notes.

Collect results. Check against ui-designer success criteria from Architect.

### 3. Dispatch Boardroom Debate (OPTIONAL — D18)

Only if user opted in during Discuss.

Dispatch boardroom with:
- Feature requirements from Discuss
- Explore findings (codebase patterns)
- ui-designer output (design direction)
- Specific question to debate (from Architect plan)

Collect synthesis: agreements, disagreements, the room's lean.

### 4. Handle Failures

If any subagent fails: log the failure, continue with remaining agents, surface all failures in Review (D08).

### Stage Artifact

Write: `.dev/discover/execute-design-doc.md`

Contents:
- Reuse audit results (from Explore): counts and details for REUSE / EXTEND / CREATE-NEW
- Design doc (from ui-designer): user flows, interaction patterns, component design
- Boardroom findings (if run): synthesis, agreements, disagreements
- Per-agent pass/fail against success criteria
- Any failures or deviations logged

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output discover execute <feature-dir> --plugin frontend
```

---

## Stage 4: Review — Design Approval

### 0. Validate Entry (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry discover review <feature-dir> --plugin frontend
```

### 1. Check Against Success Criteria

For each criterion from Architect, provide evidence-based pass/fail:
- Design doc covers all user flows from Discuss
- Interaction patterns and edge cases documented
- Reuse audit: every finding has file path or "not found", classified as REUSE / EXTEND / CREATE-NEW
- Boardroom synthesis documented (if run)

### 2. Surface Gaps

Use `AskUserQuestion` to present summary, pass/fail verdicts with evidence, gaps or open questions, and reuse audit counts (N reuse, N extend, N create-new).

### 3. User Decision (D08 — No Auto-Looping)

Present options via `AskUserQuestion`:

| Option | When to Use |
|--------|-------------|
| **Accept** | Design doc and reuse audit meet requirements |
| **Retry Execute** | Re-dispatch failed agents with adjusted prompts |
| **Back to Architect** | Redesign the exploration plan |
| **Back to Discuss** | Revisit requirements or direction |

### 4. On Accept

1. Update MANIFEST with:
   - Phase status: DISCOVER complete
   - Confirmed requirements (refined from design doc)
   - Reuse audit summary
   - Key decisions

2. Validate MANIFEST:
   ```bash
   node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest <feature-dir> --plugin frontend
   ```

3. Write review artifact (context bridge to PLAN).

#### Dispatch Mandate for Next Phase

The review artifact's context bridge MUST include a "Dispatch Mandate" section listing:
- **Mandatory agents** from domain-agent-map.md for the NEXT phase
- **Conditional agents** with their trigger conditions
- **Skipped agents** with reason

The next phase's Architect must address each listed agent — silent omission is not allowed.

### Stage Artifact (Context Bridge)

Write: `.dev/discover/review-design-approval.md`

This artifact bridges to PLAN. Must contain: design decisions and rationale, reuse audit findings (paths + classifications), confirmed requirements, boardroom synthesis (if run), caveats for PLAN, and recommended focus areas for architecture.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output discover review <feature-dir> --plugin frontend
```

---

## After Review Approval — Comprehensive Review Gate

Before displaying the Next Up block, offer a comprehensive review via `AskUserQuestion`:

> "DISCOVER is complete. Before locking architecture in PLAN, want a comprehensive review of the feature direction?"
>
> We recommend **A** for ambitious or unfamiliar features, **B** for well-understood work:
>
> - **A) CEO Review** — Challenge premises, find the 10-star version, validate scope direction. Invokes `/plan-ceo-review` against the DISCOVER outputs. Best for: new features, strategic bets, anything where "should we even build this?" is worth 10 minutes.
> - **B) Skip** — Proceed directly to PLAN. Best for: well-scoped features where direction is clear.
> - **C) Quick scope check** — Just 3 questions: (1) What existing code already solves sub-problems? (2) What's the minimum change set? (3) Complexity smell check (>8 files or >2 new classes = challenge it). Lighter than full CEO review.

If user selects A: invoke `Skill(plan-ceo-review)` with the DISCOVER review artifact as context. After the review completes, return here and display the Next Up block.

If user selects C: ask the 3 scope questions via `AskUserQuestion` (one at a time), then display Next Up.

---

## Display Next Up and STOP

```
---
Next Up

Phase: PLAN — Architecture decisions + task breakdown

/dev:plan

/clear first — fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke PLAN. Do not offer to continue in the same session.

---

## Agents Used in This Phase

| Agent | Type | Purpose | When |
|-------|------|---------|------|
| Explore | subagent_type | Codebase scanning for existing patterns, similar implementations, reusable code | Always (Execute step 1) |
| ui-designer | agent | Design direction, UI requirements analysis, component design, user flows | Always (Execute step 2) |
| Boardroom | debate | Strategic debate on approach with multiple role perspectives | User opt-in only (D18, Execute step 3) |

---

## Common Mistakes

| Mistake | Prevention |
|---------|------------|
| Executing design doc inline | MUST dispatch ui-designer subagent — orchestrator never executes work (D03) |
| Skipping reuse audit | Always dispatch Explore agent for pattern scanning — no exceptions |
| Crafting prompts without /prompt-generator | Every subagent prompt goes through /prompt-generator in Architect (D04) |
| Forcing boardroom debate | Boardroom is user opt-in only during Discuss (D18) |
| Not reading intake context bridge | Start Discuss by reading `.dev/intake/review-classification-confirmed.md` |
| Reuse audit without file paths | Explore MUST return exact file paths or explicit "not found" — no "probably exists" |
| Batching multiple questions | One `AskUserQuestion` call per question, always (D02) |
| Asking WHAT before WHY | Lead with WHY questions — understanding purpose unlocks better WHAT/HOW questions |
| Accepting vague answers | Challenge soft answers ("easy to use" → "easy for who?"). Interrogate until clarity. |
| Stopping questions too early | Do NOT decide you have enough info. Only the user says "enough" or "move on". |
| Auto-looping on review failure | Surface failures to user, let them decide next action (D08) |
| Skipping stage entry validation | Run `validate-stage-entry` before every stage — no exceptions |
| Continuing past Review without approval | Review requires explicit user acceptance before proceeding |

---

## Quick Reference

| Stage | Key Action | Artifact |
|-------|-----------|----------|
| Discuss | WHAT + HOW questions, optional research pre-step | `discuss-ui-requirements.md` |
| Architect | /prompt-generator for all subagent prompts | `architect-exploration-plan.md` |
| Execute | Dispatch Explore, ui-designer, optional boardroom | `execute-design-doc.md` |
| Review | Evidence-based pass/fail, user decides | `review-design-approval.md` (bridges to PLAN) |
