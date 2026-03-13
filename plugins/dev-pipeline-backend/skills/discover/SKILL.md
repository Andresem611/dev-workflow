---
name: discover
description: Explores requirements, researches existing patterns, and analyzes business logic for a backend feature. Produces design doc and pattern analysis via the 4-stage inner loop. Triggers on dev-pipeline-backend:discover or when /dev router advances past INTAKE.
---

# /dev:discover — Brainstorm + Codebase Research

Explore business logic requirements, data model needs, service boundaries, and API patterns. Produces a design doc and pattern analysis.

**Inner loop:** Discuss → Architect → Execute → Review

---

## Stage 1: Discuss — Feature Requirements Discussion

### 0. Validate Entry (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry discover discuss <feature-dir> --plugin backend
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
- Business logic rules and acceptance criteria
- Data model needs and entity relationships
- Service boundaries and API contract expectations
- Authorization and access control rules
- Edge cases, error states, and failure modes

### 3. Ask HOW Meta-Questions

HOW questions let the user control execution depth (D06):

| Question | What It Controls |
|----------|-----------------|
| "Focused agents or broad exploration?" | Scope of codebase research |
| "How deep should the pattern analysis go?" | Pattern analysis thoroughness |
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

Write: `.dev/discover/discuss-feature-requirements.md`

Contents:
- All Q&A pairs (WHAT and HOW)
- Locked decisions from user
- Research pre-step findings (if performed)
- User preferences for execution depth

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output discover discuss <feature-dir> --plugin backend
```

---

## Stage 2: Architect — Exploration Plan

### 0. Validate Entry (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry discover architect <feature-dir> --plugin backend
```

### 1. Craft Subagent Prompts (MANDATORY — D04)

Use `/prompt-generator` to craft every subagent prompt. Prompt quality IS architecture.

### 2. Define Agents

| Agent | Type | Purpose | Required |
|-------|------|---------|----------|
| Explore | `subagent_type` | Scan codebase for existing patterns, similar services, reusable models/concerns | Always |
| rails-expert | agent | Produce design doc: business logic, data model, service boundaries, API design | Always |
| master-backend-ai-rails | agent | Deep analysis of database schema, migration strategy, query patterns | When data model changes are involved |

### 3. Define Success Criteria

For each subagent:
- **Explore:** Must return exact file paths for every finding. Must classify each as REUSE / EXTEND / CREATE-NEW with justification.
- **rails-expert:** Must cover all business logic from Discuss, data model, service boundaries, API contracts.
- **master-backend-ai-rails (if dispatched):** Must cover migration safety, index strategy, query performance.

Overall:
- Design doc covers every requirement identified in Discuss
- Pattern analysis has zero "probably exists" entries — every item has a file path or "not found"

### 4. Define Execution Order

```
1. Explore agent (first — patterns inform design decisions)
2. rails-expert agent (second — uses Explore findings as input)
3. master-backend-ai-rails agent (third, if needed — schema layer on top of design)
```

Explore runs first because rails-expert depends on its output.

### Stage Artifact

Write: `.dev/discover/architect-exploration-plan.md`

Contents:
- Subagent assignments with crafted prompts
- Per-agent success criteria
- Overall success criteria
- Execution order and dependencies
- Escalation rules (what happens if an agent fails)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output discover architect <feature-dir> --plugin backend
```

---

## Stage 3: Execute — Design Doc + Pattern Analysis

### 0. Validate Entry (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry discover execute <feature-dir> --plugin backend
```

### 1. Dispatch Explore Agent (MANDATORY — D03)

Dispatch the Explore subagent with the prompt crafted in Architect. The orchestrator NEVER executes research inline.

Explore scans:
- `app/models/` — Active Record models, concerns, scopes, validations
- `app/services/` — Service objects, business logic patterns
- `app/controllers/api/v1/` — API controllers, authentication flows
- `app/policies/` — Authorization policies (Pundit)
- `app/jobs/`, `app/serializers/` — Background jobs, response serialization
- `db/migrate/` — Migration patterns for similar features

Collect results. Check against Explore success criteria from Architect.

### 2. Dispatch rails-expert Agent (MANDATORY — D03)

Dispatch with crafted prompt from Architect, Explore findings as input, and all Discuss requirements.

The rails-expert produces: business logic specification, data model design, service layer architecture, API endpoint contracts, error handling strategy, and authorization rules.

Collect results. Check against rails-expert success criteria from Architect.

### 3. Dispatch master-backend-ai-rails Agent (CONDITIONAL)

Only if data model changes are involved (new tables, columns, indexes, or migrations).

Dispatch with feature requirements from Discuss, Explore findings, and rails-expert output.

Produces: migration strategy, index recommendations, query optimization notes, schema safety checks.

Collect results. Check against success criteria from Architect.

### 4. Handle Failures

If any subagent fails: log the failure, continue with remaining agents, surface all failures in Review (D08).

### Stage Artifact

Write: `.dev/discover/execute-design-doc.md`

Contents:
- Pattern analysis (from Explore): REUSE / EXTEND / CREATE-NEW counts and details
- Design doc (from rails-expert): business logic, data model, services, API design
- Schema analysis (from master-backend-ai-rails, if run): migration strategy, indexes
- Per-agent pass/fail against success criteria

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output discover execute <feature-dir> --plugin backend
```

---

## Stage 4: Review — Design Approval

### 0. Validate Entry (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry discover review <feature-dir> --plugin backend
```

### 1. Check Against Success Criteria

For each criterion from Architect, provide evidence-based pass/fail:
- Design doc covers all business logic from Discuss
- Service boundaries and API contracts documented
- Pattern analysis: every finding has file path or "not found", classified correctly

### 2. Surface Gaps

Use `AskUserQuestion` to present summary, pass/fail verdicts with evidence, gaps or open questions, and pattern analysis counts (N reuse, N extend, N create-new).

### 3. User Decision (D08 — No Auto-Looping)

Present options via `AskUserQuestion`:

| Option | When to Use |
|--------|-------------|
| **Accept** | Design doc and pattern analysis meet requirements |
| **Retry Execute** | Re-dispatch failed agents with adjusted prompts |
| **Back to Architect** | Redesign the exploration plan |
| **Back to Discuss** | Revisit requirements or direction |

### 4. On Accept

1. Update MANIFEST with:
   - Phase status: DISCOVER complete
   - Confirmed requirements (refined from design doc)
   - Pattern analysis summary
   - Key decisions

2. Validate MANIFEST:
   ```bash
   node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest <feature-dir> --plugin backend
   ```

3. Write review artifact (context bridge to PLAN).

### Stage Artifact (Context Bridge)

Write: `.dev/discover/review-design-approval.md`

This artifact bridges to PLAN. Must contain: design decisions and rationale, pattern analysis findings (paths + classifications), confirmed requirements, schema analysis notes (if applicable), caveats for PLAN, and recommended architecture focus areas.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output discover review <feature-dir> --plugin backend
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
| rails-expert | agent | Business logic design, service architecture, API contracts, data model | Always (Execute step 2) |
| master-backend-ai-rails | agent | Schema analysis, migration strategy, query optimization, index planning | When data model changes are involved (Execute step 3) |

---

## Common Mistakes

| Mistake | Prevention |
|---------|------------|
| Executing design doc inline | MUST dispatch rails-expert subagent — orchestrator never executes work (D03) |
| Skipping pattern analysis | Always dispatch Explore agent for pattern scanning — no exceptions |
| Crafting prompts without /prompt-generator | Every subagent prompt goes through /prompt-generator in Architect (D04) |
| Not reading intake context bridge | Start Discuss by reading `.dev/intake/review-classification-confirmed.md` |
| Pattern analysis without file paths | Explore MUST return exact file paths or explicit "not found" — no "probably exists" |
| Batching multiple questions | One `AskUserQuestion` call per question, always (D02) |
| Auto-looping on review failure | Surface failures to user, let them decide next action (D08) |
| Skipping stage entry validation | Run `validate-stage-entry` before every stage — no exceptions |
| Continuing past Review without approval | Review requires explicit user acceptance before proceeding |
| Mixing user and student auth patterns | Always check which auth system applies — dual auth is a common source of bugs |

---

## Quick Reference

| Stage | Key Action | Artifact |
|-------|-----------|----------|
| Discuss | WHAT + HOW questions, optional research pre-step | `discuss-feature-requirements.md` |
| Architect | /prompt-generator for all subagent prompts | `architect-exploration-plan.md` |
| Execute | Dispatch Explore, rails-expert, optional master-backend-ai-rails | `execute-design-doc.md` |
| Review | Evidence-based pass/fail, user decides | `review-design-approval.md` (bridges to PLAN) |
