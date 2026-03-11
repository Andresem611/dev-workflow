# MANIFEST.md Template

Copy-paste this template when creating a new feature MANIFEST at `docs/[Feature_Name]/.dev/MANIFEST.md`.

---

```markdown
# MANIFEST — [Feature Name]

**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD

---

## Feature Metadata

| Field | Value |
|-------|-------|
| **Name** | [Feature Name] |
| **Description** | [One-line description] |
| **Tier** | KNOWN / COMBINATION / NOVEL |
| **Entry Mode** | idea-dump / tech-spec / backend-handoff / figma-handoff / bug-issue / resume |
| **Domains** | [comma-separated from: routing, state, forms, animation, a11y, responsive, api-integration, auth-ui, design-system, performance, seo, analytics] |
| **Current Phase** | INTAKE / DISCOVER / PLAN / DESIGN / DOCUMENT / BUILD / VALIDATE / SHIP / PAUSED / COMPLETE |
| **Status** | in-progress / paused / blocked / complete |
| **Feature Path** | `docs/[Feature_Name]/` |

---

## Phase Progress

| Phase | Status | Started | Completed | Gate Result |
|-------|--------|---------|-----------|-------------|
| INTAKE | not-started | - | - | - |
| DISCOVER | not-started | - | - | - |
| PLAN | not-started | - | - | - |
| DESIGN | not-started | - | - | - |
| DOCUMENT | not-started | - | - | - |
| BUILD | not-started | - | - | - |
| VALIDATE | not-started | - | - | - |
| SHIP | not-started | - | - | - |

**Status values:** not-started / in-progress / complete / skipped / n/a
**Gate Result values:** approved / revised / paused / pending / auto-approved

---

## Decision Log

Locked during PLAN phase. Each decision records WHY, not just WHAT.

| # | Decision | Choice | Rationale | Alternatives Rejected |
|---|----------|--------|-----------|----------------------|
| D1 | [What was decided] | [Chosen approach] | [Why this was best] | [Other options and why they lost] |
| D2 | | | | |
| D3 | | | | |

---

## Wave Groupings

Tasks organized into execution waves. Waves execute sequentially; tasks within a wave may run in parallel.

### Wave 1: [Wave Name — e.g., "Types & API Layer"]

| Task | File | Description | Parallel? | Subagent Assignment |
|------|------|-------------|-----------|-------------------|
| TASK_01 | tasks/TASK_01_xxx.md | [description] | yes/no | [agent or "orchestrator"] |
| TASK_02 | tasks/TASK_02_xxx.md | [description] | yes/no | [agent] |

### Wave 2: [Wave Name — e.g., "Core Components"]

| Task | File | Description | Parallel? | Subagent Assignment |
|------|------|-------------|-----------|-------------------|
| TASK_03 | tasks/TASK_03_xxx.md | [description] | yes/no | [agent] |

### Wave 3: [Wave Name — e.g., "Pages & Integration"]

| Task | File | Description | Parallel? | Subagent Assignment |
|------|------|-------------|-----------|-------------------|
| TASK_04 | tasks/TASK_04_xxx.md | [description] | yes/no | [agent] |

**Subagent assignment rules by tier:**
- **KNOWN:** All tasks assigned to orchestrator (sequential, solo execution)
- **COMBINATION:** Parallel tasks within a wave get separate subagents
- **NOVEL:** Parallel tasks get subagents + a reviewer subagent per wave

---

## Acceptance Criteria

### Standard Per-Phase Criteria

**INTAKE:**
- [ ] Tier correctly classified with justification
- [ ] All applicable domains identified
- [ ] Entry mode determined
- [ ] MANIFEST created

**DISCOVER:**
- [ ] Requirements confirmed with user
- [ ] Reuse audit complete
- [ ] Brainstorm at tier-appropriate depth
- [ ] (COMBINATION/NOVEL) Boardroom debate completed

**PLAN:**
- [ ] Architecture decisions documented with rationale
- [ ] Component hierarchy defined with file paths
- [ ] State management approach decided
- [ ] API contracts identified
- [ ] Task breakdown complete (30min-2.5hr per task)
- [ ] Wave groupings assigned
- [ ] Custom acceptance criteria defined for DESIGN/BUILD/VALIDATE
- [ ] Backend dependencies identified (PAUSE if endpoints missing)

**DESIGN (if applicable):**
- [ ] Deduplication check passed (no existing component serves this purpose)
- [ ] UI spec created via ui-designer agent
- [ ] Design system compliance verified (amber-500, font rules, 3D buttons)
- [ ] Thoven brand rules applied

**DOCUMENT:**
- [ ] 00_MASTER_PLAN.md written
- [ ] REUSE_AUDIT.md written
- [ ] COMPONENT_ARCHITECTURE.md written
- [ ] All TASK_XX.md files created
- [ ] 01_IMPLEMENTATION_STATUS.md initialized
- [ ] CURRENT_STATUS.md initialized
- [ ] FRONTEND_INTEGRATION_GUIDE.md stub created
- [ ] Wave execution plans generated

**BUILD:**
- [ ] All tasks in all waves completed
- [ ] Each task passes its acceptance criteria
- [ ] IMPLEMENTATION_STATUS updated after each task
- [ ] CURRENT_STATUS reflects actual state
- [ ] No unresolved 3-strike errors

**VALIDATE:**
- [ ] All always-run checks pass (type-check, lint, docs drift, stub-check, QA, prod data)
- [ ] Tier-driven checks pass (if COMBINATION/NOVEL)
- [ ] Domain-triggered checks pass (for each tagged domain)

**SHIP:**
- [ ] Type-check + lint clean
- [ ] CHANGELOG.md updated under [Unreleased]
- [ ] Commit created with proper format
- [ ] Deployment reminder displayed (Replit UI publish)

### Custom Criteria (defined during PLAN phase)

| Phase | Criterion | Met? |
|-------|-----------|------|
| DESIGN | [custom criterion] | [ ] |
| BUILD | [custom criterion] | [ ] |
| VALIDATE | [custom criterion] | [ ] |

---

## Artifact Paths

| Artifact | Path | Status |
|----------|------|--------|
| MANIFEST | `docs/[Feature_Name]/.dev/MANIFEST.md` | created |
| Master Plan | `docs/[Feature_Name]/00_MASTER_PLAN.md` | pending |
| Reuse Audit | `docs/[Feature_Name]/REUSE_AUDIT.md` | pending |
| Component Architecture | `docs/[Feature_Name]/COMPONENT_ARCHITECTURE.md` | pending |
| Implementation Status | `docs/[Feature_Name]/01_IMPLEMENTATION_STATUS.md` | pending |
| Current Status | `docs/[Feature_Name]/CURRENT_STATUS.md` | pending |
| Integration Guide | `docs/[Feature_Name]/FRONTEND_INTEGRATION_GUIDE.md` | pending |
| Task Files | `docs/[Feature_Name]/tasks/TASK_01..N.md` | pending |
| Transition: intake-discover | `docs/[Feature_Name]/prompt-transitions/intake-to-discover.md` | pending |
| Transition: discover-plan | `docs/[Feature_Name]/prompt-transitions/discover-to-plan.md` | pending |
| Transition: plan-design | `docs/[Feature_Name]/prompt-transitions/plan-to-design.md` | pending |
| Transition: design-document | `docs/[Feature_Name]/prompt-transitions/design-to-document.md` | pending |
| Transition: document-build | `docs/[Feature_Name]/prompt-transitions/document-to-build.md` | pending |
| Transition: build-validate | `docs/[Feature_Name]/prompt-transitions/build-to-validate.md` | pending |
| Transition: validate-ship | `docs/[Feature_Name]/prompt-transitions/validate-to-ship.md` | pending |
| Audit Report | `docs/[Feature_Name]/.dev/reports/audit_YYYY-MM-DD.md` | pending |

**Status values:** pending / created / updated / final

---

## Pause Context

_Populated only when status is "paused". Clear this section on resume._

| Field | Value |
|-------|-------|
| **Pause Reason** | user-choice / awaiting-backend / error-escalation / session-limit |
| **Paused At Phase** | [phase name] |
| **Paused At Task** | [task ID if in BUILD, otherwise n/a] |
| **Paused Date** | YYYY-MM-DD |

### What Was Done
- [Completed item 1]
- [Completed item 2]

### What Remains
- [Remaining item 1]
- [Remaining item 2]

### Blockers
- [Blocker description, or "None"]

### Resume Instructions
1. Read this MANIFEST to restore full pipeline context
2. Read the latest transition file in `docs/[Feature_Name]/prompt-transitions/`
3. Read CURRENT_STATUS.md for session-level state
4. [Phase-specific resume step]
5. Continue from [exact point — task ID, wave number, or phase step]

### Backend Handoff (populate if pause reason is "awaiting-backend")

| Field | Value |
|-------|-------|
| **API Contract Needed** | [endpoint path, HTTP method, request/response shape] |
| **Data Models** | [model names and relationships needed] |
| **Auth Requirements** | [Parent/Teacher or Student auth, role guards needed] |
| **Handoff Prompt File** | `docs/[Feature_Name]/.dev/backend-handoff.md` |
```
