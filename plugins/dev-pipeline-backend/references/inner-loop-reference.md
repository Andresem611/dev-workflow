# Inner Loop Reference -- Backend Plugin

Canonical reference: `${PLUGIN_ROOT}/../shared/references/inner-loop-reference.md`

This document supplements the shared inner-loop reference with backend-specific details.
All stage mechanics (Discuss, Architect, Execute, Review) and transition rules are defined
in the shared reference. Read it first; this file only covers what differs.

---

## Phase Chain

```
INTAKE -> DISCOVER -> PLAN -> DOCUMENT -> BUILD -> VALIDATE -> SHIP
```

**No DESIGN phase.** Backend features skip DESIGN entirely and move from PLAN directly
to DOCUMENT. The `design/` subdirectory is never created for backend features.

---

## Tool Flag

All tool calls use `--plugin backend`:

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry <phase> <stage> <dir> --plugin backend
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output <phase> <stage> <dir> --plugin backend
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js checkpoint-state <dir> --scope wave|phase --plugin backend
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest <dir> --plugin backend
```

---

## Plugin-Specific Artifact Names

Most phases use the shared defaults from the canonical reference. Overrides:

| Phase | Stage | Artifact Name |
|-------|-------|---------------|
| DISCOVER | Discuss | `discuss-feature-requirements.md` |

All other phases follow the shared artifact naming table.

---

## Directory Structure (no DESIGN)

Backend features omit the `design/` subdirectory:

```
docs/[Feature]/.dev/
  MANIFEST.md
  intake/
  discover/
  plan/
  document/        <-- follows directly after plan
  build/
    wave-01/
    wave-NN/
  validate/
  ship/
```

---

## Agent Lookup

See `references/domain-agent-map.md` for backend agent assignments per phase.

---

## Skill Invocation

```
Skill(dev-pipeline-backend:<phase>)
```

Where `<phase>` is one of: intake, discover, plan, document, build, validate, ship.

---

## Key Decision Reminder

| ID | Rule |
|----|------|
| D14 | BUILD runs inner loop per wave, not once for the whole phase |
| D16 | PAUSE is operational only -- no inner loop |
