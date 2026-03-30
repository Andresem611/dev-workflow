# Decision Ledger Template

## Purpose
The Decision Ledger tracks every decision made during the pipeline, distinguishing between user-locked decisions (cannot be overridden by agents) and agent-suggested decisions (open until user confirms).

## Ledger Format

The ledger lives as a section in the MANIFEST.md file:

```markdown
## Decision Ledger

| ID | Decision | Source | Status | Phase Set | Phase Last Referenced |
|----|----------|--------|--------|-----------|---------------------|
| U-01 | [decision text] | User:[zone] | LOCKED | DISCOVER | PLAN |
| A-01 | [decision text] | Agent:[phase] | OPEN | DESIGN | — |
```

## ID Format

- `U-XX` — User decision (from Discuss zones)
- `A-XX` — Agent decision (from Execute stages)

IDs are sequential within their prefix. Never reuse an ID.

## Status Rules

### LOCKED (User Decisions)
- Created when: User makes a decision during any Discuss zone
- Default for: ALL user statements that define scope, requirements, or direction
- Can be changed: ONLY by the user explicitly saying "unlock U-XX" or "remove U-XX"
- Agent behavior: Agents MUST include LOCKED items in their output. If an agent's work contradicts a LOCKED decision, the Review stage MUST flag it as a violation.
- Propagation: LOCKED decisions appear in EVERY context bridge. They are not summarized — they are copied verbatim.

### OPEN (Agent Decisions)
- Created when: An agent proposes a decision during Execute
- Default for: ALL agent-generated decisions (architecture choices, component patterns, etc.)
- Can be changed: By any subsequent agent or phase
- Promotion: When user explicitly confirms an OPEN decision in Review, it becomes LOCKED
- Notation: When promoted, Source changes to "User:Review-[phase]" to show user confirmed it

## Lifecycle

```
Discuss Zone → User says "Include calendar view"
    ↓
Decision Ledger: U-01 | Include calendar view | User:Zone3 | LOCKED | DISCOVER
    ↓
Bridge carries U-01 to DESIGN
    ↓
DESIGN Execute: Agent proposes "Use FullCalendar library"
    ↓
Decision Ledger: A-01 | Use FullCalendar library | Agent:DESIGN | OPEN | DESIGN
    ↓
DESIGN Review: User confirms → A-01 promoted to LOCKED
    ↓
Decision Ledger: A-01 | Use FullCalendar library | User:Review-DESIGN | LOCKED | DESIGN
```

## Violation Detection (Review Stage)

Every Review stage MUST check:

1. Read all LOCKED decisions from the ledger
2. Read all Execute outputs
3. For each LOCKED decision:
   - Is it addressed in the Execute output?
   - Is it contradicted by any agent work?
   - Is it missing from the output entirely?
4. Report violations:
   ```
   VIOLATION: U-01 (Include calendar view) — not addressed in task breakdown
   VIOLATION: U-02 (Reuse TeacherCard) — agent created new card component instead
   ```

## Integration with Bridges

Every bridge's LOCKED Decisions table is a direct extract from the ledger. The bridge does NOT summarize or reword — it copies the decision text and status exactly.

## Integration with BUILD

BUILD agent prompts MUST include a "LOCKED Decisions" section listing all LOCKED items from the ledger. This ensures agents respect user intent even in the final implementation phase.

```markdown
## LOCKED Decisions (DO NOT OVERRIDE)
- U-01: Include calendar view
- U-02: Reuse TeacherCard component
- U-03: Mobile-first layout
```

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Agent removes a LOCKED item silently | Review MUST flag as violation |
| Agent reinterprets a LOCKED item | LOCKED means verbatim — no reinterpretation |
| Bridge summarizes LOCKED items | Copy verbatim from ledger, never summarize |
| Ledger not updated in MANIFEST | Every Review acceptance updates the ledger |
| OPEN decisions treated as permanent | OPEN items can be changed until promoted to LOCKED |
