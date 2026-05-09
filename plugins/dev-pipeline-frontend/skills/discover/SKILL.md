---
name: discover
description: Explores requirements via 4-Zone Discuss, Decision Ledger, and mode selection. Brainstorms solutions and researches existing patterns. Produces design doc and reuse audit via the 4-stage inner loop. Triggers on /dev:discover or when /dev router advances past INTAKE.
---

# /dev:discover — 4-Zone Brainstorm + Codebase Research + Mode Selection (v4.0)

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

## Stage 1: Discuss — 4-Zone Brainstorm (v4.0)

### 0. Validate Entry (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry discover discuss <feature-dir> --plugin frontend
```

If FAIL → read error output and fix missing prerequisites before proceeding.
If PASS → continue.

### MANDATORY CONTEXT LOADING — Step 0

Use the Read tool on each file. Do not proceed to Zone 1 until all reads complete.

1. `Read(.dev/intake/review-classification-confirmed.md)` → extract: feature name, description, domains, entry mode, requirements from INTAKE
2. `Read(references/domain-agent-map.md)` → extract: agent assignments for DISCOVER phase, domain combination patterns
3. `Read(references/inner-loop-reference.md)` → extract: D02, D04, D06, D07, D09, D17, D18 decision rules
4. `Read(references/codebase-context-block.md)` → extract: stack details for agent prompts
5. `Read(references/discuss-zones-reference.md)` → extract: zone definitions, exit conditions, questioning techniques
6. `Read(references/decision-ledger-template.md)` → extract: ledger format, LOCKED/OPEN rules
7. `Read(references/bridge-template.md)` → extract: structured bridge format for review artifact

If any file is missing, STOP and surface the gap to the user.

**Echo-Back:** After loading, echo back any LOCKED decisions from the intake bridge:
```
Loaded context from INTAKE:
- [N] LOCKED decisions: [list or "none yet — first decisions made here"]
- Feature: [name from MANIFEST]
- Domains: [from MANIFEST]
```

### Zone 1: WHY (Problem Space)

**Technique:** Premise Challenge (from /plan-ceo-review)
**Purpose:** Understand the motivation behind the request, not just the request itself.

**Questions (AskUserQuestion, one at a time, lead with recommendation):**
1. "Why does this feature need to exist? What problem is it solving?"
2. "What happens if we do nothing? Real pain point or hypothetical?"
3. "What's the actual user outcome — not the feature, but what changes for the user?"
4. "Could a different framing yield a simpler solution?"
5. "What triggered this now? User feedback, business goal, tech debt?"

**Follow-up discipline:** If the answer describes a FEATURE ("I want a calendar"), ask "Why a calendar? What problem does a calendar solve?" The WHY reveals the real need.

**Exit condition:** Problem statement in JTBD format: "When [situation], I want [motivation], so I can [outcome]." If it mentions a specific UI element, you haven't reached the real problem.

**Ledger entries:**
- Problem statement (JTBD) → LOCKED
- Root trigger → LOCKED

### Zone 2: WHO (User Context)

**Technique:** Empathy Map + 11-Star Framework (from /customer-obsession-design-thinking)
**Purpose:** Ground the feature in a real user's day.

**Questions (AskUserQuestion, one at a time):**
1. "Which user type is this primarily for? Teacher, Parent, Student, or Admin?"
2. "Walk me through their day — where does this feature fit?"
3. "What do they currently DO to solve this problem? (workaround, manual process)"
4. "What's 5-star (functional), 7-star (delightful), 9-star (remarkable)?"
5. "Where between 7-9 should we aim?"

**Mode interaction:** In REDUCTION mode, skip Zone 2 entirely. In EXPANSION mode, add the 11-star exercise and empathy prompts (SAYS/THINKS/FEELS/DOES).

**Exit condition:** Named user scenario end-to-end: "[User type] is doing [activity], hits [problem], currently does [workaround], with this feature would [new behavior]."

**Ledger entries:**
- Target user type → LOCKED
- User scenario → LOCKED
- Star target → LOCKED

### Zone 3: WHAT (Scope + Boundaries)

**Technique:** GROUND-Informed Scope + Constraint Removal (from /product-strategy-brainstorming)
**Purpose:** Define IN/OUT, grounded in codebase reality from GROUND agent.

**GROUND findings are MANDATORY here.** Reference specific files/components the Explore agent found. Do NOT ask generic scope questions when you have codebase data.

**Questions (AskUserQuestion, one at a time):**
1. "[GROUND] I found [component X] at [path]. Reuse, extend, or new?"
2. "[GROUND] This overlaps with [feature Y]. Extending Y or separate?"
3. "If zero tech limits, what would this look like? Now the 80% version?"
4. "What are we explicitly NOT building? Where's the scope boundary?"
5. "Solution approaches: I see [A], [B], [C] — which direction?"

**Mode interaction:** In REDUCTION mode, quick IN/OUT list only. In EXPANSION mode, add constraint removal exercise and opportunity solution tree.

**Exit condition:** Explicit IN/OUT list. Every IN item traces to the JTBD from Zone 1.

**Ledger entries:**
- Every IN scope item → LOCKED (with JTBD traceability)
- NOT-in-scope items → LOCKED
- Reuse decisions → LOCKED

### Stage 3.5 — Decomposition Detection (mandatory)

After Zone 3 IN/OUT scope is captured and before Zone 4 (HOW) entry, run the decomposition trigger check. This catches Teach Mode-class features that should ship as parallel sub-pipelines instead of one long pipeline.

**Inputs:**
- Zone 3 IN list (the locked scope)
- Zone 1 JTBD list (the user-journey set)
- PLAN's wave-estimate heuristic (used internally to estimate effort; if PLAN hasn't run yet, project from Zone 3 surface area)

**4 trigger signals (any 2 must fire to surface the proposal):**

1. **Multi-journey:** IN list spans >3 distinct user journeys. Heuristic: count distinct primary actors OR distinct first-screen entry points.
2. **Multi-model:** IN list spans >2 distinct data models. Heuristic: count distinct nouns capable of independent CRUD operations.
3. **Multi-integration:** IN list spans >2 distinct integration surfaces. Heuristic: count distinct WebSocket / REST / file-storage / third-party-API touchpoints.
4. **Multi-wave:** Wave count estimate >5 from PLAN heuristic (or projection if PLAN unrun).

**Threshold:** 2-of-4 signals firing surfaces the proposal. (User-locked at Wave 3 checkpoint 2026-05-09; re-checkpointable per future audit.)

**If trigger fires, AskUserQuestion with 3 options:**

- **A) Decompose** — propose split into N sub-pipelines with explicit dependency graph. Each sub-pipeline gets its own `docs/<sub-feature-name>/.dev/MANIFEST.md` (per-sub topology, user-locked at Wave 3 checkpoint). All sub-pipelines proceed in parallel through DISCOVER → DESIGN → PLAN → DOCUMENT → BUILD → VALIDATE; SHIP enforces upstream completeness via the Upstream Pipelines section in MANIFEST.
- **B) Acknowledge but proceed in-place** — log decision; pipeline continues unchanged but a `Multi-Journey-Risk` tag attaches to MANIFEST and downstream phases get a warning banner.
- **C) Reject signal** — user disagrees with the heuristic. Capture one-sentence rationale. Pipeline continues unchanged. No tag.

**Decomposition acceptance flow (option A):**

1. User names each sub-pipeline (e.g., for Teach Mode: `teach-mode-core`, `teach-mode-canvas-save`, `teach-mode-recording`, `teach-mode-lesson-mgmt`, `teach-mode-homework`).
2. For each sub-pipeline, declare upstream dependencies (which other sub-pipelines must ship before this one can SHIP).
3. Spawn N sub-pipeline directories under `docs/<sub-feature-name>/.dev/MANIFEST.md`. Each MANIFEST gets:
   - Standard Metadata / Domains / Pipeline Status / Phase Progress / Decisions Log / Artifacts sections.
   - **`## Upstream Pipelines`** section (added in Δ2) listing each upstream's path + required artifact + Mock fallback path.

**Frame as agile parallel shipping, not v2 punting:** sub-pipelines ship independently. Downstream pipelines may stub upstream artifacts (mock canvas-save endpoint, mock recording component) until upstream ships and SHIP swaps to real.

**Concrete Teach Mode mapping (informational example):**
- Pipeline A: Core Teach Mode (room creation + multi-user canvas + roles)
- Pipeline B: Canvas-save (snapshot persistence; A depends on B for snapshot endpoint)
- Pipeline C: Recording (audio capture; can ship after A)
- Pipeline D: Lesson management (CRUD + scheduling; independent of A)
- Pipeline E: Homework submission (independent of A; reuses canvas component from A's design system)

**Mode propagation:**
- Reduction: skip Stage 3.5 entirely (decomposition only relevant on Hold/Expansion-class features).
- Hold: run; threshold remains 2-of-4.
- Expansion: run; threshold tightens to 1-of-4 (any signal surfaces the proposal — user can option-C reject if false-positive).

### Zone 4: HOW (Execution Preferences)

**Technique:** Temporal Interrogation + Mode Selection (from /product-advisor)
**Purpose:** User controls pipeline depth and execution strategy.

**Questions (AskUserQuestion, one at a time):**
1. "Pipeline mode — Expansion (go big), Hold (standard), or Reduction (ship fast)?"
2. "Backend coordination — does this need new backend work?"
3. [EXPANSION/HOLD only] "Think ahead — what decisions should we resolve NOW vs defer to DESIGN/PLAN?"
4. "Review depth — standard checks or invoke full eng/CEO reviews at boundaries?"
5. "Timeline pressure — any deadline? Does that change the mode?"

**Exit condition:** Mode selected, preferences captured.

**Ledger entries:**
- Execution mode (Expansion/Hold/Reduction) → LOCKED
- Backend coordination signal → LOCKED
- Timeline pressure → LOCKED
- Review depth preference → LOCKED

### Questioning Discipline (All Zones)

- One AskUserQuestion per question. NEVER batch.
- Lead with "We recommend [X] because [reason]" (D17)
- Follow up on vague answers. "Easy to use" → "Easy for who?"
- Reference GROUND findings in Zone 3. Generic questions when you have codebase data = lazy.
- User says "enough" or "move on" to advance. YOU do not decide when a zone is done.
- Never ask a question GROUND already answered.

### Stage Artifact

Write: `.dev/discover/discuss-ui-requirements.md`

Contents:
- All Q&A from all 4 zones
- LOCKED decisions per zone (with IDs)
- GROUND findings referenced in Zone 3
- Execution mode selected in Zone 4
- Exit condition evidence for each zone

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
- [ ] Decision Ledger entries from Discuss are complete — all 4 zones produced LOCKED items
- [ ] Execution mode is set and will be used to determine agent depth in Execute

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

3. Write review artifact (context bridge to DESIGN).

#### Dispatch Mandate for Next Phase

The review artifact's context bridge MUST include a "Dispatch Mandate" section listing:
- **Mandatory agents** from domain-agent-map.md for the NEXT phase
- **Conditional agents** with their trigger conditions
- **Skipped agents** with reason

The next phase's Architect must address each listed agent — silent omission is not allowed.

### Stage Artifact (Context Bridge)

Write: `.dev/discover/review-design-approval.md`

Must follow `references/bridge-template.md` format. This artifact bridges to DESIGN. Must contain:
- LOCKED decisions table from the Decision Ledger
- Key artifacts produced (design doc, reuse audit, boardroom synthesis if run)
- Design decisions and rationale
- Reuse audit findings (paths + classifications)
- Confirmed requirements
- Focus for DESIGN (visual design spec + component design)
- Dispatch mandate for DESIGN phase agents

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output discover review <feature-dir> --plugin frontend
```

---

## After Review Approval — Comprehensive Review Gate

Before displaying the Next Up block, offer a comprehensive review via `AskUserQuestion`:

> "DISCOVER is complete. Before moving to visual design in DESIGN, want a comprehensive review of the feature direction?"
>
> We recommend **A** for ambitious or unfamiliar features, **B** for well-understood work:
>
> - **A) CEO Review** — Challenge premises, find the 10-star version, validate scope direction. Invokes `/plan-ceo-review` against the DISCOVER outputs. Best for: new features, strategic bets, anything where "should we even build this?" is worth 10 minutes.
> - **B) Skip** — Proceed directly to DESIGN. Best for: well-scoped features where direction is clear.
> - **C) Quick scope check** — Just 3 questions: (1) What existing code already solves sub-problems? (2) What's the minimum change set? (3) Complexity smell check (>8 files or >2 new classes = challenge it). Lighter than full CEO review.

If user selects A: invoke `Skill(plan-ceo-review)` with the DISCOVER review artifact as context. After the review completes, return here and display the Next Up block.

If user selects C: ask the 3 scope questions via `AskUserQuestion` (one at a time), then display Next Up.

---

## Display Next Up and STOP

```
---
Next Up

Phase: DESIGN — Visual design spec + component design

/dev:design

/clear first — fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke DESIGN. Do not offer to continue in the same session.

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
| Flat question list instead of zones | Questions are generic, not grounded in GROUND findings — use 4-Zone Discuss with exit conditions per zone (D21) |
| Not populating Decision Ledger | User decisions lost, agents override scope — every zone produces LOCKED entries in the ledger (D19) |
| Not setting execution mode | All phases run at same depth regardless of feature size — Zone 4 must set Expansion/Hold/Reduction mode (D22) |
| Routing to PLAN after DISCOVER | v4.0: DESIGN comes before PLAN — DISCOVER routes to DESIGN, not PLAN |

---

## Quick Reference

| Stage | Key Action | Artifact |
|-------|-----------|----------|
| Discuss | 4-Zone brainstorm (WHY/WHO/WHAT/HOW), Decision Ledger, mode selection | `discuss-ui-requirements.md` |
| Architect | /prompt-generator for all subagent prompts | `architect-exploration-plan.md` |
| Execute | Dispatch Explore, ui-designer, optional boardroom | `execute-design-doc.md` |
| Review | Evidence-based pass/fail, user decides | `review-design-approval.md` (bridges to DESIGN) |
