# Frontend→Backend Handoff Redesign — Locked Design

**Status:** Phases 1-3 ALL IMPLEMENTED 2026-05-29 (FE plugin v5.3.0 / BE v3.9.0) — pending user review. Full design built; install via `/dev:update` and validate end-to-end on a real feature. Both seams closed: access (D6) RESOLVED in code (`permissions.allow` Read-glob); ledger write path (D7/D9) blessed = BE-writes-own + FE-transcribes.
**Grilled:** 2026-05-29 (continuation of the `dev-pipeline-strict-backend-handover-gate` item in the FE repo `docs/FUTURE_IMPROVEMENTS.md`). The anticipating FUTURE entry lives in `~/thoven/frontend/docs/FUTURE_IMPROVEMENTS.md`; add a pointer there to this doc so it's findable.
**Edits target:** the plugin repo `Andresem611/dev-workflow.git` (this repo) — BOTH `dev-pipeline-frontend` AND `dev-pipeline-backend`, in lockstep. Not the marketplace install cache. (`feedback_plugin_not_local`)

---

## Problem

The frontend→backend handoff is broken in two ways:

1. **Boundary mixing — the FE decides backend things.** `dev-pipeline-frontend/skills/plan/SKILL.md` has the FE authoring "Expected Request / Expected Response" per endpoint, and `design/SKILL.md` emits a full-JSON-shape `backend-contract-stub.md`. The FE pipeline was even writing migration strategy into the handoff. This violates `feedback_backend_handover_style` (which already lists "response type interfaces dictated from frontend" as NEVER) — the doc says "requirements only" but nothing enforces it.

2. **Skip-to-planning — no real backend architecture step.** `dev-pipeline-backend/skills/intake/SKILL.md` routes *"Frontend handoff → PLAN (skip DISCOVER)"*, identical to a finished tech spec. So "created the handoff doc → went straight into planning" — the backend treated the FE's self-authored contract as a locked spec to implement, instead of architecting from a brief.

**Root principle (the through-line of every decision below):** guardrails must be **structural, not willpower** — eager agents rubber-stamp suggestions and don't self-enforce boundaries.

---

## Scope

**IN:** the boundary fix, the routing fix, a context-transfer mechanism, a divergence ledger, and an FE contract-landing monitor.
**DEFERRED:** hard enforcement — a SHIP-blocking gate that requires backend acceptance, and a contract version/hash acceptance protocol.
**OUT:** the BE→FE `handover` skill (the return trip) beyond the lightweight FE monitor; exact competition agent types + decomposition granularity ("needs more setup").

---

## Locked Decisions

### D1 — Handoff = requirements-only feature brief (no shapes)
The FE→BE handoff is a **feature brief**, not a contract.
- **Binding:** data-needs (prose, per surface) + UX behaviors/intent.
- **ALLOWED** (per `feedback_backend_handover_style`): feature what/why/who; what the FE already sends/has; naming *existing* BE systems it touches (models/endpoints/flows); priority + what blocks the FE.
- **NEVER:** response JSON shapes, field/type interfaces, endpoint method/URL prescriptions, DB schema, columns, indexes, migrations, controller/service structure, work groupings.
- Asks are **audit-framed** (Status / Evidence / Action-needed-if-not-done) per `feedback_audit_before_handover_request` — "confirm what exists, propose smallest delta," never "build Z."

> Rationale: "the moment we suggest a shape, it poisons the context with a prebuilt." For an AI backend agent a suggested shape *becomes* the spec. So no shapes cross the boundary.

### D2 — Backend reads FE context via an ALLOWLIST
The backend reads FE context directly (no duplication), restricted to: **PRODUCT.md, design spec, MANIFEST, decision ledger, UX intent/binding behaviors**. It is **barred from the FE API layer** (`lib/*-api.ts`, `types/`, mocks) — that's the poison source.

### D3 — Contract surface designed by a COMPETITION
The FE-facing **contract surface** (endpoint request/response + serializer field selection) is designed by two competing agents + a judge. **Each competitor designs only the contract surface**, sketching just enough underlying data model to stay coherent — NOT the authoritative schema/migrations (those are D4 normal design). This is the reconciliation with D5: the competition does not span all backend layers.
- **Agent 1 (clean-room):** receives ONLY product/UX context, **injected into its prompt by the orchestrator** — it has *no FE file access*, so it structurally cannot see FE shapes. (Matches "no context, only product context.")
- **Agent 2 (shape-aware):** given the FE repo path + cross-repo read, reads the FE API layer ("the suggestions").
- **LLM-as-judge** compares the two contract designs. The divergence between the clean (Agent 1) and shape-aware (Agent 2) contract = the *diagnostic* of exactly where the FE's existing shapes pulled the design, so that pull is made visible and deliberate rather than silent.
- Both agents read the backend's own codebase freely.

### D4 — Competition is scoped to the FE-shared surface only
Only the FE-shared contract surface gets the competition. **Non-shared backend architecture (DB schema, models, migrations, internal services) uses NORMAL full-context design — bias welcome** (the FE has no opinion there, so there is nothing to poison). Exact competition agent types + whole-slice-vs-per-layer decomposition: *deferred* ("needs more setup"; lean whole-slice design + per-layer judging).

### D5 — Routing: FE handoff → backend DISCOVER (not PLAN)
Fixes the skip-to-planning bug. DISCOVER runs feasibility + the audit ("does this already exist?") + the contract-surface competition as a defined step; PLAN then locks everything. Update backend `intake` Entry Mode Detection: **Frontend handoff → DISCOVER** (was → PLAN, skip DISCOVER).

### D6 — Access mechanism — **RESOLVED (verified in code)**
- The FE handoff passes its **own absolute feature-dir path** (paired-worktree rule: FE passes its path, BE never hard-codes it — `project_thoven_paired_worktree_layout`).
- Clean-room is enforced **structurally** by orchestrator-injection (D3), not by instructing the agent.
- **Mechanism = a `permissions.allow` Read-glob, NOT `additionalDirectories`.** Verified 2026-05-29: `~/thoven/backend/.claude/settings.local.json` already contains `Read(//Users/andresmartinez/thoven/**)` (and `Read(//Users/andresmartinez/**)`). So a backend session can already read any FE worktree under `~/thoven/`. Cross-repo BE→FE reads work today in the main repos.
- **Caveat (the only real action item):** `settings.local.json` is per-directory, gitignored, and uses absolute user paths. A *fresh* backend worktree (`backend-<feature>`) may lack the entry. The BE `intake` skill should **verify/add** `Read(//<thoven-root>/**)` (or the specific FE feature path) to the consuming repo's `settings.local.json` when it processes a frontend handoff. Not portable to CI/other machines (absolute paths), but fine for this single-dev paired-worktree setup.

### D7 — Divergence: one FE-owned, git-backed, append-only shared decision ledger
- **Single canonical file**, owned by the FE feature dir (feature + product/design context originate FE), git-backed (= the never-lose / full-audit guarantee). *(settled)*
- **Append-only with supersession:** entries are never deleted; status `ACTIVE`/`SUPERSEDED`, `superseded_by`, `changed_by` (FE/BE), `date`, `reason`. *(settled)*
- **Extension of the existing Decision Ledger primitive** (`references/decision-ledger-template.md`) — adds the `SUPERSEDED` state + provenance + cross-stack scope. *(settled)*
- **Write path — who writes BE-originated entries, into which repo? (evidence-backed recommendation, needs user blessing.)** Code evidence (2026-05-29) makes the answer clear: the consuming repo's `settings.local.json` allow-list grants cross-repo *Read* (`Read(//Users/.../thoven/**)`) but **no cross-repo Write/Edit** — and `project_thoven_paired_worktree_layout` says "file writes are scoped to the current worktree; reading from sibling worktrees is fine." So BE-writes-FE-ledger-directly would require a new cross-repo Write grant AND break the convention. **Resolution:** every write stays worktree-scoped — the BE records its contract decisions + supersessions in its *own* feature artifacts; the FE **transcribes** BE-originated entries into the canonical FE ledger when it reads the BE result on resume/monitor (FE reads BE worktree = allow-listed; FE writes its own ledger = local). **Named cost:** a propagation-delay window — BE-originated entries aren't in the canonical ledger until the FE next syncs. (User to bless this convention; it's strongly favored by the evidence.)
- The "link" is **logical** (a runtime-resolved path), NOT an OS symlink (committed symlinks dangle across worktrees/clones/CI and bake forbidden cross-repo paths). An **optional, LOCAL, gitignored convenience symlink** may exist for human browsing only — the pipeline never depends on it.
- On each phase entry, the pipeline surfaces entries superseded since it last looked ("backend superseded product decision D-12, reason X → changed globally").

### D8 — Handoff artifact + leak guard
- Replace `references/backend-contract-stub-template.md` with a **feature-brief template** (requirements-only, audit-framed, NEVER-list).
- Produced at the FE **DESIGN Review** backend gate (rewritten), routes to BE DISCOVER. Carries: the brief + FE feature-dir absolute path + shared-ledger pointer.
- **NEVER-list enforced by a hybrid validator CLI** `validate-handoff-brief`: fast regex for unambiguous leaks (fenced JSON response blocks, `create_table`/`add_column`/`add_index`, response `interface`/`type` defs, HTTP method+path) **+ a small LLM-judge** for nuance (allows naming a model, blocks dictating its schema). **Hard-blocks** the handoff on confirmed leak.

### D9 — FE mocks path + contract-landing monitor
- FE builds against **local-only provisional mock types** for parallel velocity — these are FE-local, **never in the handoff** (no poison). When the real contract lands, FE swaps and adapts diffs (accepted cost of BE owning the contract).
- When the BE locks the contract, it writes a `CONTRACT-LANDED` marker **in its own feature artifacts** (consistent with the worktree-write-scope resolution in D7 — the BE does not write the FE ledger directly).
- FE pause-handoff records it's waiting on that marker; **the FE monitor reads the BE worktree** for it (cross-repo *read*, mirror of D6), and on resume the FE swaps mocks→contract and **transcribes** the contract + `CONTRACT-LANDED` into the canonical FE ledger. Durable mechanism = marker + check-on-resume. (Depends on the D7 write-path resolution; a FE→BE read grant is the mirror of D6's BE→FE grant.)
- **Optional** background watcher (Monitor tool / file-watch) pings live when the marker appears — convenience, not load-bearing.

---

## Corrected end-to-end flow

```
INTAKE (FE)
  → FE product design (DISCOVER → DESIGN)
  → DESIGN Review backend gate: produce requirements-only feature brief
      (validate-handoff-brief hard-blocks leaks) + FE abs path + ledger pointer
  → BE DISCOVER (NOT skip):
      • reads FE allowlist context (product/design/UX) via granted cross-repo read
      • audit: does this already exist?
      • contract-surface COMPETITION: Agent1 clean-room (injected) vs Agent2 shape-aware
        → LLM-judge per layer
      • normal full-context design for schema/models/migrations/services
  → BE PLAN locks contract + architecture
  → BE appends CONTRACT-LANDED to shared ledger
  → FE monitor/resume: swap local mocks → real contract, adapt, continue PLAN→BUILD
```

All cross-stack product/contract/design decisions live in the one append-only ledger; supersessions are visible to both sides with reasons.

---

## Implementation surface (both plugins, in this repo)

- `dev-pipeline-frontend/skills/design/SKILL.md` — rewrite "Backend Requirements Check": emit feature brief (not shape stub), run `validate-handoff-brief`, pass FE abs path + ledger pointer, route to BE DISCOVER; reframe the 3 options (mocks = local-only / pause / parallel) + add the contract-landed monitor.
- `dev-pipeline-frontend/references/backend-contract-stub-template.md` → replace with `backend-feature-brief-template.md`.
- `dev-pipeline-frontend/skills/plan/SKILL.md` — remove FE-authored "Expected Request/Expected Response" (Backend Dependency Status); reframe as prose data-needs, no shapes.
- `dev-pipeline-backend/skills/intake/SKILL.md` — Entry Mode Detection: Frontend handoff → DISCOVER; read FE allowlist context via passed path; cross-repo read grant.
- `dev-pipeline-backend/skills/discover/SKILL.md` — add the scoped contract-surface competition step (Agent1 injected / Agent2 shape-aware / LLM-judge per layer); normal design for the rest.
- `shared/tools/dev-pipeline-tools.js` — new commands: `validate-handoff-brief` (hybrid leak check), shared-ledger append + append-only/supersession validator, `CONTRACT-LANDED` marker, `additionalDirectories` grant helper, optional monitor.
- `references/decision-ledger-template.md` (both) — extend to the cross-stack shared ledger (SUPERSEDED + provenance).
- Memory: augment `feedback_backend_handover_style` with this mechanism (the no-shapes rule is **affirmed**, not softened).

---

## Build order (apply `feedback_feature_decomposition` — don't ship it all at once)

The two bugs actually hit need only Phase 1. Everything else is additive — and Phase 1 does NOT depend on the two open seams, so it de-risks them.

- **Phase 1 — Core fix — ✅ SHIPPED 2026-05-29 (FE v5.2.0 / BE v3.7.0) (solves both bugs):**
  1. Replace `backend-contract-stub-template.md` → feature-brief template (D1) + `validate-handoff-brief` leak guard (D8). *Stops the boundary leak.*
  2. Backend `intake` Entry Mode: `Frontend handoff → DISCOVER` (D5). *Stops skip-to-planning.*
  3. FE `plan` SKILL: strip FE-authored "Expected Request/Expected Response" (D1).
- **Phase 2 — Context + competition — ✅ SHIPPED 2026-05-29 (BE v3.8.0):** allowlist read (D2), cross-repo read grant (D6 — RESOLVED: ensure `Read(//<thoven-root>/**)` in the consuming repo's `settings.local.json`), contract-surface competition + judge in BE DISCOVER (D3/D4 — staffed rails-expert clean-room / api-documenter shape-aware / architecture-reviewer judge).
- **Phase 3 — Divergence ledger + monitor — ✅ SHIPPED 2026-05-29 (FE v5.3.0 / BE v3.9.0):** shared append-only ledger (D7 — write path = BE-writes-own + FE-transcribes), `ledger-validate` integrity guard, FE mocks/monitor (D9).

## Deferred / open
- ~~Convention to bless (Phase 3): ledger write path~~ — RESOLVED + IMPLEMENTED: BE writes its own artifacts, FE transcribes on resume/monitor (cross-repo writes not allow-listed, reads are).
- ~~Access mechanism (D6)~~ — RESOLVED in code: `permissions.allow` Read-glob, already present in the main backend repo.
- Deferred: hard SHIP gate blocking until BE acceptance; contract version/hash acceptance protocol.
- Out: BE→FE handover (return trip) rework beyond the FE monitor.
- Needs more setup: exact competition agent types + decomposition granularity.
