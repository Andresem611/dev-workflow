---
name: ship
description: Ships a validated feature — handles changelog, commit creation, and deployment reminders. Terminal phase of the pipeline. Triggers on /dev:ship or when /dev router advances past VALIDATE.
---

# /dev:ship — Changelog + Commit + Deploy Reminder

Terminal phase of the /dev pipeline. Takes a validated feature through changelog update, commit creation, and deployment guidance. Pipeline is COMPLETE after SHIP — there is no next phase.

## Inner Loop: Discuss > Architect > Execute > Review

---

## Stage 1: Discuss — Release Scope

**Tool:** `validate-stage-entry ship discuss <feature-dir> --plugin frontend`

### Context Bridge

Read `.dev/validate/review-ship-readiness.md` for validation results and caveats.

### WHAT Questions (AskUserQuestion, one at a time)

- Publish to production or staging only?
- Version bump type: major, minor, or patch?
- Any last-minute file exclusions?
- Deployment notes or special instructions?

### HOW Meta-Questions

- "Full changelog review or quick summary?"
- "Want to review all staged files before commit?"

No cap on questions. User says "enough" or "move on" to proceed.

### Artifact: `.dev/ship/discuss-release-scope.md`

All Q&A, locked decisions (publish vs staging, version bump, exclusions), user preferences.

**Tool:** `validate-stage-output ship discuss <feature-dir> --plugin frontend`

---

## Stage 2: Architect — Release Plan

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

4. **Deployment checklist** — post-deploy verification steps
5. **Security scan plan** — check for secrets before staging

### Subagent Assignment

| Field | Value |
|-------|-------|
| **Agent type** | Release executor |
| **Prompt** | Crafted via `/prompt-generator` |
| **Success criteria** | CHANGELOG updated, commit created, git status clean, no secrets staged |
| **Input context** | discuss-release-scope.md, MANIFEST.md, CHANGELOG.md, git diff |
| **Execution order** | Sequential: security scan > changelog > stage > commit > verify |

### Artifact: `.dev/ship/architect-release-plan.md`

Changelog entries, commit message draft, staging plan, deployment checklist, subagent prompt.

**Tool:** `validate-stage-output ship architect <feature-dir> --plugin frontend`

---

## Stage 3: Execute — Release Output

**MANDATORY:** Dispatch subagent. Orchestrator NEVER executes inline.

### 3a. Security Scan

Before staging, check all changed files for `.env` files, API keys, tokens, credentials, private keys, or database passwords. If secrets found: STOP and surface to user.

### 3b. Update CHANGELOG.md

**STAGING:** Add entries under `## [Unreleased] - Not Published`
**PUBLISH:** Rename `[Unreleased]` to versioned heading `## [X.Y.Z] - YYYY-MM-DD - Published`, move entries under it.

### 3c. Stage and Commit

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

### 3d. Verify

Run `git status` and `git log --oneline -1` to confirm clean tree and commit hash.

### Artifact: `.dev/ship/execute-release-output.md`

Commit hash, changelog entry text, git status output, security scan results, deployment notes.

**Tool:** `validate-stage-output ship execute <feature-dir> --plugin frontend`

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

### Present to User

```
Commit: <hash>
Status: PUBLISHED / STAGED
Version: <X.Y.Z if published>
Changelog: <summary of entries>
```

### User Decision (AskUserQuestion)

"Confirm deployment? Options: Confirm / Revise / Rollback"

| Option | Action |
|--------|--------|
| **Confirm** | Update MANIFEST to COMPLETE, pipeline done |
| **Revise** | Back to Architect — adjust changelog or commit |
| **Rollback** | `git reset HEAD~1` — back to Discuss |

### On Confirmation

Update MANIFEST to COMPLETE with commit hash and version. Display deployment reminder.

### Artifact: `.dev/ship/review-release-confirmation.md`

Verification results, user decision, final commit hash, pipeline completion status.

**Tool:** `validate-stage-output ship review <feature-dir> --plugin frontend`

---

## Deployment Reminder

```
## Deployment Reminder

- [ ] Verify build passes in production
- [ ] Check deployment logs for errors
- [ ] Smoke test critical user flows
- [ ] Monitor error tracking for new issues
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
- ALWAYS remind user about deployment after commit
- Commit message follows project convention from CLAUDE.md
- `git add -A` per solo developer convention
- AskUserQuestion for every question — one at a time, no batching
- Subagent dispatch in Execute — orchestrator never executes inline
- `/prompt-generator` in Architect — mandatory
