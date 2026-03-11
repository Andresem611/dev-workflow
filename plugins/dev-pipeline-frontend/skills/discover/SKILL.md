---
name: dev-discover
description: Use when /dev:discover is invoked or the pipeline transitions from INTAKE to DISCOVER. Handles brainstorming, codebase research, reuse audit, and boardroom debate for COMBINATION/NOVEL tiers.
---

# /dev:discover — Brainstorm + Codebase Research

Brainstorm requirements at tier-appropriate depth, audit the codebase for reuse, and confirm requirements before planning begins.

**Inner loop:** RESEARCH → EXECUTE → DOCUMENT → GATE

---

## RESEARCH

1. **Read MANIFEST** at `docs/[Feature]/.dev/MANIFEST.md` — extract:
   - `tier` (KNOWN / COMBINATION / NOVEL)
   - `domains` (routing, state, forms, api-integration, etc.)
   - `feature_name`, `entry_mode`, confirmed requirements from INTAKE

2. **Dispatch code-explorer subagent:**
   ```
   Agent tool:
     prompt: "[CoT Preamble]
       Analyze codebase for patterns related to [feature]:
       1. Reusable components: components/ui/, components/shared/, components/parent/, components/teacher/, components/student/
       2. API patterns: lib/*-api.ts
       3. State management: contexts/, hooks/, Redux slices
       4. Types: types/, lib/*-types.ts
       5. Similar features: search for analogous UI patterns
       Report: file paths, pattern descriptions, reuse recommendations"
   ```

3. **For COMBINATION/NOVEL only:** Read the boardroom skill pattern from `thoven-boardroom/SKILL.md` to prepare debate structure.

---

## EXECUTE

### Tier: KNOWN — Quick Brainstorm

Solo analysis. No boardroom.

1. Review INTAKE requirements + code-explorer findings
2. Ask 2-3 clarifying questions via `AskUserQuestion` (single round)
3. Confirm requirements fit an existing codebase pattern
4. Run reuse audit (see below)

### Tier: COMBINATION — Standard Brainstorm + Boardroom Debate

1. Review INTAKE requirements + code-explorer findings
2. Ask 3-5 clarifying questions via `AskUserQuestion`
3. **Boardroom debate (standard depth):**
   - Spawn 3-4 relevant roles as parallel subagents (select from: CTO, CPO, Head of Design, Head of Learning Science — pick roles matching the feature's domains)
   - Each role analyzes the feature from their perspective, proposes approach, flags risks
   - Synthesize: agreements, disagreements, the room's lean
   - Present synthesis to user — no formal judge round needed
4. Run reuse audit (see below)

### Tier: NOVEL — Deep Brainstorm + Full Boardroom Panel

1. Review INTAKE requirements + code-explorer findings
2. Ask 5-7 clarifying questions via `AskUserQuestion` (may need 2 rounds)
3. **Boardroom debate (full panel):**
   - Spawn all 7 roles as parallel subagents (CTO, CPO, CMO, Head of Growth, Head of Learning Science, Head of Design, CFO)
   - Each role: 3-5 key points, clear recommendation, expected disagreements, one question for the CEO
   - Run directed debate: message clashing roles to hash out disagreements (2-3 rounds max)
   - Synthesize: agreements, disagreements, questions for CEO, the room's lean
   - Present to user for decisions on unresolved disagreements
4. Run reuse audit (see below)

### Reuse Audit (ALL Tiers — Mandatory)

Dispatch code-explorer subagent:

```
Agent tool:
  prompt: "[CoT Preamble]
    Perform reuse audit for [feature]. Search:
    - components/ui/ and components/shared/ — UI primitives
    - components/parent/, components/teacher/, components/student/ — feature components
    - lib/*-api.ts — API functions
    - hooks/, lib/, contexts/ — custom hooks and state
    - types/, lib/*-types.ts — TypeScript interfaces

    For EACH item found, classify:
    - REUSE AS-IS: [component, path, why suitable]
    - EXTEND: [component, path, modifications needed]
    - NOT SUITABLE: [component, path, why not]

    List what MUST be created new, with justification."
```

### Reuse Decision Tree

```
Need a component/function/hook?
├── Does something similar exist in the codebase?
│   ├── YES → Can it be used as-is?
│   │   ├── YES → REUSE IT (record path + usage)
│   │   └── NO → Can it be extended without breaking existing consumers?
│   │       ├── YES → EXTEND IT (document changes needed)
│   │       └── NO → CREATE NEW (document why extension won't work)
│   └── NO → CREATE NEW (document search performed)
```

---

## DOCUMENT

1. **Update MANIFEST** — add to `docs/[Feature]/.dev/MANIFEST.md`:
   - Confirmed requirements (refined from brainstorm)
   - Reuse audit summary (counts: N reuse, N extend, N new)
   - Boardroom synthesis (COMBINATION/NOVEL only)
   - Key decisions from brainstorm
   - Phase status: DISCOVER → COMPLETE

2. **Generate transition file** — write `docs/[Feature]/prompt-transitions/discover-to-plan.md`:
   ```markdown
   # Transition: DISCOVER → PLAN
   ## Feature: [name]
   ## Tier: [tier]

   ## Confirmed Requirements
   [Refined requirements from brainstorm]

   ## Reuse Findings
   - Reuse as-is: [list with paths]
   - Extend: [list with paths + changes]
   - Create new: [list with justification]

   ## Key Decisions
   [From brainstorm/boardroom]

   ## Domains
   [From MANIFEST]

   ## Instructions for PLAN Phase
   - [Tier-specific guidance for architecture depth]
   - [Flag any unresolved disagreements from boardroom]
   ```

---

## GATE: G1 — Always Mandatory

Present results to user with tiered exit criteria:

### KNOWN Exit Criteria
- [ ] Requirements confirmed (clarifying questions resolved)
- [ ] Reuse audit complete (search performed, decisions made)
- [ ] Existing pattern identified that this feature follows

### COMBINATION Exit Criteria
- [ ] All KNOWN criteria met
- [ ] Boardroom debate conducted (3-4 roles)
- [ ] Architecture approach explored (room's lean documented)
- [ ] Cross-concern risks identified

### NOVEL Exit Criteria
- [ ] All COMBINATION criteria met
- [ ] Full boardroom panel debate conducted (7 roles)
- [ ] All disagreements resolved or escalated to user
- [ ] Research exhausted (no obvious unexplored angles)
- [ ] User confirmed direction on all open questions

Present via `AskUserQuestion`:
- question: "DISCOVER complete. [Summary: N requirements confirmed, N reuse/N extend/N new components, key decisions]. Proceed to PLAN?"
- options: "Approve — proceed to PLAN" | "Revise — [area to revisit]" | "Pause"

### After G1 Approval

Display `▶ Next Up` block and STOP:

```
---
▶ Next Up

Phase: PLAN — Architecture decisions + task breakdown

`dev-pipeline-frontend:plan`

/clear first → fresh context window
```

**STOP.** Do not invoke PLAN. Do not offer "continue in same session".

---

## Common Mistakes

| Mistake | Why It Fails | Prevention |
|---------|-------------|------------|
| Skipping reuse audit for KNOWN tier | "It's simple" — but duplicated components cause maintenance debt | Reuse audit is mandatory for ALL tiers, no exceptions |
| Running full boardroom for KNOWN features | Wastes context and time on solved patterns | Check tier FIRST, solo brainstorm for KNOWN |
| Boardroom with wrong roles | Spawning CFO for a UI-only feature adds noise | Select roles matching feature domains |
| Accepting vague requirements | "Make it look nice" passes through | Ask concrete clarifying questions with specific options |
| Reuse audit without file paths | "There's probably something we can reuse" | Subagent MUST return exact file paths or "not found" |
| Skipping transition file | Next phase loses brainstorm context | Always generate discover-to-plan.md before gate |
| Proceeding past G1 without approval | Violates gate protocol | Gate is ALWAYS mandatory — wait for user response |

---

## Boardroom Integration Reference

The boardroom pattern follows `thoven-boardroom/SKILL.md`. Key adaptations for DISCOVER:

- **No meeting notes file** — synthesis goes into MANIFEST instead
- **No formal judge round** — save that for PLAN phase architecture decisions
- **Role selection** — COMBINATION uses 3-4 roles; NOVEL uses all 7
- **Scope** — debate focuses on requirements and approach, NOT architecture details (that's PLAN)
- **Teammate prompt must include:** feature requirements, codebase findings from code-explorer, and the specific question to debate

### Spawning Boardroom Teammates

```
Agent tool (per role, in parallel):
  prompt: "You are the [ROLE] on the Thoven leadership team.
    YOUR TEAMMATES: [list selected roles]
    THOVEN CONTEXT: [from memory files if available]
    FEATURE: [name and requirements]
    CODEBASE FINDINGS: [from code-explorer]

    Analyze this feature from your role's perspective:
    1. Your 3-5 key points (specific, opinionated)
    2. Your recommendation (clear stance, no hedging)
    3. Expected disagreements with other roles
    4. One question for the CEO

    Be direct. This is a meeting, not a memo."
```

---

## Quick Reference

| Tier | Clarifying Qs | Boardroom | Roles | Reuse Audit | Gate |
|------|--------------|-----------|-------|-------------|------|
| KNOWN | 2-3 (1 round) | None | Solo | Mandatory | G1 |
| COMBINATION | 3-5 (1 round) | Standard | 3-4 selected | Mandatory | G1 |
| NOVEL | 5-7 (2 rounds) | Full panel | All 7 | Mandatory | G1 |
