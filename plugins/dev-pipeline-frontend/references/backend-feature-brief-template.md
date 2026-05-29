# Backend Feature-Brief Template

## Purpose

When the frontend DESIGN phase discovers it needs backend work that doesn't exist yet, it produces a **feature brief** — a requirements-only handoff. The brief tells the backend *what the feature is and what the frontend needs*, and lets the **backend's own pipeline design the API contract and architecture** from its actual codebase.

This is NOT a contract. The frontend never decides the API contract. (See `feedback_backend_handover_style`.)

## Why requirements-only (the AI failure mode this prevents)

A suggested shape handed to a backend *agent* gets rubber-stamped — it becomes the spec, and the backend skips real contract design. So the brief carries **zero API shapes**. The backend designs the contract via a clean-room-vs-shape-aware competition in its DISCOVER phase; the brief's job is to feed that with intent, not output.

## When to Produce

During DESIGN Review's "Backend Requirements Check", when any interaction needs a backend capability that doesn't exist. Produced at `docs/[Feature_Name]/.dev/design/backend-feature-brief.md`, then validated by `validate-handoff-brief` (hard-blocks on any leak) before handoff.

## How the backend consumes it

Paste the brief into the backend repo's `/dev` as a **"frontend handoff"** entry mode → it routes to **DISCOVER** (NOT straight to PLAN). The backend reads the FE context (path below) under its allow-listed cross-repo read, audits what already exists, then designs the contract.

---

## Template

```markdown
# Backend Feature Brief: [Feature Name]

**Produced by:** frontend /dev:design
**Date:** [YYYY-MM-DD]
**Status:** BRIEF (requirements only — backend owns the contract)
**FE feature dir (absolute, for cross-repo read):** /Users/.../thoven/frontend/docs/[Feature_Name]/.dev/
**Shared decision ledger:** [absolute path to the FE-owned canonical ledger]

---

## Feature
- **What:** [one-paragraph description of the feature]
- **Why:** [the problem it solves / the user value]
- **Who benefits:** [parent / teacher / student / admin — and how]

## What the frontend needs (data-needs, per surface — PROSE, no shapes)
For each UI surface, describe the *data it needs to function* — in words, not JSON.
- **[Surface / component]:** needs [e.g. "the reviewer's first name, a star rating, a short quote, and the lesson date"]. [Note any sort/grouping/pagination *feel*, real-time vs on-demand, empty/loading/error UX.]
- **[Next surface]:** ...

## Binding UX behaviors
Behaviors the backend MUST support (these are binding; the *shape* that delivers them is the backend's call).
- [e.g. "A teacher only ever sees reviews for their own students."]
- [e.g. "Submitting a review is idempotent — a double-tap must not create two."]

## What the frontend already sends / has
- [e.g. "The client holds `booking_id` and the dual-JWT `token`/`student_token`."]
- [e.g. "Auth context: `token` for Parents/Teachers, `student_token` for Students."]

## Existing backend systems this touches (names only — audit, don't prescribe)
Name the models/endpoints/flows you believe are involved so the backend can audit them. Do NOT prescribe changes.
- [e.g. "Likely touches the `Booking` and `Review` models and the teacher dashboard endpoints — backend to confirm."]

## Asks (audit-framed — backend fills Status/Evidence/Action)
Frame every ask as "confirm what exists, propose smallest delta." Never "build Z." (See `feedback_audit_before_handover_request`.)

| Ask | Status (BE fills) | Evidence (BE fills) | Action needed if not done (BE fills) |
|-----|-------------------|---------------------|--------------------------------------|
| [e.g. "A way to fetch a teacher's reviews"] | [ ] exists / partial / missing | [path / route] | [smallest delta] |

## Priority / what this blocks
- **Priority:** [P0/P1/P2]
- **Blocks:** [what FE work is blocked until this lands, if any]

---

## NEVER in this brief (the backend owns all of this)
Response JSON shapes · field names/types/interfaces · endpoint methods/URLs · DB schema · columns · indexes · migrations · controller/service structure · how to break down the work. `validate-handoff-brief` hard-blocks the handoff if any of these leak in.
```

---

## Principles

1. **Requirements only.** Never suggest tables, columns, indexes, migrations, serializers, or response shapes. The backend pipeline makes those decisions from its real codebase.
2. **No shapes — not even "suggested."** A suggested shape poisons the backend's contract design (it gets adopted verbatim). Describe *what you need*, in prose.
3. **Behaviors are binding; shapes are not yours to give.** State the UX behaviors the backend must satisfy; let the backend choose the contract that delivers them.
4. **Audit before build.** Every ask is "confirm what exists, propose smallest delta," never "build this." Aged/existing systems often already cover the need.
5. **Auth is specific.** Always say which JWT (User `token` vs Student `student_token`) and which role — that's a requirement, not an implementation detail.
6. **Carry the pointers, not the contract.** The brief carries the FE feature-dir absolute path (so the backend can read product/design/UX context) and the shared-ledger pointer — never the contract itself.

## After the brief

| Flow | What happens |
|------|--------------|
| **Parallel (default)** | FE builds against **local-only provisional mocks** (never in this brief), and sets a monitor on the shared ledger for the `CONTRACT-LANDED` marker. Backend designs the contract in DISCOVER. FE swaps mocks → real contract on resume. |
| **Pause + handoff** | FE pauses at DESIGN; backend designs the contract; FE resumes when the ledger marks it landed. |

The brief enters the backend `/dev` as **"frontend handoff" → DISCOVER**. The backend designs the contract (clean-room vs shape-aware competition + judge), records its decisions in its own artifacts, and appends `CONTRACT-LANDED` so the FE can transcribe and resume.
