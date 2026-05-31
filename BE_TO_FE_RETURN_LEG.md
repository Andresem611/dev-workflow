# BE→FE Return Leg Design

Companion document to `FE_TO_BE_HANDOFF_REDESIGN.md`. Covers the return trip: once the backend pipeline has built and validated a FE-initiated cross-stack feature, this document defines how the BE hands back to the FE, with a reconciled contract and a ready-to-act FE prompt.

**Scope:** Round-trip only (feature originated in FE, went to BE for contract design). BE-initiated handovers (no FE design exists) are out of scope.

---

## The Problem This Solves

The 5.3.0 FE→BE redesign fixed the outbound leg: FE sends requirements-only (no shapes), BE designs the contract from its own codebase. But the return leg had three bugs:

1. **`CONTRACT-LANDED` is written at PLAN time**, before BUILD has run. Any drift introduced during BUILD (a shape change, a new error code, a dropped field) is silently absent from the ledger.
2. **VALIDATE has runtime API evidence** but produces only a pass/fail verdict. It never computes a delta or updates the ledger.
3. **VALIDATE's Next Up routes directly to SHIP** — the conditional HANDOVER phase is dead code for cross-stack features because nothing routes to it.

---

## Full Round-Trip Trace

```
FE DESIGN
  └─ Produces requirements-only feature brief (.dev/design/backend-feature-brief.md)
  └─ Initializes shared-decision-ledger.md (FE-owned, in FE worktree)
  └─ FE continues in parallel against local provisional mocks

BE INTAKE
  └─ Reads feature brief, routes to DISCOVER (not PLAN)

BE DISCOVER
  └─ Audits existing codebase, designs the FE-facing contract via competition

BE PLAN
  └─ Locks the contract
  └─ On Accept: writes contract decisions + initial CONTRACT-LANDED marker
     to <BE>/.dev/be-contract-decisions.md
     (PLAN-time, "contract promised")

BE DOCUMENT → BE BUILD
  └─ Contract may drift during BUILD (shape changes, new error codes, field removals)

BE VALIDATE
  └─ Runs runtime API verification against actual implementation
  └─ Produces review-ship-readiness.md with endpoint-by-endpoint evidence
  └─ [NEW] Next Up: if MANIFEST has Cross-Stack: frontend → /dev:handover
                    else → /dev:ship (unchanged)

BE HANDOVER  ← [EXTENDED]
  └─ Stage 1: reads be-contract-decisions.md (PLAN-time rows) +
              review-ship-readiness.md + runtime API evidence
  └─ Stage 3: computes contract delta — PLAN-promised vs ship-time actual
  └─ Stage 4 Accept:
      └─ Appends superseded + new ACTIVE rows to be-contract-decisions.md
      └─ Re-stamps CONTRACT-LANDED marker (ship-time, "contract delivered")
      └─ Emits FE Reconciliation Prompt to chat

BE SHIP

─────── FE picks up from here ───────

FE /dev resume
  └─ Backend-contract check (dev/SKILL.md:198) reads be-contract-decisions.md
  └─ Transcribes BE rows into canonical shared-decision-ledger.md
  └─ Runs ledger-validate
  └─ Surfaces any SUPERSEDED rows to user: "BE changed X → Y, reason: Z"

FE PLAN review
  └─ User reviews locked plan against delta rows
  └─ If delta is shape-affecting: re-review relevant DESIGN_SPEC sections
  └─ If delta is additive/non-breaking: swap mocks → real contract and continue

FE BUILD (resumes or restarts from affected wave)

FE VALIDATE → FE SHIP
```

---

## What Changes in the Pipeline (summary)

| Phase | Before | After |
|-------|--------|-------|
| BE PLAN | Writes initial CONTRACT-LANDED (PLAN-time) | Unchanged — initial write stays at PLAN |
| BE VALIDATE §4.7 | Next Up → `/dev:ship` always | Next Up → `/dev:handover` if `Cross-Stack: frontend` |
| BE HANDOVER Stage 1 | Reads VALIDATE + FE context | Also reads `be-contract-decisions.md` |
| BE HANDOVER Stage 3 | Generates prose handover doc | Also computes contract delta row-by-row |
| BE HANDOVER Stage 4 | Writes prose + Notion update | Also appends delta rows, re-stamps marker, emits FE prompt |
| BE HANDOVER Rules | No ledger mention | Idempotence invariant added |

---

## Ledger Write Protocol (HANDOVER Stage 4 Accept)

The BE never writes the FE-owned canonical ledger (`<FE-feature>/.dev/shared-decision-ledger.md`). All writes stay in the BE worktree.

**On Accept:**

1. Read all rows currently in `be-contract-decisions.md`.
2. For each row that VALIDATE evidence shows has drifted from PLAN:
   - Flip that row's `Status` → `SUPERSEDED`, set `Superseded By` → new ID.
   - Append a new ACTIVE row with the ship-time value, `Changed By = BE`, `Reason = [what changed and why]`.
3. For each row where VALIDATE confirms no drift: leave unchanged (still ACTIVE).
4. Append an updated `CONTRACT-LANDED` marker row:
   ```
   | CONTRACT-LANDED | <date> | BE | <BE>/.dev/validate/review-ship-readiness.md | Delta: N rows superseded |
   ```
   (This is a second marker row — the first from PLAN stays as history per append-only rules.)
5. Run `ledger-validate <feature-dir> --plugin backend` to confirm no orphaned SUPERSEDED rows.

**Idempotence:** Ledger writes happen ONLY on Accept. If the user retries HANDOVER (Back to Architect / Discuss / re-runs Execute), the skill re-computes the delta from current VALIDATE evidence. On the next Accept, it supersedes any delta rows written in the prior Accept run, then appends fresh ACTIVE rows. Double-writing is prevented by detecting rows already marked SUPERSEDED before writing.

---

## FE Reconciliation Prompt (emitted to chat on Accept)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
▶ FE Reconciliation Required

Backend handover complete for: [Feature Name]
FE feature dir: <absolute path to FE feature dir>

Contract delta — [N rows superseded / No drift]:
  [SD-NN] [one-line summary of what changed]
  ...

Artifacts to re-review:
  - ALWAYS: .dev/plan/review-plan-approval.md (check locked decisions against delta)
  - IF shape-affecting delta: DESIGN_SPEC sections [list affected sections]

Resume command (run from inside the FE worktree):
  /dev

The /dev resume protocol will:
  1. Read be-contract-decisions.md and transcribe delta rows
  2. Surface SUPERSEDED decisions with reasons
  3. Prompt you to re-review PLAN before continuing

When reconciled: continue from PLAN → DOCUMENT, or resume BUILD if no
architecture changes required.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## Edge Cases

### 1. Zero-drift (BUILD landed exactly what PLAN promised)

VALIDATE runtime evidence matches all PLAN-time contract rows exactly. Delta is empty.

**How handled:**
- No rows are superseded. `be-contract-decisions.md` is unchanged except for the new `CONTRACT-LANDED` marker row stamped "Delta: 0 rows."
- FE Reconciliation Prompt still prints, with: "No drift — swap mocks for the landed contract and continue."
- The FE resume protocol still runs, finds the updated marker, confirms zero new superseded rows, swaps mocks.

### 2. Retry after Accept (user retries HANDOVER after a partial run)

User accepted once, found an issue in SHIP or FE reconciliation, re-runs `/dev:handover`.

**How handled:**
- Stage 4 re-computes the delta from the **current** VALIDATE evidence (re-reads `review-ship-readiness.md`).
- Before writing, detects any rows already SUPERSEDED by a prior HANDOVER run (checks `Superseded By` field).
- Supersedes those rows again with a fresh supersession chain (prior Accept's new ACTIVE row → SUPERSEDED → newer ACTIVE row).
- Never writes a duplicate ACTIVE row for a row already handled.
- Result: clean append-only history, no double-write.

### 3. Cross-Stack tag added post-INTAKE

BE PLAN or DISCOVER added `Cross-Stack: frontend` after INTAKE ran (INTAKE may have missed the signal).

**How handled:**
- VALIDATE §4.7 reads MANIFEST at run-time to detect the tag. It does NOT rely on a flag set at INTAKE.
- If tag is present at VALIDATE Review time → route to HANDOVER.
- HANDOVER Stage 1 also re-reads MANIFEST to confirm, so it never assumes INTAKE was the source.

### 4. No `be-contract-decisions.md` (pre-5.3.0 feature)

Feature was started before the 5.3.0 ledger system existed. File is absent.

**How handled:**
- HANDOVER Stage 1 checks for file existence before reading.
- If absent: emit a **loud warning** in chat:
  ```
  ⚠️ be-contract-decisions.md not found — this feature predates the shared ledger
  (5.3.0). Skipping ledger reconciliation. Proceeding with prose-only handover.
  ```
- Still produces the full `FRONTEND_HANDOVER_PROMPT.md` prose doc (existing behavior).
- Emits a manual FE Reconciliation Prompt with "LEDGER UNAVAILABLE — manually compare PLAN artifacts with this handover doc before swapping mocks."
- Does NOT crash or block HANDOVER from completing.

### 5. VALIDATE missing runtime API verification (server unavailable)

`review-ship-readiness.md` shows "Rails server unavailable — skipping runtime API verification."

**How handled:**
- HANDOVER Stage 1 detects the "unavailable" flag in the VALIDATE evidence.
- Delta computation treats all contract rows as "delta unknown" (cannot confirm drift or no-drift).
- No rows are superseded (cannot safely supersede without evidence).
- `CONTRACT-LANDED` marker still written, stamped: "Delta: UNKNOWN — runtime verification unavailable."
- FE Reconciliation Prompt includes warning:
  ```
  ⚠️ VALIDATE runtime API verification was skipped (server unavailable).
  Contract drift cannot be confirmed. Treat all contract rows as unverified.
  Manually verify endpoints before swapping mocks.
  ```

---

## Invariants

1. **BE never writes `<FE-feature>/.dev/shared-decision-ledger.md`.** All BE writes stay in `<BE-feature>/.dev/be-contract-decisions.md`.
2. **Ledger writes happen ONLY on Accept.** Back to Architect / Discuss / Retry Execute = no writes.
3. **Append-only.** No row is deleted or rewritten. Drift = supersession chain.
4. **Second CONTRACT-LANDED marker is additive.** First (PLAN-time) stays in history. Second (HANDOVER-time) is appended as a new row.
5. **FE resume is the transcription point.** The FE `dev/SKILL.md:198` resume protocol already handles BE-originated rows correctly — this design requires no FE plugin changes.

---

## Files Changed (this feature)

| File | Change |
|------|--------|
| `dev-pipeline-backend/skills/validate/SKILL.md` | §4.7 Next Up: conditional route to HANDOVER |
| `dev-pipeline-backend/skills/handover/SKILL.md` | Ledger-aware stages, delta computation, FE prompt, idempotence rule |
| `dev-pipeline-backend/.claude-plugin/plugin.json` | Version 3.9.0 → 3.10.0 |
| `frontend/CHANGELOG.md` | [5.4.0] entry |
| `frontend/BE_TO_FE_RETURN_LEG.md` | This file (NEW) |

No FE plugin changes. `dev-pipeline-frontend/skills/dev/SKILL.md:198` already handles BE writes.
