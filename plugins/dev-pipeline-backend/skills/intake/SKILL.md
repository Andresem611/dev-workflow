---
name: intake
description: Starts new backend features through the /dev pipeline. Handles classification, scoping, backend domain tagging, and MANIFEST creation using the 4-stage inner loop. Triggers on dev-pipeline-backend:intake or when /dev router detects no existing MANIFEST.
---

# dev-pipeline-backend:intake — Entry Phase (v2.0)

Classifies incoming work, tags backend domains, creates the MANIFEST, and routes to the correct starting phase. Uses the 4-stage inner loop: Discuss, Architect, Execute, Review.

---

## Resume Mode

If an existing MANIFEST is found at `docs/[feature]/.dev/MANIFEST.md`:
1. Read existing MANIFEST — do NOT create a new one
2. Check current phase and status
3. If paused, read `.dev/pause-handoff.md` for handoff context
4. Report state to user and route to the recorded phase

---

## Stage 1: Discuss — Classification Discussion

**Purpose:** Gather what/why/constraints from the user. Understand the feature, data model hints, service boundaries, API patterns, and early implementation preferences.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry intake discuss <feature-dir> --plugin backend
```

### Mechanics (per inner-loop-reference.md Section 2.1)

Use `AskUserQuestion` for EVERY question. One question at a time. NEVER batch multiple questions into a single prompt. No cap on questions — the user says "enough" or "move on" to proceed.

**WHAT questions** — The work itself:
- What are you building?
- Why? What problem does this solve?
- Any constraints (timeline, dependencies, tech preferences)?
- What models or tables does this touch?
- Are there existing services or patterns to follow?
- What API shape do you expect (endpoints, payloads)?
- Any third-party integrations involved?

**HOW meta-questions** — Execution strategy:
- "How deep should classification go?"
- "Want me to do a quick codebase scan first?"
- "Any domains you already know apply?"

**Optional research pre-step:** If the user opts in for a codebase scan, dispatch an Explore agent to search for similar features (models, services, routes), then resume questioning with findings.

### Artifact

`.dev/intake/discuss-classification.md` — Captures all Q&A, user preferences, meta-decisions.

### After Completion

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output intake discuss <feature-dir> --plugin backend
```

---

## Stage 2: Architect — MANIFEST Plan

**Purpose:** Plan the MANIFEST structure, identify domains to tag, determine entry mode, define the Execute subagent prompt.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry intake architect <feature-dir> --plugin backend
```

### Mechanics (per inner-loop-reference.md Section 2.2)

**MANDATORY:** Use `/prompt-generator` to craft the subagent prompt for MANIFEST creation.

Plan these elements:
- **Entry mode** detected (see Entry Mode Detection table below)
- **Domain tags** to assign (see Backend Domain Tag Table below)
- **MANIFEST fields** to populate: feature name, description, entry mode, domain tags, current phase, status, phase progress table
- **Success criteria** for Execute: MANIFEST file exists, all required fields populated, domain tags assigned, no tier field present

### Artifact

`.dev/intake/architect-manifest-plan.md` — MANIFEST structure plan, domain tags, entry mode, subagent prompt crafted via `/prompt-generator`.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output intake architect <feature-dir> --plugin backend
```

---

## Stage 3: Execute — Create MANIFEST

**Purpose:** Dispatch a subagent to create the MANIFEST with metadata, domains, empty phase table, and initial hints.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry intake execute <feature-dir> --plugin backend
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
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output intake execute <feature-dir> --plugin backend
```

---

## Stage 4: Review — Classification Confirmation

**Purpose:** Validate the MANIFEST, confirm domain tags, get user approval.

### Before Starting

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry intake review <feature-dir> --plugin backend
```

### Mechanics (per inner-loop-reference.md Section 2.4)

1. Check MANIFEST exists and has all required fields
2. Validate domain tags are reasonable for the described feature
3. Run validation:

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest <feature-dir> --plugin backend
```

4. Surface any gaps or issues via `AskUserQuestion`
5. Present classification summary to user:

```
## dev-pipeline-backend:intake — Classification Complete

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
> Next Up

Phase: [NEXT PHASE] — [one-line description]

`dev-pipeline-backend:[next-phase]`

/clear first -> fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke the next phase.

### Artifact

`.dev/intake/review-classification-confirmed.md` — User confirmation, final domain tags, routing decision, bridge context for next phase.

This artifact IS the context bridge. The next phase reads it to understand classification decisions.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output intake review <feature-dir> --plugin backend
```

---

## Backend Domain Tag Table

| Domain | Signals |
|--------|---------|
| `models` | New tables, column changes, associations |
| `migrations` | Schema changes, data migrations |
| `controllers` | New endpoints, route changes |
| `services` | Business logic, service objects |
| `auth` | Authentication, authorization, COPPA |
| `payments` | Stripe integration, billing |
| `background-jobs` | Solid Queue jobs, scheduled tasks |
| `mailers` | SendGrid, email templates |
| `api-design` | API contracts, versioning |
| `performance` | N+1 queries, caching, indexing |
| `security` | Input validation, rate limiting |

---

## Entry Mode Detection

| Mode | Signal | Routes To |
|------|--------|-----------|
| **Idea dump** | Rough idea, exploratory language | DISCOVER |
| **Tech spec** | PRD, spec doc, detailed requirements | PLAN (skip DISCOVER) |
| **Frontend handoff** | "Frontend needs this API", endpoint requests | PLAN |
| **Bug/issue** | "broken", "error", stack traces | BUILD (investigate) |
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
| Auto-invoking next phase after Review | Display `Next Up` block and STOP |
| Creating `prompt-transitions/` directory | v1.x pattern removed — `review-*.md` IS the context bridge |
| Skipping codebase scan when user opts in | Dispatch Explore agent if user says yes during Discuss (D09) |
| Missing data model context in Discuss | Ask about models, tables, and service boundaries early |

---

## Quick Reference

```
Discuss: AskUserQuestion (WHAT + HOW meta) -> discuss-classification.md
Architect: /prompt-generator -> architect-manifest-plan.md
Execute: Subagent creates MANIFEST -> execute-manifest-created.md
Review: validate-manifest + user confirms -> review-classification-confirmed.md

Entry Mode -> Target Phase:
  Idea dump        -> DISCOVER
  Tech spec        -> PLAN
  Frontend handoff -> PLAN
  Bug/issue        -> BUILD (investigate)
  Resume           -> MANIFEST current phase

MANIFEST: docs/[Feature_Name]/.dev/MANIFEST.md
Template: references/manifest-template.md
No tiers. No prompt-transitions/. review-*.md = context bridge.
```
