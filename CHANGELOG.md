# Changelog

All notable changes to the dev-pipeline plugin marketplace will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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
