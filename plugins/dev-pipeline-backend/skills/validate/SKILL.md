---
name: validate
description: Verifies a completed backend feature build before shipping. Runs evidence-based validation — RSpec, migration safety, API contract compliance, security audit, production data checks. Triggers on dev-pipeline-backend:validate or when /dev router advances past BUILD.
---

# dev-pipeline-backend:validate

Evidence-based validation gate. Every check produces concrete evidence — "should work" is not evidence.

**Iron Law:** No claims without evidence in THIS message. Run the check, show the output.

## Inner Loop: Discuss > Architect > Execute > Review

Reference: `${PLUGIN_ROOT}/../shared/references/inner-loop-reference.md`

---

## Stage 1: Discuss — Validation Strategy

### 1.1 Read Context Bridge

```
.dev/build/wave-NN/review-code-quality.md   <- last wave's review (context bridge)
.dev/MANIFEST.md                             <- domains, current phase, acceptance criteria
```

**Stop condition:** If any BUILD task is not DONE, return to BUILD. Do not validate incomplete work.

### 1.2 WHAT Questions

Ask via `AskUserQuestion`, one at a time:
- Which validation areas need extra attention? Any known issues from BUILD?
- Specific acceptance criteria beyond what MANIFEST defines?
- Areas of the codebase that changed significantly and need closer review?
- Any production data concerns surfaced during BUILD?

### 1.3 HOW Meta-Questions

- "How thorough should validation be? Full audit or quick sanity check?"
- "Full security audit or focused review on changed auth/payment paths?"
- "Want judge scoring for code quality assessment?"
- "Full production data re-audit or delta check against PLAN audit?"
- "Migration verification — both DBs, or local only?"

No cap on questions. User says "enough" or "move on" to proceed.

**MANDATORY: Load Requirements Contract**

Load `requirements.md` from the feature docs directory. This is the HARD CONTRACT — every requirement ID must be checked. Also load all wave files' `must_haves` blocks. VALIDATE's job is to verify these, not just "do RSpec tests pass."

Goal-backward verification (from GSD):
1. What must be TRUE for the feature to be done? → Check truths from must_haves
2. What must EXIST for those truths to hold? → Check artifacts from must_haves
3. What must be WIRED for those artifacts to function? → Check key_links from must_haves

### 1.4 Artifact

Write `.dev/validate/discuss-validation-strategy.md` — all Q&A, locked decisions, validation depth preferences.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output validate discuss <feature-dir> --plugin backend
```

---

## Stage 2: Architect — Validation Plan

### 2.1 Read Inputs

- `discuss-validation-strategy.md` — user preferences and depth decisions
- `MANIFEST.md` — domain tags (drive which validations run)

### 2.2 Craft Subagent Prompts

**MANDATORY:** Use `/prompt-generator` for every subagent prompt.

| Agent | Validation Area | When |
|-------|----------------|------|
| `qa-expert` | RSpec suite, stub scan, docs drift, QA runbook | Always |
| `rails-expert` | Code quality, pattern adherence, N+1 scans | Always |
| `security-engineer` | Auth boundaries, COPPA, injection, payment flow | `auth`, `payments`, `students`, `external-api` domains |
| `performance-engineer` | N+1 queries, index coverage, query plans | `performance` domain |

For each subagent define: agent type, prompt (via `/prompt-generator`), success criteria, input context (changed files, feature code, specs), execution order.

**MANDATORY: Requirements-Based Verification Plan**

Structure the verification plan around requirement IDs, not just "run RSpec":

For each requirement in `requirements.md`:
1. Determine verification method: automated (RSpec, migration check, route check) or manual
2. Define the check: what command to run, what output indicates PASS/FAIL
3. Map to must_haves: which truths/artifacts/key_links support this requirement

The verification report MUST include a **Requirements Coverage** table:

| Requirement | Status | Evidence |
|-------------|--------|----------|
| API-01 | SATISFIED | RSpec passes, returns 200 with expected shape |
| AUTH-03 | BLOCKED | Missing authorization check in controller |
| MIGR-01 | SATISFIED | Migration runs forward/back on both databases |
| PERF-02 | NEEDS HUMAN | Load test required for concurrent booking check |

### 2.3 Execution Order

1. **Critical (blocking):** RSpec full suite, migration verification, secrets scan
2. **Standard (blocking):** Stub scan, API contract compliance, code quality review, QA runbook
3. **Domain-specific (from MANIFEST):** auth, payments, migrations, performance, security, api-design, models
4. **Optional (if user opted in):** Judge scoring, production data re-audit

### 2.4 Artifact

Write `.dev/validate/architect-validation-plan.md` — ordered checklist, subagent assignments with prompts, success criteria, execution dependencies.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output validate architect <feature-dir> --plugin backend
```

---

## Stage 3: Execute — Run Validations

Dispatch subagents per the Architect plan. The orchestrator NEVER executes validation work inline.

### 3.1 Always-Run Checks

Every check produces EVIDENCE — actual command output, not summaries.

**RSpec Full Suite:**
```bash
bundle exec rspec 2>&1
```
Evidence: actual rspec output with example count, failure count, pending count. All must pass.

**Migration Verification:**
```bash
# Check local DB (helium)
rails db:migrate:status 2>&1

# Check production DB (Neon)
RAILS_ENV=production rails db:migrate:status 2>&1
```
Evidence: both databases show all migrations as "up". No pending migrations in either environment.

**Secrets Scan** — scan the entire codebase for leaked credentials:

| Pattern | Severity |
|---------|----------|
| API keys, tokens, passwords in source files | Error |
| `.env` values committed to git | Error |
| Hardcoded credentials (`password`, `secret`, `api_key` with literal values) | Error |
| SendGrid/Twilio/Stripe keys outside ENV references | Error |

Evidence: every match with file:line and surrounding context. Any match blocks.

**Stub Scan** — scan changed files (`git diff --name-only`):

| Pattern | Severity |
|---------|----------|
| `TODO\|FIXME\|HACK\|XXX` | Warning |
| `raise NotImplementedError`, `"placeholder"`, `TBD`, `TBC` | Error |
| Empty method bodies, empty rescue blocks | Error |
| Hardcoded test values in non-test files (`localhost`, `password123`) | Error |
| `puts`, `pp`, `binding.pry`, `byebug`, `debugger` | Error |

Evidence: every match with file:line and surrounding context. Errors block, warnings inform.

**API Contract Compliance** — verify endpoints match DOCUMENT phase contract:
- All routes defined in DOCUMENT exist in `config/routes.rb`
- Response shapes match documented schemas
- HTTP status codes match documented contracts
- Error responses follow `API_ERROR_RESPONSE_CONTRACT.md` format
- Auth requirements match documented access control

Evidence: route-by-route comparison with pass/fail per endpoint.

**Docs Drift Scan** — check changed symbols against `CLAUDE.md`, `docs/**/*.md`, `CHANGELOG.md [Unreleased]`, inline comments near changes (5 lines above/below each hunk). Evidence: list of stale references or explicit "0 found" with search scope.

**Code Quality Review** — dispatch `rails-expert`: pattern adherence, service layer usage (no business logic in controllers), proper use of `archived_at` filtering, safe navigation for nullable associations, correct profile type checks (helper methods not string comparison). Evidence: file:line findings.

**QA Runbook** — generate if none exists (`docs/[Feature]/TESTING_RUNBOOK.md`), then execute:
1. Curl/API verification — status codes, response shapes, access control
2. Rails console spot checks (if user opted in) — verify data integrity

### 3.2 Domain-Triggered Checks

Run ONLY when corresponding domain tag exists in MANIFEST.

| Domain | Agent | Key Checks |
|--------|-------|------------|
| `auth` | `security-engineer` | Dual auth boundary testing (User vs Student NEVER mixed), token handling, `jti` revocation, role-based access via Profile helper methods, COPPA compliance for student endpoints |
| `payments` | `security-engineer` | Payment flow security, Stripe webhook signature verification, idempotency, no sensitive data in logs |
| `migrations` | `rails-expert` | Dual DB sync verification (helium + Neon), reversible migrations, no data loss, index coverage for new columns |
| `performance` | `performance-engineer` | N+1 query scan (Bullet gem or manual), missing indexes, eager loading verification, query plan analysis for complex queries |
| `security` | `security-engineer` | Input validation on all params, rate limiting configuration, SQL injection prevention, mass assignment protection, Brakeman scan |
| `api-design` | `qa-expert` | RESTful conventions, pagination on list endpoints, consistent error format, proper HTTP verbs, versioned routes |
| `models` | `rails-expert` | Association integrity (foreign keys, dependent options), constraint validation (uniqueness, presence), soft delete filtering, callback safety |

Evidence required: file:line citations for violations, actual command output for automated checks.

**Always run regardless of domains:** RSpec, migration verification, secrets scan, stub scan, API contract compliance, docs drift, code quality review.

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

**Production Data Re-Audit** — invoke `/production-data-audit` for all models touched:
- Verify new code handles NULL fields found in production
- Verify new queries filter `archived_at` correctly
- Verify new associations handle missing related records
- Compare against pre-BUILD audit (from PLAN phase) — any new risks?
- Curl real endpoints, verify response shapes with production data

### 3.4 Goal-Backward Verification

**MANDATORY: Goal-Backward Verification**

Beyond running RSpec, the Execute stage MUST:

1. **Verify truths**: For each truth in must_haves, confirm the codebase makes it true
2. **Verify artifacts**: Each artifact in must_haves exists AND is substantive (not empty/stub)
3. **Verify key_links**: Each connection in must_haves is wired (controller→service→model)
4. **Scan anti-patterns**: Search for TODO, FIXME, placeholder in modified files
5. **Check requirements coverage**: Mark each requirement ID as SATISFIED / BLOCKED / NEEDS HUMAN
6. **Migration verification**: Confirm migrations run on BOTH databases (helium + Neon)
7. **API contract check**: Verify response shapes match requirements

Stub detection (from GSD verification-patterns):
- Empty methods: `def method_name; end` or methods with only `raise NotImplementedError`
- TODO markers: `grep -E "TODO|FIXME|XXX|HACK"`
- Hardcoded responses: `render json: {}`, `render json: []`
- Missing specs: Controller/service exists but no corresponding spec file

### 3.5 Post-Development Audit

Final checklist:

- All acceptance criteria from PLAN met
- Custom gate criteria from PLAN checked
- No console output (`puts`, `pp`, `Rails.logger.debug` with sensitive data) in feature code
- Service layer used for complex business logic (not in controllers)
- `archived_at` filtering on all relevant queries
- Safe navigation (`&.`) for nullable associations with sensible defaults
- Profile type checks use helper methods (`profile.teacher?`), not string/integer comparison
- Auth guards on protected endpoints (correct auth system: User vs Student)
- API error responses follow `API_ERROR_RESPONSE_CONTRACT.md`
- Background jobs for expensive operations (not inline in request cycle)
- No N+1 queries in new endpoints
- No regressions in existing features

### 3.6 Artifact

Write `.dev/validate/execute-validation-results.md` — every check with pass/fail and actual evidence.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output validate execute <feature-dir> --plugin backend
```

---

## Stage 4: Review — Ship Readiness

### 4.1 Compile Results

| Check | Result | Evidence Summary |
|-------|--------|-----------------|
| RSpec suite | PASS/FAIL | [example count, failure count, pending count] |
| Migration sync | PASS/FAIL | [both DBs status] |
| Secrets scan | PASS/FAIL | [matches found or clean] |
| Stub scan | PASS/FAIL | [error/warning counts, locations] |
| API contract | PASS/FAIL | [endpoints checked, mismatches] |
| Docs drift | PASS/FAIL | [stale refs found] |
| Code quality | PASS/FAIL | [key findings] |
| QA runbook | PASS/FAIL | [X/Y curl checks passed] |
| Domain checks | PASS/FAIL | [per-domain summary] |
| Post-dev audit | PASS/FAIL | [criteria met/failed] |

### 4.2 Categorize Issues

**Blockers** — must fix before ship: test failures, pending migrations, secrets in codebase, stub scan errors (empty implementations, hardcoded values, debug statements), security issues (missing auth guards, injection vectors, mixed auth systems), API contract mismatches, stale docs referencing deleted/renamed symbols.

**Known Issues** — document but do not block: stub scan warnings (TODO/FIXME), minor performance findings, docs drift warnings (missing changelog entry), non-critical code quality suggestions.

### 4.3 Ship Readiness Assessment

Verdict: **READY** (zero blockers, known issues documented) or **NOT READY** (specific blockers with file:line and suggested fix).

### 4.4 Surface to User

**Requirements Coverage Summary (MANDATORY in review output):**

Present to the user:
1. Requirements score: X/Y requirements satisfied
2. RSpec results: X examples, Y failures
3. Any BLOCKED requirements with blocking issue
4. Any NEEDS HUMAN requirements with what to test
5. Migration status on both databases
6. Anti-patterns found (blockers vs warnings)
7. Overall status: PASSED / GAPS_FOUND / HUMAN_NEEDED

If GAPS_FOUND: list specific gaps with fix recommendations before allowing advancement.

Present via `AskUserQuestion`:

```
## Ship Readiness Assessment

### Requirements Coverage
Requirements: X/Y satisfied
[Requirements Coverage table from verification]

### Results Summary
[Results table from 4.1]

### Blockers (if any)
[List with file:line and suggested fix]

### BLOCKED Requirements (if any)
[Requirement ID, blocking issue, fix recommendation]

### NEEDS HUMAN Requirements (if any)
[Requirement ID, what to test manually]

### Known Issues (if any)
[List with severity and tracking plan]

### Custom Acceptance Criteria
[Pass/fail per MANIFEST-defined criterion with evidence]

### Anti-Patterns
[Blockers vs warnings count, file:line for blockers]

### Migration Status
[helium DB status, Neon DB status]

### Overall Status: PASSED / GAPS_FOUND / HUMAN_NEEDED

### Options
1. **Approve** — proceed to SHIP (only if PASSED or HUMAN_NEEDED with acceptable items)
2. **Fix and re-validate** — address blockers, re-run from Execute
3. **Back to Architect** — redesign validation plan
4. **Back to Discuss** — revisit validation strategy
5. **Pause** — save state, exit pipeline
```

Approve is only offered when zero blockers remain.

### 4.5 Artifact

Write `.dev/validate/review-ship-readiness.md` — full results, blocker/known issue categorization, ship readiness verdict, user decision. This artifact IS the context bridge to SHIP.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output validate review <feature-dir> --plugin backend
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest <feature-dir> --plugin backend
```

### 4.6 After Approval

Update MANIFEST phase to VALIDATE complete. Display and STOP:

```
---
Next Up

Phase: SHIP — Changelog + commit + deployment
Command: dev-pipeline-backend:ship
/clear first — fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke SHIP. Do not offer "continue in same session".

---

## Common Mistakes

| Mistake | Why It Fails | Prevention |
|---------|-------------|------------|
| Claiming "tests passed" without showing output | No evidence, no trust | Show actual `bundle exec rspec` output in THIS message |
| Skipping migration sync check | Production DB diverges from local | Always verify BOTH helium and Neon |
| Not scanning for secrets | Credentials leak to git history | Run secrets scan on every validate |
| Declaring security "clean" after partial audit | Misses auth boundary violations, COPPA gaps | Full checklist when security domains tagged |
| Using string comparison for profile types | `profile_type == 'teacher'` always fails (integer vs string) | Verify all checks use `profile.teacher?` helpers |
| Mixing User and Student auth in tests | Auth boundary violation ships to production | Verify separate auth paths tested independently |
| Not checking API contract compliance | Endpoints drift from documented design | Route-by-route comparison against DOCUMENT artifact |
| Claiming "I already verified earlier" | Stale evidence from different context | Fresh evidence only — re-run in THIS session |
| Orchestrator executing checks inline | Violates subagent dispatch rule (D03) | Always dispatch via Agent tool |
| Skipping production data audit | NULL fields and missing associations cause 500s | Reference `/production-data-audit` for touched models |
