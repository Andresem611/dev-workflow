---
name: validate
description: Verifies a completed feature build before shipping. Runs evidence-based validation checks — type-check, lint, stubs, a11y, responsive, performance, visual regression. Triggers on /dev:validate or when /dev router advances past BUILD.
---

# /dev:validate

Evidence-based validation gate. Every check produces concrete evidence — "should work" is not evidence.

**Iron Law:** No claims without evidence in THIS message. Run the check, show the output.

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

### 3.3 Optional Checks (If User Opted In)

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

### 3.4 Post-Development Audit

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

### 3.5 Goal-Backward Verification

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

### 3.6 Failure Mode Analysis

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

### 3.7 Artifact

Write `.dev/validate/execute-validation-results.md` — every check with pass/fail and actual evidence. Include failure mode analysis table.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output validate execute <feature-dir> --plugin frontend
```

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

**Error handling:** If Notion MCP tools are unavailable, the Card ID is missing, or the update fails, warn but do NOT block the pipeline. Log the failure and continue.

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
