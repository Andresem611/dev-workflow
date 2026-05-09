# Changelog

All notable changes to the `dev-pipeline-frontend` plugin are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## v4.6.0 — Verify Against Real Systems

**Released:** 2026-05-09

This release lands the real-system verification proposals from the Teach Mode post-mortem: two-client smoke for collaborative features, live-backend integration vitest (no mocks), curl contract gate diffed against API_CONTRACT.md, and a BUILD-time CONTRACT DRIFT scan on `lib/*-api.ts` waves. v4.5 made decisions and requirements bind to artifacts; v4.6 makes those artifacts bind to running systems.

### Added

- **Δ1** — `skills/validate/SKILL.md` Section 3.4 Two-Client Smoke Test. Triggered by collaborative-keyword set (15 keywords incl. `tldraw/sync`, `websocket`, `webrtc`). 6-step symmetric-propagation test across two browser contexts. **Blocking** on no-keyword-skip and on fail. Closes F3.
- **Δ2** — Section 3.5 Live-BE Integration Vitest. Triggered by `lib/*-api.ts` touches in the wave. Spec **must not mock fetch** — vi.mock( in spec file produces explicit FAIL message. Real-fetch against staging; asserts response envelope against API_CONTRACT.md. Closes F1, F13.
- **Δ3** — Section 3.6 Curl Contract Gate. Triggered when MANIFEST domains include `api-integration`. For each row in `<feature>/api/API_CONTRACT.md`, runs `curl -i` against staging and diffs status code + top-level JSON keys. Closes F10, F12.
- **Δ7** — Section 3.0 Layer 0 `/qa --diff-aware`. Advisory tier; runs unconditionally before manual VALIDATE. Skipped on Reduction mode. Closes F17 (partial; advisor flagged H evidence — polish tier).
- **Δ4** — `skills/build/SKILL.md` Layer 2 CONTRACT DRIFT re-verification. When wave touches `lib/*-api.ts` or `cross-stack: backend` flag set, runs verify-must-haves and emits warning if `auto_appended > 0`. WARN gates VALIDATE Section 3.6 (does not block Layer 2 itself). Closes F10, F33.
- **Δ5** — `skills/document/SKILL.md` appends `## test-anti-patterns` block to every wave file's must_haves, pointing BUILD Layer 2 at the catalog. Closes F16.
- **Δ6** — NEW `references/testing-anti-patterns.md`. 5-pattern catalog (mock-of-FuT, tautology, it.skip, expect(_), snapshot-only). Each pattern: regex / severity / FP caveat / override path / feasibility note. WARN severity per O5.
- **Δ8** — `skills/pause/SKILL.md` resume Step 7. After environment freshness checks, runs `git diff --stat <pause-commit>..HEAD -- src/`; warns (non-blocking) on non-empty diff. Closes F27.

### Changed

- **Renumber prep** — validate Sections 3.4-3.8 (Optional Checks, Post-Development Audit, Goal-Backward Verification, Failure Mode Analysis, Artifact) shifted to 3.7-3.11 to accommodate new blocking gates at 3.4/3.5/3.6. Cross-ref scan confirmed locally contained — no other plugin file referenced these sections by number.

### Fixed (Wave 2.5 quality-gate follow-ups)

- **pause Step 6→Step 7 wire** (BLOCK fix) — Step 6 now appends `pause-commit: <sha>` to `.dev/pause-handoff.md`. Step 7 reads that field. Step 7 opening line clarified: runs ON RESUME, not at pause-time. Removed misleading "freshness checks (Step 5/6)" wording.
- **build catalog wire** (BLOCK fix) — Layer 2 now references `references/testing-anti-patterns.md` and applies each pattern's regex with `// AP-T<N>-OVERRIDE:` comment honor. document/SKILL.md's promise that BUILD scans the catalog is now honored.
- **build line-range cite** — replaced "lines 907-953 in tools.js" with function name `cmdVerifyMustHaves`.
- **build CONTRACT DRIFT clarity** — added "This warning does not block Layer 2 PASS; it gates VALIDATE Section 3.6" to remove AP-13-style ambiguity.
- **document Δ6 leak** — stripped internal-changelog tag "(see Δ6)" from shipped skill text.
- **document Reduction-mode reconciliation** — embedded test-anti-patterns block now matches reference doc's pattern-subset semantics ("AP-T1 + AP-T2 + AP-T4 only on Reduction") instead of the contradictory "severity reduces to log-only" wording.
- **testing-anti-patterns feasibility notes** — AP-T1 path-resolution and AP-T5 AST-aware scoping flagged as v4.6-simplified with explicit deferral notes (AST tooling deferred to v5.0+).

### Plan deviations (recorded for audit)

- **2a section-numbering collision** — runbook spec said validate had only Sections 3.1/3.2/3.3 (per SKILL_AUDIT §2.3). File actually had 3.1-3.8. Renumbering prep commit added; cross-ref scan confirmed no external dependencies. Plan was stale relative to file.
- **G-2a-3 grep window** — plan-prescribed verification used `grep -A 5 '### 3.4'` which couldn't reach the keyword line at offset 7. Adjusted to `-A 10`. Functional content unaffected.

### Out of scope / deferred

- F11 (verify-fix retry loop), F14 (test-strategy loader), F15 (PLAN test plan), and the AST-tooling for AP-T5 are explicitly DEFERRED to v5.0 per plan §7.1 anti-pattern guard against AP-04.
- Backend plugin's stale duplicate cleanup remains scoped to backend release.

### Restraint gate

Wave 3 (v5.0 decomposition) cannot start until v4.6.0 has caught ≥1 real failure that the prior pipeline missed (any of: 2-client smoke, live-BE vitest, curl gate, contract drift, anti-pattern scan). Per EXECUTION_PLAN §8 sequencing rule.

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
