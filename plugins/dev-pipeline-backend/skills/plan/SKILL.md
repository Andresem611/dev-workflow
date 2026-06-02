---
name: plan
description: Makes architecture decisions, creates task breakdowns, and defines wave groupings for a backend feature. Produces locked decision log, migration plan, and API contract draft via the 4-stage inner loop. Triggers on dev-pipeline-backend:plan or when /dev router advances past DISCOVER.
---

# /dev:plan — Architecture Decisions + Task Breakdown (v2.0)

Lock architecture decisions (with WHY + alternatives rejected), break work into tasks, group into waves, define migration sequencing, draft API contracts, and set acceptance criteria. Uses the 4-stage inner loop: Discuss, Architect, Execute, Review.

---

## Stage 1: Discuss — Architecture Direction

**Purpose:** Gather architecture preferences, constraints, and execution strategy before planning begins.

### 0. Load Context (MANDATORY — before anything else)

Read these files using the Read tool. Do NOT proceed until all are loaded:

1. **Read** `${PLUGIN_ROOT}/references/domain-agent-map.md` — agent assignments for PLAN phase
2. **Read** `${PLUGIN_ROOT}/references/inner-loop-reference.md` — stage mechanics and enforcement rules
3. **Read** `${PLUGIN_ROOT}/references/codebase-context-block.md` — standard context for subagent prompts
4. **Read** `${PLUGIN_ROOT}/references/requirements-template.md` — template for requirements artifact

Extract from domain-agent-map.md for PLAN:
- MANDATORY agents: `rails-expert`
- CONDITIONAL agents: `postgres-pro` (migration planning), `architecture-reviewer` (validate decisions), `security-engineer` (auth/payments domains), `workflow-architect` (multi-step workflows)
- Check Domain Combination Patterns against MANIFEST tags

These agents MUST be addressed in the Architect stage — either dispatched or explicitly skipped with reason.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry plan discuss <feature-dir> --plugin backend
```

### Context Bridge

Read `.dev/discover/review-design-approval.md` — extract confirmed requirements, reuse audit findings, codebase patterns, key decisions from DISCOVER.

### Mechanics (per inner-loop-reference.md Section 2.1)

Use `AskUserQuestion` for EVERY question. One at a time. NEVER batch. No cap — user says "enough" or "move on" to proceed.

**WHAT questions** — The work itself:
- Service architecture (single service, orchestrator + sub-services, inline controller)?
- DB schema (new tables, extend existing, join tables, polymorphic associations)?
- Migration strategy (single, phased multi-migration, data backfill needed)?
- API design (RESTful CRUD, custom actions, nested resources)?
- Auth requirements — which user type (User, Student, public)?
- Background job needs (Solid Queue jobs, scheduled tasks, webhooks)?
- Known constraints (production data shape, table size, existing indexes)?
- External service dependencies (Stripe, Twilio, SendGrid, Daily.co)?

**HOW meta-questions** — Execution strategy:
- "Parallel architect agents or focused sequential approach?"
- "Security agent to stress-test migration and API design?"
- "Group waves by layer (migration/model/service/controller) or feature slice?"
- "Run production data audit on affected models before planning?"
- "How strict should review be for migration safety?"

**Doneness Definition (MANDATORY — ask before leaving Discuss):**
- "What does 'done' look like for this feature? What should a reviewer check?"
- "Are there specific acceptance criteria — API responses, data integrity, security, performance?"
- "What should the verifier be able to confirm is working when this is complete?"

The orchestrator MUST ask at least 1 doneness question before advancing to Architect. These answers feed directly into the requirements artifact produced in Architect.

**Automatic Research Pre-Step (MANDATORY for PLAN):**

Before asking WHAT questions, dispatch an Explore agent to scan for architectural precedents relevant to the design decisions ahead:

```
Dispatch: Explore subagent
Purpose: Scan for architectural precedents relevant to [feature] design decisions
Scope: Similar services, migration patterns, API designs, auth flows
```

Resume questioning with findings. The research informs architecture direction and prevents decisions disconnected from existing patterns.

### Artifact

`.dev/plan/discuss-architecture-direction.md`

### After Completion

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output plan discuss <feature-dir> --plugin backend
```

---

## Stage 2: Architect — Decision Framework

**Purpose:** Plan subagent assignments, define decision categories, success criteria, and task breakdown format.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry plan architect <feature-dir> --plugin backend
```

### 0. Verify Context Loaded (MANDATORY)

Confirm `domain-agent-map.md` was Read in Discuss. If not, Read it now using the Read tool.
List ALL agents defined for PLAN in domain-agent-map.md: `postgres-pro`, `rails-expert`, `architecture-reviewer`, `security-engineer`, `workflow-architect`.
Each agent MUST appear in the Orchestration Log as either:
- **Dispatched** — with prompt and success criteria
- **Skipped** — with explicit reason (e.g., "no migrations = skip postgres-pro")

Also check the **Domain Combination Patterns** table. If MANIFEST domains match any combination, apply extra considerations.

### Mechanics (per inner-loop-reference.md Section 2.2)

**D04 ENFORCEMENT:** Follow the D04 Enforcement Protocol from `inner-loop-reference.md`. Every subagent prompt MUST go through `/prompt-generator`. Log status in the Orchestration Log section of this artifact.

**MANDATORY:** Use `/prompt-generator` to craft every subagent prompt.

### Subagent Definitions

| Field | Description |
|-------|-------------|
| **Agent type** | `rails-expert`, `security-engineer`, `postgres-pro`, `master-backend-ai-rails`, optional `challenger` |
| **Prompt** | Crafted via `/prompt-generator` |
| **Success criteria** | What the subagent output must contain |
| **Input context** | Discuss artifact + DISCOVER review artifact + MANIFEST |
| **Execution order** | Parallel vs sequential, dependencies between agents |

### Decision Categories

Subagents must address: DB schema, migration strategy, service architecture, API endpoint design, authorization rules, background jobs, error handling, caching strategy.

### Success Criteria

- Every decision has WHY + alternatives rejected (no exceptions)
- Every confirmed requirement from DISCOVER has a corresponding task
- Waves are logical — no circular dependencies
- Migration sequencing is safe — no references to tables/columns that do not yet exist
- API contracts cover all endpoints with request/response schemas and error codes
- Tasks follow 30min-2.5hr sizing rule

**MANDATORY: Requirements Artifact**

The Architect MUST produce `requirements.md` in the feature docs directory using the template at `references/requirements-template.md`.

Requirements are derived from:
- Domain tags (from INTAKE MANIFEST)
- User answers to doneness questions (from Discuss stage)
- Architecture decisions (migration plan, API contract, service boundaries)

Each requirement MUST be:
- Identified with a category-number ID (e.g., `API-01`, `AUTH-03`, `MIGR-01`)
- Testable — RSpec can verify it, or a manual check is explicitly defined
- Mapped to a wave/task in the traceability table

Rails-specific requirements to ALWAYS include:
- Migration safety (reversible, runs on both helium + Neon)
- API contract compliance (status codes, response shapes, error format)
- Authorization checks (role-based access per endpoint)

The requirements doc is the HARD CONTRACT that VALIDATE verifies against. Without it, VALIDATE has nothing to check except "do RSpec tests pass" — which is insufficient.

### Task Breakdown Format

| Field | Description |
|-------|-------------|
| **Task ID** | Sequential: T01, T02, T03... |
| **Description** | What the task accomplishes |
| **File paths** | Exact paths to create, modify, and test |
| **Acceptance criteria** | Clear done-definition |
| **Wave number** | Which wave this task belongs to |
| **Agent type** | Which subagent executes this in BUILD |

### Artifact

`.dev/plan/architect-decision-framework.md` — Must include the Orchestration Log section.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output plan architect <feature-dir> --plugin backend
```

---

## Stage 3: Execute — Locked Decisions + Task Breakdown

**Purpose:** Dispatch subagents to produce all planning artifacts.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry plan execute <feature-dir> --plugin backend
```

### Mechanics (per inner-loop-reference.md Section 2.3)

**MANDATORY:** Dispatch subagents. The orchestrator NEVER executes work inline.

For each subagent: dispatch with crafted prompt, wait, collect results, check against success criteria, log pass/fail.

### Conditional Agent Dispatches (Domain/Feature-Triggered)

In addition to the subagents defined in Architect, dispatch these agents when conditions are met:

| Condition | Agent | Task |
|-----------|-------|------|
| Feature involves multi-step workflows (booking, payment, scheduling, onboarding) | `workflow-architect` | Failure mode mapping for each workflow step + handoff contracts between services |
| `api-design` domain tagged in MANIFEST | `api-documenter` | Draft OpenAPI contract from requirements (endpoints, schemas, error codes) |
| Feature involves student engagement, practice, or parent retention | `behavioral-nudge-engine` | Engagement pattern review — identify notification touchpoints, retention hooks, and re-engagement triggers |

These are additive — they run alongside (not instead of) the primary subagents from Architect. Results feed into the Execute artifact's relevant sections (API Contract Draft, Acceptance Criteria, etc.).

### Required Outputs

Execute must produce ALL eight sections (seven planning sections + diagrams):

#### 1. Locked Decision Log

```markdown
| ID | Decision | Choice | WHY | Alternatives Rejected |
|----|----------|--------|-----|----------------------|
| D01 | Service pattern | Orchestrator | Matches BookingService pattern in app/services/ | Single service (too large), inline controller (violates convention) |
```

**WHY is mandatory.** Cite codebase files as evidence.

#### 2. Task List

```markdown
| ID | Description | Files | Acceptance Criteria | Wave | Agent |
|----|-------------|-------|-------------------|------|-------|
| T01 | Create migration | create: db/migrate/XXX_create_table.rb | Table with all D01 columns | W1 | master-backend-ai-rails |
```

**Sizing:** 30min-2.5hr. **Ordering:** Migrations, Models, Services, Controllers/Serializers, Request Specs, Edge Cases.

#### 3. Wave Groupings

```markdown
| Wave | Tasks | Parallel? | Depends On |
|------|-------|-----------|------------|
| W1 | T01 (migration), T02 (model), T03 (factory) | Yes | -- |
| W2 | T04 (service), T05 (policy) | Yes | W1 |
```

Tasks within a wave run in parallel. Waves run sequentially. One file = one task = one wave.

#### 4. Migration Plan

```markdown
| Order | Migration File | Creates/Modifies | Depends On | Rollback Strategy | Safe-Migrate Notes |
|-------|---------------|------------------|------------|-------------------|-------------------|
| 1 | create_features | Creates features table | -- | drop_table | New table, no data risk |
| 2 | add_feature_id_to_bookings | Adds FK to bookings | Migration 1 | remove_column | Nullable FK, backfill separate |
```

**Safety rules:** Order respects dependencies. Data migrations separated from schema migrations. Rollback defined for every migration. Large table ops flagged with lock duration. Reference `/safe-migrate` for heavy features. Note dual-environment runs (helium + Neon).

#### 5. API Contract Draft

```markdown
| Endpoint | Method | Auth | Request Body | Success Response | Error Codes |
|----------|--------|------|-------------|-----------------|-------------|
| /api/v1/features | POST | User (parent) | `{ feature: { name, student_id } }` | `201 { feature: { id, name } }` | 401, 403, 422 |
```

**Rules:** Auth type on every endpoint (User/Student/public/admin). Required vs optional fields. Response shape (not just status). ALL failure modes listed. Follow patterns from `.claude/docs/API_ROUTES.md`.

#### 6. Acceptance Criteria

Feature done-definition: decisions implemented, migrations clean in both environments, endpoints match contract, services handle error paths, RSpec coverage on new code, plus feature-specific criteria from DISCOVER.

#### 7. Production Data Considerations

```markdown
| Model | Field/Association | Current State | Impact on Feature |
|-------|------------------|---------------|-------------------|
| Student | active_avatar | 12% NULL | Safe navigation + defaults required |
```

If no existing models affected: "New tables only — no production data impact."

#### 8. Architecture Diagrams (D2 + ASCII)

For any non-trivial feature, subagents MUST produce architecture diagrams using **D2 syntax** (preferred) or ASCII:

- **Data flow diagram** — How data moves through services/controllers/models (required if feature has >2 services or new API endpoints)
- **State machine** — For models with >3 states or complex lifecycle (required if feature has stateful models)
- **Dependency graph** — Before/after showing new coupling (required if feature touches >4 files)
- **Migration dependency chain** — Order of operations for multi-migration features (required if >2 migrations)

**D2 rendering (when `d2` CLI is available):**
After producing diagrams in D2 syntax, render to SVG:
```bash
d2 docs/[Feature]/.dev/plan/diagrams/<name>.d2 docs/[Feature]/.dev/plan/diagrams/<name>.svg --layout=elk
```
Store both `.d2` source and `.svg` output in `docs/[Feature]/.dev/plan/diagrams/`. Reference the SVGs in task files and wave files so BUILD agents have visual context.

**Fallback:** If `d2` is not installed, produce ASCII diagrams inline (previous behavior). D2 source files are still valuable as text — they're readable without rendering.

These diagrams go in the Execute artifact AND should be embedded as inline comments in the corresponding implementation files during BUILD (Models for state transitions, Services for pipelines, Controllers for request flow). Stale diagrams are worse than no diagrams — if BUILD modifies a diagrammed flow, the diagram MUST be updated in the same wave.

**MANDATORY: must_haves in Wave Files**

Each wave file produced by Execute MUST include a `must_haves` section:

```markdown
## must_haves
- **truths**: [API behaviors, data integrity guarantees that must be true when this wave is done]
- **artifacts**: [Models, controllers, services, specs that must exist and be substantive]
- **key_links**: [controller→service, service→model, route→controller connections that must be wired]
```

These are consumed by VALIDATE for goal-backward verification. Truths without must_haves = unverifiable work.

### Artifact

`.dev/plan/execute-locked-decisions.md` — All seven sections.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output plan execute <feature-dir> --plugin backend
```

---

## Stage 4: Review — Plan Approval

**Purpose:** Validate Execute output, surface gaps, get user approval.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry plan review <feature-dir> --plugin backend
```

### Validation Checks (per inner-loop-reference.md Section 2.4)

Run each check with evidence-based pass/fail:

1. **Every decision has WHY + alternatives rejected** — reject entries missing either
2. **Every requirement has a task** — cross-reference DISCOVER requirements against task list
3. **Wave groupings logical** — no circular deps, no two tasks in same wave touching same file
4. **Migration sequencing safe** — ordered by dependency, rollback present, data/schema separated
5. **API contract complete** — auth type, request/response shapes, error codes on every endpoint
6. **Task sizing** — none above 2.5hr, none below 20min
7. **Requirements artifact** — checklist:
   - [ ] `requirements.md` exists with checkable requirement IDs
   - [ ] Every requirement is testable (RSpec or manual check defined)
   - [ ] Traceability table maps all requirements to waves/tasks
   - [ ] Wave files include `must_haves` blocks
   - [ ] Migration safety requirements present (if feature has migrations)
   - [ ] API contract requirements present (if feature has endpoints)
   - [ ] No unmapped requirements (coverage = 100%)

### Run Validation Tools

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output plan execute <feature-dir> --plugin backend
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest <feature-dir> --plugin backend
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

Review the architecture decisions for frontend dependencies:

1. Check MANIFEST for `Cross-Stack: frontend` tag from INTAKE
2. Review locked decisions — do any require frontend changes? (new endpoints, changed response shapes, WebSocket channels, auth flow changes)
3. If cross-stack work is confirmed: ensure the review artifact documents what the frontend pipeline needs to build
4. If cross-stack tag is missing but architecture reveals frontend needs: add the tag now and document the dependency

Cross-stack work does NOT block the backend pipeline — it flags that a `/dev:handover` will be needed after VALIDATE.

### Present Architecture Diagrams (MANDATORY)

Before presenting the plan summary via `AskUserQuestion`, display ALL diagrams from Execute Section 8 inline in the chat message:

- Data flow diagram (if produced)
- State machine (if produced)
- Dependency graph (if produced)
- Migration dependency chain (if produced)

Use `AskUserQuestion` to present each diagram with a 1-line description and ask: "Does this accurately represent the architecture?"

Diagrams MUST be shown in conversation — the user will NOT open artifact files to review them. If no diagrams were produced in Execute (e.g., trivial feature with <3 services and no stateful models), state: "No diagrams required for this feature scope."

### Surface Gaps

Use `AskUserQuestion` for gaps. Present summary with:
- Locked decisions table (ID, Decision, Choice, WHY short)
- Migration plan (N total, schema vs data count, safety flags)
- API contract (N endpoints, auth types)
- Plan summary (N tasks across N waves, production data status)
- Validation checklist (pass/fail for: WHY present, requirements covered, waves logical, migration safe, API complete)
- Options: **Accept** (to DOCUMENT), **Retry Execute**, **Back to Architect**, **Back to Discuss**

**User decides.** No auto-accepting (D08).

### On Accept

1. Update MANIFEST: PLAN = complete
2. Write review artifact with bridge context for DOCUMENT
3. **If this is a frontend-handoff feature (MANIFEST has `## Frontend Handoff`):** the FE-facing contract is now locked. Write the contract decisions to `<BE-feature>/.dev/be-contract-decisions.md` as ledger rows (Scope = contract, Status = ACTIVE, Changed By = BE, Reason = WHY) in the shared-decision-ledger row format, then append a `CONTRACT-LANDED` marker (date, By = BE, contract location = this review artifact). If a contract decision supersedes an FE assumption from the shared ledger, note it in the row's Reason — the FE transcribes it and flips the FE row to SUPERSEDED on resume. **Do NOT write the FE-owned canonical ledger** — writes stay worktree-local; the FE syncs on resume/monitor. Format: `${PLUGIN_ROOT}/../shared/references/shared-decision-ledger-template.md`. This is what lets the FE swap its local mocks for the real contract.

**Dispatch Mandate for DOCUMENT (MANDATORY in context bridge):**

Include this section in the review artifact. Read `domain-agent-map.md` DOCUMENT Phase Agents to populate:

```markdown
## Dispatch Mandate for DOCUMENT
Agents from domain-agent-map.md for DOCUMENT:
- MANDATORY: `rails-expert` (consistency verification of docs against codebase)
- CONDITIONAL: `api-documenter` (if `api-design` domain tagged in MANIFEST)
The DOCUMENT Architect MUST address each agent (dispatch or skip with reason in Orchestration Log).
```

### Notion Update

Update the Dev Tracker card with locked architecture decisions. Reference `references/notion-integration.md` for property names and MCP tool patterns.

**Notion Protocol:** Follow the Retry + Warning Protocol in `references/notion-integration.md`.
- Phase type: Downstream (status update — check Card ID first)
- Target status: (notes update, no status change)
- Persist warning in: `.dev/plan/review-plan-approval.md`

1. Read the Notion card page ID from MANIFEST's `## Notion Integration > Card ID`
2. **Update Dev Tracker card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: card ID from MANIFEST
   - Properties: Notes = append summary of locked architecture decisions (decision count, key choices), Last Updated = today's ISO date
3. Display status summary:

```
📋 Notion: Updated notes — "[Feature Name]" (architecture decisions locked)
```

Display `Next Up` block and **STOP**:

```
---
> Next Up

Phase: DOCUMENT — Technical documentation + wave execution plans

`/dev:document`

/clear first -> fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke DOCUMENT. Do not offer "continue in same session".

Backend ALWAYS routes to DOCUMENT after PLAN. There is no DESIGN phase in the backend pipeline.

### Artifact

`.dev/plan/review-plan-approval.md` — Validation verdicts, user decision, locked decisions summary, migration plan summary, API contract summary, wave plan, production data notes, bridge context for DOCUMENT.

This artifact IS the context bridge. DOCUMENT reads it to understand architecture decisions.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output plan review <feature-dir> --plugin backend
```

---

## Decision Log Format

```markdown
| ID | Decision | Choice | WHY | Alternatives Rejected | Supersedes | Reason |
|----|----------|--------|-----|----------------------|------------|--------|
| D01 | Service pattern | Orchestrator + sub-services | Matches BookingService pattern, coordinates cleanly | Single service (500+ lines), inline controller (violates convention) | — | — |
```

- **WHY is mandatory.** No exceptions.
- **Alternatives Rejected is mandatory.** Forces deliberate thinking.
- **Cite codebase evidence** — reference real file paths as precedent.
- Decisions LOCKED after Review. Changes require re-entering PLAN.
- **Guard 1 (lock-vs-lock, v3.11):** before locking a new decision, run the conflict check from `references/manifest-template.md` Decisions Log. If it reverses an existing LOCKED decision, name that decision in the **`Supersedes`** column with a **`Reason`**. If the reversed decision's source is the **user** (`User:*`), emit a prominent `⚠ LOCK CONFLICT` banner naming both IDs in the Review/handover output and continue — never reverse a user lock silently.

---

## Directory Structure

```
docs/[Feature_Name]/.dev/
+-- MANIFEST.md
+-- discover/
|   +-- review-design-approval.md    <- context bridge IN
+-- plan/
    +-- discuss-architecture-direction.md
    +-- architect-decision-framework.md
    +-- execute-locked-decisions.md
    +-- review-plan-approval.md      <- context bridge OUT (to DOCUMENT)
```

No `prompt-transitions/` directory. `review-plan-approval.md` IS the context bridge.

---

## Common Mistakes

| Mistake | Prevention |
|---------|------------|
| Decisions without WHY or alternatives | Reject entries missing either field |
| Tasks without acceptance criteria or file paths | Every task needs done-definition + create/modify/test paths |
| Tasks larger than 2.5 hours | Split — if it feels like one, it is two |
| Migration without rollback strategy | Every migration needs documented rollback |
| Data migration mixed with schema migration | Separate — different operations, different risk profiles |
| Migration referencing future table/column | Order by dependency, validate in Review |
| API contract missing error codes or auth type | Every endpoint: auth type + ALL failure modes |
| Bridging to DESIGN instead of DOCUMENT | Backend has no DESIGN phase |
| Waves with hidden dependencies | One file = one task = one wave |
| Batching questions in Discuss | One `AskUserQuestion` at a time (D02) |
| Decisions inline in Execute | MUST dispatch subagent (D03) |
| Skipping `/prompt-generator` in Architect | Mandatory for every Architect stage (D04) |
| Auto-accepting or auto-invoking next phase | User decides (D08), display `Next Up` and STOP |
| Creating `prompt-transitions/` | v1.x removed — `review-*.md` IS the bridge |
| Skipping production data audit | If touching existing models, ALWAYS audit |

---

## Quick Reference

```
Discuss:  AskUserQuestion (WHAT + HOW meta) -> discuss-architecture-direction.md
Architect: /prompt-generator -> architect-decision-framework.md
Execute:  Subagents produce 7 outputs -> execute-locked-decisions.md
Review:   Validate + user confirms -> review-plan-approval.md

Execute outputs:
  1. Locked Decision Log (WHY + alternatives rejected)
  2. Task List (ID, files, acceptance criteria, wave, agent)
  3. Wave Groupings (parallel tasks, sequential waves)
  4. Migration Plan (sequencing, rollback, safety notes)
  5. API Contract Draft (endpoints, auth, request/response, errors)
  6. Acceptance Criteria (feature-level done-definition)
  7. Production Data Considerations (NULL rates, edge cases)

Backend agents: rails-expert, security-engineer, postgres-pro, master-backend-ai-rails
PLAN always routes to DOCUMENT (no DESIGN phase in backend).
No prompt-transitions/. review-*.md = context bridge.
Reference /safe-migrate for migration-heavy features.
```
