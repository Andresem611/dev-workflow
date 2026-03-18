# Changelog

All notable changes to the dev-pipeline plugin marketplace will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
