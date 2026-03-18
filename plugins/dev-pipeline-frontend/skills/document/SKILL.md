---
name: document
description: Produces all documentation artifacts for a feature — master plan, component architecture, reuse audit, integration guide, task files, wave files, and implementation status. Triggers on /dev:document or when /dev router advances past DESIGN.
---

# /dev:document — Documentation & Wave Planning

Produce all planning documentation needed for BUILD. Dispatches multiple subagents to create 8 doc types, then verifies cohesion before handing off.

## Hard Rules

1. **Read before acting.** Use the Read tool on context bridges, MANIFEST, requirements.md, and all prior phase outputs before writing any documentation. Writing from memory produces artifacts that conflict with locked decisions.
2. **Use agent-prompt-template for dispatches.** Follow `references/agent-prompt-template.md` for any documentation agents.
3. **Minimum content requirements for review artifacts.** Every review artifact and transition file must contain: feature summary, locked decisions carried forward, domain tags, specific instructions for the next phase, and at least 3 context items. A 2-line "Pass. No issues." is not acceptable — it leaves the next phase blind after `/clear`.

## Inner Loop: Discuss > Architect > Execute > Review

Reference: `${PLUGIN_ROOT}/../shared/references/inner-loop-reference.md`

---

## Stage 1: Discuss — Documentation Scope

### MANDATORY CONTEXT LOADING — Step 0

Use the Read tool on each file. Do not proceed until all reads complete.

1. `Read(.dev/design/review-design-compliance.md)` → extract: design decisions, component inventory, responsive behavior, accessibility requirements
2. `Read(references/domain-agent-map.md)` → extract: agent assignments for DOCUMENT phase
3. `Read(.dev/MANIFEST.md)` → extract: domains, decision log, wave groupings from PLAN

If any file is missing, STOP and surface the gap to the user.

### 1.1 Read Context Bridge

```
docs/[Feature]/.dev/design/review-design-compliance.md
```

Extract: locked design decisions, component inventory, architecture decisions from PLAN, reuse findings from DISCOVER, task list and wave groupings. If this file does not exist, STOP — DESIGN must complete first.

### 1.2 Structured Questioning

**Tool:** `AskUserQuestion` for EVERY question. One at a time. No batching.

**WHAT questions:**
- Which docs need the most detail? Any special documentation needs?
- What level of detail for task files? (high-level vs step-by-step)
- Any existing docs to incorporate? How granular should wave planning be?

**HOW meta-questions:**
- "How many subagents for documentation? Separate agent per doc or batch?"
- "How should we verify cohesion across docs?"
- "Want a prompt-engineer for task file quality?"
- "Full reuse audit scan or rely on DISCOVER findings only?"

No cap on questions. User says "enough" or "move on" to proceed.

### 1.3 Stage Artifact

Write `docs/[Feature]/.dev/document/discuss-documentation-scope.md` — all Q&A, locked decisions, user preferences.

---

## Stage 2: Architect — Documentation Plan

### 2.1 Prompt Generation (MANDATORY)

**D04 ENFORCEMENT:** Follow the D04 Enforcement Protocol from `inner-loop-reference.md`. Every subagent prompt MUST go through `/prompt-generator`. Log status in the Orchestration Log section of this artifact.

Use `/prompt-generator` to craft every subagent prompt. No exceptions.

#### Architect Step 0: Verify Context Loaded

Before designing agent prompts, confirm:
- [ ] `domain-agent-map.md` was Read in Step 0 — list ALL agents from the map for this phase as either "dispatched" or "skipped (reason)"
- [ ] Domain Combination Patterns checked — read the Domain Combination Patterns table from domain-agent-map.md and apply any extra considerations (e.g., `routing + auth-ui` = test both authenticated and unauthenticated access)
- [ ] Previous phase review artifact was Read — decisions and context carried forward

This verification appears in the Orchestration Log under `Map compliance`.

### 2.2 Doc Inventory with Agent Assignments

| Doc | Agent Type | Notes |
|-----|-----------|-------|
| `00_MASTER_PLAN.md` | `documentation-engineer` | Executive summary, architecture, phases |
| `COMPONENT_ARCHITECTURE.md` | `documentation-engineer` | Component hierarchy, state flow, props |
| `REUSE_AUDIT.md` | `Explore` (subagent_type) | Scan codebase for reuse opportunities |
| `FRONTEND_INTEGRATION_GUIDE.md` | `documentation-engineer` | API integration, backend deps, auth |
| `tasks/TASK_01..N.md` | `prompt-engineer` | Task files need good prompts for BUILD |
| `waves/WAVE_01..N.md` | `documentation-engineer` | Wave execution plans with task assignments |
| `01_IMPLEMENTATION_STATUS.md` | `documentation-engineer` | Task tracking table |
| `CURRENT_STATUS.md` | `documentation-engineer` | Quick status reference |

### 2.3 Execution Order

```
Phase 1 (parallel):  Explore → REUSE_AUDIT.md  |  doc-engineer → 00_MASTER_PLAN.md
Phase 2 (parallel):  doc-engineer → COMPONENT_ARCHITECTURE.md  |  doc-engineer → INTEGRATION_GUIDE.md
Phase 3 (sequential): prompt-engineer → tasks/TASK_01..N.md (needs arch + reuse context)
Phase 4 (sequential): doc-engineer → waves/WAVE_01..N.md, STATUS files
```

Adjust based on user preferences from Discuss.

### 2.4 Success Criteria

Per-subagent:
- **Master Plan:** Business requirements, architecture overview, decision log table, task list, success criteria
- **Component Arch:** Component tree with exact file paths, TS props interfaces, state flow, data flow diagram
- **Reuse Audit:** Four tables — Reuse As-Is, Can Extend, Not Suitable, New Code Required (with justification)
- **Integration Guide:** API endpoints with types, auth patterns, error handling, backend dependencies
- **Task Files:** Duration 30min-2.5hr, wave assignment, dependencies, exact file paths, acceptance criteria, TDD steps
- **Wave Plans:** Task assignments, strategy, duration, completion criteria, wave dependencies
- **Status Files:** All tasks listed "Not Started" with wave and duration

Overall: every PLAN requirement has a task, every task in exactly one wave, cross-references consistent, no task outside 20min-2.5hr range.

### 2.5 Stage Artifact

Write `docs/[Feature]/.dev/document/architect-documentation-plan.md` — full inventory, execution order, success criteria, escalation rules, subagent prompts. Must include the Orchestration Log section.

---

## Stage 3: Execute — Produce All Docs

### 3.1 Dispatch Rules

**MANDATORY:** Dispatch subagents via Agent tool. Orchestrator NEVER writes docs inline.

For each subagent: dispatch with crafted prompt, collect results, check against success criteria, log pass/fail. If a subagent fails: log failure, continue with remaining agents, surface in Review.

### 3.2 Output Files

All docs go to `docs/[Feature]/`:

```
docs/[Feature]/
├── 00_MASTER_PLAN.md              ← architecture, requirements, decision log
├── COMPONENT_ARCHITECTURE.md      ← tree, props, state flow, data flow
├── REUSE_AUDIT.md                 ← reuse/extend/new tables
├── FRONTEND_INTEGRATION_GUIDE.md  ← API, auth, errors, backend deps
├── 01_IMPLEMENTATION_STATUS.md    ← tracking table, all "Not Started"
├── CURRENT_STATUS.md              ← quick status snapshot
├── tasks/
│   └── TASK_01_xxx.md .. TASK_NN_xxx.md
└── waves/
    └── WAVE_01.md .. WAVE_NN.md
```

### 3.3 Task File Structure

```markdown
# Task NN: [Name]
**Duration:** [30min-2.5hr]  **Wave:** [N]  **Dependencies:** [Task IDs or "None"]
**Agent:** [specialist agent from routing table — see below]
**Domain:** [routing | state | forms | animation | a11y | responsive | api-integration | auth-ui | design-system | performance | seo | analytics]

## Files
- **Create:** `exact/path/file.tsx`
- **Modify:** `exact/path/existing.tsx` (lines ~XX-YY)
- **Test:** `__tests__/exact/path/test.tsx`
- **Reuse:** `components/ui/existing.tsx` (from REUSE_AUDIT)

## Acceptance Criteria
- [ ] [Specific, testable criterion]
- [ ] TypeScript strict passes
- [ ] Component < 300 lines

## Implementation Steps (TDD)
1. Write failing test → 2. Verify failure → 3. Implement → 4. Verify pass → 5. Refactor → 6. Commit
```

**Agent Assignment Guide** — auto-assign the `Agent:` field using keyword matching:

| Task involves... | Assign agent |
|-----------------|--------------|
| page.tsx, layout.tsx, route, middleware, SSR, RSC, generateMetadata | `next-js-developer` |
| TypeScript interfaces, generics, type definitions, branded types | `typescript-pro` |
| React.memo, useMemo, Context optimization, hooks, re-render fixes | `react-specialist` |
| ARIA, keyboard nav, screen reader, WCAG, focus management | `accessibility-tester` |
| API endpoint design, contract review, OpenAPI | `api-designer` |
| lib/*-api.ts implementation, fetch wrappers | `frontend-developer` |
| Framer Motion, animation, CSS transition | `ui-designer` |
| General UI components, styling, layout, forms | `frontend-developer` |

**Sizing:** >2.5hr split, <20min combine. Sweet spot 30min-2.5hr.

### 3.4 Wave File Structure

```markdown
# Wave N: [Name]
**Tasks:** TASK_01, TASK_02  **Strategy:** [sequential | parallel-subagents]  **Duration:** [hours]

## Subagent Assignments
| Task | Agent Type | Key Instruction |
|------|-----------|-----------------|

## Completion Criteria
- [ ] All task acceptance criteria met
- [ ] `npm run type-check` passes
- [ ] `npm run lint` passes
- [ ] No regressions in existing tests

## Dependencies
- **Requires:** [Previous wave(s) or "None"]
- **Unlocks:** [Next wave(s)]
```

### 3.5 Stage Artifact

Write `docs/[Feature]/.dev/document/execute-docs-manifest.md` — lists ALL files produced:

```markdown
## Files Produced
| # | File | Path | Summary |
|---|------|------|---------|
| 1 | Master Plan | docs/[Feature]/00_MASTER_PLAN.md | [1-line] |
| 2 | Component Arch | docs/[Feature]/COMPONENT_ARCHITECTURE.md | [1-line] |
| ... | ... | ... | ... |

## Subagent Results
| Agent | Doc(s) Produced | Status | Deviations |
|-------|----------------|--------|------------|

## Totals
- **Tasks:** [N]  **Waves:** [N]  **Estimated hours:** [X]
```

---

## Stage 4: Review — Documentation Quality

### 4.1 Cohesion Check

- Master plan task list matches actual task files (count, names, order)
- Every task references a valid wave; every wave references only existing tasks
- Reuse audit findings reflected in task file "Reuse" fields
- Integration guide endpoints match what task files reference
- Component architecture paths match task file "Create" paths

### 4.2 Task Coverage

- Map every PLAN requirement to one or more task files
- Flag requirements with no corresponding task
- Flag tasks with no traceable requirement

### 4.3 Wave Plan Completeness

- Every task in exactly one wave
- Dependencies form a valid DAG (no cycles)
- Each wave has completion criteria
- Durations within sizing rules

### 4.4 Integration Guide Verification

- API calls documented with request/response types
- Auth patterns specified
- Error handling defined
- Backend dependencies listed with status

### 4.5 Surface Gaps

Use `AskUserQuestion` to present findings:

```
Documentation review found [N] issues:
1. [Issue] — [critical/warning/info]
...
Options: Retry Execute | Back to Architect | Back to Discuss | Accept
```

User decides. No auto-looping (D08).

### 4.6 Notion Update

After acceptance, update the Dev Tracker card with wave/task summary. Read the Card ID from MANIFEST's `## Notion Integration > Card ID`.

1. **Update card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: Card ID from MANIFEST
   - Properties: Notes = append documentation summary (X waves, Y tasks planned, estimated hours, key wave descriptions), Last Updated = today's ISO date

2. Display: `📋 Notion: Updated notes — "[Feature Name]" (X waves, Y tasks planned)`

**Notion Protocol:** Follow the Retry + Warning Protocol in `references/notion-integration.md`.
- Phase type: Downstream (status update — check Card ID first)
- Target status: (notes update, no status change)
- Persist warning in: `.dev/document/review-documentation-quality.md`

### 4.7 MANIFEST Update

On acceptance, update MANIFEST:

```yaml
phase: DOCUMENT
status: complete
artifacts:
  master_plan: docs/[Feature]/00_MASTER_PLAN.md
  reuse_audit: docs/[Feature]/REUSE_AUDIT.md
  component_arch: docs/[Feature]/COMPONENT_ARCHITECTURE.md
  integration_guide: docs/[Feature]/FRONTEND_INTEGRATION_GUIDE.md
  tasks: docs/[Feature]/tasks/
  waves: docs/[Feature]/waves/
  status_tracker: docs/[Feature]/01_IMPLEMENTATION_STATUS.md
  current_status: docs/[Feature]/CURRENT_STATUS.md
task_count: [N]
wave_count: [N]
total_estimated_hours: [X]
```

#### Dispatch Mandate for Next Phase

The review artifact's context bridge MUST include a "Dispatch Mandate" section listing:
- **Mandatory agents** from domain-agent-map.md for the NEXT phase
- **Conditional agents** with their trigger conditions
- **Skipped agents** with reason

The next phase's Architect must address each listed agent — silent omission is not allowed.

### 4.8 Stage Artifact

Write `docs/[Feature]/.dev/document/review-documentation-quality.md` — bridges to BUILD:

```markdown
## Documentation Review Summary
**Verdict:** [Pass / Pass with warnings / Fail]
**Tasks:** [N] across [N] waves  **Estimated hours:** [X]

## Cohesion Check
| Check | Status | Notes |
|-------|--------|-------|
| Master plan <> task files | Pass/Fail | |
| Task files <> wave plans | Pass/Fail | |
| Reuse audit <> task files | Pass/Fail | |
| Integration guide <> tasks | Pass/Fail | |
| Component arch <> task files | Pass/Fail | |

## Task Coverage
- Requirements covered: [N/N]
- Gaps: [list or "None"]

## Warnings for BUILD
- [Caveats, known gaps, areas needing attention]

## Recommended BUILD Focus
- Wave 1 tasks: [list]
- Wave 1 strategy: [sequential/parallel]
- Key risk areas: [list]
```

---

## Tool Integration

```bash
# Before any stage
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry document <stage> docs/[feature] --plugin frontend

# After any stage
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output document <stage> docs/[feature] --plugin frontend

# After MANIFEST changes
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest docs/[feature] --plugin frontend
```

---

## After Review Acceptance

Present summary, then display:

```
---

### Next Up

Phase: BUILD — Wave-by-wave task execution
`/dev:build`

/clear first — fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke BUILD.

---

## Output Doc Inventory

| Doc | Purpose | Agent |
|-----|---------|-------|
| 00_MASTER_PLAN.md | Executive summary, architecture, phase overview | documentation-engineer |
| COMPONENT_ARCHITECTURE.md | Component hierarchy, state flow, props/interfaces | documentation-engineer |
| REUSE_AUDIT.md | Existing components to reuse vs build new | Explore |
| FRONTEND_INTEGRATION_GUIDE.md | API integration, backend deps, auth | documentation-engineer |
| tasks/TASK_NN_xxx.md | Individual task specs with acceptance criteria | prompt-engineer |
| waves/WAVE_NN.md | Wave execution plans with task assignments | documentation-engineer |
| 01_IMPLEMENTATION_STATUS.md | Task tracking table | documentation-engineer |
| CURRENT_STATUS.md | Quick status reference | documentation-engineer |

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Writing docs inline instead of dispatching | Execute MUST dispatch subagents |
| Tasks missing exact file paths | Every task needs create/modify/test/reuse paths |
| Tasks outside 20min-2.5hr range | Split if too large, combine if too small |
| Reuse audit skipped | Mandatory — dispatch Explore agent |
| Cross-references broken | Review cohesion check catches this |
| Wave plans missing completion criteria | Every wave needs type-check + lint + acceptance |
| Task files lack TDD steps | Add: failing test > verify > implement > verify > commit |
| execute-docs-manifest.md incomplete | Must list ALL files with paths and summaries |
| Review auto-loops on failure | Surface to user — user decides next action |
