---
name: plan
description: Use when /dev:plan is invoked or MANIFEST shows PLAN phase. Handles architecture decisions, task breakdown, and wave grouping with tier-scaled review depth.
---

# /dev:plan — Architecture Decisions + Task Breakdown

Architecture decisions, task breakdown, wave grouping. Absorbs feature-orchestrator Phase 3 logic.

**Inner loop:** RESEARCH → EXECUTE → DOCUMENT → GATE

---

## RESEARCH

### 0. Validate Entry (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-entry plan docs/[feature] --plugin frontend
```

If FAIL → read error output. Fix missing prerequisites before proceeding.
If PASS → continue to step 1.

1. **Read MANIFEST** from `docs/[feature]/.dev/MANIFEST.md` — extract tier, domains, confirmed requirements
2. **Read transition file** `docs/[feature]/prompt-transitions/discover-to-plan.md` — carry forward DISCOVER outputs
3. **Dispatch code-architect subagent** for architecture proposal:
   ```
   Agent tool:
     subagent_type: "feature-dev:code-architect"
     model: "opus"
     prompt: "[CoT Preamble from feature-orchestrator]
       Propose architecture for [feature]:
       1. Component hierarchy with exact file paths
       2. Data flow: API → State → UI
       3. API contracts (endpoints, request/response types)
       4. State management approach (Context vs Redux vs local)
       5. Key design decisions with trade-off analysis

       Context: [requirements from MANIFEST + reuse audit from DISCOVER]
       Design system: Thoven (amber-500, font-display headers, font-sans body,
       3D buttons shadow-[0_4px_0_0_rgb(217,119,6)] no borders,
       spring animations stiffness:500 damping:35 mass:0.6)

       Output: Architecture proposal + decision table"
   ```

4. **Backend dependency detection** — for each API endpoint in the proposal:
   ```
   curl -s -o /dev/null -w "%{http_code}" \
     "${NEXT_PUBLIC_API_BASE_URL}/api/v1/[endpoint]"
   ```
   Classify each endpoint: EXISTS (2xx/4xx) | MISSING (404/connection refused)

---

## EXECUTE

Depth scales by tier:

### KNOWN — Solo Architecture Review

Lead proposes architecture. Single reviewer subagent challenges it:

```
Agent tool:
  subagent_type: "feature-dev:code-architect"
  model: "opus"
  prompt: "[CoT Preamble]
    Review this architecture proposal for [feature]:
    [paste proposal]

    Challenge against:
    1. Existing codebase patterns — cite specific files
    2. Edge cases: empty data, loading, error, auth boundaries
    3. State management appropriateness
    4. Performance: re-renders, bundle size
    5. Mobile/responsive behavior
    6. COPPA compliance (if student-facing)
    7. Accessibility: WCAG 2.1 AA

    Output: Decision table with [Decision | Choice | Rationale | Concerns | Resolution]"
```

### COMBINATION — Boardroom Architecture Review

Invoke boardroom (TeamCreate) with architecture focus. Architect + domain experts debate the proposal. Cap at 2-3 rounds. Lead synthesizes.

### NOVEL — Boardroom + Dual-Perspective

Two parallel subagents (Architect + Challenger) each produce independent proposals. Then boardroom debate on contested decisions. Lead synthesizes, documents dissent.

### After Review — All Tiers

1. **Build decision log** — every decision gets a WHY entry (see format below)
2. **Task breakdown** — decompose into 30min-2.5hr tasks with exact file paths
3. **Wave grouping** — assign tasks to parallel waves based on dependencies
4. **Define custom gate criteria** for DESIGN, BUILD, VALIDATE phases
5. **Check backend results** — if ANY endpoint is MISSING → trigger PAUSE

### Decision Log Format

Every architecture decision MUST follow this format in MANIFEST:

```markdown
### Decisions (LOCKED)

| # | Decision | Choice | Why | Alternatives Rejected | Risk |
|---|----------|--------|-----|----------------------|------|
| D1 | State management | React Context | Matches dashboard pattern (components/parent/DashboardContext.tsx), no cross-page state needed | Redux (overkill), Zustand (not in codebase) | Context re-render scope — mitigate with memo |
| D2 | API layer | New lib/feature-api.ts | Follows established *-api.ts pattern | Inline fetch (violates CLAUDE.md rules) | None |
```

**WHY is mandatory.** A decision without WHY is not a decision — it is a guess. Cite existing codebase files as evidence.

### Task Breakdown Rules

- **30min - 2.5hr** per task. Split if larger, combine if smaller than 20min.
- Every task: exact file paths (create/modify/test), acceptance criteria, dependencies
- Task ordering: Types → API → State → Components → Pages → Tests → Polish
- Each task references its wave assignment

### Wave Grouping

```markdown
### Wave Plan

| Wave | Tasks | Parallel? | Depends On |
|------|-------|-----------|------------|
| W1 | T01 (types), T02 (API layer) | Yes | — |
| W2 | T03 (context), T04 (hook) | Yes | W1 |
| W3 | T05 (component A), T06 (component B) | Yes | W2 |
| W4 | T07 (page integration) | No | W3 |
| W5 | T08 (tests), T09 (polish) | Yes | W4 |
```

Tasks within a wave run in parallel (subagents). Waves run sequentially.

### Custom Gate Criteria

Define acceptance criteria that DESIGN, BUILD, and VALIDATE gates check IN ADDITION to their standard checks:

```markdown
### Custom Gate Criteria

**G3 (DESIGN):** [e.g., "Mobile wireframe for booking flow", "Dark mode variants"]
**G5 (BUILD per wave):** [e.g., "All API calls use error boundaries", "Loading skeletons on every async view"]
**G6 (VALIDATE):** [e.g., "Booking flow works with 0 available slots", "Teacher with no photo renders fallback"]
```

### Backend Dependency → PAUSE

If backend detection found MISSING endpoints:

1. Set MANIFEST status: `awaiting-backend`
2. Record missing endpoints with expected contracts:
   ```markdown
   ### Backend Blockers
   | Endpoint | Method | Expected Request | Expected Response | Status |
   |----------|--------|-----------------|-------------------|--------|
   | /api/v1/bookings | POST | { student_id, slot_id } | { booking: { id, status } } | MISSING |
   ```
3. Invoke prompt-generator to create backend handoff prompt
4. Transition to `/dev:pause` — do NOT proceed to DESIGN/DOCUMENT

---

## DOCUMENT

Update these artifacts:

1. **MANIFEST** — add to `docs/[feature]/.dev/MANIFEST.md`:
   - Decision log (LOCKED) with WHY reasoning
   - Wave groupings table
   - Custom gate criteria for G3, G5, G6
   - Backend dependency status
   - Phase progress: PLAN → COMPLETE

2. **Decision log** — embedded in MANIFEST (not separate file)

3. **Transition file** — generate via prompt-generator:
   - If DESIGN phase applies: `prompt-transitions/plan-to-design.md`
   - If DESIGN skipped: `prompt-transitions/plan-to-document.md`
   - Contents: feature summary, LOCKED decisions, domains, wave plan, custom gate criteria, tier-specific instructions for next phase

---

## GATE: G2 — Architecture Approval

**Always mandatory.** No tier skips this gate.

Present to user:

```
Architecture decisions for [Feature]:

| # | Decision | Choice | Why (short) |
|---|----------|--------|-------------|
| D1 | ... | ... | ... |
| D2 | ... | ... | ... |

Task breakdown: [N] tasks across [N] waves
Estimated total: [X] hours
Backend status: All endpoints exist | [N] endpoints missing → PAUSE

Custom gate criteria defined for: DESIGN / BUILD / VALIDATE
```

**Options:** Approve | Revise [specify which decision] | Pause

### Pre-Gate Verification

4. **Verify transition (MANDATORY):**

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-transition plan docs/[feature] --plugin frontend
```

If FAIL → Re-invoke prompt-generator with the listed missing fields.

5. **Verify MANIFEST (MANDATORY):**

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest docs/[feature] --plugin frontend
```

If FAIL → Update MANIFEST before ending session.

### After G2 Approval

Determine next phase: DESIGN (if design domains tagged) or DOCUMENT (if not).

Display `▶ Next Up` block and STOP:

```
---
▶ Next Up

Phase: [DESIGN or DOCUMENT] — [description]

`dev-pipeline-frontend:[design or document]`

/clear first → fresh context window
```

**STOP.** Do not invoke next phase. Do not offer "continue in same session".

---

## Common Mistakes

| Mistake | Why It Fails | Prevention |
|---------|-------------|------------|
| Decision log without WHY | Future sessions guess at intent, make wrong trade-offs | Enforce WHY column — reject entries without it |
| Tasks without exact file paths | Subagents create wrong files, duplicate work | Every task lists create/modify/test paths |
| Skipping backend detection | BUILD phase hits 404s, wastes full wave | Always curl endpoints during RESEARCH |
| Waves with hidden dependencies | Parallel tasks conflict on same file | One file = one task = one wave assignment |
| Custom gate criteria too vague | "Works well" passes anything | Criteria must reference specific scenarios with data states |
| Tasks > 2.5 hours | Context overflow, scope creep in subagents | Split. If it feels like one task, it is two |
| Architecture without codebase evidence | Decisions drift from existing patterns | Every choice cites a real file path as precedent |
| Proceeding past G2 without approval | Entire BUILD may need rework | G2 is ALWAYS mandatory — no auto-advance |
