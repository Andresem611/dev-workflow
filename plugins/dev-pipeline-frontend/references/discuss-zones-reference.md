# Discuss Zones Reference — v4.0

## Purpose

The 4-Zone Discuss replaces flat question lists. Each zone has a specific purpose, technique borrowed from an existing skill, exit conditions, and ledger integration. Zones run sequentially (Zone 1 → 2 → 3 → 4).

## Mode Interaction

The execution mode (set in Zone 4 of DISCOVER, propagated via Decision Ledger) controls zone depth:

| Zone | REDUCTION | HOLD | EXPANSION |
|------|-----------|------|-----------|
| Zone 1: WHY | 2 questions max | Full zone | Full + deep premise challenge |
| Zone 2: WHO | Skip entirely | Full zone | Full + 11-star exercise |
| Zone 3: WHAT | Quick IN/OUT list | Full zone | Full + constraint removal |
| Zone 4: HOW | Quick preferences | Full zone | Full + temporal interrogation |

In DISCOVER (where mode is first set), always run all 4 zones at HOLD depth minimum. Mode applies to subsequent phases.

## Where Zones Apply

| Phase | Uses 4-Zone? | Notes |
|-------|-------------|-------|
| INTAKE | No | INTAKE uses simple classification questions (unchanged) |
| DISCOVER | Yes — FULL 4-zone | This is where zones are most important |
| DESIGN | Adapted | Zone 1 (WHY) = visual direction why. Zone 3 (WHAT) = component scope. Zone 2/4 adapted. |
| PLAN | Adapted | Zone 1 (WHY) = architecture rationale. Zone 3 (WHAT) = task scope. Lighter zones. |
| Other phases | No | Standard Discuss with echo-back only |

---

## Zone 1: WHY (Problem Space)

**Source technique:** Premise Challenge from `/plan-ceo-review`

**Purpose:** Understand the motivation behind the request, not just the request itself. A feature request is a proposed solution — the WHY reveals the actual problem, which may have a better solution.

**Questions (use AskUserQuestion, one at a time):**

1. "Why does this feature need to exist? What problem is it solving?"
2. "What happens if we do nothing? Is this a real pain point or a hypothetical one?"
3. "What's the actual user outcome you're after — not the feature, but what changes for the user?"
4. "Could a different framing yield a simpler solution? What if we solved the underlying problem instead of building this specific feature?"
5. "What triggered this now? User feedback, business goal, technical debt, or something else?"

**Follow-up discipline:** If the answer to question 1 describes a FEATURE ("I want a calendar view"), ask "Why a calendar? What problem are teachers hitting that a calendar solves?" The WHY reveals the real need (e.g., "teachers can't see available time slots at a glance" — which might be solved by a simpler list view).

**Exit condition:** You can articulate the problem in ONE SENTENCE without mentioning the solution. If your problem statement includes the word "calendar" or "dashboard" or any specific UI element, you haven't reached the real problem yet.

**Ledger output:**
- Problem statement in JTBD format → LOCKED
  - Format: "When [situation], I want to [motivation], so I can [outcome]"
- Root trigger (user feedback / business goal / tech debt) → LOCKED

---

## Zone 2: WHO (User Context)

**Source technique:** Empathy Map + Day-in-the-Life + 11-Star Framework from `/customer-obsession-design-thinking`

**Purpose:** Ground the feature in a real user's reality. Not an abstract persona — a specific type of person with a specific day, specific frustrations, and specific moments where this feature would matter.

**Questions (use AskUserQuestion, one at a time):**

1. "Which user type is this primarily for? Teacher, Parent, Student, or Admin?"
2. "Walk me through their day — where does this feature fit into their routine?"
3. "What do they currently DO to solve this problem? (workaround, manual process, different tool)"
4. "What's the 5-star version of this feature — just functional, meets expectations?"
5. "What's the 7-star version — delightful, makes them tell a colleague?"
6. "What's the 9-star version — remarkable, changes how they think about their work?"
7. "Where between 7 and 9 stars should we aim for this release?"

**The 11-star exercise (EXPANSION mode only):**
Push to 11 stars (impossible/magical). Then work backward to find the achievable ambitious version.

**Empathy prompts:**
- "What do they SAY about this problem?" (quotes, complaints)
- "What do they THINK but don't say?" (fears, hopes)
- "What do they FEEL?" (frustrated, overwhelmed, excited)
- "What do they DO?" (workarounds, hacks, manual processes)

**Exit condition:** You can describe a specific user scenario end-to-end: "[User type] is doing [activity], hits [problem], currently does [workaround], and with this feature would instead [new behavior]."

**Ledger output:**
- Target user type → LOCKED
- User scenario (end-to-end) → LOCKED
- Star target (e.g., "aim for 8-star") → LOCKED

---

## Zone 3: WHAT (Scope + Boundaries)

**Source technique:** GROUND-Informed Scope from GROUND agent findings + Constraint Removal from `/product-strategy-brainstorming` + Opportunity Solution Tree

**Purpose:** Define what's IN and what's OUT, grounded in what the codebase already has. The GROUND agent's Explore findings directly inform these questions — don't ask generic scope questions when you have specific codebase evidence.

**GROUND Integration (MANDATORY):**
Before Zone 3, the GROUND agent has already run (Stage 0). Its findings inform every question in this zone. Reference specific files, components, and patterns it found.

**Questions (use AskUserQuestion, one at a time):**

1. "[From GROUND] I found [component/pattern X] in the codebase. Should we reuse it, extend it, or build something new? Here's what it does: [brief]"
2. "[From GROUND] This overlaps with [existing feature Y]. Are we extending Y or is this separate?"
3. "Constraint removal: If there were zero technical limits, what would this look like? [pause] Now what's the 80% version that's actually buildable?"
4. "What are we explicitly NOT building? Where's the scope boundary?"
5. "Let's map the solution space — I see 2-3 approaches to this problem: [list from GROUND findings + Zone 1 WHY]. Which direction?"

**Opportunity Solution Tree (EXPANSION mode only):**
```
OUTCOME: [from Zone 1 JTBD]
    ├── Approach A: [description]
    ├── Approach B: [description]
    └── Approach C: [description]
```
Evaluate each approach against the star target from Zone 2.

**Exit condition:** You have an explicit IN/OUT list. Every IN item traces back to the JTBD from Zone 1 — if it doesn't serve the job, it's OUT.

**Ledger output:**
- Every IN scope item → LOCKED (with JTBD traceability)
- NOT-in-scope items → LOCKED (prevents scope creep)
- Reuse decisions (from GROUND findings) → LOCKED

---

## Zone 4: HOW (Execution Preferences)

**Source technique:** Temporal Interrogation from `/product-advisor` + Mode Selection

**Purpose:** Let the user control HOW the pipeline executes — depth, speed, agent strategy, and pipeline mode. This zone also sets the execution mode that propagates to all downstream phases.

**Questions (use AskUserQuestion, one at a time):**

1. "Pipeline mode — how ambitious should we be?"
   - **Expansion:** Go big. Deep investigation, all agents, challenge steps, explore alternatives.
   - **Hold:** Standard depth. Follow the process, cover edge cases, be thorough but not exhaustive.
   - **Reduction:** Ship fast. Minimum viable, skip optional agents, lighter docs.

2. "Backend coordination — does this need backend work?"
   - Will surface again in DESIGN Review (Backend Requirements Check)
   - Early signal helps planning

3. **Temporal interrogation (EXPANSION and HOLD only):**
   "Think ahead to implementation — what decisions need resolving NOW that will bite us in DESIGN or PLAN?"
   ```
   DESIGN phase:  What visual decisions should we lock now?
   PLAN phase:    What architecture constraints do we know?
   BUILD phase:   What will surprise us during implementation?
   ```

4. "Review depth — how thorough should reviews be?"
   - Standard: check against criteria
   - Deep: invoke /plan-eng-review or /plan-ceo-review at phase boundaries

5. "Timeline pressure — any deadline driving this? Does that change the mode?"

**Exit condition:** Execution mode selected and preferences captured.

**Ledger output:**
- Execution mode (Expansion/Hold/Reduction) → LOCKED
- Backend coordination signal → LOCKED
- Timeline pressure → LOCKED
- Review depth preference → LOCKED

---

## Questioning Discipline (All Zones)

### Rules:
- One AskUserQuestion per question. NEVER batch.
- Lead with recommendation: "We recommend [X] because [reason]"
- Follow up on vague answers. "Easy to use" → "Easy for who?"
- Reference GROUND findings in Zone 3 questions. Generic scope questions when you have codebase data = lazy.
- The user says "enough" or "move on" to advance to the next zone. YOU do not decide you have enough.
- Never ask a question the GROUND agent already answered.

### Anti-Patterns:
| Pattern | Fix |
|---------|-----|
| "What do you want to build?" without WHY first | Start with Zone 1 WHY questions |
| Generic scope questions ignoring GROUND | Reference specific files/patterns from GROUND |
| Stopping after 2 questions per zone | Keep asking until user says "move on" |
| "That makes sense, let me proceed" on vague answer | Challenge it: "Can you be more specific about...?" |
| Asking about preferences before understanding the problem | Zones are sequential: WHY → WHO → WHAT → HOW |
