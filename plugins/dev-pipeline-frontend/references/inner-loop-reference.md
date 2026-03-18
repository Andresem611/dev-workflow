# Inner Loop Reference -- Frontend Plugin

Canonical reference: `${PLUGIN_ROOT}/../shared/references/inner-loop-reference.md`

This document supplements the shared inner-loop reference with frontend-specific details.
All stage mechanics (Discuss, Architect, Execute, Review) and transition rules are defined
in the shared reference. Read it first; this file only covers what differs.

---

## Phase Chain

```
INTAKE -> DISCOVER -> PLAN -> DESIGN -> DOCUMENT -> BUILD -> VALIDATE -> SHIP
```

**DESIGN always runs** (D15) -- it is not conditional on domain tags or feature type.
Every frontend feature passes through DESIGN between PLAN and DOCUMENT.

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

## Directory Structure (DESIGN addition)

Frontend features include the `design/` subdirectory:

```
docs/[Feature]/.dev/
  ...
  plan/
  design/          <-- frontend only, always present
  document/
  ...
```

---

## Agent Lookup

See `references/domain-agent-map.md` for frontend agent assignments per phase.

**Mandatory Read enforcement:** Every Architect stage MUST `Read(references/domain-agent-map.md)` using the Read tool before designing agent prompts. Natural language references ("see domain-agent-map") are insufficient — the orchestrator must actually open the file and extract agent assignments for the current phase.

---

## Step 0: Load Context (v3.0.0)

Every Discuss stage begins with MANDATORY CONTEXT LOADING:
1. Use the Read tool on each required file (context bridge, domain-agent-map, inner-loop-reference, codebase-context-block)
2. Extract the noted fields from each file
3. DO NOT proceed to questions until all reads complete
4. If any file is missing, STOP and surface the gap to the user

Every Architect stage begins with VERIFY CONTEXT LOADED:
1. Confirm domain-agent-map was Read — list ALL agents from the map for this phase
2. Each agent listed as "dispatched" or "skipped (reason)" — silent omission not allowed
3. Check Domain Combination Patterns table for extra considerations
4. This verification appears in the Orchestration Log under `Map compliance`

---

## Auto-Research (v3.0.0)

DISCOVER, PLAN, and BUILD Discuss stages automatically dispatch Explore agents before asking questions. This was opt-in (D09) in v2.x; it is now mandatory. Questions are informed by codebase reality instead of asked "blind."

The GROUND step dispatches an Explore agent to scan relevant files BEFORE the orchestrator formulates questions. Skip only if: PAUSE resume, DEV router override, or user explicitly says "skip ground."

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
| D15 | DESIGN phase always runs for frontend -- never skipped |
| D14 | BUILD runs inner loop per wave, not once for the whole phase |
| D16 | PAUSE is operational only -- no inner loop |
| D17 | **Opinionated recommendations.** Every `AskUserQuestion` MUST lead with "We recommend [X]: [reason]" before listing options. No balanced menus — state a directive, explain WHY, then list alternatives. Map reasoning to engineering preferences: DRY, tests non-negotiable, explicit > clever, minimal diff, handle edge cases over speed. If the fix is obvious with no real tradeoff, just state what you'll do and move on — don't waste a question. |
