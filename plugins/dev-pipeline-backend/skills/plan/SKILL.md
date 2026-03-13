---
name: plan
description: Makes architecture decisions, creates task breakdowns, and defines wave groupings for a backend feature. Produces locked decision log, migration plan, and API contract draft via the 4-stage inner loop. Triggers on dev-pipeline-backend:plan or when /dev router advances past DISCOVER.
---

# /dev:plan — Architecture Decisions + Task Breakdown (v2.0)

Lock architecture decisions (with WHY + alternatives rejected), break work into tasks, group into waves, define migration sequencing, draft API contracts, and set acceptance criteria. Uses the 4-stage inner loop: Discuss, Architect, Execute, Review.

---

## Stage 1: Discuss — Architecture Direction

**Purpose:** Gather architecture preferences, constraints, and execution strategy before planning begins.

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

**Optional research pre-step:** If user opts in, dispatch an Explore agent to analyze existing patterns, then resume questioning with findings.

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

### Mechanics (per inner-loop-reference.md Section 2.2)

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

`.dev/plan/architect-decision-framework.md`

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

### Required Outputs

Execute must produce ALL seven sections:

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
| ID | Decision | Choice | WHY | Alternatives Rejected |
|----|----------|--------|-----|----------------------|
| D01 | Service pattern | Orchestrator + sub-services | Matches BookingService pattern, coordinates cleanly | Single service (500+ lines), inline controller (violates convention) |
```

- **WHY is mandatory.** No exceptions.
- **Alternatives Rejected is mandatory.** Forces deliberate thinking.
- **Cite codebase evidence** — reference real file paths as precedent.
- Decisions LOCKED after Review. Changes require re-entering PLAN.

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
