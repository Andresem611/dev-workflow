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

- **Domain-specific agent routing** -- Frontend skills dispatch to React/TypeScript agents; backend skills dispatch to Rails/ActiveRecord agents.
- **Requirements-driven development** -- Every feature gets checkable requirement IDs (e.g., `R-001`). Build and validate phases trace back to them.
- **Goal-backward verification** -- Phase completion requires `must_haves` (truths that must hold, artifacts that must exist, key links that must resolve).
- **Anti-stub detection** -- Placeholders, TODOs, and empty implementations are flagged as failures during build and validate.
- **Session boundary enforcement** -- Each phase runs in its own context window to prevent stale context and token bloat.
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

## Requirements

| Requirement | Details |
|-------------|---------|
| Claude Code CLI | Required for all plugins |
| Backend plugin | Ruby on Rails project |
| Frontend plugin | TypeScript/React project (adaptable to other stacks) |

## License

Internal tooling by [Thoven](https://thoven.co). Contact andres@thoven.co for access.
