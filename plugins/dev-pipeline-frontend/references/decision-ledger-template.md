# Decision Ledger Template

## Purpose
The Decision Ledger tracks every decision made during the pipeline, distinguishing between user-locked decisions (cannot be overridden by agents) and agent-suggested decisions (open until user confirms).

## Ledger Format

The ledger lives as a section in the MANIFEST.md file:

```markdown
## Decision Ledger

| ID | Decision | Source | Status | Phase Set | Phase Last Referenced | Supersedes | Reason |
|----|----------|--------|--------|-----------|---------------------|------------|--------|
| U-01 | [decision text] | User:[zone] | LOCKED | DISCOVER | PLAN | — | — |
| A-01 | [decision text] | Agent:[phase] | OPEN | DESIGN | — | — | — |
| P-23 | [decision text] | Agent:PLAN | LOCKED | PLAN | PLAN | U-01 | Eligibility moved to BE policy; FE un-gated — recorded reversal of a USER lock (see ⚠ LOCK CONFLICT) |
```

### Supersedes / Reason columns (v5.4 — reversal provenance)

These two columns make decision **reversals structurally visible** instead of buried in prose. They power the lock-vs-lock conflict check below.

- **`Supersedes`** — if this decision overrides or contradicts an existing decision, it MUST name that decision's ID here (e.g. `U-01`). A decision that overrides another but leaves `Supersedes` empty is a ledger error.
- **`Reason`** — REQUIRED whenever `Supersedes` is set. One line: why the override was made. Empty `Reason` with a non-empty `Supersedes` is a ledger error.
- Default for both columns is `—` (no supersession).

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

## Decision-vs-Decision Conflict Check (v5.4 — Guard 1)

**Why this exists:** Violation Detection (below) historically ran ONE direction only — it compared Execute *outputs* (code/specs) against LOCKED decisions. It never compared a **new or newly-promoted decision against the existing LOCKED decisions**. That blind spot let an agent-sourced LOCKED decision silently negate a user-sourced LOCKED decision (a `Source: Agent:*` decision reversing a `Source: User:*` decision) with the contradiction only ever named in prose. This check closes the lock-vs-lock direction.

**When it runs:** Every time a decision is **added as LOCKED** or **promoted from OPEN to LOCKED** (DESIGN and PLAN Execute/Review, and any phase that writes the ledger).

**Procedure — before writing the new LOCKED decision:**
1. Scan ALL existing LOCKED decisions for one this new decision contradicts (same surface/behavior, opposite effect).
2. If none → write normally (`Supersedes: —`).
3. If it contradicts an **`Agent:*`** LOCKED decision → record the supersession (`Supersedes: <ID>`, `Reason: <one line>`), flip the superseded row's intent if needed, and **continue**.
4. If it contradicts a **`User:*`** LOCKED decision → this is a user-lock reversal. Behavior is **WARN-and-continue** (not a hard halt):
   - Emit a prominent banner at the **top** of the Review / bridge / echo-back output, naming BOTH IDs:

     ```
     ⚠ LOCK CONFLICT: <new-ID> (<source>) reverses USER-locked <old-ID> ("<old decision text>").
        New: "<new decision text>"
        This overrides a decision the USER locked. Recording supersession and continuing —
        confirm this is intended, or say "unlock <old-ID>" / "keep <old-ID>" to resolve.
     ```
   - Record it in the ledger: set the new row's `Supersedes: <old-ID>` and `Reason: <why>`. A user-lock reversal with empty `Supersedes`/`Reason` is forbidden — it MUST be logged.
   - Then continue. Never proceed *silently* past a user-lock reversal: the banner + the recorded supersession are both mandatory.

> Per the LOCKED status rule, a USER lock can only be *unlocked* by the user explicitly saying "unlock U-XX". This guard does not auto-unlock — it makes any de-facto reversal loud and traceable so the user can act on it. Tune to a hard halt if reversals keep slipping through.

## Unverified Assumptions May Not Be Load-Bearing (v5.4 — Guard 4)

A GROUND finding, handover note, or any claim tagged **`BE-confirm`**, **OPEN**, or otherwise **unverified** MAY NOT be the *justification* for a LOCKED decision until it is confirmed.

- If a decision's rationale depends on an unconfirmed assumption (e.g. "the backend already accepts a `purpose` field"), that decision stays **OPEN** (or is flagged `pending-verification`) until the assumption is verified against the real artifact (code, API, contract).
- Verify the assumption before it becomes load-bearing — do not lock on "hinting", "appears to", or "anticipates".
- Record the verification (what was checked + result) in the `Reason` column when the decision is finally locked.

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
3. For each LOCKED decision (output ↔ lock direction):
   - Is it addressed in the Execute output?
   - Is it contradicted by any agent work?
   - Is it missing from the output entirely?
4. **For each NEW or newly-promoted LOCKED decision (lock ↔ lock direction — Guard 1):** run the Decision-vs-Decision Conflict Check above. A new decision that reverses a `User:*` lock without a `⚠ LOCK CONFLICT` banner + recorded `Supersedes`/`Reason` is itself a violation.
5. Report violations:
   ```
   VIOLATION: U-01 (Include calendar view) — not addressed in task breakdown
   VIOLATION: U-02 (Reuse TeacherCard) — agent created new card component instead
   VIOLATION: P-23 (FE un-gated) — reverses USER-locked U-01 (enrolled-only) with no Supersedes/Reason recorded
   ```

## Integration with Bridges

Every bridge's LOCKED Decisions table is a direct extract from the ledger. The bridge does NOT summarize or reword — it copies the decision text and status exactly.

## Integration with BUILD (Two-Tier Approach)

BUILD agent prompts use a two-tier system for LOCKED decisions. This solves a tension: dumping all 66 decisions into every prompt dilutes focus on the 3-5 that actually constrain the current task, but omitting decisions causes silent gaps where agents unknowingly contradict user intent. Two tiers solve both problems.

**Tier 1 — Task-specific (highlighted at top of agent prompt):** The LOCKED decisions listed in this task's "Locked Decisions" section. These directly constrain the task and the agent should treat them as primary requirements.

**Tier 2 — Full ledger (safety net in agent prompt):** ALL remaining LOCKED items from the Decision Ledger in MANIFEST. Listed under a separate "Full LOCKED Decision Ledger" section. The agent must not contradict these, but they are secondary context — not the focus of this specific task.

Format in agent prompts:

```markdown
## LOCKED Decisions — THIS TASK (DO NOT OVERRIDE)
- U-01: Include calendar view ← directly constrains this task
- U-03: Mobile-first layout ← directly constrains this task

## LOCKED Decisions — FULL LEDGER (safety net — do not contradict)
- U-02: Reuse TeacherCard component
- U-04: Spring animations for transitions
- ... (all remaining LOCKED items from MANIFEST)
```

**Why two tiers:** Task files from DOCUMENT contain 3-5 selectively filtered decisions. Without Tier 2, agents never see the other LOCKED decisions and can silently violate them. Without Tier 1, all decisions have equal weight and the agent cannot prioritize the ones that actually matter for its specific work.

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Agent removes a LOCKED item silently | Review MUST flag as violation |
| Agent reinterprets a LOCKED item | LOCKED means verbatim — no reinterpretation |
| Bridge summarizes LOCKED items | Copy verbatim from ledger, never summarize |
| Ledger not updated in MANIFEST | Every Review acceptance updates the ledger |
| OPEN decisions treated as permanent | OPEN items can be changed until promoted to LOCKED |
| New decision silently reverses a USER lock | Guard 1 — emit `⚠ LOCK CONFLICT`, record `Supersedes`/`Reason`, continue. Never silent. |
| Reversal explained only in prose rationale | Guard 2 — the override MUST name the superseded ID in the `Supersedes` column |
| Decision locked on an unverified `BE-confirm`/OPEN assumption | Guard 4 — keep it OPEN until the assumption is verified against the real artifact |
