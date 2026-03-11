---
name: dev-document
description: Use when /dev pipeline reaches DOCUMENT phase. Writes 5-layer documentation and wave execution plans from PLAN phase outputs. Triggers after G2 approval or DESIGN completion.
---

# /dev:document — Documentation & Wave Planning

Write 5-layer feature documentation and generate wave-level execution plans. Absorbs feature-orchestrator Phase 4 and writing-plans execution plan generation.

## Inner Loop: RESEARCH > EXECUTE > DOCUMENT > GATE

---

## 1. RESEARCH

Read these files before writing anything:

```
docs/[Feature]/.dev/MANIFEST.md          → tier, domains, wave groupings, decision log
docs/[Feature]/prompt-transitions/        → plan-to-document.md OR design-to-document.md
```

Extract from MANIFEST:
- **Decision log** (locked decisions with WHY reasoning)
- **Wave groupings** (task-to-wave assignments from PLAN)
- **Task list** (ordered, with dependencies)
- **Tier** (drives documentation depth)
- **Reuse audit findings** (from DISCOVER)
- **Architecture decisions** (from PLAN)

If any of these are missing, STOP and return to the phase that should have produced them.

---

## 2. EXECUTE

### 2A. Write 5-Layer Documentation

All files go to `docs/[Feature_Name]/`. Every file includes:
```
**Procedure:** Follow `FRONTEND_STANDARD_FEATURE_DEVELOPMENT_PROCEDURE.md`
```

#### Layer 1: 00_MASTER_PLAN.md
Sections: business requirements, architecture overview (from PLAN decisions), reuse summary (from DISCOVER), design system compliance, task list, success criteria.

Include the decision log table:
```markdown
| Decision | Choice | Rationale | Alternatives Considered |
|----------|--------|-----------|------------------------|
```

#### Layer 2: REUSE_AUDIT.md
Populated from DISCOVER findings. Tables: Can Reuse As-Is, Can Extend, Similar But Not Suitable, New Code Required (with justification).

#### Layer 3: COMPONENT_ARCHITECTURE.md
Component tree with exact file paths, props interfaces (TypeScript), state flow (Context/Redux/local), data flow diagram (API > hook > component > UI).

Skip for KNOWN tier single-component features.

#### Layer 4: Task Files (tasks/TASK_01..N.md)

Each task file contains:
```markdown
# Task XX: [Name]
**Duration:** [30min-2.5hr]
**Wave:** [N]
**Dependencies:** [Task IDs]
**Decision Context:** [WHY from decision log that drives this task]

**Files:**
- Create: `exact/path/file.tsx`
- Modify: `exact/path/existing.tsx` (lines ~XX-YY)
- Test: `__tests__/exact/path/test.tsx`
- Reuse: `components/ui/existing.tsx` (from REUSE_AUDIT)

**Acceptance Criteria:**
- [ ] [Specific, testable]
- [ ] TypeScript strict passes
- [ ] Component < 300 lines

**Steps (TDD):**
1. Write failing test → 2. Verify failure → 3. Implement → 4. Verify pass → 5. Commit
```

**Decision log embedding rule:** Every task MUST reference the specific decision(s) from the PLAN decision log that drive it. This is the "Decision Context" field. If a task has no decision context, it lacks justification.

#### Layer 5: Tracking Files

**01_IMPLEMENTATION_STATUS.md** — All tasks "Not Started" with estimated durations and wave assignments.

**CURRENT_STATUS.md** — Phase: Documentation Complete, Blockers: None, Next Steps: Wave 1 execution.

**FRONTEND_INTEGRATION_GUIDE.md** — Stub with section headers: Quick Start, Feature Flag, API Module, Types, Components, Error Handling, Testing, Architecture Notes.

### 2B. Task Sizing Rules

| Rule | Action |
|------|--------|
| Task > 2.5hr | Split into subtasks |
| Task < 20min | Combine with adjacent task |
| Target sweet spot | 30min - 2.5hr |
| Every task | Exact file paths (create, modify, test, reuse) |
| Every task | TDD steps where applicable |
| Dependencies | Map via wave ordering (Types > Components > Pages > Tests > Polish) |

Category guidelines:
- UI Component: 30min-2hr
- Container/Page: 1-2.5hr
- Custom Hook: 15min-1hr (combine if <20min)
- API Integration: 30min-1.5hr
- State Management: 30min-1.5hr
- Testing: 1-2hr

### 2C. Generate Wave-Level Execution Plans

Group tasks into waves based on PLAN phase wave groupings. Each wave plan follows this format:

```markdown
## Wave [N]: [Name]
**Tasks:** TASK_01, TASK_02, TASK_03
**Strategy:** [sequential | parallel-subagents | expert-reviewed]
**Estimated Duration:** [total hours]

### Subagent Assignments
| Task | Agent Type | Model | Key Instruction |
|------|-----------|-------|-----------------|
| TASK_01 | frontend-developer | sonnet | [specific directive] |
| TASK_02 | frontend-developer | sonnet | [specific directive] |

### Completion Criteria
- [ ] All task acceptance criteria met
- [ ] Type-check passes: `npm run type-check`
- [ ] Lint passes: `npm run lint`
- [ ] No regressions in existing tests
- [ ] IMPLEMENTATION_STATUS.md updated

### Decision Context for This Wave
[Relevant decision log entries that inform this wave's approach]

### Wave Dependencies
- **Requires:** [Previous wave(s) or "None"]
- **Unlocks:** [Next wave(s)]
```

**Strategy by tier:**
- KNOWN: All waves sequential, solo execution
- COMBINATION: Parallel subagents within waves
- NOVEL: Expert-reviewed (subagents + reviewer per wave)

**Wave plan location:** `docs/[Feature]/waves/WAVE_01.md` through `WAVE_N.md`

---

## 3. DOCUMENT

Update MANIFEST with:
```yaml
phase: DOCUMENT
status: complete
artifacts:
  master_plan: docs/[Feature]/00_MASTER_PLAN.md
  reuse_audit: docs/[Feature]/REUSE_AUDIT.md
  component_arch: docs/[Feature]/COMPONENT_ARCHITECTURE.md
  tasks: docs/[Feature]/tasks/  # [N] task files
  waves: docs/[Feature]/waves/  # [N] wave plans
  status_tracker: docs/[Feature]/01_IMPLEMENTATION_STATUS.md
  current_status: docs/[Feature]/CURRENT_STATUS.md
  integration_guide: docs/[Feature]/FRONTEND_INTEGRATION_GUIDE.md
task_count: [N]
wave_count: [N]
total_estimated_hours: [N]
```

Generate transition file: `docs/[Feature]/prompt-transitions/document-to-build.md`

Transition file contents:
- Feature summary + tier
- Task count and wave count
- Wave execution order with strategies
- First wave details (tasks, agents, criteria)
- Decision log entries relevant to Wave 1
- File paths for all documentation artifacts

---

## 4. GATE: G4

**Auto-approve** for KNOWN tier. **Mandatory user approval** for COMBINATION and NOVEL.

Present to user:
```
Planning complete: [N] tasks across [N] waves ([X] estimated hours).
Docs saved to docs/[Feature]/.

Wave breakdown:
  Wave 1: [tasks] ([strategy])
  Wave 2: [tasks] ([strategy])
  ...

Ready for execution?
```

**Options:** Approve / Revise / Pause

### After G4 Approval

- **KNOWN tier:** Auto-advance — invoke `/dev build` immediately.
- **COMBINATION/NOVEL tier:** Display `▶ Next Up` block and STOP.

```
---
▶ Next Up

Phase: BUILD — Tier-driven task execution

`dev-pipeline:build`

/clear first → fresh context window
```

**STOP.** Do not invoke BUILD (unless KNOWN tier auto-advance).

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Tasks missing exact file paths | Go back, add create/modify/test/reuse paths to every task |
| Tasks > 2.5hr | Split immediately. No exceptions. |
| Tasks < 20min | Combine with adjacent task in same wave |
| Decision log not embedded in tasks | Add "Decision Context" field to every task file |
| Wave plans missing completion criteria | Every wave needs type-check + lint + acceptance criteria |
| Skipping REUSE_AUDIT.md | Mandatory. Populate from DISCOVER findings even if nothing reusable found |
| No TDD steps in task files | Add failing test > verify > implement > verify > commit |
| COMPONENT_ARCHITECTURE.md has vague paths | Use exact file paths, not "a component for X" |
| Wave strategy wrong for tier | KNOWN=sequential, COMBINATION=parallel, NOVEL=expert-reviewed |
| Transition file missing wave 1 details | BUILD phase needs wave 1 specifics to start immediately |
| MANIFEST not updated with artifact paths | BUILD phase reads MANIFEST to find docs. Missing paths = lost context |

---

## Quick Reference

| Artifact | Location | Key Content |
|----------|----------|-------------|
| Master Plan | `docs/[F]/00_MASTER_PLAN.md` | Requirements, architecture, reuse, tasks |
| Reuse Audit | `docs/[F]/REUSE_AUDIT.md` | What to reuse/extend/create |
| Component Arch | `docs/[F]/COMPONENT_ARCHITECTURE.md` | Tree, props, state, data flow |
| Task Files | `docs/[F]/tasks/TASK_XX.md` | 30min-2.5hr units with TDD steps |
| Wave Plans | `docs/[F]/waves/WAVE_XX.md` | Agent assignments + completion criteria |
| Status | `docs/[F]/01_IMPLEMENTATION_STATUS.md` | All tasks "Not Started" |
| Current Status | `docs/[F]/CURRENT_STATUS.md` | Snapshot for session continuity |
| Integration Guide | `docs/[F]/FRONTEND_INTEGRATION_GUIDE.md` | Stub for dev usage docs |
| Transition | `docs/[F]/prompt-transitions/document-to-build.md` | Bridge to BUILD phase |
| MANIFEST | `docs/[F]/.dev/MANIFEST.md` | Updated with all artifact paths |
