---
name: dev:update
description: Update dev-pipeline plugins to latest version with changelog display
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

# /dev:update — Update Dev Pipeline Plugins

Check for updates to the thoven-dev plugin marketplace, display what changed, and pull the latest version.

## Process

### Step 1: Detect Installation

```bash
# Find the marketplace directory
MARKETPLACE_DIR=""
for dir in ~/.claude/plugins/marketplaces/thoven-dev ~/.claude/plugins/marketplaces/dev-workflow; do
  if [ -d "$dir/.git" ]; then
    MARKETPLACE_DIR="$dir"
    break
  fi
done

if [ -z "$MARKETPLACE_DIR" ]; then
  echo "NOT_FOUND"
else
  echo "$MARKETPLACE_DIR"
fi
```

Parse output:
- If `NOT_FOUND`: Display error — "thoven-dev marketplace not found. Install with: `git clone https://github.com/Andresem611/dev-workflow.git ~/.claude/plugins/marketplaces/thoven-dev`"
- Otherwise: use the found directory for subsequent steps

### Step 2: Read Current Version

```bash
# Read version from plugin.json
cd "$MARKETPLACE_DIR"
cat plugins/dev-pipeline-frontend/.claude-plugin/plugin.json | grep '"version"' | head -1
```

Extract the version string (e.g., "2.4.0").

### Step 3: Check for Updates

```bash
cd "$MARKETPLACE_DIR" && git fetch origin 2>&1
```

Then compare:

```bash
cd "$MARKETPLACE_DIR" && git rev-parse HEAD && git rev-parse origin/main
```

- If both HEADs are the same: Display "Already up to date (v[version])" and exit
- If local is ahead: Display "Local is ahead of remote (development version?)" and exit
- If remote is ahead: continue to Step 4

### Step 4: Show What Changed

```bash
cd "$MARKETPLACE_DIR" && git log --oneline HEAD..origin/main
```

And show the CHANGELOG diff:

```bash
cd "$MARKETPLACE_DIR" && git diff HEAD..origin/main -- CHANGELOG.md
```

Display to user:

```
## Dev Pipeline Update Available

**Installed:** v[current]
**Latest:** [remote HEAD short hash]

### Commits Since Your Version
[git log output]

### Changelog Changes
[CHANGELOG diff, cleaned up]

⚠️  **Note:** Pulling updates will modify plugin files in:
- `plugins/dev-pipeline-backend/`
- `plugins/dev-pipeline-frontend/`
- `plugins/shared/`

Your custom files outside these directories are preserved.
```

### Step 5: Confirm

Use `AskUserQuestion`:
- Question: "Proceed with update?"
- Options:
  - "Yes, update now"
  - "No, cancel"

If cancelled: exit.

### Step 6: Pull Update

```bash
cd "$MARKETPLACE_DIR" && git pull origin main
```

### Step 7: Display Result

Read the new version:

```bash
cd "$MARKETPLACE_DIR" && cat plugins/dev-pipeline-frontend/.claude-plugin/plugin.json | grep '"version"' | head -1
```

Display:

```
╔═══════════════════════════════════════════════════════════╗
║  Dev Pipeline Updated: v[old] → v[new]                   ║
╚═══════════════════════════════════════════════════════════╝

⚠️  Restart Claude Code to pick up the new plugin files.

The cached versions in ~/.claude/plugins/cache/thoven-dev/ will be
refreshed on next Claude Code startup.
```

### Step 8: Stale Skill Check (F9 / SKILL_AUDIT §2.9)

After update, surface any stale local skill files outside the plugin path. The sandbox cannot auto-delete user-managed files; this is a warning-only check.

```bash
# F9: Stale skill detection (post-update warning)
echo ""
echo "=== Stale skill check (F9 / SKILL_AUDIT §2.9) ==="
if [ -d "$HOME/.claude/skills/dev" ]; then
  echo "WARNING: Found stale local skill files outside the plugin:"
  ls -la "$HOME/.claude/skills/dev/" 2>/dev/null
  echo ""
  echo "v3.x layout detected. The plugin now lives at \$CLAUDE_PLUGINS/dev-pipeline-frontend/skills/."
  echo "Recommend manual delete: rm -rf \"$HOME/.claude/skills/dev\""
  echo "Sandbox does not auto-delete to preserve user-managed files."
else
  echo "Clean: no stale ~/.claude/skills/dev/ directory found."
fi
```

If files are found, surface to user:

> Found stale local skill files outside the plugin. v3.x layout detected. Recommend manual delete: `rm -rf ~/.claude/skills/dev`. Sandbox cannot auto-delete; user must run.

If `~/.claude/skills/dev/` does not exist or is empty: log "no stale skills" and continue.
