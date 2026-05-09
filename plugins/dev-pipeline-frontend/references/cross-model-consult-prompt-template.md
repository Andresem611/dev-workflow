# Cross-Model Consult Prompt Template

Adapted from LEARNINGS Phase 3 Codex shard prompt. Used by BUILD (After Final Wave) and VALIDATE (pre-SHIP) when cross-model consult is enabled (`DEV_PIPELINE_CROSS_MODEL != off`).

## Variables (substituted by orchestrator before invoking)

| Variable | Source |
|----------|--------|
| `<feature-name>` | MANIFEST metadata |
| `<mode>` | Hold or Expansion (Reduction skips this template entirely) |
| `<files-changed>` | `git diff --name-only <build-start-commit>..HEAD` |
| `<must_haves-aggregate>` | UNION of all wave files' `## must_haves` blocks |
| `<requirements>` | `<feature>/requirements.md` content (or absence note if not present) |
| `<api-contract>` | `<feature>/api/API_CONTRACT.md` content (or n/a if absent) |
| `<decision-ledger>` | MANIFEST `## Decisions Log` (LOCKED rows only) |

## Prompt template (verbatim)

```
You are an independent code reviewer with no context from the build process.
Your training corpus is different from the build agent's; your blind spots are different.

Feature: <feature-name>
Mode: <mode>
Files changed in this feature (post-BUILD): <files-changed>

Your job: review the diff for these classes of issue. For each, return PASS / WARN / NEEDS_WORK / HIGH_RISK + concrete file:line references.

1. **Contract drift** — diff API_CONTRACT.md against actual routes/endpoints in the code:
   <api-contract>

2. **Auth bypass via soft-delete or scoping shortcuts** (LEARNINGS CD-010 pattern):
   - Look for `where(active: true)` / `where.not(deleted_at: nil)` chains that miss the auth scope.
   - Look for direct ID lookups that skip parent-record auth.
   - Look for queries that bypass tenant isolation.

3. **Conditional side effects** that fire only in certain code paths:
   - `if env.production?` blocks not exercised in tests.
   - Logging/notification calls inside conditional branches.
   - Migrations that run only on first-deploy.

4. **must_haves silent-drop:** compare aggregated must_haves to grep of code symbols:
   <must_haves-aggregate>

5. **Mock-of-function-under-test patterns:** vi.mock / jest.mock of the module being implemented in the same wave (per `references/testing-anti-patterns.md` AP-T1).

6. **Frontend-specific:**
   a. Design-system primitive misuse (custom button when `<Button>` exists; custom modal when `<Dialog>` exists).
   b. Missing keyboard navigation on interactive elements.
   c. Dropped accessibility hints (aria-label, role, aria-live).
   d. Hardcoded colors not from the design-system tokens.
   e. Hardcoded copy strings (should be in i18n catalog if i18n is set up).

7. **Decision Ledger fidelity:** every LOCKED row in <decision-ledger> should have a code-side reflection. Flag any LOCKED decision that has no detectable implementation.

## Output format (return verbatim)

```
VERDICT: PASS | WARN | NEEDS_WORK | HIGH_RISK

FINDINGS:

[Class 1: Contract drift]
- file:line | severity | one-sentence finding

[Class 2: Auth bypass]
- file:line | severity | one-sentence finding

[...continues per class]

COST: $X.XX (under ceiling: <yes/no>)
```
```

## Findings consumption

The orchestrator parses the verdict and findings:

- **PASS:** log to bridge as PASS; advance.
- **WARN:** log findings to bridge as advisory; advance. User may opt to address.
- **NEEDS_WORK:** **BLOCK transition.** Surface findings to user. User must address each before re-running.
- **HIGH_RISK:** **BLOCK + auto-escalate to Expansion mode** (per LEARNINGS Lesson 4). Triggers VALIDATE→SHIP consult on the next pass.

No `--skip` flag. No bypass. The user can disable cross-model entirely via `DEV_PIPELINE_CROSS_MODEL=off`, but cannot dismiss a NEEDS_WORK or HIGH_RISK verdict without addressing findings.

## Cost management

User-set ceiling: **$1.00 per consult** (env: `DEV_PIPELINE_CROSS_MODEL_CEILING=1.00`).

If a consult exceeds ceiling, the orchestrator:
1. Logs the overrun.
2. Surfaces to user before invoking the next consult.
3. Pauses pipeline for user policy decision (raise ceiling / continue / disable for this feature / disable globally).

## Boundary triggers

- **BUILD After Final Wave:** Hold mode runs one consult; Expansion runs one consult. Reduction skips.
- **VALIDATE pre-SHIP:** Expansion only. Lighter prompt focused on ship-readiness criteria from VALIDATE bridge.
