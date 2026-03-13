---
name: dev
description: Develops backend features end-to-end — from idea through ship. Routes all multi-step backend work through a linear phase chain (INTAKE through SHIP) and resumes paused pipelines. Triggers on "build feature", "implement", "add endpoint", or any multi-step backend work. Also triggers on "/dev" or when resuming a paused feature pipeline.
---

# /dev — Backend Development Pipeline v2.0

Unified pipeline that routes all backend feature work through a linear phase chain: INTAKE through SHIP. Single entry point replaces manual skill-hopping between brainstorming, feature-orchestrator, writing-plans, subagent-driven-development, verify, and publish.

## When to Use

- Building any new backend feature
- User says "build", "implement", "add endpoint", "create" for a backend feature
- Resuming a paused feature (`/dev` with existing MANIFEST)
- Receiving a tech spec, API spec, or migration-heavy requirement
- Bug/issue that needs structured investigation and fix

**Do NOT use for:**
- Pure strategy/business discussions (use `thoven-boardroom`)
- Non-code tasks (emails, Notion, research)
- Quick one-line fixes that need no pipeline
- Frontend-only work (use `dev-pipeline-frontend:dev`)

---

## Sub-Command Chain

Each phase is a plugin skill invoked via colon notation:

```
/dev              → This file. Routes to correct phase or resumes.
/dev intake       → Skill(dev-pipeline-backend:intake)    — Classify, scope, create MANIFEST
/dev discover     → Skill(dev-pipeline-backend:discover)  — Brainstorm + codebase research + reuse audit
/dev plan         → Skill(dev-pipeline-backend:plan)      — Architecture decisions + task breakdown
/dev document     → Skill(dev-pipeline-backend:document)  — 5-layer docs + wave execution plans
/dev build        → Skill(dev-pipeline-backend:build)     — Wave-based task execution + agent dispatch
/dev validate     → Skill(dev-pipeline-backend:validate)  — RSpec, security review, QA, production data audit
/dev ship         → Skill(dev-pipeline-backend:ship)      — Changelog + commit + deployment
/dev pause        → Skill(dev-pipeline-backend:pause)     — Explicit pause with handoff context
```

Each phase skill contains its own complete logic. This file is the router only.

**Phase invocation:** When routing to a phase, use the Skill tool:
```
Skill(dev-pipeline-backend:intake)     # Plugin colon notation
```

---

## Phase Chain

```
INTAKE → DISCOVER → PLAN → DOCUMENT → BUILD → VALIDATE → SHIP
                                                           ↑
                                                     PAUSE (any point)
```

**Every phase runs the inner loop:** Discuss → Architect → Execute → Review
See `references/inner-loop-reference.md` for the canonical 4-stage pattern definition.

**Every Review offers:** Accept (next phase) / Retry Execute / Back to Architect / Back to Discuss

### Session Boundary Enforcement

**Every Review acceptance is a hard stop.** When Review completes and the user accepts, display a `Next Up` block and STOP. No exceptions.

**`Next Up` block format (displayed inline after every Review acceptance):**

```
---
▶ Next Up

Phase: [NEXT PHASE] — [one-line description]

`/dev:[next-phase]`

/clear first → fresh context window
```

**Rules:**
- Every Review displays this block after acceptance. No exceptions.
- The agent does NOT invoke the next phase. The user runs `/clear` and invokes.
- State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.
- `review-*.md` files carry full structured context between phases (context bridge pattern).
- BUILD is the only phase with intra-session wave progression (see build skill for details).

---

## Entry Mode Routing

Determine entry mode from user input, then route to the correct starting phase.

| Mode | Signal | Starting Phase |
|------|--------|----------------|
| **Idea dump** | Rough idea, "I want...", "what if..." | INTAKE → DISCOVER |
| **Tech spec** | PRD, spec doc, detailed requirements | INTAKE → PLAN |
| **API spec** | OpenAPI doc, endpoint contract, route list | INTAKE → PLAN |
| **Migration-heavy** | Schema change, new tables, data backfill | INTAKE → PLAN |
| **Bug/issue** | "broken", "error", "bug", "fix" | INTAKE → BUILD (investigate logic) |
| **Resume** | Existing MANIFEST found | MANIFEST's current phase |

**Default:** If unclear, start at INTAKE and let classification decide.

---

## Domain Tags

Set during INTAKE. Drive agent dispatch and conditional validation in BUILD and VALIDATE.

| Domain | Signals | Triggers |
|--------|---------|----------|
| `models` | New models, associations, validations | Schema verification, factory checks |
| `migrations` | Schema changes, column adds, index work | `/safe-migrate`, dual DB sync check |
| `controllers` | New endpoints, parameter handling | Route testing, request specs |
| `services` | Business logic, complex workflows | Service unit tests, integration tests |
| `auth` | Login, tokens, role guards, COPPA | Auth boundary testing, `/security-review` |
| `payments` | Stripe, billing, subscriptions | Payment flow verification, `/security-review` |
| `background-jobs` | Solid Queue, async processing | Job execution testing, queue verification |
| `mailers` | SendGrid, email templates, notifications | Email delivery testing, template review |
| `api-design` | Route structure, versioning, contracts | API contract verification |
| `performance` | N+1 queries, caching, heavy queries | Query analysis, benchmark testing |
| `security` | Input validation, injection, access control | `/security-review`, OWASP checks |

Multiple domains can apply to a single feature.

---

## Routing Logic

### On `/dev` invocation:

```
1. Check for $ARGUMENTS (feature name passed via /dev command)
   |-- Provided → find matching MANIFEST → skip to resume
   +-- Not provided → scan docs/**/.dev/MANIFEST.md

2. MANIFEST scan results:
   |-- 0 found    → NEW FEATURE → INTAKE
   |-- 1 found    → RESUME directly
   +-- 2+ found   → SHOW PICKER
       |-- AskUserQuestion: list features with phase/stage/status
       |-- User picks feature → RESUME
       +-- User picks "new"   → INTAKE

3. On RESUME:
   |-- Read MANIFEST (current phase, domains, status)
   |-- Read latest review-*.md from last completed phase
   |-- If paused: read .dev/pause-handoff.md
   |-- Report state to user: "Resuming [feature] at [phase]. Last: [phase]."
   +-- Route to current phase skill

4. On phase invocation:
   |-- Skill(dev-pipeline-backend:<phase>)
   |-- Read MANIFEST
   |-- Read review-*.md from previous phase for context bridge
   |-- If review-*.md missing:
   |     validate-stage-entry <current_phase> discuss <feature-dir> --plugin backend
   |     If FAIL: show issues, suggest re-running previous phase Review
   |     If PASS with warnings: proceed with warning
   +-- Phase runs its own inner loop → Review → ▶ Next Up → STOP
```

### MANIFEST Location

```
docs/[Feature_Name]/.dev/MANIFEST.md
```

Search for existing MANIFESTs: `docs/**/.dev/MANIFEST.md`

### Resume Protocol

1. Read MANIFEST to find: current phase, domains, last completed phase
2. Read the latest `review-*.md` from the last completed phase directory
3. If paused: also read `.dev/pause-handoff.md` for handoff context
4. Present summary to user: "Resuming [feature] at [phase]. Last completed: [phase]."
5. Load the current phase sub-file and continue

---

## Phase Prerequisites

Each phase validates that its predecessors completed before executing.

| Phase | Requires |
|-------|----------|
| INTAKE | Nothing |
| DISCOVER | MANIFEST exists |
| PLAN | DISCOVER completed (or skipped per entry mode) |
| DOCUMENT | PLAN completed |
| BUILD | DOCUMENT completed |
| VALIDATE | BUILD completed (all waves) |
| SHIP | VALIDATE passed |
| PAUSE | Any phase in progress |

If prerequisites are not met, warn the user and suggest the correct phase.

---

## Artifact Paths

```
docs/[Feature_Name]/.dev/
├── MANIFEST.md
├── intake/          → discuss-classification, architect-manifest-plan, execute-manifest-created, review-classification-confirmed
├── discover/        → discuss-feature-requirements, architect-exploration-plan, execute-design-doc, review-design-approval
├── plan/            → discuss-architecture-direction, architect-decision-framework, execute-locked-decisions, review-plan-approval
├── document/        → discuss-documentation-scope, architect-documentation-plan, execute-docs-manifest, review-documentation-quality
├── build/wave-NN/   → discuss-implementation-path, architect-subagent-prompts, execute-build-results, review-code-quality
├── validate/        → discuss-validation-strategy, architect-validation-plan, execute-validation-results, review-ship-readiness
└── ship/            → discuss-release-scope, architect-release-plan, execute-release-output, review-release-confirmation
```

Each phase gets its own subdirectory. All artifacts follow `<stage>-<descriptive-name>.md` naming. `review-*.md` in each phase directory serves as the context bridge to the next phase. There is NO separate `prompt-transitions/` directory.

---

## Error Escalation (BUILD Phase)

```
Task fails verification
|-- Simple error → Self-fix (1 retry max)
+-- Complex error → Investigate logic
    |-- Investigation fixes it → Resume
    +-- 3 strikes → PAUSE with options:
        1. Guide fix manually
        2. Revise plan (return to PLAN phase)
        3. Pause feature entirely
```

---

## Common Mistakes

| Mistake | Why It Breaks | Prevention |
|---------|---------------|------------|
| Skipping INTAKE | No MANIFEST, no domains — all phases break | INTAKE is always the first phase for new features |
| Jumping to BUILD without DOCUMENT | No task files, no wave plans, unstructured execution | Validate prerequisites before each phase |
| Ignoring domain tags | Missing validation checks (e.g., no migration audit on schema feature) | Set domains during INTAKE, they drive VALIDATE |
| Manual skill-hopping mid-pipeline | Context lost between skills, MANIFEST not updated | Stay in /dev pipeline; it orchestrates internally |
| Not reading MANIFEST on resume | Repeats completed work, loses decisions | Always read MANIFEST first on `/dev` |
| Using `prompt-transitions/` directory | v1.x pattern — no longer exists | `review-*.md` in each phase directory IS the context bridge |
| Skipping Discuss stage | Requirements unclear, subagent prompts are vague | Every phase MUST run Discuss with `AskUserQuestion` |
| Executing inline in Execute | Orchestrator does work instead of dispatching | MUST dispatch subagents — orchestrator never executes inline |
| Auto-looping in Review | User loses control of iteration direction | User decides path: Accept / Retry / Back to Architect / Back to Discuss |
| Not reading `review-*.md` on resume | Context bridge lost, next phase starts blind | Always read previous phase's `review-*.md` before starting |
| Auto-invoking next phase after Review | Context rot, no fresh window | Review displays `Next Up` block and STOP. Never invoke next phase. |
| Offering "continue in same session" | Defeats session boundary purpose | Never offer. Every Review acceptance is a hard stop. |
| Forgetting dual DB migrations | helium dev DB drifts from Neon production | Run migrations in BOTH environments — see DEPLOYMENT.md |
| Skipping RSpec before commit | Broken tests ship to staging/production | `bundle exec rspec` is mandatory in VALIDATE and before every commit |
| Adding a DESIGN phase | Backend has no DESIGN phase — that is frontend-only | Chain is INTAKE → DISCOVER → PLAN → DOCUMENT → BUILD → VALIDATE → SHIP |
| Running /dev with multiple MANIFESTs and no picker | Auto-resuming first found feature silently | Always show picker when 2+ active MANIFESTs |

---

## Tool Integration

Call these at the specified points. Tool location: `${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js`

| When | Command |
|------|---------|
| Before entering any stage | `validate-stage-entry <phase> <stage> <feature-dir> --plugin backend` |
| After completing any stage | `validate-stage-output <phase> <stage> <feature-dir> --plugin backend` |
| Before session breaks | `checkpoint-state <feature-dir> --scope wave\|phase --plugin backend` |
| After MANIFEST changes | `validate-manifest <feature-dir> --plugin backend` |

---

## Reference Files

| File | Content |
|------|---------|
| `references/manifest-template.md` | MANIFEST structure and field definitions |
| `references/domain-agent-map.md` | Which agents to dispatch per domain tag |
| `references/validation-checklists.md` | Per-domain validation criteria |
| `references/codebase-context-block.md` | Standard codebase context for subagent prompts |
| `references/inner-loop-reference.md` | 4-stage inner loop pattern definition |
