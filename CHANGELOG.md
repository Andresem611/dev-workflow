# Changelog

All notable changes to the dev-pipeline plugin marketplace will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [5.3.0] - 2026-05-29

### Changed — Frontend→Backend handoff redesign (frontend 5.3.0, backend 3.9.0)

The FE→BE handoff is now requirements-only: the frontend never decides the API contract or backend architecture. Fixes two bugs — the FE authoring request/response shapes (boundary leak) and the backend treating the handoff as a locked spec (skip-to-planning). Full design: `FE_TO_BE_HANDOFF_REDESIGN.md`.

- **FE feature brief replaces the contract stub** — requirements-only (data-needs + binding UX behaviors, no shapes); `validate-handoff-brief` hard-blocks schema/migration/shape/endpoint leaks (regex pre-filter + LLM-judge nuance pass).
- **Backend routes `frontend handoff → DISCOVER`** (was PLAN / skip-DISCOVER) — audits what already exists, then designs the contract itself.
- **Contract-surface competition** — backend reads allow-listed FE context (product/design/UX, never the FE API layer) and designs the FE contract via a clean-room (`rails-expert`) vs shape-aware (`api-documenter`) competition + `architecture-reviewer` judge.
- **Shared decision ledger** — one FE-owned, git-backed, append-only cross-stack ledger (supersession + provenance) with the `ledger-validate` integrity guard; the backend writes its locked contract + a `CONTRACT-LANDED` marker to its own artifacts, and the FE transcribes + swaps local mocks on resume.
- **Versions** — frontend 5.1.0 → 5.3.0, backend 3.6.0 → 3.9.0. 17/17 `dev-pipeline-tools` tests pass.
- Marketplace backend version re-synced to the plugin's actual version (`marketplace.json` was stale at 2.1.0 vs the plugin's 3.x).

## [team-kit 0.1.0] - 2026-05-21

### Added — new `team-kit` plugin (standalone, repo-agnostic)
- **New third plugin in the marketplace**, installable on its own (`claude plugin install team-kit@thoven-dev`), with no dependency on the dev-pipeline plugins. A durable home for curated third-party skills.
- **Four skills ported from [Cursor's Team Kit](https://github.com/cursor/plugins)** (MIT, pinned to upstream `3347cba`, attributed in `plugins/team-kit/NOTICE`):
  - `thermo-nuclear-code-quality-review` (skill + Task agent) — strict structural maintainability review: code-judo simplification, 1k-line file rule, spaghetti-condition detection, boundary/abstraction cleanliness. Skill is user-invoked; the agent auto-routes and is scoped to structural review (boundary vs `code-reviewer`).
  - `deslop` — remove AI slop from the current branch's diff vs main (scoped to avoid collision with `code-simplifier`).
  - `verify-this` — falsify a specific claim with baseline/treatment evidence → VERIFIED / NOT VERIFIED / INCONCLUSIVE.
  - `weekly-review` — recap of authored commits grouped by bugfix / tech-debt / net-new.
- **Not ported** (audited out): `ci-watcher`, `run-smoke-tests`, `what-did-i-get-done`, all PR-flow skills, and others — see `plugins/team-kit/NOTICE`.
- Pipeline wrapping of these skills is tracked separately in `TODO-team-kit-pipeline-wiring.md`.

## [4.3.0] - 2026-04-06

### Added (Both Pipelines — DOCUMENT)
- **LOCKED Decision Coverage check (BLOCKING)** — New Review section 4.2b verifies every LOCKED decision ID from the Decision Ledger appears in at least one task file. Undistributed decisions block DOCUMENT completion. Prevents the compression that caused 18 gaps in the Teach Mode feature build.
- **`verify-decision-coverage` tool command** — Mechanical enforcement in `dev-pipeline-tools.js`. Parses MANIFEST Decision Ledger, cross-references against all task files, reports PASS/FAIL with undistributed decision details. Called as BLOCKING in DOCUMENT Review, advisory in BUILD Step 0.
- **Verbatim LOCKED decision echo-back** — DOCUMENT Discuss now lists every LOCKED decision ID + text verbatim (not just counts). Count verification against MANIFEST catches silent drops. Mismatch blocks progress.

### Added (Both Pipelines — BUILD)
- **Two-tier LOCKED decisions in agent prompts** — Tier 1: task-specific decisions (highlighted, from task file). Tier 2: full Decision Ledger (safety net, from MANIFEST). Prevents agents from contradicting decisions they weren't explicitly assigned. Backend BUILD now has a Hard Rules section (was missing).

### Changed (Both Pipelines)
- **Removed "3-5 relevant" decision cap** — DOCUMENT task creation no longer limits locked decisions per task. Coverage (every decision in at least one task) takes priority over brevity.
- **Updated bridge-template.md echo-back protocol** — Verbatim decision listing required, count verification mandatory, failure conditions expanded.
- **Updated decision-ledger-template.md** — BUILD integration section rewritten for two-tier approach.
- **Common Mistakes tables** — "Dumping all decisions" anti-pattern replaced with "undistributed decision" anti-pattern.
- **Backend plugin.json** — Version bumped to 3.6.0
- **Frontend plugin.json** — Version bumped to 4.3.0

## [4.2.0] - 2026-04-01

### Added (Both Pipelines — VALIDATE)
- **Runtime API verification in backend VALIDATE** — Playwright MCP tools or curl hit every endpoint from API_CONTRACT.md against a running Rails server. Verifies status codes and response shapes. Server auto-started if not running, mandatory cleanup on exit. Runtime failures are BLOCKING.
- **Visual QA verification in frontend VALIDATE** — Playwright MCP tools navigate to affected pages, take screenshots, check console errors, verify accessibility trees. Enhanced by /qa-only skill when available (health scores, visual diffs). Console errors and broken layouts are BLOCKING.
- **Inner loop visual tracking via TaskCreate** — New Section 11 in shared inner-loop-reference.md. All phases create TaskCreate entries for Discuss/Architect/Execute/Review stages. Stage name lookup table covers all 8 phases. DESIGN adds Gate 1 + Gate 2 tasks. BUILD creates per-wave task sets. Prevents silent stage skipping.

### Added (Both Pipelines — DOCUMENT + BUILD)
- **Behavior-slice task template** — New `shared/references/task-template.md`. Tasks group files that import/call each other (controller + service + spec = one task). 2-4 tasks per wave, 1-3hr each. Three sections: Acceptance Criteria (must_haves), Locked Decisions (from PLAN), Context. "Suggested Approach" replaces mandatory TDD step-by-step instructions.
- **Multi-domain behavior-slice routing in BUILD** — Architect stage routes multi-domain tasks to PRIMARY domain agent with secondary concerns in prompt. No more dispatching 3 agents for one behavior slice. Existing single-domain routing from domain-agent-map.md unchanged.

### Changed (Both Pipelines)
- **DOCUMENT Execute** — Inline task template replaced with reference to shared task-template.md. Task sizing updated from 20min-2.5hr to 1-3hr behavior slices. Locked decisions extraction instruction added (3-5 relevant per task, not all).
- **Common Mistakes tables** — Updated across DOCUMENT and BUILD skills: "one task per file type" anti-pattern, "dumping all locked decisions" anti-pattern, "tasks under 1 hour" anti-pattern, "dispatching 3 agents for one behavior slice" anti-pattern.
- **Backend plugin.json** — Version bumped to 3.5.0
- **Frontend plugin.json** — Version bumped to 4.2.0

## [4.1.0] - 2026-03-31

### Added (Both Pipelines — BUILD)
- **4-layer verify-fix loop in BUILD Review** — Replaces single-pass review with: Layer 1 (Mechanical: rspec/type-check+lint), Layer 2 (Mechanical: verify-must-haves), Layer 3 (Semantic: code-reviewer with CRITICAL+PATTERN/UNIQUE/NON-CRITICAL classification), Layer 4 (Quality: /simplify with git stash revert on failure). Fix dispatches log must_haves/context_block/failure_details checklist.
- **Batch-eligible task classification** — Architect stage identifies tasks applying same change pattern to different files. Execute dispatches one agent for the batch instead of N agents.
- **Endpoint/component overlap check** — Sequential Awareness Gate extended: backend checks API endpoint overlap, frontend checks component import and shared endpoint overlap.
- **update-wave-tracking command** — New tool command mechanically updates MANIFEST (current_wave, build_progress), CURRENT_STATUS.md, and next wave's upstream context between waves. Replaces error-prone manual file updates.

### Added (Both Pipelines — Tools)
- **Auto-append API contract** — verify-must-haves auto-discovers routes from routes.rb and appends missing ones to API_CONTRACT.md with TBD fields. Creates contract file if missing.
- **Artifact trail enforcement** — validate-stage-entry blocks BUILD wave N+1 if previous wave missing any of 4 stage artifacts (discuss/architect/execute/review).
- **Completion log quality check** — validate-stage-entry warns on BUILD review if task completion logs have empty Files touched or Discoveries fields.
- **Enforcement in validate-stage-output** — Warns if review mentions /simplify without Post-simplify verification field, or fix dispatch without context checklist.
- **Migration guard in checkpoint-state** — Only validates current wave directory, not retroactive check of all prior waves.
- **Smoke test suite** — 8 tests covering all new tool commands and checks.

### Added (Frontend — DESIGN)
- **Context-aware design decisions** — 5 AskUserQuestion calls in Discuss: existing patterns, installed packages, design direction, component reuse, micro-interactions.
- **Mandatory ASCII mockup + Gate 1** — Layout mockup required before Execute. User must approve via AskUserQuestion. Recorded in discuss artifact.
- **Expansion mode component decomposition** — For layouts with 4+ sections, optional per-section ui-designer dispatch with cross-section consistency review.
- **Gate 2 in Review** — Final design approval via AskUserQuestion before advancing to PLAN.
- **Missing validate-stage-entry calls** — Added to Stages 2, 3, 4 (were missing in v4.0.0).

### Fixed (Both Pipelines)
- **Frontend phase chain ordering (P0)** — Frontend PHASE_CHAINS had "plan" before "design", breaking all validate-stage-entry prerequisite checks. Fixed to design→plan matching v4.0 intent.

### Changed (Both Pipelines)
- **Backend plugin.json** — Version bumped to 3.4.0
- **Frontend plugin.json** — Version bumped to 4.1.0

## [4.0.0] - 2026-03-30

### Changed (Frontend — MAJOR)
- **DESIGN before PLAN** — Phase chain reordered: INTAKE → DISCOVER → DESIGN → PLAN → DOCUMENT → BUILD → VALIDATE → SHIP. Architecture decisions are now informed by the actual UI spec instead of being made blind. PLAN reads DESIGN's bridge; DESIGN reads DISCOVER's bridge.
- **Decision Ledger** — New tracking mechanism in MANIFEST. User decisions = LOCKED by default, agent decisions = OPEN until confirmed. LOCKED items propagate verbatim through every bridge. Agents cannot remove LOCKED items without flagging in Review. BUILD agents receive LOCKED items in prompts as "DO NOT OVERRIDE".
- **4-Zone Discuss** — DISCOVER Discuss replaced with 4 structured zones: WHY (premise challenge from /plan-ceo-review), WHO (empathy + 11-star from /customer-obsession), WHAT (GROUND-informed scope from /product-strategy), HOW (temporal interrogation + mode selection from /product-advisor). Each zone has exit conditions and produces LOCKED ledger entries.
- **Backend gate in DESIGN Review** — DESIGN Review now checks all interactions for missing backend endpoints. Produces `backend-contract-stub.md` (requirements-only, no architecture). User chooses: proceed with mocks, pause + handoff to backend /dev, or both in parallel. Stub feeds into backend /dev:intake as "frontend handoff" entry mode.
- **Structured bridges with echo-back** — All `review-*.md` bridges use structured format: LOCKED decisions table, key artifacts, focus for next phase, dispatch mandate. Next phase MUST echo-back LOCKED items before asking questions.
- **Mode-driven adaptive depth** — Execution mode (Expansion/Hold/Reduction) set in DISCOVER Zone 4, propagates to all phases. Controls question depth, agent count, doc thoroughness, review rigor. Can upgrade mid-pipeline, never downgrade.
- **Entry mode routing updated** — Tech spec, Kiro spec, CEK SDD spec now route to DESIGN (not PLAN) since DESIGN precedes PLAN in v4.0.

### Added (Frontend)
- `references/decision-ledger-template.md` — Ledger format, LOCKED/OPEN rules, violation detection
- `references/bridge-template.md` — Structured bridge format with echo-back protocol
- `references/backend-contract-stub-template.md` — Backend contract stub format for frontend→backend handoff
- `references/discuss-zones-reference.md` — 4-Zone Discuss spec with techniques and exit conditions
- `references/mode-propagation-reference.md` — Expansion/Hold/Reduction depth matrix per phase
- LOCKED decision violation check in VALIDATE phase
- Echo-back protocol in all phase Discuss stages
- LOCKED decisions in BUILD agent prompts

## [3.3.1] - 2026-03-24

### Changed (Frontend — DISCOVER)
- **D2 user flow diagrams in DISCOVER Execute** — ui-designer agent output now mandates D2 syntax for user flow diagrams (render to SVG via `d2`, fallback to ASCII). Completes visual tooling integration across all frontend pipeline phases.

### Changed (Backend — DISCOVER)
- **D2 service/data flow diagrams in DISCOVER Execute** — rails-expert agent output now mandates D2 syntax for service dependency and data flow diagrams (render to SVG via `d2`, fallback to ASCII). Completes visual tooling integration across all backend pipeline phases.

## [3.3.0] - 2026-03-24

### Added (Both Pipelines — DISCOVER)
- **Interrogation-style questioning in DISCOVER Discuss** — New "Questioning Philosophy" section mandates interrogation for maximum clarity, not checkbox-style questioning. Agent must keep asking until every gap, ambiguity, and half-formed idea is pressure-tested. Only the user says "enough."
- **WHY-first question ordering** — DISCOVER Discuss now leads with WHY questions (purpose, trigger, alternatives, success criteria) before WHAT questions. Understanding intent unlocks better design questions and adjacent insights — the "boiling water for pasta → salt the water" principle.
- **Soft answer challenges** — Agent must challenge vague answers ("easy to use" → "easy for who?") and surface its own confusion rather than moving on with ambiguity.
- **3 new anti-patterns** in Common Mistakes: asking WHAT before WHY, accepting vague answers, stopping questions too early.

### Added (Both Pipelines — BUILD & DOCUMENT)
- **Completion Log in task files** — DOCUMENT task file template now includes a `## Completion Log` section (Status, Planned, Actual, Deviations, Discoveries, Files touched). BUILD agents fill this after each task, creating a paper trail that survives `/clear` and parallel dispatch.
- **Upstream Context in wave files** — DOCUMENT wave file template now includes `## Upstream Context` section listing prior wave completion log paths and key discoveries to carry forward.
- **Completion Log mandate in BUILD Execute** — After each subagent finishes, the orchestrator MUST update the task file's Completion Log. Sequential tasks within a wave propagate discoveries to the next task's agent prompt.
- **Upstream context reading in BUILD Step 0** — Wave 2+ context loading reads all prior wave task completion logs, compiles a "Prior Discoveries" summary (max 10 bullets), and embeds it in agent prompts.
- **Sequential Awareness Gate in BUILD Architect** — Before marking tasks as parallel, checks file overlap, state overlap (React Context/DB tables/API endpoints), and migration overlap (backend). Defaults to sequential if any overlap found. User can override with logged reason.
- **Upstream context in agent prompt template** — `## Upstream Context (Completion Logs)` section added to agent-prompt-template.md for Wave 2+ and sequential task prompts.
- **Between-wave tracking updates** — After each wave, orchestrator must: fill next wave's Upstream Context, verify all completion logs are populated.

### Changed (Both Pipelines)
- **Common Mistakes table** — Added 3 new anti-patterns: missing completion logs, missing prior wave context reads, parallel dispatch when tasks share files.
- **Plugin descriptions** — Updated to mention completion log tracking and sequential awareness gate.

## [3.2.0] - 2026-03-19

### Added (Backend)
- **D2 diagram rendering in PLAN** — Architecture diagrams (data flow, state machine, dependency graph, migration dependency chain) now use D2 syntax with `d2` CLI rendering to SVG. Fallback to ASCII when `d2` unavailable. D2 source + SVG stored in `docs/[Feature]/.dev/plan/diagrams/`.
- **D2 diagrams in DOCUMENT** — Master Plan docs require D2 diagrams for service dependencies, data flow, migration chains, and model relationships. Rendered to SVG alongside `.d2` source files.
- **Architecture diagram context in BUILD** — Mandatory context loading includes D2 diagram paths from PLAN/DOCUMENT phases. Subagent prompt table includes architecture diagrams row.

### Changed (Backend)
- **Backend plugin.json** — Version bumped to 3.2.0, description updated

### Added (Frontend)
- **D2 diagram rendering in PLAN** — Architecture diagrams (data flow, state machine, dependency graph) now use D2 syntax with `d2` CLI rendering to SVG. Fallback to ASCII when `d2` unavailable. D2 source + SVG stored in `docs/[Feature]/.dev/plan/diagrams/`.
- **D2 diagrams in DOCUMENT** — Component Architecture docs require D2 diagrams for component tree, data flow, and state flow. Rendered to SVG alongside `.d2` source files.
- **Architecture diagram context in BUILD** — Mandatory context loading includes D2 diagram paths from PLAN/DOCUMENT phases. Subagent prompt table includes architecture diagrams row.
- **Wireframe tool priority in DESIGN** — Hard Rule 4 now specifies tool priority: (a) `/wireframe` skill for 5-option HTML prototypes, (b) Excalidraw CLI for quick PNG sketches, (c) ASCII mockups. Layout approval required before ui-designer dispatch.

### Changed (Frontend)
- **PLAN Hard Rule 4** — Updated from "render ASCII diagrams" to "render D2 or ASCII diagrams, prefer D2 syntax"
- **DESIGN Hard Rule 4** — Updated from "render ASCII mockups" to wireframe tool priority chain with mandatory layout approval gate

## [3.0.0] - 2026-03-18

### Added (Frontend)
- **Mandatory context loading (Step 0)** — Every phase's Discuss stage now has explicit `Read(filepath) → extract:` blocks that force the Read tool on context bridges, domain-agent-map.md, inner-loop-reference.md, and codebase-context-block.md before any questions. Root cause fix for stale-memory decisions.
- **Architect context verification (Step 0)** — Every Architect stage verifies domain-agent-map.md was loaded, lists ALL agents as dispatched or skipped with reason. Map compliance field added to Orchestration Log.
- **Hard Rules section** — Front-loaded in first 30 lines of all 8 phase skills with reasoning-based enforcement (WHY dispatch matters, not just demands).
- **GROUND step (Stage 0)** — DISCOVER, PLAN, BUILD automatically dispatch Explore agents before Discuss. Questions informed by codebase reality instead of memory. Was opt-in (D09), now mandatory.
- **Anti-rationalization checklists** — Added to BUILD and DISCOVER Execute stages. Names common rationalizations for inline execution and preemptively rejects them.
- **Dispatch Mandate in context bridges** — Every Review artifact includes "Dispatch Mandate for [NEXT_PHASE]" listing mandatory and conditional agents from domain-agent-map.md for the next phase.
- **Mandatory code-reviewer in BUILD.Review** — Moved from optional to mandatory every wave. Catches N+1 queries, convention violations, auth boundary issues.
- **Exact must_haves passthrough** — BUILD.Execute requires copy-pasting must_haves verbatim into agent prompts — summarizing prohibited.
- **agent-prompt-template.md** — New reference file providing standard template for ALL subagent prompts. Fixes D04 dead letter — serves as fallback when /prompt-generator unavailable.
- **D04 fallback explicit Read** — When /prompt-generator unavailable, orchestrator must Read agent-prompt-template.md using the Read tool.
- **Template reads in Step 0** — BUILD loads agent-prompt-template.md, PLAN loads requirements-template.md in context loading.
- **Visual mockup enforcement** — DISCOVER, PLAN, DESIGN Hard Rules require inline ASCII mockups confirmed via AskUserQuestion with preview field (D17).
- **Domain Combination checking** — All Architect stages check Domain Combination Patterns table from domain-agent-map.md.
- **Agent dispatch count in validate-stage-output** — Execute stage validation now warns if artifact mentions zero agent dispatches (D03 enforcement).
- **Minimum review content requirements** — DOCUMENT Hard Rules specify review artifacts must contain decisions, requirements addressed, gaps, and context-for-next-phase.

### Changed (Frontend)
- **Frontend plugin.json** — Version bumped to 3.0.0
- **Frontend inner-loop-reference.md** — Added Step 0 Load Context, Verify Context Loaded, auto-research mandatory, expanded Orchestration Log with map compliance
- **dev/SKILL.md router** — Updated to v3.0, added GROUND step to inner loop description, added agent-prompt-template.md to reference table

### Added (Backend)
- **Mandatory context loading (Step 0)** — Every phase's Discuss stage now explicitly Reads `domain-agent-map.md`, `inner-loop-reference.md`, and `codebase-context-block.md` using the Read tool before any other work. This is the root cause fix — reference files were previously invisible to the orchestrator because they were only passively referenced ("See references/...") and never actually opened.
- **Architect context verification (Step 0)** — Every Architect stage verifies domain-agent-map.md was loaded and lists ALL agents from the map as either dispatched or skipped with reason.
- **Orchestration Log map compliance** — Expanded Orchestration Log template with mandatory `Map compliance` field. Every agent in domain-agent-map.md for the current phase must appear — silent omission is no longer possible.
- **Dispatch Mandate in context bridges** — Every Review artifact's context bridge now includes a "Dispatch Mandate for [NEXT_PHASE]" section listing mandatory and conditional agents from domain-agent-map.md. The next phase's Architect must address each agent.
- **Mandatory code-reviewer in BUILD.Review** — `code-reviewer` moved from "Optional (User Decides)" to mandatory every wave. Catches N+1 queries, convention violations, and auth boundary issues that automated tests miss.
- **architecture-reviewer in DISCOVER.Execute** — New conditional agent for COMBINATION+ complexity or new subsystems. Validates design against system architecture before locking decisions in PLAN.
- **rails-expert consistency check in DOCUMENT.Execute** — Verifies doc accuracy against codebase: file paths exist, decision IDs match, wave dependencies acyclic, agent assignments match domain-agent-map.
- **Automatic research pre-step** — Discuss stages in DISCOVER, PLAN, and BUILD now automatically dispatch Explore agents before asking questions (was optional opt-in). Questions are informed by codebase reality instead of asked "blind."
- **Inline diagram display** — PLAN.Review shows all architecture diagrams from Execute inline in chat. BUILD.Review shows updated diagrams when waves modify diagrammed flows. DISCOVER.Review shows design diagrams when present.
- **Pre-commit code-reviewer in SHIP** — Conditional `code-reviewer` dispatch on full diff before staging, for COMBINATION+ features or >50 files changed.
- **Domain Combination checking** — All Architect stages check the Domain Combination Patterns table from domain-agent-map.md (e.g., `auth + students` = COPPA) and apply extra considerations.
- **Agent dispatch count in validation tool** — `validate-stage-output` for Execute stages now warns if no agent dispatches are mentioned in the artifact (D03 enforcement).
- **Exact must_haves passthrough** — BUILD.Execute explicitly requires copy-pasting must_haves and requirements verbatim into subagent prompts — summarizing is prohibited.
- **D04 fallback explicit Read** — When `/prompt-generator` is unavailable, the orchestrator must Read `agent-prompt-template.md` using the Read tool instead of passively referencing it.
- **Template reads in Step 0** — PLAN loads `requirements-template.md`, DOCUMENT loads `wave-plan-template.md`, BUILD loads `agent-prompt-template.md` in their Step 0 context loading.

### Changed (Backend)
- **Backend plugin.json** — Version bumped to 3.0.0
- **Backend inner-loop-reference.md** — Added mandatory Read enforcement note to Agent Lookup section
- **Shared inner-loop-reference.md** — Step 0 Load Context added to Section 2.1, Verify Context Loaded added to Section 2.2, auto-research replaces optional research in Discuss, Orchestration Log expanded with map compliance

## [2.5.0] - 2026-03-18

### Added (Frontend)
- **Specialized agent routing in BUILD** — 3-tier agent selection system: task-level `agent:` hints (highest priority) → keyword-based routing table → domain-agent-map defaults. Tasks now dispatched to `next-js-developer`, `typescript-pro`, `react-specialist`, `accessibility-tester`, `api-designer` based on content instead of all going to `frontend-developer`.
- **Task file `agent:` hint field** — DOCUMENT phase auto-assigns specialist agents to task files using keyword matching. BUILD phase reads the hint and dispatches accordingly.
- **Universal VALIDATE agents** — `typescript-pro` (type safety audit) and `code-reviewer` (primary verifier) now run on ALL domains, not just domain-triggered.
- **New domain-agent mappings** — `routing` BUILD → `next-js-developer`; `state` BUILD → `react-specialist`; `api-integration` BUILD → `api-designer`; `performance` BUILD → `react-specialist`; `a11y` VALIDATE → `accessibility-tester`; `routing` VALIDATE → `next-js-developer`.

### Fixed (Frontend)
- **Phantom `architecture-reviewer` eliminated** — 5 references in domain-agent-map + 1 in plan SKILL.md replaced with `code-reviewer`. The `architecture-reviewer` agent never existed.

### Changed (Frontend)
- **Frontend plugin.json** — Version bumped to 2.5.0
- **Domain-Agent Map v4.0 (frontend)** — Expanded from single BUILD agent per domain to multi-agent routing with separate BUILD/VALIDATE columns.

### Added (Backend)
- **Specialized agent wiring (backend)** — 6 new domain agents integrated into pipeline phases:
  - PLAN: `workflow-architect` (multi-step flow failure modes), `api-documenter` (OpenAPI contract drafting), `behavioral-nudge-engine` (student engagement patterns) — all conditional on domain/feature type
  - VALIDATE: `legal-compliance-checker` (COPPA audit for student features), `postgres-pro` (independent EXPLAIN ANALYZE for performance domain), `api-documenter` (endpoint contract verification)
  - SHIP: `executive-summary-generator` (SCQA-format changelog entries), explicit `security-engineer` dispatch (replaces generic security scan)
- **Domain-Agent Map v4.0 (backend)** — Aligned with subagent ecosystem cleanup (117 → 32 agents). Retired agents (`api-designer`, `backend-service-developer`, `performance-engineer`, `qa-expert`, `test-automator`, `database-optimizer`, `documentation-engineer`) replaced with consolidated equivalents. New domains: `workflows` → `workflow-architect`, `students` now includes `legal-compliance-checker`.

### Changed
- **Backend plugin.json** — Version bumped to 2.5.0
- **VALIDATE primary verifier** — Changed from `qa-expert` (retired) to `rails-expert` for independent requirements verification
- **BUILD services tasks** — `backend-service-developer` references replaced with `rails-expert`
- **Performance domain** — `performance-engineer` + `database-optimizer` replaced with `master-backend-ai-rails` + `postgres-pro`

## [2.4.0] - 2026-03-16

### Added
- **Independent verification system** — Two-layer verification enforces must_haves compliance:
  - `verify-must-haves` tool command in `dev-pipeline-tools.js` — mechanical gate checking file existence, route matching (BE) / import resolution (FE), spec non-empty, anti-stub scan
  - Independent semantic verification agent dispatched in BUILD:Review — `qa-expert` (backend) or `code-reviewer` (frontend) with clean context, no build history
  - Independent verifier in VALIDATE:Execute — comprehensive requirements.md + all must_haves verification by agent with no build phase context
- **Verification Agents section** — Both domain-agent-map.md files document the verification agent assignments for BUILD:Review and VALIDATE:Execute
- **`/dev:update` command** — Check for updates, show changelog diff, pull latest with user confirmation. Registered in both plugins.
- **`check-update.js` SessionStart hook** — Background update check on session start. Writes cache file for update-available banner. Runs detached, does not block startup.

### Changed
- **Notion retry + warning protocol** — All phase skills now reference `references/notion-integration.md` Retry + Warning Protocol instead of inline error handling:
  - INTAKE: try → wait 2s → retry once → loud warning if both fail
  - Downstream phases: check Card ID first → try → retry → warn if fails
  - Warnings persisted in review artifacts under `## Notion Status` heading
  - Never silently skip — missing Card ID produces visible warning every phase
- **Both plugin.json** — Version bumped to 2.4.0, `check-update.js` hook registered

## [2.3.0] - 2026-03-15

### Added
- **Handover skill v2.0** — Complete rewrite of backend HANDOVER phase to 4-stage inner loop (Discuss → Architect → Execute → Review), replacing legacy v1.x RESEARCH>EXECUTE>DOCUMENT>GATE pattern
- **Cross-stack detection** — INTAKE and PLAN phases detect frontend dependencies and tag MANIFEST with `Cross-Stack: frontend`
- **D04 enforcement protocol** — `/prompt-generator` is a hard gate in every Architect stage. Orchestration Log section mandatory in all architect artifacts.
- **Agent maps v3.0** — Extended domain-agent-map.md to cover ALL pipeline phases (INTAKE through SHIP), not just BUILD and VALIDATE
- **Notion Dev Tracker auto-sync** — All phase skills update Notion Dev Tracker card with status changes and notes. Card created at INTAKE, moved through Kanban columns per phase.

### Fixed
- **Kanban column order** — Corrected to: Code Review before Replit Staging (was reversed)
- **Next Up blocks** — Now show `/dev:[phase]` slash commands for easy copy-paste

## [2.2.0] - 2026-03-12

### Added
- **Commands directory (frontend)** — `/dev:intake`, `/dev:plan`, `/dev:design`, `/dev:document`, `/dev:build`, `/dev:validate`, `/dev:ship`, `/dev:pause` now appear as slash commands in Claude Code autocomplete. Each delegates to the corresponding `dev-pipeline-frontend:*` skill.
- **Commands directory (backend)** — Same set minus `design`, plus `/dev:handover`. Delegates to `dev-pipeline-backend:*` skills.
- **Multi-MANIFEST picker** — When `/dev` is invoked with 2+ active MANIFESTs, shows a numbered feature list (name, phase, stage, status) and routes to the selected feature. Supports optional feature name argument (`/dev Admin_Overhaul`) to skip the picker.
- **Feature name argument** — `/dev [feature-name]` directly resumes the matching feature without showing the picker.

## [2.1.1] - 2026-03-12

### Fixed
- **Shared tools not found in cache** — `dev-pipeline-tools.js` was in a root-level `shared/` sibling directory that doesn't get installed when each plugin is cached independently. Embedded the tools file inside each plugin at `shared/tools/dev-pipeline-tools.js` so `${PLUGIN_ROOT}/../shared/tools/` resolves correctly.
- **Kiro spec + CEK SDD entry modes** — Added both as intake entry modes in frontend and backend pipelines, routing to PLAN (skip DISCOVER). Added `shared/references/ears-notation-guide.md` for EARS notation reference.

## [2.1.0] - 2026-03-12

### Added
- **Requirements artifact** — PLAN phase produces `requirements.md` with checkable requirement IDs, traceability tables, and `must_haves` blocks in wave files
- **Doneness questions** — PLAN Discuss stage asks mandatory acceptance-criteria questions before advancing
- **Goal-backward verification** — VALIDATE checks truths, artifacts, and key_links from `must_haves`, not just test results
- **Anti-stub detection** — VALIDATE scans for TODO, FIXME, placeholder, empty handlers, hardcoded returns
- **Requirements coverage table** — VALIDATE presents SATISFIED/BLOCKED/NEEDS_HUMAN per requirement ID
- **Build agent contract** — BUILD passes `must_haves` and requirement IDs to subagents with anti-stub instruction
- **Domain-specific requirements templates** — FE categories (UI, A11Y, PERF, SEO) and BE categories (API, AUTH, MIGR, PERF)
- **VALIDATE sections in agent maps** — Both domain-agent-map.md files now include VALIDATE phase agents
- **Domain-specific resume checks** — PAUSE skills include FE/BE-specific resume guidance
- **State persistence notice** — All phase Next Up blocks state that MANIFEST + artifacts persist to disk

### Changed
- **Third-person descriptions** — All 20 SKILL.md frontmatter descriptions rewritten from "Use when..." to third-person declarative form
- **validate-stage-entry/output coverage** — All 4 stages in INTAKE, DISCOVER, PLAN, BUILD now have entry/output validation calls
- **D08 decision references** — Added explicit (D08) annotations to anti-auto-looping text in DESIGN, DOCUMENT, BUILD phases
- **Next Up block formatting** — Standardized to plain `### Next Up` heading (removed `>` and `>>>` prefixes)
- **FE validation-checklists.md** — Added table of contents, replaced stale tier language with current terminology

### Fixed
- **BE validate dangling reference** — Removed reference to nonexistent `references/validation-checklists.md`
- **FE codebase-context-block.md** — Added missing table of contents (file exceeded 100 lines)

### Deprecated
- **BE handover/SKILL.md** — Marked as v1.x remnant; uses legacy RESEARCH>EXECUTE>DOCUMENT>GATE pattern, not referenced by v2.0 dev router

## [2.0.0] - 2026-03-11

### Added
- Complete v2.0 rewrite with 4-stage inner loop (Discuss > Architect > Execute > Review)
- 10 phase skills per plugin: dev, intake, discover, plan, document, build, validate, ship, pause
- Frontend-only DESIGN phase for visual specifications
- Backend-only HANDOVER phase (v1.x remnant, dormant)
- Domain-specific agent maps (references/domain-agent-map.md)
- Shared tools infrastructure (dev-pipeline-tools.js)
- Session boundary enforcement with /clear between phases
- Hooks: session-context.js (SessionStart), doc-staleness-nudge.js (PostToolUse)

### Removed
- v1.x tier classification (KNOWN/COMBINATION/NOVEL)
- v1.x prompt-transitions/ directory
- v1.x RESEARCH>EXECUTE>DOCUMENT>GATE inner loop pattern

## [1.0.0] - 2026-03-10

### Added
- Initial release of dev-pipeline-backend plugin
- 3-tier classification system with phase-specific workflows
- Prompt transitions for phase advancement
