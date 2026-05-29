---
name: dev
description: Builds frontend features end-to-end — from idea through ship. Routes all multi-step frontend work through a linear phase chain (INTAKE through SHIP) and resumes paused pipelines. Triggers on "build this feature", "implement", "new page", "add X to Y", or any multi-step frontend work. Also triggers on "/dev" or when resuming a paused feature pipeline.
---

# /dev — Frontend Development Pipeline v4.0

Unified pipeline that routes all frontend feature work through a linear phase chain: INTAKE through SHIP. Single entry point replaces manual skill-hopping between brainstorming, feature-orchestrator, writing-plans, subagent-driven-development, verify, and publish.

**v4.0 changes:** DESIGN before PLAN, Decision Ledger, 4-Zone Discuss, backend gate in DESIGN Review, structured bridges with echo-back, mode-driven adaptive depth.

## When to Use

- Building any new frontend feature
- User says "build", "implement", "add", "create" for a frontend feature
- Resuming a paused feature (`/dev` with existing MANIFEST)
- Receiving a backend handoff, design handoff, or tech spec
- Bug/issue that needs structured investigation and fix

**Do NOT use for:**
- Pure strategy/business discussions (use `thoven-boardroom`)
- Non-code tasks (emails, Notion, research)
- Quick one-line fixes that need no pipeline
- Tasks another skill handles entirely (e.g., pure SEO content via `seo-resource-page`)

---

## Sub-Command Chain

Each phase is a plugin skill invoked via colon notation:

```
/dev              → This file. Routes to correct phase or resumes.
/dev intake       → Skill(dev-pipeline-frontend:intake)    — Classify, scope, create MANIFEST + Decision Ledger
/dev discover     → Skill(dev-pipeline-frontend:discover)  — 4-Zone Discuss + codebase research + reuse audit
/dev persona      → Skill(dev-pipeline-frontend:persona)   — Frontend + Product + Backend (opt-in) personas grill the user (sub-phase between DISCOVER and DESIGN)
/dev design       → Skill(dev-pipeline-frontend:design)    — UI spec + design system compliance + backend gate (ALWAYS RUNS)
/dev plan         → Skill(dev-pipeline-frontend:plan)      — Architecture decisions + task breakdown (informed by DESIGN)
/dev document     → Skill(dev-pipeline-frontend:document)  — 5-layer docs + wave execution plans
/dev build        → Skill(dev-pipeline-frontend:build)     — Wave-based task execution + agent dispatch
/dev validate     → Skill(dev-pipeline-frontend:validate)  — Type-check, lint, QA, domain audits
/dev ship         → Skill(dev-pipeline-frontend:ship)      — Changelog + commit + deployment reminder
/dev pause        → Skill(dev-pipeline-frontend:pause)     — Explicit pause with handoff context
```

Each phase skill contains its own complete logic. This file is the router only.

**Phase invocation:** When routing to a phase, use the Skill tool:
```
Skill(dev-pipeline-frontend:intake)     # Plugin colon notation
```

---

## Phase Chain

```
INTAKE → DISCOVER → PERSONA → DESIGN → [BACKEND GATE] → PLAN → DOCUMENT → BUILD → VALIDATE → SHIP
                                                                                                ↑
                                                                                          PAUSE (any point)
```

**v5.0 sub-phase:** PERSONA runs between DISCOVER Zone 4 close and DESIGN entry. Three personas (Frontend Designer, Product, Backend opt-in for `Cross-Stack: backend`) grill the user one question at a time. Persona answers feed MANIFEST and Decision Ledger; DESIGN reads them on entry.

**v4.0 ordering:** DESIGN runs before PLAN so architecture decisions are informed by the actual UI spec. The backend gate in DESIGN Review checks for unmet backend data needs and produces a requirements-only feature brief if needed (the backend designs the contract — the FE never authors it).

**Every phase runs the inner loop:** GROUND → Discuss → Architect → Execute → Review

**GROUND** (Stage 0, v3.0.0): Dispatch an Explore agent to scan the codebase before Discuss. Grounds questions in reality instead of memory. Mandatory for DISCOVER, DESIGN, PLAN, BUILD. Optional for other phases.

**DECISION LEDGER** (v4.0.0): User decisions are LOCKED by default, agent decisions are OPEN. The ledger lives in MANIFEST and propagates through every bridge. See `references/decision-ledger-template.md`.

**4-ZONE DISCUSS** (v4.0.0): DISCOVER Discuss uses 4 structured zones (WHY, WHO, WHAT, HOW) instead of flat question lists. Other phases use adapted versions. See `references/discuss-zones-reference.md`.

**STRUCTURED BRIDGES** (v4.0.0): Every `review-*.md` uses a structured format with LOCKED decisions, key artifacts, focus for next phase, and dispatch mandate. Next phase must echo-back LOCKED items. See `references/bridge-template.md`.

**MODE-DRIVEN DEPTH** (v4.0.0): Execution mode (Expansion/Hold/Reduction) is set in DISCOVER Zone 4 and controls depth of all downstream phases. See `references/mode-propagation-reference.md`.

**MANDATORY CONTEXT LOADING**: Every Discuss stage begins with explicit `Read()` calls on context bridges, domain-agent-map, and reference files, followed by echo-back of LOCKED decisions.
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
| **Tech spec** | PRD, spec doc, detailed requirements | INTAKE → DESIGN (skip DISCOVER) |
| **Backend handoff** | "Backend is ready", API endpoints exist | INTAKE → DESIGN or PLAN |
| **Design handoff** | Figma link, mockups, visual spec | INTAKE → DESIGN |
| **Bug/issue** | "broken", "error", "bug", "fix" | INTAKE → BUILD (investigate logic) |
| **Resume** | Existing MANIFEST found | MANIFEST's current phase |

**Default:** If unclear, start at INTAKE and let classification decide.

---

## Domain Tags

Set during INTAKE. Drive agent dispatch and conditional validation in BUILD and VALIDATE.

| Domain | Signals | Triggers |
|--------|---------|----------|
| `routing` | New pages, URL patterns, guards | Route testing |
| `state` | Context, Redux, stores | State flow verification |
| `forms` | Validation, multi-step, file upload | Form edge case testing |
| `animation` | Motion, transitions, springs | Visual review |
| `a11y` | Interactive elements, modals, focus | Full a11y audit |
| `responsive` | Layout changes, breakpoints | Mobile audit |
| `api-integration` | New API calls, data fetching | API contract verification |
| `auth-ui` | Login, protected routes, role guards | Auth boundary testing |
| `design-system` | New components, tokens, patterns | Design system compliance |
| `performance` | Heavy components, images, lists | Lighthouse, bundle size |
| `seo` | Marketing pages, metadata | SEO audit |
| `analytics` | Track events, identify calls | Analytics event verification |

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
   |-- Skill(dev-pipeline-frontend:<phase>)
   |-- Read MANIFEST
   |-- Read review-*.md from previous phase for context bridge
   |-- If review-*.md missing:
   |     validate-stage-entry <current_phase> discuss <feature-dir> --plugin frontend
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
4. **Backend-contract check (if awaiting one).** If DESIGN chose parallel-with-mocks and the shared decision ledger has no `CONTRACT-LANDED` marker yet: read the BE artifacts (`<BE-feature>/.dev/be-contract-decisions.md` + its `CONTRACT-LANDED` marker) via the allow-listed cross-repo read. If landed, **transcribe** the BE rows into the canonical ledger (flip any superseded FE rows to SUPERSEDED), run `ledger-validate docs/[feature] --plugin frontend`, then swap local provisional mocks → the landed contract before continuing. If not landed, keep building against mocks. (Writes stay worktree-local: the FE writes its own ledger; it never writes the BE repo.)
5. Present summary to user: "Resuming [feature] at [phase]. Last completed: [phase]."
6. Load the current phase sub-file and continue

---

## Phase Prerequisites

Each phase validates that its predecessors completed before executing.

| Phase | Requires |
|-------|----------|
| INTAKE | Nothing |
| DISCOVER | MANIFEST exists |
| PERSONA | DISCOVER completed; persona answers captured to MANIFEST `## Frontend Persona Answers` AND `## Product Persona Answers` AND (if Cross-Stack: backend) `## Backend Persona Answers` |
| DESIGN | PERSONA completed (or skipped per entry mode). ALWAYS RUNS — not conditional on domain tags |
| PLAN | DESIGN completed (architecture informed by actual design spec) |
| DOCUMENT | PLAN completed |
| BUILD | DOCUMENT completed |
| VALIDATE | BUILD completed (all waves) AND `verify-decision-coverage <feature> --plugin frontend` returns JSON `res.valid===true` AND `verify-requirements-coverage <feature> --plugin frontend` returns JSON `res.valid===true` AND loop `verify-must-haves --wave N` for each completed wave 1..final, gate on JSON `res.valid===true` for every iteration |
| SHIP | VALIDATE passed |
| PAUSE | Any phase in progress |

If prerequisites are not met, warn the user and suggest the correct phase.

### Phase Boundary Aggregation

Before any phase advances, the orchestrator runs the boundary check for that transition. Each `verify-*` command exits with process code 0 by design (see `output()` helper); the gate's binary-ness lives in the parsed JSON. Orchestrator must read stdout, `JSON.parse(stdout)`, and gate on `res.valid`.

| From → To | Mechanical checks (gate on JSON `res.valid===true`) |
|-----------|------------------------------------------------------|
| INTAKE → DISCOVER | `validate-manifest` (existing) |
| DISCOVER → PERSONA | (no mechanical gate; PERSONA is question-driven) |
| PERSONA → DESIGN | persona-bridge written; MANIFEST has 3 (or 2 non-CrossStack) Persona Answers sections populated |
| PLAN → DOCUMENT | `verify-decision-coverage` |
| DOCUMENT → BUILD | `verify-decision-coverage` AND `verify-requirements-coverage` |
| BUILD wave N → wave N+1 | `verify-must-haves --wave N` |
| BUILD (final wave) → VALIDATE | `verify-decision-coverage` AND `verify-requirements-coverage` AND loop `verify-must-haves --wave N` for each completed wave 1..final, gate on JSON `res.valid===true` for every iteration |
| VALIDATE → SHIP | (per validate skill) |

A failed mechanical check (`res.valid===false` in any of the JSON outputs above) **blocks** the transition. The user can override only by editing the underlying artifact and re-running the check (no `--skip` flag).

**Auto-rerun (Δ12):** the orchestrator runs `verify-requirements-coverage --scope phase` unconditionally at every phase-exit hook before writing the context bridge. There is no caching, no `--refresh` flag, no `Last Verified Against` column. The run is always fresh; runtime is <200ms on a 50-requirement feature (Wave 0 spike Q3 sign-off).

---

## Artifact Paths

All feature artifacts live under a nested phase-based structure:

```
docs/[Feature_Name]/.dev/
├── MANIFEST.md
├── intake/
│   ├── discuss-classification.md
│   ├── architect-manifest-plan.md
│   ├── execute-manifest-created.md
│   └── review-classification-confirmed.md
├── discover/
│   ├── discuss-ui-requirements.md
│   ├── architect-exploration-plan.md
│   ├── execute-design-doc.md
│   └── review-design-approval.md
├── design/                                    ← v4.0: DESIGN before PLAN
│   ├── discuss-visual-direction.md
│   ├── architect-design-plan.md
│   ├── execute-design-spec.md
│   ├── backend-feature-brief.md               ← produced if backend data needs are unmet (requirements-only)
│   └── review-design-compliance.md
├── plan/
│   ├── discuss-architecture-direction.md
│   ├── architect-decision-framework.md
│   ├── execute-locked-decisions.md
│   └── review-plan-approval.md
├── document/
│   └── ...
├── build/
│   ├── wave-01/
│   │   ├── discuss-implementation-path.md
│   │   ├── architect-subagent-prompts.md
│   │   ├── execute-build-results.md
│   │   └── review-code-quality.md
│   └── wave-NN/
│       └── ...
├── validate/
│   └── ...
└── ship/
    └── ...
```

Each phase gets its own subdirectory. `review-*.md` in each phase directory serves as the context bridge to the next phase. There is NO separate `prompt-transitions/` directory.

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
| Ignoring domain tags | Missing validation checks (e.g., no a11y audit on modal feature) | Set domains during INTAKE, they drive VALIDATE |
| Manual skill-hopping mid-pipeline | Context lost between skills, MANIFEST not updated | Stay in /dev pipeline; it orchestrates internally |
| Not reading MANIFEST on resume | Repeats completed work, loses decisions | Always read MANIFEST first on `/dev` |
| Using `prompt-transitions/` directory | v1.x pattern — no longer exists | `review-*.md` in each phase directory IS the context bridge |
| Skipping Discuss stage | Requirements unclear, subagent prompts are vague | Every phase MUST run Discuss with `AskUserQuestion` |
| Executing inline in Execute | Orchestrator does work instead of dispatching | MUST dispatch subagents — orchestrator never executes inline |
| Auto-looping in Review | User loses control of iteration direction | User decides path: Accept / Retry / Back to Architect / Back to Discuss |
| Making DESIGN conditional | UI spec skipped, design debt accumulates | DESIGN always runs regardless of domain tags |
| Routing PLAN before DESIGN | Architecture decisions blind to actual UI | v4.0: DESIGN runs before PLAN — design informs architecture |
| Ignoring LOCKED decisions | User scope overridden by agents | Decision Ledger: user decisions = LOCKED, agents cannot remove without Review flag |
| Skipping echo-back on phase start | Context bridge not loaded, phase starts blind | Every Discuss must echo-back LOCKED items before asking questions |
| Skipping backend gate in DESIGN Review | Missing endpoints not caught until BUILD | DESIGN Review always checks Backend Requirements |
| Not reading `review-*.md` on resume | Context bridge lost, next phase starts blind | Always read previous phase's `review-*.md` before starting |
| Auto-invoking next phase after Review | Context rot, no fresh window | Review displays `Next Up` block and STOP. Never invoke next phase. |
| Offering "continue in same session" | Defeats session boundary purpose | Never offer. Every Review acceptance is a hard stop. |
| Using production backend URL | Data inconsistency, affects live users | Always verify `NEXT_PUBLIC_API_BASE_URL` points to dev |
| Creating feature branches | Project uses main-only workflow | Commit directly to `main`. No branches. |
| Running /dev with multiple MANIFESTs and no picker | Auto-resuming first found feature silently | Always show picker when 2+ active MANIFESTs |

---

## Tool Integration

Call these at the specified points. Tool location: `${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js`

| When | Command |
|------|---------|
| Before entering any stage | `validate-stage-entry <phase> <stage> <feature-dir> --plugin frontend` |
| After completing any stage | `validate-stage-output <phase> <stage> <feature-dir> --plugin frontend` |
| Before session breaks | `checkpoint-state <feature-dir> --scope wave\|phase --plugin frontend` |
| After MANIFEST changes | `validate-manifest <feature-dir> --plugin frontend` |

---

## Reference Files

| File | Content |
|------|---------|
| `references/manifest-template.md` | MANIFEST structure and field definitions |
| `references/domain-agent-map.md` | Which agents to dispatch per domain tag |
| `references/validation-checklists.md` | Per-domain validation criteria |
| `references/codebase-context-block.md` | Standard codebase context for subagent prompts |
| `references/inner-loop-reference.md` | 4-stage inner loop pattern definition |
| `references/agent-prompt-template.md` | Standard template for ALL subagent prompts — D04 fallback when /prompt-generator unavailable |
| `references/requirements-template.md` | Requirement ID format and must_haves structure |
| `references/decision-ledger-template.md` | Decision Ledger format, LOCKED/OPEN rules, violation detection (v4.0) |
| `references/bridge-template.md` | Structured bridge format with echo-back protocol (v4.0) |
| `references/backend-feature-brief-template.md` | Requirements-only feature-brief format for frontend→backend handoff (no shapes; backend owns the contract) |
| `references/discuss-zones-reference.md` | 4-Zone Discuss spec with techniques and exit conditions (v4.0) |
| `references/mode-propagation-reference.md` | Expansion/Hold/Reduction depth matrix per phase (v4.0) |
