---
name: dev
description: Use when building frontend features end-to-end — from idea through ship. Triggers on "build this feature", "implement", "new page", "add X to Y", or any multi-step frontend work. Also triggers on "/dev" or when resuming a paused feature pipeline.
---

# /dev — Frontend Development Pipeline

Unified pipeline that routes all frontend feature work through a linear phase chain: INTAKE through SHIP. Single entry point replaces manual skill-hopping between brainstorming, feature-orchestrator, writing-plans, subagent-driven-development, verify, and publish.

## When to Use

- Building any new frontend feature (simple or complex)
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
/dev intake       → Skill(dev-pipeline-frontend:intake)    — Classify, scope, create MANIFEST
/dev discover     → Skill(dev-pipeline-frontend:discover)  — Brainstorm + codebase research + reuse audit
/dev plan         → Skill(dev-pipeline-frontend:plan)      — Architecture decisions + task breakdown
/dev design       → Skill(dev-pipeline-frontend:design)    — UI spec + design system compliance (CONDITIONAL)
/dev document     → Skill(dev-pipeline-frontend:document)  — 5-layer docs + wave execution plans
/dev build        → Skill(dev-pipeline-frontend:build)     — Tier-driven task execution + auto-escalation
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

## Phase Chain and Gates

```
INTAKE → DISCOVER → PLAN → DESIGN → DOCUMENT → BUILD → VALIDATE → SHIP
  G0       G1        G2      G3       G4        G5       G6        G7
                                                                    ↑
                                                              PAUSE (any point)
```

**Every phase follows the inner loop:** RESEARCH → EXECUTE → DOCUMENT → GATE

**Every gate offers:** Approve / Revise / Pause

| Gate | After | Mandatory? |
|------|-------|------------|
| G0 | INTAKE | Auto for KNOWN tier, mandatory for COMBINATION/NOVEL |
| G1 | DISCOVER | Always |
| G2 | PLAN | Always |
| G3 | DESIGN | Only if design domains present, skip otherwise |
| G4 | DOCUMENT | Auto for KNOWN, mandatory for COMBINATION/NOVEL |
| G5 | BUILD (per wave) | Auto for KNOWN, mandatory for COMBINATION/NOVEL |
| G6 | VALIDATE | Always |
| G7 | SHIP | Always |

### Session Boundary Enforcement

**Every gate is a hard stop.** When a gate fires and the user approves, display a `▶ Next Up` block and STOP. No exceptions, no tier-based matrix, no "continue in same session" option.

**`▶ Next Up` block format (displayed inline after every gate approval):**

```
---
▶ Next Up

Phase: [NEXT PHASE] — [one-line description]

`dev-pipeline-frontend:[next-phase]`

/clear first → fresh context window
```

**Rules:**
- Every gate displays this block. Every tier. No exceptions.
- The agent does NOT invoke the next phase. The user runs `/clear` and invokes.
- State persists to disk (MANIFEST + transition files). Nothing is lost on `/clear`.
- `prompt-transitions/` files carry full structured context between phases.
- BUILD is the only phase with intra-session wave progression (see build.md for details).

---

## Entry Mode Routing

Determine entry mode from user input, then route to the correct starting phase.

| Mode | Signal | Starting Phase | Skip |
|------|--------|----------------|------|
| **Idea dump** | Rough idea, "I want...", "what if..." | INTAKE → DISCOVER | Nothing |
| **Tech spec** | PRD, spec doc, detailed requirements | INTAKE → PLAN | DISCOVER |
| **Backend handoff** | "Backend is ready", API endpoints exist | INTAKE → PLAN or DESIGN | DISCOVER |
| **Design handoff** | Figma link, mockups, visual spec | INTAKE → DESIGN | DISCOVER |
| **Bug/issue** | "broken", "error", "bug", "fix" | INTAKE → BUILD (investigate logic) | DISCOVER, PLAN, DESIGN, DOCUMENT |
| **Resume** | Existing MANIFEST found | MANIFEST's current phase | Completed phases |

**Default:** If unclear, start at INTAKE and let classification decide.

---

## Complexity Tiers

Set once during INTAKE. Drives depth of every subsequent phase.

| Tier | Signal | Example | Brainstorm Depth | Build Strategy |
|------|--------|---------|------------------|----------------|
| **KNOWN** | Pattern exists in codebase already | "Add another dashboard card" | Quick (2-3 Qs) | Sequential, solo |
| **COMBINATION** | Combines 2+ known patterns | "Booking wizard with calendar + teacher cards + payment" | Standard + boardroom | Wave-parallel subagents |
| **NOVEL** | No existing pattern to follow | "Real-time collaborative practice rooms" | Deep + full boardroom panel | Expert-reviewed waves |

**Tier determines:** brainstorm depth, gate strictness, build parallelism, validation rigor.
**Tier is based on NOVELTY, not time.** A large but repetitive task is KNOWN, not NOVEL.

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
1. Check for existing MANIFEST
   |-- Found + status != COMPLETE → RESUME (read MANIFEST, go to current phase)
   +-- Not found → NEW FEATURE
       |-- Classify entry mode from user input
       |-- Route to starting phase per Entry Mode table
       +-- First phase is always INTAKE (creates MANIFEST)

2. On phase invocation:
   |-- Use Skill(dev-pipeline-frontend:<phase>) to load and execute
   |-- Read MANIFEST
   |-- Read prompt-transition file from previous phase
   |   - If prompt-transition file missing:
   |     ```bash
   |     node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-entry [current_phase] docs/[feature] --plugin frontend
   |     ```
   |     - If FAIL: show issues to user, suggest re-running previous phase's TRANSITION
   |     - If PASS with warnings: proceed but warn user about missing context
   |     - Read MANIFEST + CURRENT_STATUS.md + design doc as fallback context
   |-- Validate prerequisites (previous phase completed or explicitly skipped)
   +-- On phase completion → gate fires → display ▶ Next Up → STOP
       (User runs /clear, invokes next phase skill directly)
```

### MANIFEST Location

```
docs/[Feature_Name]/.dev/MANIFEST.md
```

Search for existing MANIFESTs: `docs/**/.dev/MANIFEST.md`

### Resume Protocol

1. Read MANIFEST to find: current phase, tier, domains, last gate status
2. Read the latest transition file in `docs/[Feature_Name]/prompt-transitions/`
3. Present summary to user: "Resuming [feature] at [phase]. Last completed: [phase]. Tier: [tier]."
4. Load the current phase sub-file and continue

---

## Phase Prerequisites

Each phase validates that its predecessors completed before executing.

| Phase | Requires |
|-------|----------|
| INTAKE | Nothing (always valid) |
| DISCOVER | MANIFEST exists |
| PLAN | DISCOVER completed (or skipped per entry mode) |
| DESIGN | PLAN completed + design-relevant domain tags present |
| DOCUMENT | PLAN completed (DESIGN completed if it was required) |
| BUILD | DOCUMENT completed |
| VALIDATE | BUILD completed (all waves) |
| SHIP | VALIDATE passed |
| PAUSE | Any phase in progress |

If prerequisites are not met, warn the user and suggest the correct phase.

---

## Artifact Paths

All feature artifacts live under:

```
docs/[Feature_Name]/
|-- .dev/
|   |-- MANIFEST.md                    <- Pipeline state (tier, phase, domains)
|   +-- reports/                       <- Validation reports, judge scores
|-- prompt-transitions/                <- Phase boundary context bridges
|   |-- intake-to-discover.md
|   |-- discover-to-plan.md
|   +-- ...
|-- 00_MASTER_PLAN.md
|-- 01_IMPLEMENTATION_STATUS.md
|-- CURRENT_STATUS.md
|-- REUSE_AUDIT.md
|-- COMPONENT_ARCHITECTURE.md
|-- FRONTEND_INTEGRATION_GUIDE.md
+-- tasks/
    |-- TASK_01_xxx.md
    +-- ...
```

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
| Skipping INTAKE | No MANIFEST, no tier, no domains — all phases break | INTAKE is always the first phase for new features |
| Wrong tier assignment | KNOWN tier on NOVEL work = shallow planning, bad output | Tier is about NOVELTY not size. Ask if unsure. |
| Jumping to BUILD without DOCUMENT | No task files, no wave plans, unstructured execution | Validate prerequisites before each phase |
| Ignoring domain tags | Missing validation checks (e.g., no a11y audit on modal feature) | Set domains during INTAKE, they drive VALIDATE |
| Manual skill-hopping mid-pipeline | Context lost between skills, MANIFEST not updated | Stay in /dev pipeline; it orchestrates the absorbed skills internally |
| Not reading MANIFEST on resume | Repeats completed work, loses decisions | Always read MANIFEST first on `/dev` |
| Skipping gates | User never approves, bad decisions propagate | Every phase ends with a gate. Never auto-advance mandatory gates. |
| Running DESIGN when no design domains | Wastes time on unnecessary UI spec | DESIGN is conditional — check domain tags |
| Using production backend URL | Data inconsistency, affects live users | Always verify `NEXT_PUBLIC_API_BASE_URL` points to dev |
| Creating feature branches | Project uses main-only workflow | Commit directly to `main`. No branches. |
| Auto-invoking next phase after gate | Context rot, no fresh window | Gates display `▶ Next Up` block and STOP. Never invoke next phase. |
| Offering "continue in same session" | Defeats session boundary purpose | Never offer. Every gate is a hard stop. |

---

## Reference Files

| File | Content |
|------|---------|
| `references/manifest-template.md` | MANIFEST structure and field definitions |
| `references/domain-agent-map.md` | Which agents to dispatch per domain tag |
| `references/validation-checklists.md` | Per-domain validation criteria |
| `references/codebase-context-block.md` | Standard codebase context for subagent prompts |
