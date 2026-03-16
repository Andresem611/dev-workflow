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

---

## Skill Invocation

```
Skill(dev-pipeline-frontend:<phase>)
```

Where `<phase>` is one of: intake, discover, plan, design, document, build, validate, ship.

---

## D04 Enforcement

D04 enforcement protocol (prompt-generator hard gate) is defined in the shared inner-loop-reference.md Section 10. All frontend phases MUST follow it. Every `architect-*.md` artifact MUST include the Orchestration Log section.

---

## Key Decision Reminder

| ID | Rule |
|----|------|
| D15 | DESIGN phase always runs for frontend -- never skipped |
| D14 | BUILD runs inner loop per wave, not once for the whole phase |
| D16 | PAUSE is operational only -- no inner loop |
| D17 | **Opinionated recommendations.** Every `AskUserQuestion` MUST lead with "We recommend [X]: [reason]" before listing options. No balanced menus — state a directive, explain WHY, then list alternatives. Map reasoning to engineering preferences: DRY, tests non-negotiable, explicit > clever, minimal diff, handle edge cases over speed. If the fix is obvious with no real tradeoff, just state what you'll do and move on — don't waste a question. |
