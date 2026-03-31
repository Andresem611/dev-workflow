# Dev Pipeline Overhaul v4 — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task.

**Goal:** Upgrade dev-pipeline-backend to v3.4.0 and dev-pipeline-frontend to v4.1.0 with mechanical enforcement for BUILD verification, between-wave tracking, and DESIGN approval gates.

**Architecture:** All tool changes go into `plugins/shared/tools/dev-pipeline-tools.js` (860-line Node.js CLI, commander pattern with 5 existing commands). A new test file validates all additions. Skill prose changes modify 3 markdown files: backend BUILD, frontend BUILD, frontend DESIGN. Tool changes first, skill changes second.

**Tech Stack:** Node.js (CLI tool), Markdown (skill files), no frameworks, no database

**Working directory:** `/Users/andresmartinez/thoven/dev-pipeline/frontend`

---

## Context

Audit of 5 completed features revealed: broken phase chain ordering (v4.0 moved DESIGN before PLAN but tool was not updated), 60-100% artifact trail gaps, MANIFEST never updated between waves, and no structured verification-fix loop in BUILD Review. This plan adds mechanical enforcement via tooling and restructures the BUILD Review and DESIGN Discuss stages.

**Critical files:**
- `plugins/shared/tools/dev-pipeline-tools.js` — the tool being extended (859 lines)
- `plugins/dev-pipeline-backend/skills/build/SKILL.md` — backend BUILD skill (651 lines)
- `plugins/dev-pipeline-frontend/skills/build/SKILL.md` — frontend BUILD skill
- `plugins/dev-pipeline-frontend/skills/design/SKILL.md` — frontend DESIGN skill (448 lines)

---

## Task 1: Fix Frontend Phase Chain (P0 Bug)

**Files:**
- Modify: `plugins/shared/tools/dev-pipeline-tools.js:31`

**What to change:** Line 31 has the frontend phase chain with "plan" before "design". Swap them so "design" comes before "plan", matching v4.0 ordering.

Current: `frontend: ["intake", "discover", "plan", "design", "document", "build", "validate", "ship"]`
Fixed: `frontend: ["intake", "discover", "design", "plan", "document", "build", "validate", "ship"]`

**Verify:** `node -e "require('./plugins/shared/tools/dev-pipeline-tools.js'); console.log('OK');"` should print OK.

**Commit:** `git commit -m "fix: frontend phase chain ordering — design before plan (P0)"`

---

## Task 2: Shared Routes Parser + Auto-Append API Contract (B-5)

**Files:**
- Modify: `plugins/shared/tools/dev-pipeline-tools.js`

**What to build:**

1. **parseRoutesFile(routesPath)** function — Insert after `parsePhaseProgress` (after line ~139), before `// --- Helpers ---`. Parses routes.rb and returns `[{method, path, controller}]` array. Handle two patterns:
   - Explicit routes: `get '/path', to: 'controller#action'`
   - Resources: `resources :name` (generates standard CRUD routes)

2. **Auto-append in cmdVerifyMustHaves** — After the key_links verification section (after line ~790), before stub errors check. When plugin is "backend":
   - Read API_CONTRACT.md from `<feature-dir>/api/API_CONTRACT.md`
   - Parse routes.rb via parseRoutesFile
   - Diff: find routes not in the contract
   - Auto-append missing routes as markdown table rows with TBD fields: `| path | METHOD | TBD | NEW | TBD | Wave N (auto-discovered) |`
   - If contract file does not exist, create it with header + all discovered routes
   - Report count of auto-appended routes in warnings array

**Key detail:** Use `fs.appendFileSync` for existing contracts, `fs.writeFileSync` for new ones. Create the `api/` directory with `{ recursive: true }` if needed.

**Verify:** Module loads without error.

**Commit:** `git commit -m "feat: shared routes parser + auto-append API contract (B-5)"`

---

## Task 3: Artifact Trail + Completion Log Enforcement (B + E)

**Files:**
- Modify: `plugins/shared/tools/dev-pipeline-tools.js` — `cmdValidateStageEntry` function

**What to build:**

1. **Artifact trail check (Item B)** — In `cmdValidateStageEntry`, inside the `if (stage === "discuss")` block. When entering BUILD wave N+1 (wave > 1), check that previous wave directory has all 4 artifacts: `discuss-*.md`, `architect-*.md`, `execute-*.md`, `review-*.md`. Use existing `findArtifact()` helper. Missing artifacts are BLOCKING issues (push to `res.issues`).

2. **Completion log quality check (Item E)** — In `cmdValidateStageEntry`, inside the `if (stage === "review")` block. When reviewing BUILD wave N, read task files referenced in the wave file, check each has a `## Completion Log` section with non-empty `Files touched` and `Discoveries` fields. Missing/empty fields are WARNINGS (push to `res.warnings`), not blocking.

**Key detail:** Wave file is at `<feature-dir>/waves/WAVE_NN.md`. Task files at `<feature-dir>/tasks/TASK_XX.md`. Use regex to extract task references from wave file.

**Verify:** Module loads without error.

**Commit:** `git commit -m "feat: artifact trail + completion log checks in validate-stage-entry (B+E)"`

---

## Task 4: update-wave-tracking Command (F)

**Files:**
- Modify: `plugins/shared/tools/dev-pipeline-tools.js`

**What to build:**

New command `cmdUpdateWaveTracking` that mechanically updates between-wave tracking files. Insert before the CLI router's `main()` function.

**Usage:** `node dev-pipeline-tools.js update-wave-tracking <feature-dir> --plugin backend|frontend --wave N`

**Logic:**
1. Read current wave's completion data (execute results, task completion logs)
2. Update MANIFEST: set `current_wave` to N, `build_progress` to "Wave N complete"
3. Update CURRENT_STATUS.md: rewrite the Current Status section with phase=BUILD, wave=N complete, date=today
4. Update next wave file (WAVE_N+1.md): populate "Key discoveries to carry forward" from current wave's task completion logs
5. Warn about IMPLEMENTATION_STATUS (format-specific, recommend manual review)

**Output:** JSON with `updated` array (which files changed) and `warnings` array. Raw mode: `DONE: Updated N tracking files (list)`.

**Also:** Add to CLI router switch statement, update usage string, add to module.exports.

**Verify:** `node plugins/shared/tools/dev-pipeline-tools.js update-wave-tracking 2>&1` should show usage error.

**Commit:** `git commit -m "feat: update-wave-tracking command for mechanical between-wave updates (F)"`

---

## Task 5: Enforcement Additions + Migration Guard (ENF + M1)

**Files:**
- Modify: `plugins/shared/tools/dev-pipeline-tools.js`

**What to build:**

1. **validate-stage-output enforcement** — In `cmdValidateStageOutput`, inside the review stage checks for BUILD phase:
   - If artifact mentions `/simplify` but no `Post-simplify verification` field: warn
   - If artifact mentions `fix dispatch` but no context checklist (must_haves/context_block fields): warn
   - For DESIGN phase: if artifact claims N sections designed, check dispatch count matches

2. **Migration guard in checkpoint-state** — In `cmdCheckpointState`, when scope is "wave": parse MANIFEST for `current_wave` field. Only validate the current wave directory exists, not retroactive check of all waves. This prevents new checks from failing on old waves completed under previous plugin version.

**Verify:** Module loads without error.

**Commit:** `git commit -m "feat: enforcement additions + migration guard (ENF+M1)"`

---

## Task 6: Smoke Test Script (TEST)

**Files:**
- Create: `plugins/shared/tools/test-dev-pipeline-tools.js`

**What to build:**

Standalone Node.js test script. For each test:
1. Create temp directory via `fs.mkdtempSync(path.join(os.tmpdir(), 'dp-test-'))`
2. Write mock fixture files (MANIFEST.md, wave files, task files, routes.rb, etc.)
3. Run the tool command by requiring the module and calling the function directly, or by spawning `node dev-pipeline-tools.js <command>` via child process
4. Assert output contains expected PASS/FAIL
5. Clean up temp directory

**Tests to include:**
1. Phase chain: frontend chain has design before plan
2. parseRoutesFile: extracts routes from mock routes.rb
3. verify-must-haves auto-append: adds routes to mock API_CONTRACT.md
4. validate-stage-entry artifact check: fails when previous wave missing artifacts
5. validate-stage-entry completion log: warns on empty completion log fields
6. update-wave-tracking: updates mock MANIFEST and CURRENT_STATUS
7. checkpoint-state migration: only checks current wave, not retroactive
8. validate-stage-output enforcement: warns on missing post-simplify field

**Output format:** `PASS: test name` or `FAIL: test name - reason`. Final line: `N/M tests passed`.

**Verify:** `node plugins/shared/tools/test-dev-pipeline-tools.js` — all tests pass.

**Commit:** `git commit -m "test: smoke tests for all new tool commands and checks"`

---

## Task 7: Backend BUILD SKILL.md — Review Rewrite + Architect Additions

**Files:**
- Modify: `plugins/dev-pipeline-backend/skills/build/SKILL.md`

**What to change:**

1. **Architect stage additions:**
   - Add "Batch-Eligible Task Classification" section after Sequential Awareness Gate. If 2+ tasks apply the same change pattern to different files, mark as batch-eligible. Execute dispatches one agent for the batch.
   - Add endpoint overlap check as item 5 in Sequential Awareness Gate. If two tasks reference the same API endpoint path, default to sequential.

2. **Review stage rewrite (Stage 4):** Replace entire Review stage with 4-layer verify-fix loop:
   - Layer 1 (Mechanical): `bundle exec rspec` — must pass, self-fix 1 retry
   - Layer 2 (Mechanical): `verify-must-haves` — must pass, self-fix 1 retry
   - Layer 3 (Semantic): code-reviewer dispatch. Findings classified as:
     - CRITICAL+PATTERN: one agent batch fix, re-verify L1-L3
     - CRITICAL+UNIQUE: fresh Agent with must_haves + context block + failure details, re-verify L1-L3
     - NON-CRITICAL: document, user decides
   - Layer 4 (Quality): /simplify invocation (skip in Reduction, opt-in in Hold, default in Expansion). `git stash` before, re-run Layer 1 after, `git stash pop` to revert on failure. Record "Post-simplify verification: PASS/FAIL" in artifact.
   - Fix dispatch logging: `Fix dispatch: [must_haves: Y/N, context_block: Y/N, failure_details: Y/N]`
   - Escalation: existing 3-strike rule after verify-fix exhausted
   - Preserve: must_haves verification checklist, architecture diagram updates, user decision (D08), artifact path

3. **Between Waves update:** Replace "2. Update Tracking Files" with invocation of `update-wave-tracking` command. Remove manual update instructions.

**Preserve:** All existing content outside the modified sections. Entry validation, execute stage, common mistakes table, quick reference table, directory structure.

**Verify:** Read modified file end-to-end. Check stage numbering, artifact names, tool paths.

**Commit:** `git commit -m "feat(backend): 4-layer verify-fix loop, batch tasks, update-wave-tracking (v3.4.0)"`

---

## Task 8: Frontend BUILD SKILL.md — Same Changes, Frontend-Adapted

**Files:**
- Modify: `plugins/dev-pipeline-frontend/skills/build/SKILL.md`

**What to change:** Same as Task 7, with these adaptations:
- Layer 1: `npm run type-check && npm run lint` instead of `bundle exec rspec`
- No migration verification sections
- No dual-database checks
- code-reviewer focus: design system compliance instead of auth boundaries
- `--plugin frontend` in all tool calls
- Sequential Awareness Gate addition: check component import overlap and shared API endpoint references (not routes.rb)
- All other structure identical to Task 7

**Verify:** Read modified file. Check frontend-specific commands, `--plugin frontend` flags.

**Commit:** `git commit -m "feat(frontend-build): 4-layer verify-fix loop, batch tasks, update-wave-tracking (v4.1.0)"`

---

## Task 9: Frontend DESIGN SKILL.md — Discuss Enhancements + Gates

**Files:**
- Modify: `plugins/dev-pipeline-frontend/skills/design/SKILL.md`

**What to change:**

1. **Design decision questions (D-3)** — Add AFTER WHAT Questions section, BEFORE HOW Meta-Questions. 5 context-aware AskUserQuestion calls:
   - Existing patterns match/diverge
   - Installed packages to use
   - Design direction match/enhance/contrast
   - Component reuse from dedup audit
   - Micro-interactions desired
   All questions use AskUserQuestion with concrete recommendations.

2. **Mandatory ASCII mockup + Gate 1 (D-NEW + D-6)** — Add AFTER design decisions, BEFORE HOW Meta-Questions. Orchestrator produces ASCII layout mockup, presents via AskUserQuestion with preview. User MUST approve before Execute. Record `Layout approved: yes/no` in discuss artifact.

3. **Expansion mode section opt-in (D-2)** — Add AFTER Gate 1, BEFORE HOW Meta-Questions. Only in Expansion mode. If layout has 4+ distinct sections, ask: "Design sections separately?" If yes, Execute dispatches per-section ui-designer agents. After all complete, orchestrator assembles partial specs and reviews cross-section consistency.

4. **Gate 2 in Review (D-6)** — Add BEFORE Gap Resolution in Stage 4. Final design approval via AskUserQuestion before advancing to PLAN. Record `Final design approved: yes/no`.

**Preserve:** All existing content. WHAT questions, HOW meta-questions, brand rules reference, common mistakes, Execute stage, review checklist.

**Verify:** Read modified file. Check flow: WHAT -> D-3 -> Gate 1 -> D-2 -> HOW. Gate 2 in Review before Gap Resolution.

**Commit:** `git commit -m "feat(frontend-design): design decisions, mockup gate, 2 gates, expansion decomposition (v4.1.0)"`

---

## Post-Implementation

After all 9 tasks + final code review:

1. **Version bumps:**
   - `plugins/dev-pipeline-backend/plugin.json`: version -> "3.4.0"
   - `plugins/dev-pipeline-frontend/plugin.json`: version -> "4.1.0"

2. **Changelog entries** for both plugins

3. **Final commit:** `git commit -m "chore: version bump backend v3.4.0 + frontend v4.1.0"`

4. **Push**
