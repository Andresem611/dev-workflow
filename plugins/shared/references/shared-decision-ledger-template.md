# Shared Cross-Stack Decision Ledger

The single source of truth for decisions that BOTH the frontend and backend pipelines depend on (product intent, the API contract, cross-stack design decisions). It extends the per-feature Decision Ledger (`decision-ledger-template.md`) with two additions: **cross-stack scope** and an **append-only supersession model** with provenance.

## Why this exists

As FE and BE evolve in paired worktrees, shared decisions drift. This ledger keeps **one canonical record** so neither side silently diverges: nothing is ever deleted — decisions are **superseded** with a reason, and the other side sees "X changed globally, because Y" on its next phase.

## Ownership, location, and the write path

- **Owner:** the **frontend** feature dir (the feature + product/design context originate FE). Git-backed = the never-lose / full-audit guarantee.
- **Canonical location:** `<FE-feature>/.dev/shared-decision-ledger.md` (absolute path carried in the feature brief).
- **Write path (worktree-scoped — see `project_thoven_paired_worktree_layout`):**
  - The **FE writes the canonical ledger directly** (its own repo).
  - The **BE never writes the canonical ledger.** It records its decisions + the `CONTRACT-LANDED` marker in its **own** feature artifacts (`<BE-feature>/.dev/be-contract-decisions.md`), in this same row format.
  - The **FE transcribes** BE-originated rows into the canonical ledger when it reads the BE result on resume/monitor. Cost: a propagation-delay window — BE rows aren't canonical until the FE next syncs.
- **The "link" is logical** — both sides reference by absolute path. NOT an OS symlink. An optional LOCAL gitignored convenience symlink may exist for human browsing; the pipeline never depends on it.

## Format (append-only)

```markdown
# Shared Decision Ledger: [Feature Name]

**Canonical owner:** frontend (`<FE-feature>/.dev/shared-decision-ledger.md`)
**Paired BE artifacts:** `<BE-feature>/.dev/be-contract-decisions.md`

| ID | Decision | Scope | Status | Superseded By | Changed By | Date | Reason |
|----|----------|-------|--------|---------------|------------|------|--------|
| SD-01 | Review card shows reviewer first name + rating + quote + date | product | ACTIVE | — | FE | 2026-05-29 | DESIGN spec |
| SD-02 | Reviews fetched on-demand (no real-time) | contract | SUPERSEDED | SD-05 | BE | 2026-05-30 | BE: existing dashboard endpoint already paginates; reuse it |
| SD-05 | Reviews paginated via the existing teacher-dashboard endpoint | contract | ACTIVE | — | BE | 2026-05-30 | supersedes SD-02 — reuse over net-new |

## CONTRACT-LANDED
| Marker | Date | By | Contract location | Notes |
|--------|------|----|--------------------|-------|
| CONTRACT-LANDED | 2026-05-30 | BE | <BE-feature>/.dev/plan/review-plan-approval.md | Contract locked; FE may swap mocks |
```

## Append-only + supersession rules

1. **Never delete or rewrite an existing row.** History is immutable (git underneath is the deep audit trail).
2. **To change a decision:** flip the old row's `Status` to `SUPERSEDED`, set its `Superseded By` to the new ID, then **add a new ACTIVE row** that references what it supersedes in its `Reason`.
3. **Every SUPERSEDED row MUST have** a `Superseded By` ID, a `Changed By` (FE/BE), a `Date`, and a `Reason`. `ledger-validate` hard-fails otherwise.
4. **IDs are unique and monotonic** (`SD-01`, `SD-02`, …). Reusing an ID is a validation failure.
5. **Scope** is one of `product` / `contract` / `design` — so each side can filter what concerns it.

## Cross-stack visibility (the point)

On each phase entry, the pipeline reads the ledger and surfaces any row that became `SUPERSEDED` since it last looked — e.g. "BE superseded SD-02 (contract) → SD-05, reason: reuse existing endpoint." The consuming side then knows a shared decision changed globally and why, instead of silently diverging.

## Lifecycle

| When | Who | Action |
|------|-----|--------|
| FE DESIGN produces the brief | FE | Initialize the ledger (if absent); add the FE's contract-affecting product/design decisions as ACTIVE rows; record the ledger path in the brief |
| BE DISCOVER/PLAN locks the contract | BE | Append contract decisions + a `CONTRACT-LANDED` marker to its OWN `be-contract-decisions.md` (same row format) |
| FE resume / monitor | FE | Read the BE artifacts; transcribe BE rows + the marker into the canonical ledger; if a BE row supersedes an FE row, flip the FE row to SUPERSEDED; swap local mocks → the landed contract |
| Either side changes a shared decision later | that side | Supersede (never delete); FE transcribes BE-originated supersessions on next sync |

Validate any time with: `dev-pipeline-tools.js ledger-validate <feature-dir> --plugin frontend|backend`.
