---
name: validate
description: Verifies a completed feature build before shipping. Runs evidence-based validation checks — type-check, lint, stubs, a11y, responsive, performance, visual regression, and Cross-Model Independent Review (Codex consult; Hold + Expansion modes; configurable via DEV_PIPELINE_CROSS_MODEL env). Triggers on /dev:validate or when /dev router advances past BUILD.
---

# /dev:validate

Evidence-based validation gate. Every check produces concrete evidence — "should work" is not evidence.

**Iron Law:** No claims without evidence in THIS message. Run the check, show the output.

## Hard Rules

1. **Read before acting.** Use the Read tool on MANIFEST, requirements.md, build review artifacts, and domain-agent-map before running any checks. Validating against stale assumptions misses real issues.
2. **Evidence, not claims.** "Should work" is not evidence. Run the check, show the output, cite the file:line. This is the Iron Law.
3. **Dispatch domain specialists from domain-agent-map.** Use `Read(references/domain-agent-map.md)` to select VALIDATE agents per domain — the correct agents are: `typescript-pro` (type safety), `accessibility-tester` (a11y), `code-reviewer` (universal), `ui-designer` (design-system), `seo-specialist` (seo), `performance-analyzer` (performance), `security-engineer` (auth-ui), `next-js-developer` (routing).
4. **Use agent-prompt-template for dispatches.** Follow `references/agent-prompt-template.md` with domain-specific VALIDATE prompt templates from `references/domain-agent-map.md`.
5. **Verify against must_haves, not assumptions.** Every must_have from requirements.md must have evidence of pass/fail in this message.

## Inner Loop: Discuss > Architect > Execute > Review

Reference: `${PLUGIN_ROOT}/../shared/references/inner-loop-reference.md`

---

## Stage 1: Discuss — Validation Strategy

### 1.1 Read Context Bridge

```
.dev/build/wave-NN/review-code-quality.md   ← last wave's review (context bridge)
.dev/MANIFEST.md                             ← domains, current phase, acceptance criteria
```

**Stop condition:** If any BUILD task is not DONE, return to BUILD. Do not validate incomplete work.

**MANDATORY: Load Requirements Contract**

Load `requirements.md` from the feature docs directory. This is the HARD CONTRACT — every requirement ID must be checked. Also load all wave files' `must_haves` blocks. VALIDATE's job is to verify these, not just "do tests pass."

### MANDATORY CONTEXT LOADING — Step 0

Use the Read tool on each file. Do not proceed until all reads complete.

1. `Read(.dev/build/wave-NN/review-code-quality.md)` → extract: build summary for each wave, deviations, issues found
2. `Read(docs/[feature]/requirements.md)` → extract: ALL must_haves — this is the verification contract
3. `Read(references/domain-agent-map.md)` → extract: VALIDATE agents per domain, verification agent assignments
4. `Read(references/agent-prompt-template.md)` → extract: prompt structure for validation agent dispatches
5. `Read(docs/[feature]/.dev/MANIFEST.md)` → extract: domains, Decision Ledger (ALL LOCKED entries), completed phases, execution mode
6. `Read(references/mode-propagation-reference.md)` → extract: VALIDATE depth settings for current execution mode
7. **CONDITIONAL — voice context:** If `PRODUCT.md` exists at repo root, `Read(PRODUCT.md)` → extract: voice & copy rules, anti-references. Required for Layer V2 voice-check (see Execute § 3.7). If absent, Layer V2 will skip silently.

If any of items 1-6 is missing, STOP and surface the gap to the user. Item 7 is conditional and skipped silently when absent.

**Echo-Back (v4.0):** After loading, echo back LOCKED decisions:
```
Loaded context for VALIDATE:
- [N] LOCKED decisions from Decision Ledger
- Execution mode: [Expansion/Hold/Reduction]
- Requirements: [N] must_haves to verify
- Waves completed: [N]
```

**LOCKED Decision Violation Check (v4.0 — MANDATORY):**
After running all validation checks, compare the built code against EVERY LOCKED decision in the Decision Ledger:
- Is each LOCKED scope item (U-XX) implemented?
- Does the implementation match the LOCKED decision's intent?
- Were any LOCKED items silently dropped during BUILD?
Report violations in the review artifact. A LOCKED violation is a FAIL regardless of other check results.

Goal-backward verification (from GSD):
1. What must be TRUE for the feature to be done? → Check truths from must_haves
2. What must EXIST for those truths to hold? → Check artifacts from must_haves
3. What must be WIRED for those artifacts to function? → Check key_links from must_haves

### 1.2 WHAT Questions

Ask via `AskUserQuestion`, one at a time:
- Which validation areas need extra attention? Any known issues from BUILD?
- Specific acceptance criteria beyond what MANIFEST defines?
- Areas of the codebase that changed significantly and need closer review?
- Known browser or device constraints to test against?

### 1.3 HOW Meta-Questions

- "How thorough should validation be? Full audit or quick sanity check?"
- "Full a11y audit or quick check on key interactive elements?"
- "Want judge scoring for code quality assessment?"
- "Browser QA needed, or curl/API verification sufficient?"
- "Performance benchmarks — full Lighthouse or just bundle size?"

No cap on questions. User says "enough" or "move on" to proceed.

### 1.4 Artifact

Write `.dev/validate/discuss-validation-strategy.md` — all Q&A, locked decisions, validation depth preferences.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output validate discuss <feature-dir> --plugin frontend
```

---

## Stage 2: Architect — Validation Plan

### 2.1 Read Inputs

- `discuss-validation-strategy.md` — user preferences and depth decisions
- `MANIFEST.md` — domain tags (drive which validations run)
- `references/validation-checklists.md` — standard checklists per domain

### 2.2 Craft Subagent Prompts

**D04 ENFORCEMENT:** Follow the D04 Enforcement Protocol from `inner-loop-reference.md`. Every subagent prompt MUST go through `/prompt-generator`. Log status in the Orchestration Log section of this artifact.

**MANDATORY:** Use `/prompt-generator` for every subagent prompt.

#### Architect Step 0: Verify Context Loaded

Before designing agent prompts, confirm:
- [ ] `domain-agent-map.md` was Read in Step 0 — list ALL agents from the map for this phase as either "dispatched" or "skipped (reason)"
- [ ] Domain Combination Patterns checked — read the Domain Combination Patterns table from domain-agent-map.md and apply any extra considerations (e.g., `routing + auth-ui` = test both authenticated and unauthenticated access)
- [ ] Previous phase review artifact was Read — decisions and context carried forward

This verification appears in the Orchestration Log under `Map compliance`.

| Agent | Validation Area | When |
|-------|----------------|------|
| `qa-expert` | Type-check, lint, stub scan, docs drift, QA runbook | Always |
| `code-reviewer` | Code quality, pattern adherence | Always |
| `accessibility-tester` | Full WCAG 2.1 AA audit | `a11y` domain |
| `performance-engineer` | Lighthouse, bundle size, render perf | `performance` domain |
| `security-engineer` | Auth boundary testing, injection checks | `auth-ui` domain |

For each subagent define: agent type, prompt (via `/prompt-generator`), success criteria, input context (changed files, feature code, types), execution order.

**MANDATORY: Requirements-Based Verification Plan**

Structure the verification plan around requirement IDs, not just test categories:

For each requirement in `requirements.md`:
1. Determine verification method: automated (type-check, lint, test, a11y audit) or manual
2. Define the check: what to run, what output indicates PASS/FAIL
3. Map to must_haves: which truths/artifacts/key_links support this requirement

The verification report MUST include a **Requirements Coverage** table:

| Requirement | Status | Evidence |
|-------------|--------|----------|
| UI-01 | SATISFIED | Component renders correctly, screenshot verified |
| A11Y-03 | BLOCKED | Missing aria-label on submit button |
| PERF-01 | NEEDS HUMAN | LCP measurement requires production environment |

### 2.3 Execution Order

1. **Critical (blocking):** Type-check, lint, stub scan
2. **Standard (blocking):** Docs drift, code quality review, QA runbook
3. **Domain-specific (from MANIFEST):** a11y, responsive, performance, auth-ui, forms, animation, api-integration, seo
4. **Optional (if user opted in):** Judge scoring, production data audit

### 2.4 Artifact

Write `.dev/validate/architect-validation-plan.md` — ordered checklist, subagent assignments with prompts, success criteria, execution dependencies. Must include the Orchestration Log section.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output validate architect <feature-dir> --plugin frontend
```

---

## Stage 3: Execute — Run Validations

Dispatch subagents per the Architect plan. The orchestrator NEVER executes validation work inline.

### 3.0 Layer 0 — Automated `/qa --diff-aware`

Run before any manual VALIDATE work. **Advisory tier only — does NOT block VALIDATE→SHIP.** Manual walkthrough proceeds regardless of Layer 0 findings.

**Trigger:** unconditional. Every VALIDATE entry runs Layer 0 first.

**Command:**

```bash
/qa --diff-aware --since=BUILD-start-commit
```

**Output handling:** report findings as a "Layer 0 /qa scan" block in the VALIDATE summary. User reviews and may incorporate findings into the manual pass, but cannot use Layer 0 alone to block ship.

**Mode propagation:**
- Reduction: skip (depth-matrix mode reduces /qa to type-check + lint per `mode-propagation-reference.md`).
- Hold: run.
- Expansion: run with extended scope (`--include-cosmetic`).

**Why advisory:** F17 evidence is hypothetical (no Teach Mode failure attributed). Tier confined to /qa noise filtering rather than primary verification.

### 3.1 Always-Run Checks

Every check produces EVIDENCE — actual command output, not summaries.

**Type-Check + Lint:**
```bash
timeout 60 npm run type-check 2>&1
npm run lint 2>&1
```
Evidence: actual tsc and eslint output. Both must pass.

**Stub Scan** — scan changed files (`git diff --name-only`):

| Pattern | Severity |
|---------|----------|
| `TODO\|FIXME\|HACK\|XXX` | Warning |
| `lorem ipsum\|placeholder\|TBD\|TBC` | Error |
| Empty implementations (`=> {}`, `return null //`, empty catch) | Error |
| Hardcoded test values (`localhost`, `127.0.0.1`, `password123`) | Error |
| `console.(log\|debug\|warn\|error)`, commented-out code blocks | Warning |

Evidence: every match with file:line and surrounding context. Errors block, warnings inform.

### 3.1.1 Independent Verification Agent

**MANDATORY.** Before running domain-specific checks, dispatch an independent verification agent. This agent has a CLEAN CONTEXT — it receives only the requirements contract and codebase access, with NO build history or phase context.

**Agent:** `code-reviewer`
**Input:**
1. Full contents of `requirements.md` (all requirement IDs)
2. All wave files' `must_haves` blocks (truths, artifacts, key_links)
3. Codebase access (Read, Grep, Glob)

**NOT provided:** Build artifacts, execute results, architect prompts, wave review artifacts, or any context from BUILD phase. The agent must form its own assessment from the requirements and code alone.

**Prompt pattern:**
```
You are independently verifying a feature you did NOT build. You have no context about the build process.

## Requirements Contract
[paste full requirements.md content]

## must_haves (all waves)
[paste concatenated must_haves from all wave files]

## Your Task
1. For each requirement ID (UI-01, A11Y-01, etc.): verify it is SATISFIED, BLOCKED, or NEEDS HUMAN
2. For each truth in must_haves: verify it is actually true in the codebase
3. For each artifact: verify it exists AND is substantive (not a stub)
4. For each key_link: verify the connection is wired end-to-end
5. Scan all listed artifacts for anti-patterns: TODO, FIXME, placeholder, empty handlers, console.log

Produce a Requirements Coverage table:
| Requirement | Status | Evidence |
|-------------|--------|----------|

And a must_haves Verification table:
| Category | Item | Status | Evidence |
|----------|------|--------|----------|

Be skeptical. Assume nothing works until you verify it with file:line evidence.
```

**Results:** The independent verifier's Requirements Coverage table becomes the PRIMARY source of truth for the Review stage's requirements assessment. Domain-specific agents (Section 3.2) provide additional depth but do not override the independent verifier's findings.

If the independent verifier finds BLOCKED requirements, these are treated as blocking issues in Review regardless of other check results.

**Docs Drift Scan** — check changed symbols against `CLAUDE.md`, `docs/**/*.md`, `CHANGELOG.md [Unreleased]`, `types/*.ts`, inline comments near changes (5 lines above/below each hunk). Evidence: list of stale references or explicit "0 found" with search scope.

**Code Quality Review** — dispatch `code-reviewer`: pattern adherence, separation of concerns, no direct fetch in components (must use `lib/*-api.ts`), error/loading/empty states. Evidence: file:line findings.

**QA Runbook** — generate if none exists (`docs/[Feature]/TESTING_RUNBOOK.md`), then execute:
1. Curl/API verification first — status codes, response shapes, access control
2. Browser QA second (if user opted in) — one test at a time, wait for user pass/fail

### 3.2 Domain-Triggered Checks

Run ONLY when corresponding domain tag exists in MANIFEST.

| Domain | Agent | Key Checks |
|--------|-------|------------|
| `a11y` | `accessibility-tester` | Contrast (4.5:1), focus indicators, touch targets (44x44px), ARIA, keyboard nav, skip links, form labels, screen reader, modal trapping |
| `responsive` | `qa-expert` | Layout at 375/768/1440px, touch targets, no h-scroll, text readability, media scaling |
| `performance` | `performance-engineer` | LCP < 2.5s, FID < 100ms, CLS < 0.1, bundle size, re-renders, lazy loading, code splitting |
| `auth-ui` | `security-engineer` | Auth guards, role-based access, token handling, injection vectors |
| `forms` | `qa-expert` | Edge cases (empty, max length, special chars), validation messages, error recovery |
| `animation` | `qa-expert` | Visual regression, reduced-motion support, no jank, spring animation compliance |
| `api-integration` | `qa-expert` | Response shapes match TypeScript types, error responses handled, auth headers correct |
| `seo` | `qa-expert` | Title/meta, OpenGraph, Twitter cards, canonical URL, heading hierarchy, alt text, JSON-LD |

Evidence required: file:line citations for violations, actual audit output for automated checks.

**Always run regardless of domains:** type-check, lint, stub scan, docs drift, code quality review.

### 3.3 Visual QA Verification (MANDATORY when dev server available)

Dispatch a subagent to verify the UI works visually, not just in code.

**Pre-check:** Check if dev server is running:
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 || echo "NO_SERVER"
```

**If server running:** proceed with visual QA.
**If not running:** attempt `npm run dev` in background, wait 10s, retry. If still fails, warn and skip: "Dev server unavailable — skipping visual QA verification. Run `npm run dev` manually and re-run VALIDATE."

**Primary path — Playwright MCP tools:**

1. Read must_haves key_links for page URLs to test
2. For each page/route:
   - `browser_navigate` to the URL
   - `browser_snapshot` for accessibility tree (checks structure)
   - `browser_take_screenshot` for visual evidence
   - `browser_console_messages` to check for errors
   - If interactive elements exist: `browser_click` key buttons, verify state changes
3. Report: screenshot per page, console errors found, accessibility tree issues

**Enhancement — /qa-only skill (when available):**

If the /qa-only skill is detected (check: `Skill tool with skill: "qa-only"` responds), invoke it AFTER the Playwright baseline:
- /qa-only provides: health score, structured QA report, visual diff comparison
- Feed it the must_haves key_links as test scope
- Its report supplements the Playwright baseline

**Cleanup:** If subagent started dev server, kill it:
```bash
kill $(lsof -ti:3000) 2>/dev/null || true
```

**Results feed into Review verdict.** Console errors and broken layouts are BLOCKING. Screenshot evidence is attached to the review artifact.

### 3.4 Two-Client Smoke Test (Collaborative Features Only)

**Blocking** when the collaborative-trigger keyword set matches.

**Trigger:** any keyword from the collaborative-trigger set appears in MANIFEST or DESIGN_SPEC (case-insensitive substring match):

`real-time | sync | broadcast | collaborative | peer | multi-user | join | presence | shared session | live cursors | yjs | tldraw/sync | websocket | socketio | webrtc`

**Skip protocol:** if no keyword matches, log "Section 3.4 SKIPPED — no collaborative trigger" and continue. Do not skip silently.

**Steps:**

1. Open Browser A as Teacher persona (existing test account). Navigate to feature route. Take screenshot.
2. Open Browser B (separate Chrome profile or Playwright incognito context — `mcp__plugin_playwright_playwright__browser_tabs` supports multi-tab) as Student persona. Same room/session ID. Take screenshot.
3. Action in A: perform the canonical collaborative action (e.g., draw a stroke, send a message, drop a cursor). Capture A screenshot.
4. Wait ≤2s. Capture B screenshot.
5. Diff B-before vs B-after: assert the action propagated. If no visible change in B, FAIL with screenshots attached.
6. Reverse direction: action in B → assert visible in A within ≤2s. If symmetric propagation fails, FAIL.

**Pass criterion:** both directions of state propagation visibly succeed.

**Fail handling:** report screenshots to user; **block VALIDATE→SHIP transition**. Do not auto-retry.

**Mode propagation:**
- Reduction: skipped only if no keyword matches (mechanical trigger applies in all modes).
- Hold: as above.
- Expansion: above + 3rd client (observer) for read-only verification.

**Fallback (if Playwright multi-tab unavailable):** spawn two browser binaries with distinct user-data-dirs, manually orchestrate the 6 steps; capture screenshots via `mcp__plugin_playwright_playwright__browser_take_screenshot`.

### 3.5 Live-BE Integration Vitest (Backend-Touching Waves)

**Blocking** when the wave touches `lib/*-api.ts` (any added/modified file matching the glob).

**Trigger:** grep added/modified files in the wave for `lib/.*-api\.ts` pattern. If match: this section runs. Otherwise skip with log "Section 3.5 SKIPPED — no lib/*-api.ts touched."

**Spec authoring requirements:**

- Spec file lives at `<feature>/tests/integration/<api-name>.live.test.ts`.
- Spec **must not mock fetch**. **No `vi.mock()` of fetch, the API client, or any layer between the test and the real backend.** If `vi.mock(` appears in the spec file: FAIL with explicit error: `Live-BE integration spec must not mock fetch — Section 3.5 forbids it. Convert to real-fetch or move to integration unit-test layer (Section 3.2).`
- Spec asserts response envelope (status code + top-level JSON keys) against `<feature>/api/API_CONTRACT.md`.
- Spec exercises at least 1 happy-path (200) + 1 4xx negative case per endpoint.

**Runtime:**

```bash
TEST_API_BASE=https://staging.thoven.co npx vitest run <feature>/tests/integration --timeout=10000
```

**Failure modes:**
- Network/timeout/staging-down: surface as "ENVIRONMENT FAIL not feature FAIL"; user retries once before marking blocking.
- Schema mismatch: BLOCK ship.
- 4xx case missing: BLOCK ship.

**Mode propagation:**
- Reduction: trigger applies (mechanical); spec authoring depth reduces (skip 4xx case requirement).
- Hold: full requirements.
- Expansion: + add 1 5xx test case.

**Why no mocks:** F1 evidence — Teach Mode tests passed by mocking the integration. Real-fetch against staging is the only mechanism that catches `vi.mock('@/lib/lesson-channel')` shape failures.

### 3.6 Curl Contract Gate (api-integration Domain)

**Blocking** when MANIFEST `## Domains` includes `api-integration`.

**Trigger (any condition fires the gate):**

1. MANIFEST `## Domains` includes `api-integration` (`grep -q 'api-integration' <feature>/.dev/MANIFEST.md`).
2. BUILD emitted a CONTRACT DRIFT warning (Layer 2 v4.6-Δ4) — check `<feature>/.dev/build/review-build.md` for any "CONTRACT DRIFT detected" line. If present, this gate runs regardless of domain tag.

The combined trigger ensures BUILD's contract-drift detection has an enforced consumer at VALIDATE.

**Inputs:**

- `<feature>/api/API_CONTRACT.md` — produced by DESIGN; lists endpoint rows (method / path / status code / response envelope).

**Steps:**

For each endpoint row in API_CONTRACT.md:

```bash
TOKEN=$THOVEN_TEST_ACCOUNT_TOKEN
curl -i -H "Authorization: Bearer $TOKEN" -X <METHOD> https://staging.thoven.co<PATH>
```

For each response, parse the status code line + top-level JSON keys. Diff against the contract row's expected envelope.

**Pass criterion:** every endpoint row's response status code matches AND every contract-named top-level key is present (extra keys allowed; missing keys = FAIL).

**Fail handling:**
- Status code mismatch: BLOCK with "Endpoint <PATH> returned <X>, contract expects <Y>".
- Missing key: BLOCK with "Endpoint <PATH> response missing key <KEY> (contract requires)".
- Auth failure (401): BLOCK with "ENVIRONMENT FAIL — staging auth token expired or scope wrong"; user refreshes before retry.

**Mode propagation:**
- Reduction: trigger applies; reduces to happy-path only (skip negative cases).
- Hold: full per-row diff.
- Expansion: + diff response body shape (recursive key check), not just top-level.

**Why this gate:** F12 evidence — Pass 2 Homework had `video/webm` MIME mismatch and FE/BE type drift that no other gate caught. The Calendar webhook URL drift (W1→W4) would have surfaced here.

### 3.6.5 Layer V1 — Optional `/impeccable audit` Deep Technical Pass (if installed)

If the `impeccable` plugin is installed, offer via `AskUserQuestion` BEFORE proceeding to 3.7 Judge Scoring:

"Want to run `/impeccable audit` for a deep technical pass before scoring?"

| Option | Action |
|---|---|
| A | Run `/impeccable audit` — animation-a11y intersection, real-world network throttling (4G/3G), complex widget keyboard nav (combobox, datepicker, modal stacks), `prefers-reduced-motion` override paths |
| B | Skip |

**Distinct from existing gates:** `accessibility-check` (3.2 domain-triggered) covers static WCAG AA; `mobile-audit` covers breakpoints + perf budgets; `/qa --diff-aware` (3.0 Layer 0) covers test coverage. `/impeccable audit` adds the **animation + a11y intersection**, **real-world throttling**, and **complex-widget interaction** dimensions none of those cover. RED scenario: scroll-triggered animation that breaks under `prefers-reduced-motion` passes every existing gate but fails Layer V1.

If `impeccable` is NOT installed, skip this layer silently — recommend installing for future deep-audit capability.

**Naming note:** This is "Layer V1" (VALIDATE-1), distinct from BUILD's Layer 4.5 (`/impeccable polish | harden | audit` post-wave). Layer V1 operates on the *assembled feature* pre-ship; BUILD Layer 4.5 operates on *individual wave code* post-commit.

### 3.6.7 Layer V2 — Voice & Copy Verification (when PRODUCT.md present)

If `PRODUCT.md` exists at repo root (loaded in Step 0 item 7), dispatch a subagent to scan shipped UI strings against the project's voice & copy rules. Inputs:
- PRODUCT.md Voice & Copy section + Anti-references list
- The feature's modified files (filter to strings in JSX, button labels, error messages, empty state copy, microcopy)

Subagent verifies:
- [ ] No anti-reference language present (e.g., for Thoven: no "invalid", no streak-shaming, no engagement-bait phrasing)
- [ ] Voice rules followed (e.g., for Thoven: human/encouraging/specific, never robotic/accusatory/generic)
- [ ] Error messages soft-toned per PRODUCT.md error-handling rules (where applicable)
- [ ] Empty states framed positively per voice guidance

If any item fails, surface to user via `AskUserQuestion`: fix-now (route to `/impeccable clarify` if installed), defer to a follow-up, or override-with-rationale.

**RED scenario:** Shipping copy "Invalid email format. Please correct your input." Type-check passes, lint passes, accessibility-check passes, /qa passes — none of them check tone. Layer V2 reads PRODUCT.md "Encouraging, never accusatory" rule and surfaces the violation before ship.

If PRODUCT.md not present, skip silently with the note "PRODUCT.md not loaded — voice check skipped." Recommend running `/impeccable teach` to set up PRODUCT.md for future projects.

### 3.7 Optional Checks (If User Opted In)

**Judge Scoring** — dispatch judge subagent:

| Criterion | Weight |
|-----------|--------|
| Correctness | 30% |
| Code Quality | 20% |
| Completeness | 20% |
| Pattern Adherence | 15% |
| Documentation Accuracy | 15% |

Default score is 2. Justify scores above 2. Weighted total >= 4.0 passes.

**Production Data Audit** — curl real endpoints, verify response shapes match TypeScript types, required fields present, auth guards return 401/403 for wrong roles.

### 3.8 Post-Development Audit

Final checklist (from `references/validation-checklists.md`):

- All acceptance criteria from PLAN met
- Custom gate criteria from PLAN checked
- No console errors or warnings in feature
- Loading states for all async operations
- Error states with retry/recovery actions
- Empty states handled (no data scenario)
- Auth guards on protected routes
- API calls through `lib/*-api.ts` only (no direct fetch in components)
- Works on mobile, tablet, desktop
- No regressions in existing features

### 3.9 Goal-Backward Verification

**MANDATORY: Goal-Backward Verification**

Beyond running tests, the Execute stage MUST:

1. **Verify truths**: For each truth in must_haves, confirm the codebase makes it true
2. **Verify artifacts**: Each artifact in must_haves exists AND is substantive (not a stub)
3. **Verify key_links**: Each connection in must_haves is wired (not orphaned)
4. **Scan anti-patterns**: Search for TODO, FIXME, placeholder, "coming soon" in modified files
5. **Check requirements coverage**: Mark each requirement ID as SATISFIED / BLOCKED / NEEDS HUMAN

Stub detection (from GSD verification-patterns):
- Placeholder text: `grep -iE "placeholder|coming soon|will be here"`
- Empty handlers: `onClick={() => {}}`, `onChange={() => console.log()}`
- Hardcoded returns: `return null`, `return []`, `return {}`
- TODO markers: `grep -E "TODO|FIXME|XXX|HACK"`

### 3.10 Failure Mode Analysis

**MANDATORY.** For each new codepath or integration point identified during validation, document:

1. **One realistic production failure scenario** — timeout, nil reference, race condition, stale data, missing auth, network partition, malformed response, etc.
2. **Three checks per failure:**

| Codepath | Failure Scenario | Test Covers? | Error Handling? | User Sees Clear Error? |
|----------|-----------------|-------------|----------------|----------------------|
| `BookingForm.submit()` | Stripe API timeout after 30s | NO | YES (catch block) | YES ("Payment failed, try again") |
| `useTeacherProfile()` | Teacher deleted between list and detail view | NO | NO | NO — blank page ← **CRITICAL GAP** |

**Critical gap** = no test + no error handling + silent failure. Flag as BLOCKER in Review.

**Not a critical gap** (document but don't block):
- Has test OR has error handling OR user sees a clear error message
- Theoretical failures that require extraordinary conditions

Focus on codepaths that are NEW in this feature — don't audit the entire codebase.

### 3.11 Artifact

Write `.dev/validate/execute-validation-results.md` — every check with pass/fail and actual evidence. Include failure mode analysis table.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output validate execute <feature-dir> --plugin frontend
```

### 3.12 Cross-Model Independent Review (VALIDATE→SHIP, Expansion only)

**Trigger:** mode = **Expansion only**. Skipped on Hold + Reduction.

**Pre-check:** if `DEV_PIPELINE_CROSS_MODEL=off`, skip. Otherwise (default `codex`):

**Steps:**

1. Generate consult prompt from `references/cross-model-consult-prompt-template.md`. Substitute variables; this consult uses a lighter prompt focused on ship-readiness:
   - Files changed since BUILD→VALIDATE bridge.
   - VALIDATE failures resolved this pass.
   - Outstanding warnings carrying into SHIP.

2. Invoke Codex CLI (same command shape as build/SKILL.md Cross-Model Independent Review). Cost ceiling: `$DEV_PIPELINE_CROSS_MODEL_CEILING` (default `$1.00`).

3. **Findings consumption:** same semantics as BUILD's consult — PASS advances, WARN advisory, NEEDS_WORK BLOCKS, HIGH_RISK BLOCKS + auto-escalates (escalation here means "remain in VALIDATE for another pass," since SHIP is the next phase).

4. Log invocation to `<feature>/.dev/cross-model-consult.log` (append-only).

**Why Expansion-only at this boundary:**

- Hold mode already ran the BUILD→VALIDATE consult; the VALIDATE→SHIP consult is largely redundant for that mode.
- Expansion explicitly opts into the deeper rigor; cost ($2/feature in Expansion vs $1/feature in Hold) is bounded.

---

## Stage 4: Review — Ship Readiness

### 4.1 Compile Results

| Check | Result | Evidence Summary |
|-------|--------|-----------------|
| Type-check | PASS/FAIL | [error count, key errors] |
| Lint | PASS/FAIL | [error count, key errors] |
| Stub scan | PASS/FAIL | [error/warning counts, locations] |
| Docs drift | PASS/FAIL | [stale refs found] |
| Code quality | PASS/FAIL | [key findings] |
| QA runbook | PASS/FAIL | [X/Y curl, X/Y browser passed] |
| Domain checks | PASS/FAIL | [per-domain summary] |
| Post-dev audit | PASS/FAIL | [criteria met/failed] |

### 4.2 Categorize Issues

**Blockers** — must fix before ship: type errors, lint errors, stub scan errors (empty implementations, hardcoded test values), security issues (missing auth guards, injection vectors), stale docs referencing deleted/renamed symbols.

**Known Issues** — document but do not block: stub scan warnings (TODO/FIXME, console.log), minor a11y findings below AA threshold, performance nice-to-haves, docs drift warnings (missing changelog entry).

**Requirements Coverage Summary (MANDATORY in review output):**

Present to the user:
1. Requirements score: X/Y requirements satisfied
2. Any BLOCKED requirements with blocking issue
3. Any NEEDS HUMAN requirements with what to test
4. Anti-patterns found (blockers vs warnings)
5. Overall status: PASSED / GAPS_FOUND / HUMAN_NEEDED

If GAPS_FOUND: list specific gaps with fix recommendations before allowing advancement.

### 4.3 Ship Readiness Assessment

Verdict: **READY** (zero blockers, known issues documented) or **NOT READY** (specific blockers with file:line and suggested fix).

### 4.4 Surface to User

Present via `AskUserQuestion`:

```
## Ship Readiness Assessment

### Results Summary
[Results table from 4.1]

### Blockers (if any)
[List with file:line and suggested fix]

### Known Issues (if any)
[List with severity and tracking plan]

### Custom Acceptance Criteria
[Pass/fail per MANIFEST-defined criterion with evidence]

### Options
1. **Approve** — proceed to SHIP
2. **Fix and re-validate** — address blockers, re-run from Execute
3. **Back to Architect** — redesign validation plan
4. **Back to Discuss** — revisit validation strategy
5. **Pause** — save state, exit pipeline
```

Approve is only offered when zero blockers remain.

### 4.5 Artifact

Write `.dev/validate/review-ship-readiness.md` — full results, blocker/known issue categorization, ship readiness verdict, user decision. This artifact IS the context bridge to SHIP.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output validate review <feature-dir> --plugin frontend
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest <feature-dir> --plugin frontend
```

### 4.6 Notion Update

After approval, move the Dev Tracker card to "Code Review". Read the Card ID from MANIFEST's `## Notion Integration > Card ID`.

1. **Update card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: Card ID from MANIFEST
   - Properties: Status = `Code Review`, Last Updated = today's ISO date

2. Display: `📋 Notion: Moved — "[Feature Name]" → Code Review`

**Notion Protocol:** Follow the Retry + Warning Protocol in `references/notion-integration.md`.
- Phase type: Downstream (status update — check Card ID first)
- Target status: `Code Review`
- Persist warning in: `.dev/validate/review-ship-readiness.md`

### 4.7 After Approval

Update MANIFEST phase to VALIDATE complete. Display and STOP:

```
---
Next Up

Phase: SHIP — Changelog + commit + deployment
/dev:ship
/clear first — fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke SHIP. Do not offer "continue in same session".

---

## Common Mistakes

| Mistake | Why It Fails | Prevention |
|---------|-------------|------------|
| Claiming "it passed" without showing output | No evidence, no trust | Show actual command output in THIS message |
| Skipping curl layer, doing browser-only QA | Misses API contract regressions | Always curl first, browser second |
| Declaring a11y "clean" after partial audit | Misses keyboard traps, ARIA, motion | Full checklist when `a11y` domain tagged |
| Not checking custom acceptance criteria | PLAN-defined gates get ignored | Read MANIFEST criteria, check each explicitly |
| Claiming "I already verified earlier" | Stale evidence from different context | Fresh evidence only — re-run in THIS session |
| Orchestrator executing checks inline | Violates subagent dispatch rule (D03) | Always dispatch via Agent tool |
| Skipping visual QA because dev server wasn't running | Misses visual regressions, console errors, broken layouts | Start server or warn user. Visual QA is mandatory when server is available. |
