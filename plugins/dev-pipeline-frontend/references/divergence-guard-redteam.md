# Divergence-Guard Red-Team Scenarios

These are replay scenarios drawn from a **real** pipeline divergence (Teacher_Reviews_Ratings_v1, the cold-parent review flow). Each guard must fire on its scenario. Use these as acceptance scenarios when changing the decision-ledger / DESIGN / PLAN / VALIDATE skills — if an edit makes a guard stop firing here, the edit regressed the guard.

Guards under test (defined in `decision-ledger-template.md` and wired into `skills/{discover,design,plan,validate}/SKILL.md`):
- **Guard 1** — decision-vs-decision conflict check (lock-vs-lock), WARN-and-continue on a USER-lock reversal.
- **Guard 2** — `Supersedes`/`Reason` ledger columns make reversals structurally visible.
- **Guard 3** — Journey-Intent Reconciliation (behavior, not just contract shape).
- **Guard 4** — an unverified `BE-confirm`/OPEN assumption may not justify a LOCKED decision.

---

## Scenario A — P-23 reverses USER-locked U-01 (Guard 1 + Guard 2)

**Ledger state going into PLAN:**
- `U-01 | Eligibility: only enrolled parents can review | User:PRD | LOCKED | DISCOVER`

**The diverging move (what actually happened):** PLAN proposes and locks
- `P-23 | Eligibility: BE policy, FE un-gated | Agent:PLAN | LOCKED | PLAN`

`P-23` directly contradicts `U-01` (un-gated vs enrolled-only), and `U-01`'s Source is `User:*`.

**Guard 1 MUST fire here.** Expected behavior:
- A `⚠ LOCK CONFLICT` banner is emitted at the top of the PLAN Review / bridge output, naming BOTH IDs (`P-23` reverses USER-locked `U-01`).
- The run does NOT silently proceed; the conflict is surfaced for the user to confirm or say "unlock U-01" / "keep U-01".
- It then continues (WARN-and-continue, not a hard halt — by design choice).

**Guard 2 MUST fire here.** Expected ledger row:
- `P-23 | ... | Agent:PLAN | LOCKED | PLAN | PLAN | Supersedes: U-01 | Reason: eligibility moved to BE policy`
- A `P-23` that reverses `U-01` with an empty `Supersedes`/`Reason` is itself a VALIDATE violation.

**Regression signal:** P-23 gets locked with no banner and no `Supersedes` recorded → Guard 1/2 broken.

---

## Scenario B — GROUND #10 false `purpose` assumption (Guard 4)

**GROUND finding (as written):** "`enrollViaInviteLink` already accepts a `purpose` in the request body, hinting BE has anticipated this." — stated as fact; never read in real code. (Reality: the shipped `lib/invite-link-api.ts` sends `{class_id, student_id, invite_link_token}` only; no `purpose`, no `review_eligible`.)

**The diverging move:** this assumption is used to justify the route decision (extend `/invite` vs separate `/review`) and is treated as a settled contract.

**Guard 4 MUST fire here.** Expected behavior:
- The finding is tagged **ASSUMED / `BE-confirm`** (it makes a cross-stack claim about backend behavior not read in this repo).
- Any decision whose rationale rests on it stays **OPEN** until the field is verified against the real backend contract.
- It may NOT be promoted to a LOCKED decision on "hinting" / "anticipates".

**Regression signal:** a decision locks citing the `purpose` assumption while it is still unverified → Guard 4 broken.

---

## Scenario C — separate `/review` route drops the enroll leg (Guard 3)

**DISCOVER flow (EP-A, cold parent):** signup → student creation → auto-enroll (`enrollViaInviteLink`) → **review as Step 4**. Behavioral invariant: *the parent is enrolled before they can review* (U-01). Dependency: the enroll step + a `class_id`.

**The diverging move:** DESIGN/PLAN choose a separate, un-gated `/review/[token]` route whose logged-out branch bounces to a bare `/signup`, then straight to the review form — **no enroll step**. Every API contract shape still matches (the review endpoints are fine), so contract reconciliation PASSES.

**Guard 3 MUST fire here.** Expected behavior:
- DESIGN Journey-Intent Reconciliation re-walks EP-A, lists the invariant "parent enrolled before review" + dependency "enroll step", and finds the chosen route **DROPS** it.
- A dropped invariant is a **BLOCK** at DESIGN; VALIDATE re-runs the check against shipped code and FAILS if the built flow lets a non-enrolled parent review — *even though all contract shapes match*.

**Regression signal:** contract checks pass and the feature advances with the enroll step gone, no journey-intent FAIL → Guard 3 broken.

---

## How to use these

When editing any guard, mentally (or in a test feature) replay A–C and confirm each guard still fires with the expected output. The point of every guard is the same: a downstream phase must not be able to silently trade away an upstream-locked behavior — the trade must be made **loud** (Guard 1), **visible** (Guard 2), **behavioral-not-just-shape** (Guard 3), and **evidence-based-not-assumed** (Guard 4).
