# Changelog

All notable changes to the dev-pipeline plugin marketplace will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.1] - 2026-03-19

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
