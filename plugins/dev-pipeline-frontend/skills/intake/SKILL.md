---
name: intake
description: Use when starting any new feature, bug fix, or development task through the /dev pipeline. Handles initial classification, scoping, and MANIFEST creation. Triggers on /dev:intake or when /dev router detects no existing MANIFEST.
---

# /dev:intake — Entry Phase

Classifies incoming work, determines complexity tier and domain tags, creates the MANIFEST, and routes to the correct starting phase.

## Inner Loop: RESEARCH → EXECUTE → DOCUMENT → GATE

---

## RESEARCH — Parse Input & Scan Codebase

### 1. Parse User Input

Extract from the user's request:
- **What** they want built (feature name, description)
- **Why** (business goal, user story, problem statement)
- **Attachments** (spec docs, Figma links, backend API docs, error reports)
- **Constraints** mentioned (timeline, dependencies, tech preferences)

### 2. Detect Entry Mode

| Mode | Signal | Routes To |
|------|--------|-----------|
| **Idea dump** | Rough idea, no spec, exploratory language | DISCOVER |
| **Tech spec** | PRD, spec doc, detailed requirements provided | PLAN (skip DISCOVER) |
| **Backend handoff** | "Backend is ready", API docs attached, endpoint references | PLAN or DESIGN |
| **Figma/design handoff** | Mockups, design files, visual references provided | DESIGN |
| **Bug/issue** | "broken", "error", "not working", stack traces | BUILD (via investigate logic) |
| **Resume** | Existing MANIFEST found at `docs/[feature]/.dev/MANIFEST.md` | Current phase from MANIFEST |

### 3. Quick Codebase Scan

Search for existing patterns related to the feature (keep shallow — deeper research happens in DISCOVER):

```
Glob: **/*[relevant-keyword]*.{ts,tsx}
Grep: pattern related to feature domain
Check: docs/*/00_MASTER_PLAN.md for similar past features
```

If **Resume** mode: read `docs/[feature]/.dev/MANIFEST.md` and skip to routing.

---

## EXECUTE — Classify & Scope

### 1. Complexity Tier (by NOVELTY, not time)

| Tier | Signal | Example |
|------|--------|---------|
| **KNOWN** | Pattern already exists in codebase, can copy/adapt | "Add another dashboard card", "New CRUD page" |
| **COMBINATION** | Combines 2+ known patterns in a new way | "Booking wizard with calendar + teacher cards + payment" |
| **NOVEL** | No existing pattern, requires new architecture | "Real-time collaborative practice rooms" |

**Decision criteria:**
- Search codebase for similar implementations. Found near-identical? → KNOWN
- Found pieces but not assembled this way? → COMBINATION
- Nothing comparable exists? → NOVEL

### 2. Domain Tags (select all that apply)

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

### 3. Feature Scope Summary

Compose a one-paragraph scope statement:
- Feature name (kebab-case for folder: `booking-wizard`)
- What it does (1-2 sentences)
- Tier + justification
- Domain tags + justification
- Entry mode detected
- Target starting phase

---

## DOCUMENT — Create MANIFEST & Folder Structure

### 1. Create Folder Structure

```
docs/[Feature_Name]/
├── .dev/
│   ├── MANIFEST.md          ← Created now
│   └── reports/             ← Empty, used by later phases
└── prompt-transitions/      ← Empty, used by phase bridges
```

### 2. Create MANIFEST

Write `docs/[Feature_Name]/.dev/MANIFEST.md` using the template at `references/manifest-template.md`.

Populate these fields during INTAKE:
- Feature name, description, entry mode
- Complexity tier with justification
- Domain tags
- Current phase: the phase being routed to
- Status: `active`
- Phase progress table (INTAKE = complete, rest = pending)
- Decision log: empty (populated during PLAN)
- Artifact paths: MANIFEST path only (others added per phase)

### 2b. Generate Transition File

Write `prompt-transitions/intake-to-discover.md` (or intake-to-plan, intake-to-design, intake-to-build depending on entry mode routing). Include: feature name, tier, domains, entry mode, scope summary, and routing decision.

### 3. Resume Mode Handling

If resuming, do NOT create a new MANIFEST. Instead:
1. Read existing MANIFEST
2. Check current phase and status
3. Check for pause context (blockers, handoff notes)
4. Report state to user and route to the recorded phase

---

## GATE — G0 Approval

### Auto-Advance (KNOWN tier only)

INTAKE is the ONLY phase that can auto-advance. For KNOWN tier:
1. Present the scope summary to the user as an informational message
2. Immediately route to the target phase (usually DISCOVER or PLAN)
3. No approval required

### Mandatory Approval (COMBINATION / NOVEL)

Present to user:

```
## /dev:intake — Classification Complete

**Feature:** [name]
**Tier:** [KNOWN|COMBINATION|NOVEL] — [justification]
**Domains:** [tag list]
**Entry Mode:** [mode] → Routes to [phase]

Scope: [one-paragraph summary]

Options:
1. **Approve** — proceed to [target phase]
2. **Revise** — change tier, domains, or routing
3. **Pause** — save MANIFEST, stop here
```

Wait for explicit user choice before proceeding.

### Pre-Gate Verification

5. **Verify transition (MANDATORY):**

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-transition intake docs/[feature] --plugin frontend
```

If FAIL → Re-invoke prompt-generator with the listed missing fields.

6. **Verify MANIFEST (MANDATORY):**

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest docs/[feature] --plugin frontend
```

If FAIL → Update MANIFEST before ending session.

### Routing After Approval

| Entry Mode | Target Phase | Notes |
|------------|-------------|-------|
| Idea dump | DISCOVER | Full brainstorm cycle |
| Tech spec | PLAN | Requirements already defined |
| Backend handoff | PLAN or DESIGN | PLAN if architecture needed, DESIGN if UI-only |
| Figma/design handoff | DESIGN | Design artifacts provided |
| Bug/issue | BUILD | Enters via investigate logic |
| Resume | Recorded phase | From MANIFEST `current_phase` |

**G0 behavior:**
- **KNOWN tier:** Auto-advance — invoke next phase immediately (INTAKE is lightweight).
- **COMBINATION/NOVEL tier:** After user approves, display `▶ Next Up` block and STOP.

```
---
▶ Next Up

Phase: [NEXT PHASE] — [description]

`dev-pipeline-frontend:[next-phase]`

/clear first → fresh context window
```

**STOP.** Do not invoke next phase.

---

## Common Mistakes

| Mistake | Why It Fails | Prevention |
|---------|-------------|------------|
| Classifying by estimated time instead of novelty | Time varies by developer; novelty drives architecture risk | Ask: "Does this pattern exist in our codebase?" not "How long will this take?" |
| Skipping codebase scan | Misclassifies KNOWN as COMBINATION | Always search for similar implementations before classifying |
| Over-tagging domains | Triggers unnecessary validation audits in VALIDATE | Only tag domains with clear evidence from the request |
| Under-tagging domains | Skips needed audits (missed a11y, missed mobile) | Check each domain signal against the feature description |
| Creating MANIFEST for bug/issue entry | Bugs use investigate logic, not the full pipeline | If entry mode is bug/issue, route to BUILD with investigate — skip MANIFEST creation |
| Auto-advancing COMBINATION/NOVEL | User loses ability to correct misclassification | ONLY KNOWN tier auto-advances. All others require explicit approval |
| Not reading existing MANIFEST on resume | Creates duplicate, loses progress tracking | Always check `docs/*/.dev/MANIFEST.md` before creating new one |

---

## Quick Reference

```
INPUT → Detect entry mode → Codebase scan → Classify tier → Tag domains
  → Create MANIFEST → G0 gate → Route to target phase

Tier Decision:
  Pattern exists?     → KNOWN (auto-advance)
  Pieces exist?       → COMBINATION (approval required)
  Nothing comparable? → NOVEL (approval required)

MANIFEST location: docs/[Feature_Name]/.dev/MANIFEST.md
Template: references/manifest-template.md
```
