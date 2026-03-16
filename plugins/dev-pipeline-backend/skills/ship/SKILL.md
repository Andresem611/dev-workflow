---
name: ship
description: Ships a validated backend feature — handles changelog, commit, dual-database migration verification, and deployment reminders. Terminal phase. Triggers on dev-pipeline-backend:ship or when /dev router advances past VALIDATE.
---

# /dev:ship — Changelog + Commit + Deploy Reminder

Terminal phase of the /dev pipeline. Takes a validated backend feature through changelog update, commit creation, dual-database verification, and deployment guidance. Pipeline is COMPLETE after SHIP — there is no next phase.

## Inner Loop: Discuss > Architect > Execute > Review

---

## Stage 1: Discuss — Release Scope

**Tool:** `validate-stage-entry ship discuss <feature-dir> --plugin backend`

### Context Bridge

Read `.dev/validate/review-ship-readiness.md` for validation results and caveats.

### WHAT Questions (AskUserQuestion, one at a time)

- Publish to production or staging only?
- Version bump type: major, minor, or patch?
- Any last-minute file exclusions?
- Did this feature include database migrations?
- Are there new environment variables required for production?
- Deployment notes or special instructions (e.g., migration order, downtime window)?

### HOW Meta-Questions

- "Full changelog review or quick summary?"
- "Want to review all staged files before commit?"
- "Full dual-DB verification or quick migration status check?"

No cap on questions. User says "enough" or "move on" to proceed.

### Artifact: `.dev/ship/discuss-release-scope.md`

All Q&A, locked decisions (publish vs staging, version bump, exclusions, migration status, env vars), user preferences.

**Tool:** `validate-stage-output ship discuss <feature-dir> --plugin backend`

---

## Stage 2: Architect — Release Plan

**D04 ENFORCEMENT:** Follow the D04 Enforcement Protocol from `inner-loop-reference.md`. Every subagent prompt MUST go through `/prompt-generator`. Log status in the Orchestration Log section of this artifact.

**MANDATORY:** Use `/prompt-generator` to craft the subagent prompt.

### Define the Release Plan

1. **Changelog entries** — categorized: Added, Changed, Fixed, Breaking Changes
2. **Files to stage** — `git add -A` per solo dev convention
3. **Commit message draft** — project convention:

```
<Title: Brief description>

<Body: What changed and why>

- Change 1
- Change 2

Publication Status: Published - YYYY-MM-DD HH:MM UTC  (or "Not Published")

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
```

4. **Dual-database verification plan** — migration deployment order, sync checks
5. **Environment variable checklist** — new vars needed, where to set them
6. **Deployment checklist** — post-deploy verification steps
7. **Security scan plan** — check for secrets, credentials, API keys before staging

### Subagent Assignment

| Field | Value |
|-------|-------|
| **Agent type** | Release executor |
| **Prompt** | Crafted via `/prompt-generator` |
| **Success criteria** | CHANGELOG updated, commit created, git status clean, no secrets staged, migrations verified on both DBs, env vars confirmed |
| **Input context** | discuss-release-scope.md, MANIFEST.md, CHANGELOG.md, git diff |
| **Execution order** | Sequential: security scan > dual-DB verify > env vars check > changelog > stage > commit > verify |

### Artifact: `.dev/ship/architect-release-plan.md`

Changelog entries, commit message draft, staging plan, dual-DB verification plan, env var checklist, deployment checklist, subagent prompt. Must include the Orchestration Log section.

**Tool:** `validate-stage-output ship architect <feature-dir> --plugin backend`

---

## Stage 3: Execute — Release Output

**MANDATORY:** Dispatch subagent. Orchestrator NEVER executes inline.

### 3a. Security Scan

Before staging, check all changed files for `.env` files, API keys, tokens, credentials, private keys, or database passwords. If secrets found: STOP and surface to user.

### 3b. Dual-Database Migration Verification

If the feature includes migrations, verify both environments are in sync:

```bash
# Check development DB (helium)
rails db:migrate:status

# Check production DB (Neon)
RAILS_ENV=production rails db:migrate:status
```

**Both must show `up` for all feature migrations.** If any migration shows `down` in either environment: STOP and surface to user. Run `/safe-migrate` before continuing.

**If schema drift detected between environments:** STOP. Sync schemas before proceeding.

### 3c. Environment Variable Verification

If the feature requires new environment variables, confirm each var is set in the production environment with correct, non-empty values. Document which vars were added and their purpose.

### 3d. Update CHANGELOG.md

**STAGING:** Add entries under `## [Unreleased] - Not Published`
**PUBLISH:** Rename `[Unreleased]` to versioned heading `## [X.Y.Z] - YYYY-MM-DD - Published`, move entries under it.

### 3e. Stage and Commit

```bash
git add -A

git commit -m "$(cat <<'EOF'
<Title: Brief description>

<Body: What changed and why>

- Change 1
- Change 2

Publication Status: Published - YYYY-MM-DD HH:MM UTC

🤖 Generated with [Claude Code](https://claude.com/claude-code)
Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

For staging commits, use `Publication Status: Not Published`.

**NEVER amend previous commits. Always create NEW commits.**

### 3f. Verify

Run `git status` and `git log --oneline -1` to confirm clean tree and commit hash.

### Artifact: `.dev/ship/execute-release-output.md`

Commit hash, changelog entry text, git status output, security scan results, dual-DB migration status (both environments), env var verification results, deployment notes.

**Tool:** `validate-stage-output ship execute <feature-dir> --plugin backend`

---

## Stage 4: Review — Release Confirmation

Check Execute output against Architect's success criteria with evidence-based pass/fail.

### Verification Checklist

| Criterion | Evidence |
|-----------|----------|
| Commit exists | `git log --oneline -1` shows expected hash |
| Changelog accurate | Diff matches planned entries |
| No secrets staged | Security scan passed |
| Git status clean | Working tree clean |
| Commit format correct | Co-Authored-By present, Publication Status matches decision |
| Migrations synced | Both dev and production show `up` for all feature migrations |
| Env vars set | All required variables confirmed in production |

### Present to User

```
Commit: <hash>
Status: PUBLISHED / STAGED
Version: <X.Y.Z if published>
Changelog: <summary of entries>
Migrations: Synced (dev + production) / No migrations
Env Vars: All set / None required
```

### User Decision (AskUserQuestion)

"Confirm deployment? Options: Confirm / Revise / Rollback"

| Option | Action |
|--------|--------|
| **Confirm** | Update MANIFEST to COMPLETE, pipeline done |
| **Revise** | Back to Architect — adjust changelog, commit, or verification |
| **Rollback** | `git reset HEAD~1` — back to Discuss |

### On Confirmation

### Notion Update

Update the Dev Tracker card based on publication status. Reference `references/notion-integration.md` for property names and MCP tool patterns.

**If Notion MCP tools are unavailable or the update fails, warn but do NOT block the pipeline.**

1. Read the Notion card page ID from MANIFEST's `## Notion Integration > Card ID`
2. **If published:** Update Dev Tracker card using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: card ID from MANIFEST
   - Properties: Status = `Published`, Last Updated = today's ISO date, Notes = append "Published vX.Y.Z on YYYY-MM-DD"
   - Display: `📋 Notion: Moved — "[Feature Name]" → Published`
3. **If staging only:** Update Dev Tracker card using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: card ID from MANIFEST
   - Properties: Notes = append "Staged — not yet published (commit: [hash])", Last Updated = today's ISO date
   - Keep current Status unchanged
   - Display: `📋 Notion: Updated notes — "[Feature Name]" (staged, not yet published)`

Update MANIFEST to COMPLETE with commit hash and version. Display deployment reminder.

### Artifact: `.dev/ship/review-release-confirmation.md`

Verification results, user decision, final commit hash, migration sync status, pipeline completion status.

**Tool:** `validate-stage-output ship review <feature-dir> --plugin backend`

---

## Deployment Reminder

```
## Deployment Reminder

- [ ] Verify migrations applied in production (`RAILS_ENV=production rails db:migrate:status`)
- [ ] Confirm environment variables set in production
- [ ] Check deployment logs for errors
- [ ] Verify Solid Queue workers restarted (if job changes)
- [ ] Smoke test critical API endpoints
- [ ] Monitor error tracking for new issues
- [ ] Verify at https://thoven.co/health after publishing
- [ ] Update MANIFEST status to COMPLETE
```

For Replit-hosted projects: `git push` does NOT deploy. User must click **Publish** in the Replit Deployments tab.

---

## Pipeline Complete

After confirmation, display:

```
/dev pipeline COMPLETE for [Feature Name].

Committed: [hash]
Status: [STAGED / PUBLISHED]
Version: [X.Y.Z if published]
Migrations: [Synced / No migrations]

Pipeline artifacts: docs/[Feature]/.dev/
```

**There is no "Next Up" block. The pipeline is done.**

If STAGED: remind user they can publish later via the deployment UI.

---

## Rules (Non-Negotiable)

- SHIP is the TERMINAL phase — no next phase, no "Next Up" block
- MANIFEST updated to COMPLETE on successful confirmation
- NEVER commit secrets — security scan is mandatory
- NEVER amend previous commits — always create NEW commits
- ALWAYS use HEREDOC for commit messages
- ALWAYS include `Co-Authored-By: Claude <noreply@anthropic.com>`
- ALWAYS update CHANGELOG.md before committing
- ALWAYS verify migrations on BOTH databases before shipping
- ALWAYS check environment variables are set in production
- ALWAYS remind user about deployment after commit
- Commit message follows project convention from CLAUDE.md
- `git add -A` per solo developer convention
- AskUserQuestion for every question — one at a time, no batching
- Subagent dispatch in Execute — orchestrator never executes inline
- `/prompt-generator` in Architect — mandatory
