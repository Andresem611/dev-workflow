# Inner Loop Reference -- Frontend Plugin v4.0

Canonical reference: `${PLUGIN_ROOT}/../shared/references/inner-loop-reference.md`

This document supplements the shared inner-loop reference with frontend-specific details.
All stage mechanics (Discuss, Architect, Execute, Review) and transition rules are defined
in the shared reference. Read it first; this file only covers what differs.

---

## Phase Chain (v4.0)

```
INTAKE -> DISCOVER -> DESIGN -> [BACKEND GATE] -> PLAN -> DOCUMENT -> BUILD -> VALIDATE -> SHIP
```

**v4.0 change:** DESIGN runs BEFORE PLAN so architecture decisions are informed by the actual UI spec. The backend gate in DESIGN Review checks for unmet backend data needs and produces a requirements-only feature brief if needed.

**DESIGN always runs** (D15) -- it is not conditional on domain tags or feature type.
Every frontend feature passes through DESIGN between DISCOVER and PLAN.

---

## Tool Flag

All tool calls use `--plugin frontend`:

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry <phase> <stage> <dir> --plugin frontend
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output <phase> <stage> <dir> --plugin frontend
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js checkpoint-state <dir> --scope wave|phase --plugin frontend
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest <dir> --plugin frontend
```

---

## Plugin-Specific Artifact Names

Most phases use the shared defaults from the canonical reference. Overrides:

| Phase | Stage | Artifact Name |
|-------|-------|---------------|
| DISCOVER | Discuss | `discuss-ui-requirements.md` |
| DESIGN | Discuss | `discuss-visual-direction.md` |
| DESIGN | Architect | `architect-design-plan.md` |
| DESIGN | Execute | `execute-design-spec.md` |
| DESIGN | Review | `review-design-compliance.md` |

All other phases follow the shared artifact naming table.

---

## Directory Structure (v4.0 ordering)

Frontend features include the `design/` subdirectory BEFORE `plan/`:

```
docs/[Feature]/.dev/
  ...
  discover/
  design/          <-- v4.0: BEFORE plan, always present
  plan/
  document/
  ...
```

---

## Agent Lookup

See `references/domain-agent-map.md` for frontend agent assignments per phase.

**Mandatory Read enforcement:** Every Architect stage MUST `Read(references/domain-agent-map.md)` using the Read tool before designing agent prompts. Natural language references ("see domain-agent-map") are insufficient — the orchestrator must actually open the file and extract agent assignments for the current phase.

---

## Step 0: Load Context + Echo-Back (v4.0.0)

Every Discuss stage begins with MANDATORY CONTEXT LOADING:
1. Use the Read tool on each required file (context bridge, domain-agent-map, inner-loop-reference, codebase-context-block)
2. Read the Decision Ledger from MANIFEST
3. Extract the noted fields from each file
4. DO NOT proceed to questions until all reads complete
5. If any file is missing, STOP and surface the gap to the user

**Echo-Back (v4.0.0):** After loading context, the orchestrator MUST echo back LOCKED decisions from the Decision Ledger before asking any questions:
```
Loaded context from [PREVIOUS PHASE]:
- [N] LOCKED decisions: U-01 (description), U-02 (description), ...
- [N] OPEN decisions: A-01 (description), ...
- Key artifacts: [list]
- Focus areas: [from bridge]
```
If the echo-back is incomplete → re-read the bridge. See `references/bridge-template.md`.

Every Architect stage begins with VERIFY CONTEXT LOADED:
1. Confirm domain-agent-map was Read — list ALL agents from the map for this phase
2. Each agent listed as "dispatched" or "skipped (reason)" — silent omission not allowed
3. Check Domain Combination Patterns table for extra considerations
4. Verify all LOCKED decisions from the ledger are addressed in agent prompts
5. This verification appears in the Orchestration Log under `Map compliance`

---

## Decision Ledger (v4.0.0)

The Decision Ledger tracks user vs agent decisions across the pipeline. See `references/decision-ledger-template.md` for full spec.

Key rules:
- User decisions = LOCKED by default. Agent decisions = OPEN until user confirms.
- LOCKED decisions propagate through EVERY bridge — copied verbatim, never summarized.
- Review stages check for LOCKED violations: did Execute contradict any user decision?
- BUILD agent prompts include all LOCKED items in a "DO NOT OVERRIDE" section.

---

## 4-Zone Discuss (v4.0.0)

DISCOVER Discuss uses 4 structured zones instead of flat question lists. Other phases use adapted versions. See `references/discuss-zones-reference.md` for full spec.

Zones: WHY (premise challenge) → WHO (empathy + 11-star) → WHAT (GROUND-informed scope) → HOW (mode selection + temporal interrogation)

---

## Mode-Driven Depth (v4.0.0)

Execution mode (Expansion/Hold/Reduction) is set in DISCOVER Zone 4 and controls depth of all downstream phases. See `references/mode-propagation-reference.md` for the full depth matrix.

Mode can be upgraded mid-pipeline (never downgraded). LOCKED in Decision Ledger.

---

## Backend Gate (v4.0.0)

DESIGN Review includes a Backend Requirements Check. When backend data needs are unmet, produces `backend-feature-brief.md` (requirements-only — no shapes/architecture; validated by `validate-handoff-brief`). See `references/backend-feature-brief-template.md`. The backend designs the contract — the FE never authors it.

User chooses: parallel (local-only mocks + CONTRACT-LANDED monitor) / pause + handoff. The brief routes to the backend as "frontend handoff" → DISCOVER.

---

## Auto-Research (v3.0.0, updated v4.0.0)

DISCOVER, DESIGN, PLAN, and BUILD Discuss stages automatically dispatch Explore agents before asking questions. This was opt-in (D09) in v2.x; it is now mandatory. Questions are informed by codebase reality instead of asked "blind."

The GROUND step dispatches an Explore agent to scan relevant files BEFORE the orchestrator formulates questions. In DISCOVER, GROUND findings directly inform Zone 3 (WHAT) questions. Skip only if: PAUSE resume, DEV router override, or user explicitly says "skip ground."

---

## Skill Invocation

```
Skill(dev-pipeline-frontend:<phase>)
```

Where `<phase>` is one of: intake, discover, plan, design, document, build, validate, ship.

---

## D04 Enforcement

D04 enforcement protocol (prompt-generator hard gate) is defined in the shared inner-loop-reference.md Section 10. All frontend phases MUST follow it. Every `architect-*.md` artifact MUST include the Orchestration Log section.

**D04 fallback (v3.0.0):** When `/prompt-generator` is unavailable, the orchestrator must `Read(references/agent-prompt-template.md)` using the Read tool instead of passively referencing it. The template IS the fallback — ad-hoc prompt crafting is not acceptable.

## Orchestration Log (v3.0.0 expansion)

Every `architect-*.md` artifact includes an Orchestration Log with these mandatory fields:

```markdown
### Orchestration Log
- Prompt method: `/prompt-generator` | `agent-prompt-template.md` fallback
- Map compliance: [list every agent from domain-agent-map for this phase — dispatched or skipped with reason]
- Domain combinations: [any domain-combo patterns that apply, with extra considerations]
- Agents dispatched: [agent-type: task description]
- Agents skipped: [agent-type: reason]
```

---

## Key Decision Reminder

| ID | Rule |
|----|------|
| D15 | DESIGN phase always runs for frontend -- never skipped. v4.0: DESIGN runs BEFORE PLAN. |
| D14 | BUILD runs inner loop per wave, not once for the whole phase |
| D16 | PAUSE is operational only -- no inner loop |
| D17 | **Opinionated recommendations.** Every `AskUserQuestion` MUST lead with "We recommend [X]: [reason]" before listing options. No balanced menus — state a directive, explain WHY, then list alternatives. Map reasoning to engineering preferences: DRY, tests non-negotiable, explicit > clever, minimal diff, handle edge cases over speed. If the fix is obvious with no real tradeoff, just state what you'll do and move on — don't waste a question. |
| D19 | **Decision Ledger.** User decisions = LOCKED by default. Agent decisions = OPEN. LOCKED items propagate verbatim through every bridge. Agents cannot remove LOCKED items without flagging in Review. |
| D20 | **Echo-back.** Every Discuss stage must echo-back LOCKED decisions from the bridge before asking questions. Failed echo-back = re-read bridge. |
| D21 | **4-Zone Discuss.** DISCOVER uses WHY/WHO/WHAT/HOW zones. Other phases use adapted versions. See `discuss-zones-reference.md`. |
| D22 | **Mode-driven depth.** Execution mode set in DISCOVER Zone 4 propagates to all phases. Can upgrade, never downgrade. See `mode-propagation-reference.md`. |
| D23 | **Backend gate.** DESIGN Review checks for unmet backend data needs and produces a requirements-only feature brief if needed (FE never authors the contract). See `backend-feature-brief-template.md`. |
