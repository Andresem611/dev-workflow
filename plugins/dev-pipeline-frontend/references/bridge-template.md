# Context Bridge Template

## Purpose

Context bridges are the `review-*.md` artifacts that carry decisions, artifacts, and focus areas between pipeline phases. In v4.0, bridges are structured (not free-form) and include an echo-back requirement to ensure the next phase actually loaded the context.

## Bridge Format

Every `review-*.md` file MUST use this structure:

```markdown
## Context Bridge: [CURRENT PHASE] → [NEXT PHASE]

### LOCKED Decisions (from Decision Ledger)

| ID | Decision | Status |
|----|----------|--------|
| U-01 | [verbatim from ledger] | LOCKED |
| U-02 | [verbatim from ledger] | LOCKED |
| A-01 | [verbatim from ledger] | OPEN |

Total: [N] LOCKED, [N] OPEN

### Key Artifacts Produced

| Artifact | Path | Summary |
|----------|------|---------|
| [name] | `.dev/[phase]/[file]` | [one-line what it contains] |

### Focus for Next Phase

Specific, actionable guidance for the next phase. Reference LOCKED items by ID.

- [Guidance item 1 — reference U-XX if applicable]
- [Guidance item 2]
- [What the next phase should prioritize]
- [What the next phase should NOT do]

### Open Questions

Questions that were raised but not resolved in this phase. The next phase's Discuss should address these.

- [Question 1]
- [Question 2]

### Dispatch Mandate

Agents the next phase MUST address (from domain-agent-map.md):

- **Mandatory:** [agent-type] — [purpose]
- **Conditional:** [agent-type] — [trigger condition]
- **Skipped:** [agent-type] — [reason for skip]

The next phase's Architect must address each listed agent. Silent omission is not allowed.
```

## Echo-Back Protocol

When a phase starts and reads the bridge from the previous phase, it MUST echo back the LOCKED decisions before proceeding to any questions.

### How Echo-Back Works

1. Phase starts → Discuss Stage 0 (Mandatory Context Loading)
2. Read the bridge: `Read(.dev/[previous-phase]/review-*.md)`
3. Extract LOCKED decisions from the bridge
4. Display echo-back to user:

```
Loaded context from [PREVIOUS PHASE]:
- [N] LOCKED decisions: U-01 (calendar view), U-02 (reuse TeacherCard), ...
- [N] OPEN decisions: A-01 (FullCalendar library), ...
- Key artifacts: [list]
- Focus areas: [list]
```

5. If echo-back is incomplete or wrong → re-read the bridge
6. Only proceed to Discuss questions after successful echo-back

### Echo-Back Failure

If the echo-back doesn't match the bridge content (wrong count, missing items, wrong IDs):
- DO NOT proceed
- Re-read the bridge file
- Try echo-back again
- If still failing: surface the issue to the user

## Bridge Content Rules

### DO:
- Copy LOCKED decisions verbatim from the ledger (no rewording)
- Include specific file paths for all artifacts
- Write actionable focus items that reference LOCKED decision IDs
- List open questions that the next phase should resolve
- Include dispatch mandate from domain-agent-map.md

### DO NOT:
- Summarize LOCKED decisions (verbatim only)
- Write generic focus items ("continue working on the feature")
- Leave the Focus section empty or with fewer than 3 items
- Skip the Dispatch Mandate section
- Write "no open questions" if there ARE unresolved items from Discuss

## Minimum Content Requirements

A bridge is INVALID if:
- LOCKED Decisions table is missing or empty (every phase has at least the decisions from INTAKE)
- Key Artifacts table has zero entries
- Focus section has fewer than 3 items
- Dispatch Mandate is missing

## Phase-Specific Bridge Names

| Phase | Bridge File |
|-------|-------------|
| INTAKE | `review-classification-confirmed.md` |
| DISCOVER | `review-design-approval.md` |
| DESIGN | `review-design-compliance.md` |
| PLAN | `review-plan-approval.md` |
| DOCUMENT | `review-documentation-quality.md` |
| BUILD (per wave) | `review-code-quality.md` |
| VALIDATE | `review-ship-readiness.md` |
| SHIP | `review-release-confirmation.md` |
