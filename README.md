# thoven-dev Plugin Marketplace

Phased feature development pipelines for Claude Code. Two plugins provide structured, requirements-driven workflows for frontend (TypeScript/React) and backend (Ruby on Rails) projects.

## Structure

```
thoven-dev/
├── plugins/
│   ├── dev-pipeline-frontend/       # Frontend feature pipeline
│   │   ├── .claude-plugin/plugin.json
│   │   ├── skills/                  # 10 phase skills
│   │   ├── references/              # Templates, agent maps, checklists
│   │   └── hooks/                   # Session context, doc staleness
│   ├── dev-pipeline-backend/        # Backend (Rails) feature pipeline
│   │   ├── .claude-plugin/plugin.json
│   │   ├── skills/                  # 10 phase skills
│   │   ├── references/              # Templates, agent maps, checklists
│   │   └── hooks/                   # Session context, doc staleness
│   └── shared/                      # Shared across plugins
│       ├── tools/                   # dev-pipeline-tools.js
│       └── references/              # inner-loop-reference.md
├── .claude-plugin/marketplace.json
├── CHANGELOG.md
└── README.md                        # This file
```

## What It Does

Each plugin enforces a **4-stage inner loop** on every phase of work:

1. **Discuss** -- Clarify goals with the user. No code, no assumptions.
2. **Architect** -- Design the solution. Present the plan for approval.
3. **Execute** -- Build exactly what was approved. Anti-stub detection prevents placeholders.
4. **Review** -- Verify against requirements. Goal-backward checks confirm completeness.

Work flows through a **10-phase pipeline**:

| Phase | Frontend | Backend | Purpose |
|-------|----------|---------|---------|
| `dev` | Yes | Yes | Entry point -- routes to the correct phase |
| `intake` | Yes | Yes | Capture feature request, produce requirements |
| `discover` | Yes | Yes | Research codebase, identify constraints |
| `plan` | Yes | Yes | Break work into waves with dependency order |
| `design` | Yes | -- | UI/UX design and component architecture |
| `handover` | -- | Yes | Hand completed backend to frontend team |
| `document` | Yes | Yes | Write docs before code (requirements-first) |
| `build` | Yes | Yes | Implement the feature |
| `validate` | Yes | Yes | Run tests, verify all requirements met |
| `ship` | Yes | Yes | Final checks, commit, deploy |
| `pause` | Yes | Yes | Save session state for later resumption |

Each phase runs in a fresh context window with only the artifacts it needs. Specialized subagents handle domain-specific work.

## Key Features

- **Domain-specific agent routing** -- Frontend pipeline v2.5+ uses a 3-tier agent selection system: task-level `agent:` hints, keyword-based routing table, and domain-agent-map defaults. BUILD tasks dispatch to `next-js-developer` (routing/SSR), `typescript-pro` (types), `react-specialist` (performance), `accessibility-tester` (a11y), `api-designer` (API contracts), or `frontend-developer` (general UI). VALIDATE dispatches `typescript-pro` + `code-reviewer` universally, plus domain-specific agents. Backend pipeline v2.5+ routes to 13 specialized agents including `workflow-architect`, `legal-compliance-checker`, `api-documenter`, and `behavioral-nudge-engine` based on feature domain tags.
- **Requirements-driven development** -- Every feature gets checkable requirement IDs (e.g., `API-01`, `AUTH-03`). Build and validate phases trace back to them.
- **Independent verification** -- Two-layer verification in BUILD:Review (mechanical tool gate + independent agent) and VALIDATE (comprehensive agent with clean context). The verifier never sees build artifacts — it checks must_haves against the actual codebase with fresh eyes.
- **Goal-backward verification** -- Phase completion requires `must_haves` (truths that must hold, artifacts that must exist, key links that must resolve).
- **Anti-stub detection** -- Placeholders, TODOs, and empty implementations are flagged as failures during build and validate.
- **Notion Dev Tracker integration** -- Automatic Kanban card creation at INTAKE, status updates at every phase. Retry + warning protocol ensures Notion failures are always visible, never silently skipped.
- **Session boundary enforcement** -- Each phase runs in its own context window to prevent stale context and token bloat.
- **Visual tool integration (v3.0.1+)** -- PLAN and DOCUMENT phases produce D2 architecture diagrams rendered to SVG (data flow, state machine, dependency graph, component tree). DESIGN phase uses wireframe tool priority chain (`/wireframe` → Excalidraw CLI → ASCII) with mandatory layout approval before ui-designer dispatch. BUILD agents receive diagram paths as architecture context. Requires `d2` CLI (`brew install d2`) and optionally `excalidraw-cli` (`npm i -g @swiftlysingh/excalidraw-cli`).
- **User control at every gate** -- No auto-looping. The user approves before the pipeline advances (D08 design constraint).

## Installation

```bash
# Install the full marketplace (both plugins)
git clone https://github.com/Andresem611/dev-workflow.git \
  ~/.claude/plugins/marketplaces/thoven-dev

# Install only frontend
git clone https://github.com/Andresem611/dev-workflow.git \
  ~/.claude/plugins/marketplaces/thoven-dev
rm -rf ~/.claude/plugins/marketplaces/thoven-dev/plugins/dev-pipeline-backend

# Install only backend
git clone https://github.com/Andresem611/dev-workflow.git \
  ~/.claude/plugins/marketplaces/thoven-dev
rm -rf ~/.claude/plugins/marketplaces/thoven-dev/plugins/dev-pipeline-frontend

# Update to latest
cd ~/.claude/plugins/marketplaces/thoven-dev && git pull origin main
```

## Quick Start

After installing, start a new feature by invoking the entry-point skill:

```
/dev                              # Uses whichever plugin matches your project
/dev-pipeline-frontend:dev        # Explicitly use frontend pipeline
/dev-pipeline-backend:dev         # Explicitly use backend pipeline
```

The `dev` skill detects your current phase and routes you there, or starts a new feature from `intake`.

To resume interrupted work:

```
/pause                            # Save state before ending a session
/dev                              # Picks up where you left off next time
```

To update to the latest version:

```
/dev:update                       # Check for updates, show changelog, pull with confirmation
```

## Requirements

| Requirement | Details |
|-------------|---------|
| Claude Code CLI | Required for all plugins |
| Backend plugin | Ruby on Rails project |
| Frontend plugin | TypeScript/React project (adaptable to other stacks) |

## License

Internal tooling by [Thoven](https://thoven.co). Contact andres@thoven.co for access.
