---
name: validate
description: Use when /dev pipeline reaches VALIDATE phase. Runs comprehensive validation absorbing verify, manual-qa, accessibility-check, mobile-audit, and post-development audit into three layers (always-run, tier-driven, domain-triggered).
---

# dev-pipeline:validate

Comprehensive validation gate. Three layers scaled by tier and domains.

**Iron Law:** No claims without evidence in THIS message. "Should work" is not evidence. Run the check, show the output.

## Inner Loop: RESEARCH > EXECUTE > DOCUMENT > GATE

---

## 1. RESEARCH

Read these files before executing anything:

| File | Extract |
|------|---------|
| `.dev/MANIFEST.md` | Tier, domains, current phase, custom acceptance criteria for VALIDATE |
| `.dev/reports/*` | Any prior validation attempts |
| `01_IMPLEMENTATION_STATUS.md` | Task completion status — all tasks must be DONE |
| `CURRENT_STATUS.md` | BUILD phase exit state |
| All BUILD artifacts | Changed files list via `git diff --name-only` against pre-build state |

**Stop condition:** If any BUILD task is not DONE, return to BUILD. Do not validate incomplete work.

---

## 2. EXECUTE — Three Layers

### Layer 1: Always Run (all tiers)

Run every check. Failures in any block are blocking.

#### 1A. Type-check + Lint

```bash
timeout 60 npm run type-check 2>&1
npm run lint 2>&1
```

Both must pass. Show errors if any. Do not proceed until clean.

#### 1B. Stub-check

Scan all changed files for incomplete code patterns:

| Pattern | Severity |
|---------|----------|
| `TODO\|FIXME\|HACK\|XXX` | Warning |
| `placeholder\|TBD\|lorem ipsum` | Error |
| Empty catch blocks, `=> {}`, `return null //` | Error |
| `console.log\|console.debug` | Warning |
| `localhost\|127.0.0.1\|password123` | Error |

Errors are blocking. Warnings are reported but non-blocking.

#### 1C. Docs Drift Scan

1. Get changed symbols from `git diff` (renamed functions, changed types, modified endpoints)
2. Search `CLAUDE.md`, `docs/**/*.md`, `CHANGELOG.md [Unreleased]`, `types/*.ts` for stale references
3. Check inline comments 5 lines above/below each changed hunk for stale descriptions
4. If `lib/*-api.ts` changed: verify callers use correct endpoint paths and headers

Errors (stale refs to renamed/deleted symbols) are blocking. Warnings (missing changelog entry) are non-blocking.

#### 1D. QA Runbook Generation + Execution

**Generate** (if no runbook exists for this feature):
1. Read every file in the feature (pages, API layer, utilities, components, analytics)
2. Extract test paths: auth guards, conditional UI, loading/error states, validation, API calls, responsive classes, animations
3. Write test cases in three phases: Smoke (automated), Development QA (curl + browser), Production QA (post-deploy)
4. Save to `docs/[Feature]/TESTING_RUNBOOK.md`

**Execute** (always — generate first if needed):
1. **Curl/API verification first:** Login as test accounts, hit endpoints, verify status codes + response shapes + access control
2. **Browser QA second:** Create tasks for visual checks, walk user through one at a time, wait for pass/fail per test
3. Group browser tests by login account to minimize switching
4. If a test fails, stop and discuss before continuing

Both layers (curl + browser) are mandatory. Neither replaces the other.

#### 1E. Production Data Audit

Curl real endpoints on dev backend. For each API module the feature uses:

```bash
# Example pattern — adapt per feature
curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE_URL/api/v1/endpoint" | head -c 2000
```

Verify:
- Response status is 2xx
- Response shape matches TypeScript types in `types/`
- Required fields are present and non-null
- No `"Alex Rodriguez"` hardcoded fallback data (TD-007)
- Enum values match frontend expectations

Log each endpoint checked with status and field verification result.

---

### Layer 2: Tier-Driven

#### COMBINATION + NOVEL: Judge Scoring

Dispatch judge subagent (sonnet model) with rubric:

| Criterion | Weight |
|-----------|--------|
| Correctness | 30% |
| Code Quality | 20% |
| Completeness | 20% |
| Pattern Adherence | 15% |
| Documentation Accuracy | 15% |

Default score is 2. Justify any score above 2. Score of 5 in <5% of evaluations.
- Weighted total >= 4.0: PASS
- Weighted total < 4.0: FAIL — list specific issues, fix, re-run
- After 3 failures: escalate to user

#### NOVEL Only: Debate Mode

Dispatch 3 independent judges in parallel:
- Judge 1: Focus on CORRECTNESS and edge cases
- Judge 2: Focus on CODE QUALITY and patterns
- Judge 3: Focus on COMPLETENESS, docs accuracy, and security

Scoring: Unanimous >= 4.0 passes. All < 3.0 fails (redesign). Split (>1.5 point gap) triggers Round 2 where judges see each other's evaluations. Majority rules.

---

### Layer 3: Domain-Triggered

Run ONLY when the corresponding domain tag exists in MANIFEST.

| Domain | Audit | Key Checks |
|--------|-------|------------|
| `a11y` | WCAG 2.1 AA | All 7 categories: Keyboard, Focus, ARIA, Forms, Visual, Semantic, Motion. Line numbers required for every violation. |
| `responsive` | Mobile/tablet/desktop | All 8 categories: Touch targets (44x44px), Breakpoints, Text/Input sizing, Overflow (320px), Fixed positioning, Modals, Tap vs Hover, Images. |
| `performance` | Lighthouse + bundle | Run `npm run build`, check bundle size delta, flag components >50KB. |
| `analytics` | Event verification | Curl endpoints that trigger events, check console for `[Analytics] Event tracked:` logs, verify property shapes. |
| `design-system` | Thoven compliance | Verify: amber-500 not orange-500, font-display only on h1/h2, font-sans everywhere else, 3D button pattern where applicable. |
| `seo` | Meta + structured data | Check `layout.tsx` for OpenGraph, Twitter cards, canonical URLs, JSON-LD structured data. |

For a11y and responsive audits: cite specific file:line for every violation with the exact fix.

### Custom Acceptance Criteria

Read PLAN-defined criteria for the VALIDATE gate from MANIFEST. Check each criterion explicitly. Report pass/fail per criterion with evidence.

---

## 3. DOCUMENT

After all checks complete:

1. **Update MANIFEST** — set phase to VALIDATE, record pass/fail per layer
2. **Write validation report** to `.dev/reports/validation-report.md`:

```markdown
## Validation Report — [Feature Name]
**Date:** [date]  **Tier:** [tier]  **Domains:** [list]

### Layer 1: Always Run
| Check | Result | Details |
|-------|--------|---------|
| Type-check | PASS/FAIL | [error count] |
| Lint | PASS/FAIL | [error count] |
| Stub-check | PASS/FAIL | [errors/warnings] |
| Docs drift | PASS/FAIL | [errors/warnings] |
| QA runbook | PASS/FAIL | [X/Y curl, X/Y browser] |
| Production data audit | PASS/FAIL | [endpoints checked] |

### Layer 2: Tier-Driven
[Judge score table or "N/A — KNOWN tier"]

### Layer 3: Domain-Triggered
[Per-domain audit results or "No domain audits triggered"]

### Custom Criteria
| Criterion | Result | Evidence |
|-----------|--------|----------|

### Failures
| ID | Layer | Severity | Description |
|----|-------|----------|-------------|
```

3. **Generate transition file:** `prompt-transitions/validate-to-ship.md` with validation summary, any caveats, and ship readiness assessment.

---

## 4. GATE: G6 (Always Mandatory)

Present to user:

```
## G6: Validation Gate

### Results Summary
[Layer 1/2/3 results table from report]

### Failures (if any)
[List with severity: Critical / Medium / Low]

### Custom Criteria
[Pass/fail per criterion]

### Options
1. **Approve** — proceed to SHIP
2. **Fix and re-validate** — address failures, re-run VALIDATE
3. **Pause** — save state, exit pipeline
```

All Critical failures must be resolved before Approve is offered. Medium/Low failures can be approved with acknowledgment.

---

## Common Mistakes

| Mistake | Why It Fails | Prevention |
|---------|-------------|------------|
| Skipping curl layer, doing browser-only QA | Misses API contract regressions, wrong status codes, access control holes | Always curl first, browser second |
| Running type-check but not reading its output | Blind "it passed" without evidence | Show actual output in this message |
| Using KNOWN-tier validation for COMBINATION features | Skips judge scoring, ships unreviewed code | Read tier from MANIFEST, not from memory |
| Declaring a11y "clean" after checking 2 of 7 categories | Partial audit misses keyboard traps, missing ARIA, motion issues | All 7 categories mandatory when `a11y` domain is tagged |
| Skipping production data audit | Response shapes drift from types, hardcoded fallbacks ship | Curl real endpoints, compare to TypeScript types |
| Not checking custom acceptance criteria | PLAN defined specific gates that get ignored | Read MANIFEST criteria, check each explicitly |
| Claiming "I already verified earlier" | Stale evidence from a different message | Fresh evidence only. Re-run in THIS message. |
