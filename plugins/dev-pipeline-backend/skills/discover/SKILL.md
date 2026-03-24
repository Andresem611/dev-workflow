---
name: discover
description: Explores requirements, researches existing patterns, and analyzes business logic for a backend feature. Produces design doc and pattern analysis via the 4-stage inner loop. Triggers on dev-pipeline-backend:discover or when /dev router advances past INTAKE.
---

# /dev:discover — Brainstorm + Codebase Research

Explore business logic requirements, data model needs, service boundaries, and API patterns. Produces a design doc and pattern analysis.

**Inner loop:** Discuss → Architect → Execute → Review

---

## Stage 1: Discuss — Feature Requirements Discussion

### 0. Load Context (MANDATORY — before anything else)

Read these files using the Read tool. Do NOT proceed until all are loaded:

1. **Read** `${PLUGIN_ROOT}/references/domain-agent-map.md` — agent assignments for DISCOVER phase
2. **Read** `${PLUGIN_ROOT}/references/inner-loop-reference.md` — stage mechanics and enforcement rules
3. **Read** `${PLUGIN_ROOT}/references/codebase-context-block.md` — standard context for subagent prompts

Extract from domain-agent-map.md for DISCOVER:
- MANDATORY agents: `Explore`, `rails-expert`
- CONDITIONAL agents: `master-backend-ai-rails` (when data model changes involved), `architecture-reviewer` (when COMBINATION+ complexity or new subsystems)
- Check Domain Combination Patterns against MANIFEST tags

These agents MUST be addressed in the Architect stage — either dispatched or explicitly skipped with reason.

### 0b. Validate Entry (MANDATORY)

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

### Questioning Philosophy: Interrogation for Clarity

**Do not check boxes. Interrogate.**

The goal of Discuss is not to collect answers — it is to achieve *maximum clarity* about what we're building and WHY. Ask questions until every gap, ambiguity, and half-formed idea has been pressure-tested. The user says "enough" or "move on" to end — you do NOT decide you have enough.

**Rules:**
- **Never stop early.** If you sense ambiguity, unresolved tension, or a vague answer — ask a follow-up. "That makes sense, but what happens when...?" is always better than moving on.
- **Lead with WHY, then WHAT, then HOW.** Understanding *why* the user wants something unlocks better *what* questions. If the user says "add a bookings endpoint," ask "Why a new endpoint? What's wrong with the existing one?" — because the answer might reveal the real need is filtering, not a new resource.
- **Challenge soft answers.** "It should handle errors gracefully" → "Gracefully for who? The frontend showing a toast? A parent mid-payment? A background job retrying?" — those are different error strategies.
- **Use the boiling water test.** If the user says "make X," ask WHY they want X. If they say "because I'm making pasta," you can now suggest "should we also salt the water?" — the WHY unlocks adjacent insights the user hasn't articulated yet.
- **Surface your own confusion.** If something doesn't click, say so: "I don't fully understand how [A] connects to [B] — can you walk me through that?" Silence about confusion = bad downstream decisions.
- **This is a product thinking session, not a form.** The user is working through their own reasoning. Your questions should help them sharpen their thinking — like a PM grilling a feature spec before it goes to engineering.

### 2. Ask WHY Questions First (one at a time)

Before asking WHAT to build, understand WHY we're building it. Use `AskUserQuestion` for every question. One question per call. No batching. No cap — the user says "enough" or "move on" to end questioning (D02, D07).

**WHY questions** (ask these FIRST — they shape everything downstream):
- Why does this feature need to exist? What problem is it solving?
- Why now? What triggered this — user feedback, business goal, technical debt?
- Why this approach? Were alternatives considered and rejected?
- Who specifically benefits? What does their workflow look like without this feature?
- What does success look like? How would you know this feature is working?

**WHAT questions** (informed by WHY answers):
- Business logic rules and acceptance criteria
- Data model needs and entity relationships
- Service boundaries and API contract expectations
- Authorization and access control rules
- Edge cases, error states, and failure modes

**Follow-up on every answer.** If the answer to a WHAT question is vague, circle back to WHY: "You said you want soft deletes — why not hard deletes? Is there a compliance reason, or do users need to restore?"

### 3. Ask HOW Meta-Questions

HOW questions let the user control execution depth (D06):

| Question | What It Controls |
|----------|-----------------|
| "Focused agents or broad exploration?" | Scope of codebase research |
| "How deep should the pattern analysis go?" | Pattern analysis thoroughness |
| "Want codebase research before we continue?" | Triggers optional research pre-step (D09) |
| "Any specific areas of the codebase to investigate?" | Targets Explore agent scope |

### 4. Automatic Research Pre-Step (MANDATORY for DISCOVER)

Before asking WHAT questions, dispatch an Explore agent to scan for existing patterns. This is NOT optional in DISCOVER — the orchestrator asks better questions when it has codebase context.

```
Dispatch: Explore subagent
Purpose: Scan codebase for patterns related to [feature]
Scope: models, services, controllers, routes for feature-relevant patterns
```

Resume Discuss questioning with findings. The research enriches remaining questions and prevents "blind" questioning.

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

### 0b. Verify Context Loaded (MANDATORY)

Confirm `domain-agent-map.md` was Read in Discuss. If not, Read it now using the Read tool.
List ALL agents defined for DISCOVER in domain-agent-map.md.
Each agent MUST appear in the Orchestration Log as either:
- **Dispatched** — with prompt and success criteria
- **Skipped** — with explicit reason (e.g., "domain not tagged in MANIFEST")

Also check the **Domain Combination Patterns** table. If MANIFEST domains match any combination (e.g., `auth + students` = COPPA), apply extra considerations.

### 1. Craft Subagent Prompts (MANDATORY — D04)

**D04 ENFORCEMENT:** Follow the D04 Enforcement Protocol from `inner-loop-reference.md`. Every subagent prompt MUST go through `/prompt-generator`. Log status in the Orchestration Log section of this artifact.

Use `/prompt-generator` to craft every subagent prompt. Prompt quality IS architecture.

### 2. Define Agents

| Agent | Type | Purpose | Required |
|-------|------|---------|----------|
| Explore | `subagent_type` | Scan codebase for existing patterns, similar services, reusable models/concerns | Always |
| rails-expert | agent | Produce design doc: business logic, data model, service boundaries, API design | Always |
| master-backend-ai-rails | agent | Deep analysis of database schema, migration strategy, query patterns | When data model changes are involved |
| architecture-reviewer | agent | Validate design against system architecture, assess coupling and scalability | COMBINATION+ complexity or new subsystems |

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
- Orchestration Log (prompt-generator status, agents selected, cross-stack signals)

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

### 4. Dispatch architecture-reviewer Agent (CONDITIONAL)

When MANIFEST complexity is COMBINATION or NOVEL, or when the design introduces new subsystems, services, or significant coupling changes:

Dispatch `architecture-reviewer` with: feature requirements from Discuss, Explore findings, and rails-expert design doc output.

Produces: architecture fit assessment, coupling analysis, scalability considerations, alignment with existing system patterns documented in `.claude/docs/ARCHITECTURE.md`.

Collect results. Check against success criteria from Architect.

**Skip condition:** KNOWN-tier features that extend existing patterns without new subsystems. Log "skipped — KNOWN complexity, extends existing pattern" in Orchestration Log.

### 5. Handle Failures

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

### 2. Present Design Diagrams (CONDITIONAL)

If the design doc from Execute contains any diagrams (data flow, entity relationships, service boundaries), display them inline via `AskUserQuestion` before presenting the summary. The user should see and approve the architecture visually, not just read text descriptions.

### 3. Surface Gaps

Use `AskUserQuestion` to present summary, pass/fail verdicts with evidence, gaps or open questions, and pattern analysis counts (N reuse, N extend, N create-new).

### 4. User Decision (D08 — No Auto-Looping)

Present options via `AskUserQuestion`:

| Option | When to Use |
|--------|-------------|
| **Accept** | Design doc and pattern analysis meet requirements |
| **Retry Execute** | Re-dispatch failed agents with adjusted prompts |
| **Back to Architect** | Redesign the exploration plan |
| **Back to Discuss** | Revisit requirements or direction |

### 5. On Accept

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

**Dispatch Mandate for PLAN (MANDATORY in context bridge):**

Include this section in the review artifact. Read `domain-agent-map.md` PLAN Phase Agents to populate:

```markdown
## Dispatch Mandate for PLAN
Agents from domain-agent-map.md for PLAN:
- MANDATORY: `rails-expert` (API/service design)
- CONDITIONAL: `postgres-pro` (if migrations needed), `architecture-reviewer` (validate decisions), `security-engineer` (if auth/payments domains), `workflow-architect` (if multi-step workflows)
The PLAN Architect MUST address each agent (dispatch or skip with reason in Orchestration Log).
```

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output discover review <feature-dir> --plugin backend
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
| rails-expert | agent | Business logic design, service architecture, API contracts, data model | Always (Execute step 2) |
| master-backend-ai-rails | agent | Schema analysis, migration strategy, query optimization, index planning | When data model changes are involved (Execute step 3) |
| architecture-reviewer | agent | Architecture fit, coupling analysis, scalability, system alignment | COMBINATION+ complexity or new subsystems (Execute step 4) |

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
| Asking WHAT before WHY | Lead with WHY questions — understanding purpose unlocks better WHAT/HOW questions |
| Accepting vague answers | Challenge soft answers ("handle errors gracefully" → "gracefully for who?"). Interrogate until clarity. |
| Stopping questions too early | Do NOT decide you have enough info. Only the user says "enough" or "move on". |
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
