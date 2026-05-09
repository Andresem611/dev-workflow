# MANIFEST Template (v2.0)

Use this template when creating a new MANIFEST in `dev-pipeline-frontend:intake`.

```markdown
# MANIFEST — [Feature Name]

## Metadata
| Field | Value |
|-------|-------|
| **Feature** | [Name] |
| **Description** | [Brief description] |
| **Created** | [YYYY-MM-DD] |
| **Entry Mode** | [idea dump / tech spec / backend handoff / design handoff / bug/issue] |
| **Domains** | [comma-separated: routing, state, forms, animation, a11y, responsive, api-integration, auth-ui, design-system, performance, seo, analytics] |
| **Cross-Stack** | [none / frontend / backend — detected during INTAKE, confirmed in PLAN] |

## Pipeline Status
| Field | Value |
|-------|-------|
| **Current Phase** | [INTAKE / DISCOVER / PLAN / DESIGN / DOCUMENT / BUILD / VALIDATE / SHIP] |
| **Current Stage** | [Discuss / Architect / Execute / Review] |
| **Status** | [in-progress / paused / complete] |
| **Current Wave** | [N/A or wave number if in BUILD] |

## Phase Progress

| # | Phase | Discuss | Architect | Execute | Review | Status |
|---|-------|---------|-----------|---------|--------|--------|
| 1 | INTAKE | — | — | — | — | not-started |
| 2 | DISCOVER | — | — | — | — | not-started |
| 3 | PLAN | — | — | — | — | not-started |
| 4 | DESIGN | — | — | — | — | not-started |
| 5 | DOCUMENT | — | — | — | — | not-started |
| 6 | BUILD | — | — | — | — | not-started |
| 7 | VALIDATE | — | — | — | — | not-started |
| 8 | SHIP | — | — | — | — | not-started |

Stage columns: ✅ (complete) / — (not started) / 🔄 (in progress)
Status: not-started / in-progress / complete / skipped

## Context Bridges
| Phase | Review Artifact |
|-------|----------------|
| INTAKE | `.dev/intake/review-classification-confirmed.md` |
| DISCOVER | `.dev/discover/review-design-approval.md` |
| PLAN | `.dev/plan/review-plan-approval.md` |
| DESIGN | `.dev/design/review-design-compliance.md` |
| DOCUMENT | `.dev/document/review-documentation-quality.md` |
| BUILD | `.dev/build/wave-NN/review-code-quality.md` |
| VALIDATE | `.dev/validate/review-ship-readiness.md` |
| SHIP | `.dev/ship/review-release-confirmation.md` |

## Decisions Log
[Populated during PLAN phase — locked decisions with WHY + alternatives rejected]

| ID | Decision | Choice | WHY | Alternatives Rejected |
|----|----------|--------|-----|----------------------|

## Artifacts
[Updated as phases complete]

| Artifact | Path | Created By |
|----------|------|------------|

## Dependencies (typed)

Populated during INTAKE Stage 4; updated during PLAN.

| Type | Name | Version | Source decision | Required by |
|------|------|---------|-----------------|-------------|
| npm  | @tldraw/sync | ^3.0.0 | U-17 | wave-01 collab-sync |
| service | calendar-webhook | n/a | U-23 | wave-04 reminders |
| env-var | TEACH_MODE_FLAG | bool | U-09 | wave-01 feature gate |

## Upstream Pipelines

When this feature was decomposed at DISCOVER (Stage 3.5), this section lists sister pipelines this one depends on. Empty for non-decomposed features.

| Pipeline name | Path | Required artifact | Status | Mock fallback |
|---------------|------|-------------------|--------|---------------|
| teach-mode-canvas-save | `docs/teach-mode-canvas-save/.dev/MANIFEST.md` | `src/lib/canvas-save.ts:saveSnapshot` | shipped | n/a |
| teach-mode-recording | `docs/teach-mode-recording/.dev/MANIFEST.md` | `src/components/RecordingControls.tsx` | in-progress | `src/lib/__mocks__/canvas-save.ts:saveSnapshot` |

**Status values:**
- `shipped` — upstream's SHIP phase completed; required artifact is real.
- `in-progress` — upstream still in DISCOVER/DESIGN/PLAN/BUILD/VALIDATE; this pipeline uses Mock fallback.
- `not-started` — upstream hasn't begun; Mock fallback required.

**Mock fallback values:**
- `n/a` — upstream is `shipped`, no mock needed.
- `<path>` — relative path to a mock implementation; SHIP gate refuses to advance until either upstream is `shipped` (and mock removed) or Mock fallback is genuinely a permanent stub (rare).

**SHIP gate (added in Wave 3 ship-side change):** every Upstream Pipelines row must have `Status=shipped` OR `Mock fallback != n/a`. If a row has `Status=in-progress` and `Mock fallback=n/a`, SHIP refuses to advance. Encoding: any pipeline that depends on an unshipped upstream MUST have a working mock; any pipeline whose upstream has shipped MUST have removed its mock.

## Frontend Persona Answers

[Populated during PERSONA sub-phase. Empty for features that haven't run PERSONA yet.]

**Q1 — <persona question>**
A: [user's answer verbatim]

**Q2 — <persona question>**
A: [user's answer verbatim]

[Q3-Q5 in Hold, Q3-Q8 in Expansion. Q+A pairs that surface decisions also appear in `## Decisions Log` with Source=PERSONA:Frontend.]

## Product Persona Answers

[Populated during PERSONA sub-phase.]

**Q1 — <persona question>**
A: [verbatim]

[Same shape as Frontend.]

## Backend Persona Answers

[Populated during PERSONA sub-phase ONLY if `Cross-Stack: backend` flag is set. Empty otherwise.]

**Q1 — <persona question>**
A: [verbatim]

[Same shape; question count per mode-propagation.]

## Notion Integration
- **Card ID:** [notion-page-uuid — populated by INTAKE after card creation]
- **Sprint:** [sprint-name — populated by INTAKE]
- **Created:** [ISO-date — populated by INTAKE]

## Pause Context
[Only present when status = paused]
- **Paused At:** [phase] / [stage]
- **Paused On:** [timestamp]
- **Resume From:** [phase]:[stage]
- **Blockers:** [if any]
- **Handoff:** `.dev/pause-handoff.md`
```
