---
name: discover
description: Explores requirements, brainstorms solutions, and researches existing patterns for a feature. Produces design doc and reuse audit via the 4-stage inner loop. Triggers on /dev:discover or when /dev router advances past INTAKE.
---

# /dev:discover — Brainstorm + Codebase Research

Explore UI requirements, user flows, interaction patterns, and component reuse. Produces a design doc and reuse audit.

**Inner loop:** Discuss → Architect → Execute → Review

---

## Stage 1: Discuss — UI Requirements Discussion

### 0. Validate Entry (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry discover discuss <feature-dir> --plugin frontend
```

If FAIL → read error output and fix missing prerequisites before proceeding.
If PASS → continue.

### 1. Read Previous Phase Context

Read the INTAKE context bridge: `.dev/intake/review-classification-confirmed.md`

Extract:
- Feature name, description, domains
- Entry mode and routing rationale
- Requirements captured during INTAKE
- Codebase scan findings (shallow)

### 2. Ask WHAT Questions (one at a time)

Use `AskUserQuestion` for every question. One question per call. No batching. No cap — the user says "enough" or "move on" to end questioning (D02, D07).

WHAT questions explore:
- UI requirements and acceptance criteria
- User flows and interaction patterns
- Component reuse needs and expectations
- Visual references or prior art
- Edge cases and error states
- Responsive behavior and accessibility needs

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

Use `/prompt-generator` to craft every subagent prompt. Prompt quality IS architecture.

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

The ui-designer produces: UI requirements spec, user flow diagrams, interaction patterns, component hierarchy with reuse decisions, error states, and responsive behavior notes.

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

### Stage Artifact (Context Bridge)

Write: `.dev/discover/review-design-approval.md`

This artifact bridges to PLAN. Must contain: design decisions and rationale, reuse audit findings (paths + classifications), confirmed requirements, boardroom synthesis (if run), caveats for PLAN, and recommended focus areas for architecture.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output discover review <feature-dir> --plugin frontend
```

---

## After Review Approval

Display the Next Up block and STOP:

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
