---
name: intake
description: Starts new features through the /dev pipeline. Handles initial classification, scoping, domain tagging, and MANIFEST creation using the 4-stage inner loop. Triggers on /dev:intake or when /dev router detects no existing MANIFEST.
---

# /dev:intake — Entry Phase (v2.0)

Classifies incoming work, tags domains, creates the MANIFEST, and routes to the correct starting phase. Uses the 4-stage inner loop: Discuss, Architect, Execute, Review.

---

## Resume Mode

If an existing MANIFEST is found at `docs/[feature]/.dev/MANIFEST.md`:
1. Read existing MANIFEST — do NOT create a new one
2. Check current phase and status
3. If paused, read `.dev/pause-handoff.md` for handoff context
4. Report state to user and route to the recorded phase

---

## Stage 1: Discuss — Classification Discussion

**Purpose:** Gather what/why/constraints from the user. Understand the feature, UI references, early implementation preferences.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry intake discuss <feature-dir> --plugin frontend
```

### Mechanics (per inner-loop-reference.md Section 2.1)

Use `AskUserQuestion` for EVERY question. One question at a time. NEVER batch multiple questions into a single prompt. No cap on questions — the user says "enough" or "move on" to proceed.

**WHAT questions** — The work itself:
- What are you building?
- Why? What problem does this solve?
- Any constraints (timeline, dependencies, tech preferences)?
- UI references or mockups?
- Existing patterns in the codebase to follow?

**HOW meta-questions** — Execution strategy:
- "How deep should classification go?"
- "Want me to do a quick codebase scan first?"
- "Any domains you already know apply?"

**Optional research pre-step:** If the user opts in for a codebase scan, dispatch an Explore agent to search for similar features, then resume questioning with findings.

### Artifact

`.dev/intake/discuss-classification.md` — Captures all Q&A, user preferences, meta-decisions.

### After Completion

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output intake discuss <feature-dir> --plugin frontend
```

---

## Stage 2: Architect — MANIFEST Plan

**Purpose:** Plan the MANIFEST structure, identify domains to tag, determine entry mode, define the Execute subagent prompt.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry intake architect <feature-dir> --plugin frontend
```

### Mechanics (per inner-loop-reference.md Section 2.2)

**MANDATORY:** Use `/prompt-generator` to craft the subagent prompt for MANIFEST creation.

Plan these elements:
- **Entry mode** detected (see Entry Mode Detection table below)
- **Domain tags** to assign (see Domain Tag Table below)
- **MANIFEST fields** to populate: feature name, description, entry mode, domain tags, current phase, status, phase progress table
- **Success criteria** for Execute: MANIFEST file exists, all required fields populated, domain tags assigned, no tier field present

### Artifact

`.dev/intake/architect-manifest-plan.md` — MANIFEST structure plan, domain tags, entry mode, subagent prompt crafted via `/prompt-generator`.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output intake architect <feature-dir> --plugin frontend
```

---

## Stage 3: Execute — Create MANIFEST

**Purpose:** Dispatch a subagent to create the MANIFEST with metadata, domains, empty phase table, and initial hints.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry intake execute <feature-dir> --plugin frontend
```

### Mechanics (per inner-loop-reference.md Section 2.3)

**MANDATORY:** Dispatch a subagent. The orchestrator NEVER creates the MANIFEST inline.

The subagent:
1. Creates `docs/[Feature_Name]/.dev/MANIFEST.md` using the template from `references/manifest-template.md`
2. Populates: feature name, description, entry mode, domain tags, current phase, status (`active`), empty phase progress table (INTAKE = in progress, rest = pending)
3. Creates the `.dev/intake/` directory structure
4. Does NOT include any tier field (tiers removed — D05)

### Artifact

`.dev/intake/execute-manifest-created.md` — Confirmation that MANIFEST was created, path to it, fields populated.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output intake execute <feature-dir> --plugin frontend
```

---

## Stage 4: Review — Classification Confirmation

**Purpose:** Validate the MANIFEST, confirm domain tags, get user approval.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry intake review <feature-dir> --plugin frontend
```

### Mechanics (per inner-loop-reference.md Section 2.4)

1. Check MANIFEST exists and has all required fields
2. Validate domain tags are reasonable for the described feature
3. Run validation:

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest <feature-dir> --plugin frontend
```

4. Surface any gaps or issues via `AskUserQuestion`
5. Present classification summary to user:

```
## /dev:intake — Classification Complete

**Feature:** [name]
**Domains:** [tag list with justifications]
**Entry Mode:** [mode] -> Routes to [phase]

Scope: [one-paragraph summary]

Options:
1. **Accept** — proceed to [target phase]
2. **Retry Execute** — re-dispatch subagent with adjustments
3. **Back to Architect** — redesign the MANIFEST plan
4. **Back to Discuss** — revisit requirements
```

**User decides.** No auto-accepting (D08).

### On Accept

1. Update MANIFEST phase progress: INTAKE = complete
2. Determine routing based on entry mode (see Entry Mode Detection table)
3. Display `Next Up` block and **STOP**:

```
---
▶ Next Up

Phase: [NEXT PHASE] — [one-line description]

`/dev:[next-phase]`

/clear first -> fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke the next phase.

### Artifact

`.dev/intake/review-classification-confirmed.md` — User confirmation, final domain tags, routing decision, bridge context for next phase.

This artifact IS the context bridge. The next phase reads it to understand classification decisions.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output intake review <feature-dir> --plugin frontend
```

---

## Domain Tag Table

| Domain | Signals |
|--------|---------|
| `routing` | New pages, URL patterns, route guards |
| `state` | New Context, Redux, complex stores |
| `forms` | Validation, multi-step forms, file uploads |
| `animation` | Motion, transitions, spring animations |
| `a11y` | Interactive elements, modals, focus management |
| `responsive` | Layout changes across breakpoints |
| `api-integration` | New API calls, data fetching patterns |
| `auth-ui` | Login flows, protected routes, role guards |
| `design-system` | New shared components, design tokens |
| `performance` | Heavy lists, images, lazy loading |
| `seo` | Marketing pages, metadata, structured data |
| `analytics` | Tracking events, identify calls |

---

## Entry Mode Detection

| Mode | Signal | Routes To |
|------|--------|-----------|
| **Idea dump** | Rough idea, exploratory language | DISCOVER |
| **Tech spec** | PRD, spec doc, detailed requirements | PLAN (skip DISCOVER) |
| **Backend handoff** | "Backend is ready", API docs attached | PLAN or DESIGN |
| **Design handoff** | Mockups, design files, visual references | DESIGN |
| **Bug/issue** | "broken", "error", stack traces | BUILD (investigate) |
| **Kiro spec** | `.kiro/specs/` dir present, EARS requirements pasted (WHEN…SHALL lines), or "Kiro spec ready" | PLAN (skip DISCOVER) |
| **CEK SDD spec** | `.specs/tasks/todo/` dir present, arc42 spec pasted, or "CEK spec ready" | PLAN (skip DISCOVER) |
| **Resume** | Existing MANIFEST found | Current phase from MANIFEST |

---

## Directory Structure Created

```
docs/[Feature_Name]/
└── .dev/
    ├── MANIFEST.md
    └── intake/
        ├── discuss-classification.md
        ├── architect-manifest-plan.md
        ├── execute-manifest-created.md
        └── review-classification-confirmed.md
```

No `prompt-transitions/` directory. The `review-classification-confirmed.md` serves as the context bridge to the next phase.

---

## Common Mistakes

| Mistake | Prevention |
|---------|------------|
| Batching questions in Discuss | One `AskUserQuestion` at a time (D02) |
| Creating MANIFEST inline in Execute | MUST dispatch subagent (D03) |
| Adding tier field to MANIFEST | Tiers removed (D05) |
| Skipping `/prompt-generator` in Architect | Mandatory for every Architect stage (D04) |
| Auto-accepting in Review | User decides — surface via `AskUserQuestion` (D08) |
| Making DESIGN conditional on domain tags | DESIGN always runs (D15) |
| Auto-invoking next phase after Review | Display `Next Up` block and STOP |
| Creating `prompt-transitions/` directory | v1.x pattern removed — `review-*.md` IS the context bridge |
| Skipping codebase scan when user opts in | Dispatch Explore agent if user says yes during Discuss (D09) |

---

## Quick Reference

```
Discuss: AskUserQuestion (WHAT + HOW meta) -> discuss-classification.md
Architect: /prompt-generator -> architect-manifest-plan.md
Execute: Subagent creates MANIFEST -> execute-manifest-created.md
Review: validate-manifest + user confirms -> review-classification-confirmed.md

Entry Mode -> Target Phase:
  Idea dump      -> DISCOVER
  Tech spec      -> PLAN
  Backend handoff -> PLAN or DESIGN
  Design handoff -> DESIGN
  Bug/issue      -> BUILD (investigate)
  Kiro spec      -> PLAN (skip DISCOVER; spec artifacts seed architecture + acceptance criteria)
  CEK SDD spec   -> PLAN (skip DISCOVER; arc42 spec seeds architecture + acceptance criteria)
  Resume         -> MANIFEST current phase

MANIFEST: docs/[Feature_Name]/.dev/MANIFEST.md
Template: references/manifest-template.md
No tiers. No prompt-transitions/. review-*.md = context bridge.
```
