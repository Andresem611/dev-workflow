# Changelog

All notable changes to the `dev-pipeline-frontend` plugin are documented here. Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## v5.0.0 — Personas, TDD, Decomposition, Cross-Model

**Released:** 2026-05-09

This release lands the four major v5.0 capabilities: a PERSONA sub-phase with three sequential personas (Frontend Designer, Product, Backend opt-in), TDD strict-edit guardrail with SHA256-locked test files, DISCOVER decomposition detection for Teach Mode-class features, and Codex cross-model consult at BUILD→VALIDATE / VALIDATE→SHIP boundaries. Also adopts EARS sentence shapes within the existing categorical-prefix scheme.

### Added — Wave 3 (Decomposition / R-NEW-3)

- **Δ1** — `skills/discover/SKILL.md` Stage 3.5 Decomposition Detection. 4 trigger signals (multi-journey >3 / multi-model >2 / multi-integration >2 / multi-wave >5); 2-of-4 fires on Hold (1-of-4 on Expansion); 3-option AskUserQuestion (Decompose / Acknowledge in-place / Reject signal). Reduction skips entirely.
- **Δ2** — `references/manifest-template.md` `## Upstream Pipelines` section (Pipeline name / Path / Required artifact / Status / Mock fallback).
- **Δ3 ship-side** — `skills/ship/SKILL.md` Verification Checklist gate: every Upstream Pipelines row must have `Status=shipped` OR `Mock fallback != n/a`. Otherwise BLOCK ship.

### Added — Wave 4 (PERSONA / R-NEW-1)

- **NEW** `skills/persona/SKILL.md` — three sequential personas: Frontend Designer (always), Product (always), Backend (opt-in via Cross-Stack: backend tag — locked at user pre-flight Q4). Question budget per mode: Reduction 3/3/skip; Hold 5/5/5; Expansion 8/8/8 + cross-persona challenge round. Style lifted from grill-me: one question at a time, recommended answers, codebase-exploration shortcut.
- **NEW** `commands/dev:persona.md` invoker.
- `skills/dev/SKILL.md` — PERSONA inserted between DISCOVER Zone 4 and DESIGN entry in phase chain. Phase Boundary Aggregation gains DISCOVER→PERSONA + PERSONA→DESIGN rows. PERSONA→DESIGN gate: presence-of-population on Persona Answers MANIFEST sections.
- `references/manifest-template.md` — three new sections: `## Frontend Persona Answers`, `## Product Persona Answers`, `## Backend Persona Answers` (last only populated for Cross-Stack: backend features).

### Added — Wave 5 (TDD strict-edit / R-NEW-2)

- **NEW tools.js commands** — `cmdVerifyTestImmutability` and `cmdOverrideTest`. Total tools.js: 10 commands.
- **`@test-contract` frontmatter** — TypeScript test files emit JSDoc frontmatter with `@feature`, `@task`, `@must-haves`, `@sha256` (SHA256 of content excluding the @sha256 line itself), `@locked-at`. Cross-tool sanity: hash matches between Node `crypto.createHash("sha256")` and shell `shasum -a 256`.
- **NEW `references/test-file-template.md`** — frontmatter shape + per-field semantics + DOCUMENT generates / BUILD verifies pattern.
- **NEW `references/test-immutability-protocol.md`** — 4-step override path. User types attestation `OVERRIDE T-NN: <reason>` exactly. NO `--force` flag. Append-only `.dev/test-overrides.log`.
- `skills/document/SKILL.md` Section 3.5 Test Authoring (TDD-first) — emit one test per task per must-have. Section 3.5.1 EARS-within-categorical-prefixes paragraph. Section 3.5.2 Amendment-driven re-DOCUMENT path (AP-15).
- `skills/build/SKILL.md` Layer 0 Test Immutability Check — pre-wave gate; BLOCKs on hash drift; references both immutability-protocol and test-file-template.
- 3 new test fixtures (test11/test12/test13) — total 13/13 passing.

### Added — Wave 6 (Cross-model + EARS / RP3 + O3)

- **NEW `references/cross-model-consult-prompt-template.md`** — adapted from LEARNINGS Phase 3 Codex shard. 7 review classes (contract drift, auth bypass, conditional side effects, must_haves silent-drop, mock-of-FuT, frontend-specific, decision-ledger fidelity). Verdict: PASS / WARN / NEEDS_WORK / HIGH_RISK. Cost ceiling **$1.00/consult** (user-set in Wave 6 checkpoint, raised from runbook's recommended $0.50).
- `skills/build/SKILL.md` After Final Wave — Cross-Model Independent Review section. Hold + Expansion runs Codex consult. NEEDS_WORK BLOCKS; HIGH_RISK BLOCKS + auto-escalates to Expansion. Env: `DEV_PIPELINE_CROSS_MODEL=codex|gemini|off` (default codex per AP-05 watchdog); `DEV_PIPELINE_CROSS_MODEL_CEILING=1.00`.
- `skills/validate/SKILL.md` Section 3.12 Cross-Model Review (Expansion only) — same mechanism, lighter prompt focused on ship-readiness. Cost-bounded ($2/feature in Expansion vs $1/feature in Hold).
- `references/requirements-template.md` — merged in **EARS Sentence Shapes** section (Ubiquitous / Event-driven / State-driven / Optional/conditional). EARS lives at the bullet-grammar level WITHIN existing categorical prefixes (UI-NN / A11Y-NN / etc.). `verify-requirements-coverage` tool unaffected — reads MANIFEST table by column, not sentence.
- `skills/document/SKILL.md` 3.5.1 — EARS-within-categorical-prefixes paragraph; required for v5.0+ features.

### Fixed (Wave 6.5 quality-gate follow-ups)

- **validate frontmatter widening** (BLOCK fix) — description now mentions Cross-Model consult so skill discovery surfaces it.
- **build references test-file-template.md** (BLOCK fix) — Layer 0 now points at the format spec; producer-consumer wire complete.
- **persona AP-13 gate reconciliation** — explicitly BLOCK on presence-of-population (was ambiguously phrased "advisory" earlier).
- **persona AP-15 amendment-propagation protocol** — when a PERSONA-sourced LOCKED decision is amended, single-question refresh.
- **document Section 3.5.2 amendment-driven re-DOCUMENT path** — two-step flow (override-test then `/dev:document --task T-NN`).
- **validate Section 3.6 consumes BUILD CONTRACT DRIFT** — gate triggers on `api-integration` domain OR BUILD-emitted drift warning.

### Plan deviations (recorded for audit)

- **Wave 6.5-C subagent-creator elevate-existing pass skipped** — subagent-creator skill is for agent file creation/elevation; the W6.5-A skill-reviewer covered the same surface for SKILL.md files.
- **Wave 6 Cost ceiling raised** — user chose $1.00/consult vs runbook's recommended $0.50. EARS adopted now in v5.0 vs runbook's recommended defer-to-v5.1.
- **Wave 6 requirements-template.md merge variant** — file already existed (191 LOC, in-use by dev/ and plan/SKILL.md); spec asserted "NEW reference" but reality required merge to preserve downstream contracts. Option B (merge) selected: existing categorical prefix scheme preserved + new EARS Sentence Shapes section added.
- **Wave 5 Section 3.5 placement (DOCUMENT)** — runbook said Section 4.6 Test Authoring; existing 4.6 was Notion Update. Pivoted to Section 3.5 (between Wave File Structure and Stage Artifact). Cross-references aligned.

### Restraint gates fired

- **1.5→2a:** "Has v4.5.0 been used through ≥1 real feature?" — user override YES (proceeded).
- **2.5→3:** "Has v4.6.0 caught ≥1 real failure?" — user override YES (proceeded).

Both overrides recorded as user-acknowledged escape hatches.

### Anti-pattern watchdog log

Zero unresolved trips. AP-05 (Cross-Model Independent Review) confirmed: default = `codex`, `=off` is opt-out only, NOT default. AP-13 (advisory-as-gate) reconciled at Wave 6.5 (persona). AP-15 (amendment propagation) closed via auto-rerun (v4.5-Δ12 user-locked) + persona refresh + document amendment-driven re-DOCUMENT path.

### Out of scope / deferred

- F11 verify-fix retry loop deferred to v5.1.
- F14 / F15 / F17 (test-strategy loader / PLAN test plan / Layer 0 /qa scope expansion) deferred per AP-04 watchdog (wire-in-without-root-cause-fix).
- Backend plugin's stale duplicate cleanup remains scoped to backend release.
- AST tooling for AP-T5 (snapshot-only) deferred to v5.1 (BUILD Layer 2 uses simplified line-only fallback in v5.0).

### Migration notes

Pre-v5.0 features: existing requirements.md prose-style files NOT retroactively migrated. New v5.0+ features adopt EARS within categorical prefixes from authoring-time.

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
