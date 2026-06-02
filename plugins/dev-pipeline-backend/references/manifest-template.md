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
| **Cross-Stack** | [none / frontend / backend — detected during INTAKE, confirmed in PLAN] |

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

| ID | Decision | Choice | WHY | Alternatives Rejected | Supersedes | Reason |
|----|----------|--------|-----|----------------------|------------|--------|

**Guard 1 + Guard 2 (v3.11 — lock-vs-lock reversal):** Before locking a new decision, check it against existing LOCKED decisions for contradiction.
- If it reverses an **`Agent:*`** locked decision → record the supersession and continue.
- If it reverses a **`User:*`** locked decision → emit a prominent `⚠ LOCK CONFLICT` banner naming BOTH IDs in the PLAN Review / handover output, then continue (WARN-and-continue, never silent). A USER lock can only be *unlocked* by the user saying "unlock <ID>".
- Either way, the overriding decision MUST name the superseded ID in the **`Supersedes`** column with a one-line **`Reason`**. A reversal with empty `Supersedes`/`Reason` is a ledger error. This makes reversals structurally visible instead of buried in the `WHY` prose.

## Artifacts
[Updated as phases complete]

| Artifact | Path | Created By |
|----------|------|------------|

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
