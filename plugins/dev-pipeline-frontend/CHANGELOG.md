# Changelog

All notable changes to the `dev-pipeline-frontend` plugin are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## v4.5.0 — Make Decisions and Requirements Both Bind

**Released:** 2026-05-09

This release closes the Teach Mode silent-drop failure mode (8 specced features dropped during Wave 1 BUILD without detection) by extending the bridge schema with a Requirements Coverage section and adding a mechanical aggregation gate (`verify-requirements-coverage`) that the orchestrator runs unconditionally at every phase boundary.

### Added

- **Δ1** — `references/bridge-template.md` gains a `### Requirements Coverage` section (R-NN binding states OPEN/BOUND/UNBOUND) plus Echo-Back step 5b. Closes F4 / F18 / F24 / F29.
- **Δ2** — `references/manifest-template.md` gains a `## Dependencies (typed)` block (Type/Name/Version/Source-decision/Required-by). Closes F5 / F34.
- **Δ3** — Canonical `plugins/shared/tools/dev-pipeline-tools.js` gains `cmdVerifyRequirementsCoverage` (~111 LOC). 3-state taxonomy. `--scope wave|phase` flag. Sibling of `cmdVerifyDecisionCoverage`. Test fixtures (test9 PASS + test10 FAIL) added. Closes F4 / F6 / F18 / F29 (mechanical foundation).
- **Δ4** — `skills/dev/SKILL.md` gains a new `### Phase Boundary Aggregation` section + revised VALIDATE row in Phase Prerequisites table. Documents auto-rerun behavior (Δ12). All gate prose explicitly requires JSON `res.valid===true` parsing (not exit-code interpretation, since `output()` always exits 0). Closes F6 / F26 / F29 (orchestrator-side).
- **Δ9** — `skills/intake/SKILL.md` Stage 4 gains Q-DEPS structured-capture block. Distinguishes "no dependencies" (single `n/a` row) from "question skipped" (no row). Locked column-name parity with MANIFEST template. Closes F5 / F34.
- **Δ10** — `skills/design/SKILL.md` line 86 generalized from animation/UI/effect-only to MANIFEST Dependencies reconciliation against `package.json`. BLOCKING escalation when an `npm` row is missing. Includes pre-check fallback for features predating v4.5 INTAKE. Closes F35.
- **Δ11** — `commands/dev:update.md` post-update step surfaces stale `~/.claude/skills/dev/` directory if present. Closes F9.
- **Δ12** — Auto-rerun mechanism implemented in orchestrator (Wave 1b Δ4): `verify-requirements-coverage --scope phase` runs unconditionally at every phase-exit hook before bridge write. No `--refresh` flag, no `Last Verified Against` column, no caching — runtime <200ms on a 50-requirement feature. Closes AP-15.

### Changed

- **Δ5** — `references/mode-propagation-reference.md` Reduction VALIDATE row split: mechanical aggregation gate cannot reduce; "Manual line-by-line" preserved as separate spot-check row. Closes F25.

### Fixed

- **Δ6** — `skills/ship/SKILL.md` removes all 3 `git add -A` occurrences. New Stage 1c emits FILES_TO_STAGE list (filtered `git status --porcelain`) for user confirmation before any `git add`. awk regex `/^[MARD?]/` covers modifications, additions, renames, deletions, and untracked. Closes F31.
- **Δ7** — `skills/pause/SKILL.md` Step 6 removes `git add -A`. Explicit `git add .dev/` plus user-confirmed feature-file staging via literal `while read` loop. awk regex symmetric with ship. Closes F30.
- **Δ8** — Stale duplicate `plugins/dev-pipeline-frontend/shared/tools/dev-pipeline-tools.js` deleted (was 4-command stale copy of canonical 8-command file). Already misled one auditor. Closes F28 / F7'.

### Quality-gate polish (Wave 1.5 follow-ups)

User chose "Fix ALL WARNs" at the v4.5 quality gate. Five polish commits applied:
- `Δ7-fix` — pause Step 6 awk regex widened from `/^[MA]/` to `/^[MARD?]/` (BLOCK fix; untracked files were silently dropped).
- `Δ7-polish` — pause head -20 truncation removed (full file list + total count surfaced); pseudocode `git add` line replaced with literal `while read` loop.
- `Δ6-polish` — ship Stage 1c awk regex includes D/R codes (symmetric with pause).
- `Δ10-polish` — design frontmatter widened to mention MANIFEST Dependencies reconciliation; missing-section fallback added for features predating v4.5 INTAKE.
- `Δ4-polish` — dev/SKILL.md "every wave's verify-must-haves --wave N" pseudocode replaced with literal loop instruction.
- `Δ9-polish` — intake Q-DEPS adds explicit column-name parity paragraph against MANIFEST template.

### Deviations from EXECUTION_PLAN spec (recorded for audit)

- **Δ1 placement** — bridge-template insert after Key Artifacts Produced / before Focus for Next Phase (Wave 0 spike Q4 sign-off; deviates from plan's "between Open Questions and Dispatch Mandate" — spike grouped "what happened" content together).
- **Δ2 placement** — manifest-template insert after Artifacts / before Notion Integration (Wave 0 spike Q4 sign-off; plan said "after Domains" but `## Domains` does not exist in current template).
- **Δ4 wording** — orchestrator skill prose says "returns JSON `res.valid===true`" instead of plan's "exits 0". Reason: `output()` helper exits 0 unconditionally; "exits 0" wording would trip AP-13 (advisory-as-gate). The gate's binary-ness lives in JSON `res.valid`.
- **Δ12 design** — auto-rerun on every phase boundary (user re-affirmation Q2 chose this over the plan's `Last Verified Against` + `--refresh` design). Δ12 has zero footprint in tools.js; orchestrator-side only.

### Out of scope / deferred

- Backend plugin's own stale duplicate at `plugins/dev-pipeline-backend/shared/tools/dev-pipeline-tools.js` exists but Δ8 was scoped to frontend only. Recommend a parallel backend cleanup in a future backend release.
- F11 (verify-fix retry loop), F14 / F15 / F17 (test-strategy loader / Plan test plan / Layer 0 /qa) are explicitly DEFERRED to v4.6 / v5.0 per plan §7.1 anti-pattern guard against AP-04 (wire-in-skill ceremony without root-cause fix).

### Restraint gate

Wave 2a (v4.6) cannot start until v4.5.0 has shipped through ≥1 real feature end-to-end. Per EXECUTION_PLAN §8 sequencing rule.
