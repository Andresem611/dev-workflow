# MANIFEST Template

Use this template when creating a new MANIFEST in `dev-pipeline-backend:intake`.

```markdown
# MANIFEST — [Feature Name]

**Created:** [today's date]
**Last Updated:** [today's date]

---

## Feature Metadata

| Field | Value |
|-------|-------|
| **Name** | [Feature Name] |
| **Description** | [description from user] |
| **Tier** | KNOWN / COMBINATION / NOVEL |
| **Entry Mode** | idea / spec / handover / bug |
| **Domains** | [comma-separated: auth, database, payments, students, real-time, external-api, performance, api-design, background-jobs] |
| **Current Phase** | INTAKE |
| **Status** | in-progress |
| **Feature Path** | `docs/[feature-slug]/` |

---

## Phase Progress

| Phase | Status | Started | Completed | Gate Result |
|-------|--------|---------|-----------|-------------|
| INTAKE | in-progress | [now] | - | - |
| DISCOVER | not-started | - | - | - |
| PLAN | not-started | - | - | - |
| DOCUMENT | not-started | - | - | - |
| BUILD | not-started | - | - | - |
| VALIDATE | not-started | - | - | - |
| HANDOVER | not-started | - | - | - |
| SHIP | not-started | - | - | - |

---

## Decision Log

Locked during PLAN phase. Each decision records WHY, not just WHAT.

| # | Decision | Choice | Rationale | Alternatives Rejected |
|---|----------|--------|-----------|----------------------|
| D01 | [What was decided] | [Chosen approach] | [Why — cite agent evidence with file:line] | [Other options and why they lost] |

---

## Wave Groupings

[Populated during PLAN — waves with task assignments and dependencies]

---

## Acceptance Criteria

[Populated during PLAN — custom criteria for BUILD, VALIDATE, HANDOVER phases]

---

## Artifact Paths

| Artifact | Path | Status |
|----------|------|--------|
| MANIFEST | `docs/[feature-slug]/.dev/MANIFEST.md` | created |

---

## Pause Context

_Populated only when status is "paused". Clear this section on resume._

| Field | Value |
|-------|-------|
| **Pause Reason** | user-choice / error-escalation / session-limit |
| **Paused At Phase** | [phase name] |
| **Paused At Task** | [task ID if in BUILD, otherwise n/a] |
| **Paused Date** | [date] |

### What Was Done
- [Completed item 1]

### What Remains
- [Remaining item 1]

### Blockers
- [Blocker description, or "None"]

### Resume Instructions
1. Read this MANIFEST to restore full pipeline context
2. Read the latest transition file in prompt-transitions/
3. Read CURRENT_STATUS.md for session-level state
4. Continue from [exact point]
```
