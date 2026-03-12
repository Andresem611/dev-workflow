# MANIFEST Template (v2.0)

Use this template when creating a new MANIFEST in `dev-pipeline-backend:intake`.

```markdown
# MANIFEST — [Feature Name]

## Metadata
| Field | Value |
|-------|-------|
| **Feature** | [Name] |
| **Description** | [Brief description] |
| **Created** | [YYYY-MM-DD] |
| **Entry Mode** | [idea dump / tech spec / backend handoff / design handoff / bug/issue] |
| **Domains** | [comma-separated: auth, database, payments, students, real-time, external-api, performance, api-design, background-jobs] |

## Pipeline Status
| Field | Value |
|-------|-------|
| **Current Phase** | [INTAKE / DISCOVER / PLAN / DOCUMENT / BUILD / VALIDATE / SHIP] |
| **Current Stage** | [Discuss / Architect / Execute / Review] |
| **Status** | [in-progress / paused / complete] |
| **Current Wave** | [N/A or wave number if in BUILD] |

## Phase Progress

| # | Phase | Discuss | Architect | Execute | Review | Status |
|---|-------|---------|-----------|---------|--------|--------|
| 1 | INTAKE | — | — | — | — | not-started |
| 2 | DISCOVER | — | — | — | — | not-started |
| 3 | PLAN | — | — | — | — | not-started |
| 4 | DOCUMENT | — | — | — | — | not-started |
| 5 | BUILD | — | — | — | — | not-started |
| 6 | VALIDATE | — | — | — | — | not-started |
| 7 | SHIP | — | — | — | — | not-started |

Stage columns: ✅ (complete) / — (not started) / 🔄 (in progress)
Status: not-started / in-progress / complete / skipped

## Context Bridges
| Phase | Review Artifact |
|-------|----------------|
| INTAKE | `.dev/intake/review-classification-confirmed.md` |
| DISCOVER | `.dev/discover/review-design-approval.md` |
| PLAN | `.dev/plan/review-plan-approval.md` |
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

## Pause Context
[Only present when status = paused]
- **Paused At:** [phase] / [stage]
- **Paused On:** [timestamp]
- **Resume From:** [phase]:[stage]
- **Blockers:** [if any]
- **Handoff:** `.dev/pause-handoff.md`
```
