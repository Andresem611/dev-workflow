---
name: ship
description: Ships a validated feature — handles changelog, commit creation, and deployment reminders. Terminal phase of the pipeline. Triggers on /dev:ship or when /dev router advances past VALIDATE.
---

# /dev:ship — Changelog + Commit + Deploy Reminder

Terminal phase of the /dev pipeline. Takes a validated feature through changelog update, commit creation, and deployment guidance. Pipeline is COMPLETE after SHIP — there is no next phase.

## Hard Rules

1. **Read before acting.** Use the Read tool on MANIFEST, CHANGELOG, and the validate review artifact before any commit action. Shipping from memory risks wrong version numbers and missed changelog entries.
2. **Never skip the publish/staging gate.** Always ask the user — they decide deployment intent.
3. **Stage specific files only.** Never `git add -A` or `git add .` — list files explicitly.

## Inner Loop: Discuss > Architect > Execute > Review

---

## Stage 1: Discuss — Release Scope

**Tool:** `validate-stage-entry ship discuss <feature-dir> --plugin frontend`

### Context Bridge

Read `.dev/validate/review-ship-readiness.md` for validation results and caveats.

### MANDATORY CONTEXT LOADING — Step 0

Use the Read tool on each file. Do not proceed until all reads complete.

1. `Read(.dev/validate/review-ship-readiness.md)` → extract: validation results, any caveats, ship readiness assessment, LOCKED decision compliance
2. `Read(CHANGELOG.md)` → extract: current [Unreleased] section, last published version number
3. `Read(docs/[feature]/.dev/MANIFEST.md)` → extract: feature name, domains, all completed phases, Decision Ledger summary, execution mode

**Echo-Back (v4.0):** After loading, confirm all LOCKED decisions were verified:
```
Loaded context for SHIP:
- Feature: [name]
- LOCKED decisions: [N] total, [N] verified in VALIDATE
- Validation: [PASS/FAIL with caveats]
```

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

**D04 ENFORCEMENT:** Follow the D04 Enforcement Protocol from `inner-loop-reference.md`. Every subagent prompt MUST go through `/prompt-generator`. Log status in the Orchestration Log section of this artifact.

**MANDATORY:** Use `/prompt-generator` to craft the subagent prompt.

#### Architect Step 0: Verify Context Loaded

Before designing agent prompts, confirm:
- [ ] `domain-agent-map.md` was Read in Step 0 — list ALL agents from the map for this phase as either "dispatched" or "skipped (reason)"
- [ ] Domain Combination Patterns checked — read the Domain Combination Patterns table from domain-agent-map.md and apply any extra considerations (e.g., `routing + auth-ui` = test both authenticated and unauthenticated access)
- [ ] Previous phase review artifact was Read — decisions and context carried forward

This verification appears in the Orchestration Log under `Map compliance`.

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

Changelog entries, commit message draft, staging plan, deployment checklist, subagent prompt. Must include the Orchestration Log section.

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

### Notion Update

After confirmation, update the Dev Tracker card based on publication status. Read the Card ID from MANIFEST's `## Notion Integration > Card ID`.

**If published:**
1. **Update card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: Card ID from MANIFEST
   - Properties: Status = `Published`, Last Updated = today's ISO date, Notes = append "Published [version] on [date]"

2. Display: `📋 Notion: Moved — "[Feature Name]" → Published`

**If staging only:**
1. **Update card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: Card ID from MANIFEST
   - Properties: Notes = append "Staged — not yet published", Last Updated = today's ISO date

2. Display: `📋 Notion: Updated notes — "[Feature Name]" (staged — not yet published)`

**Notion Protocol:** Follow the Retry + Warning Protocol in `references/notion-integration.md`.
- Phase type: Downstream (status update — check Card ID first)
- Target status: `Published`
- Persist warning in: `.dev/ship/review-release-confirmation.md`

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
