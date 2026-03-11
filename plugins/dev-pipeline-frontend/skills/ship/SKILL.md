---
name: ship
description: Use when the /dev pipeline reaches the SHIP phase. Handles changelog updates, commit creation, and deployment reminders. Absorbs the publish skill entirely. Triggers on /dev:ship or when BUILD+VALIDATE are complete and feature is ready to commit.
---

# /dev:ship — Changelog + Commit + Deploy Reminder

Final phase of the /dev pipeline. Absorbs ALL publish skill logic. Takes a validated feature from VALIDATE through changelog, commit, and deployment guidance.

## Inner Loop: RESEARCH → EXECUTE → DOCUMENT → GATE

---

## Step 1: RESEARCH

### 0. Validate Entry (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-entry ship docs/[feature] --plugin frontend
```

If FAIL → read error output. Fix missing prerequisites before proceeding.
If PASS → continue to step 1.

Gather state before any action.

1. **Read MANIFEST** (`docs/[feature]/.dev/MANIFEST.md`)
   - Feature name, tier, domains
   - All completed phases and their outcomes
   - Decision log entries
   - Verify VALIDATE phase shows PASSED

2. **Read CHANGELOG.md**
   - Current `[Unreleased]` section contents
   - Last published version number (e.g., `1.11.0`)

3. **Check git state**
   ```bash
   git status
   git diff --stat
   git log --oneline -5
   ```

4. **Summarize** to user: what changed, what will be committed.

---

## Step 2: EXECUTE

### 2a. Final Verification

Run type-check + lint one last time. Do NOT skip even if VALIDATE passed — files may have changed.

```bash
npm run type-check && npm run lint
```

If either fails: FIX before proceeding. Do not commit broken code.

### 2b. Gate G7 — Publish or Staging Decision

**This gate is ALWAYS mandatory. Never skip it.**

Present to user:

```
Is this a PUBLISH (release) or STAGING (commit only)?

PUBLISH = Production release
- Renames [Unreleased] to version number
- Commit includes "Publication Status: Published"
- You'll click Publish in Replit UI to deploy

STAGING = Save progress
- Adds entries to [Unreleased] section
- Regular commit message
- Changes accumulate for next publish

Options: Publish / Stage / Pause
```

If user chooses **Pause**: invoke `/dev:pause` and stop.

### 2c. Update CHANGELOG.md

**For STAGING:**

Add entries under `## [Unreleased] - Not Published`:

```markdown
### Added
- **Feature Name** - Brief description
  - Detail 1
  - File: `path/to/file.tsx`

### Fixed
- **Bug Name** - What was fixed
```

**For PUBLISH:**

1. Determine next version from last version in CHANGELOG:
   - Patch (1.11.1) = bug fixes, minor changes
   - Minor (1.12.0) = new features
   - Major (2.0.0) = breaking changes

2. Rename `[Unreleased]` section:
   ```markdown
   ## [Unreleased] - Not Published

   ---

   ## [1.12.0] - 2026-03-10 - Published
   ```

3. Move all unreleased entries under the new version heading.

### 2d. Create Commit

**Stage specific files only** — never `git add -A` or `git add .`

```bash
git add <specific-files>
```

**HEREDOC commit format (mandatory):**

Staging:
```bash
git commit -m "$(cat <<'EOF'
Brief descriptive summary

- Bullet points for specific changes
- Another change

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

Publish:
```bash
git commit -m "$(cat <<'EOF'
Publish vX.X.X: Brief summary of major features

- Feature highlight 1
- Feature highlight 2

Publication Status: Published

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
EOF
)"
```

### 2e. Post-Commit

1. Run `git status` to verify commit succeeded
2. **Remind user about deployment:**

> "Changes committed. To deploy to production, click **Publish** in the Replit Deployments tab. `git push` does NOT deploy — it only backs up to remote."

---

## Step 3: DOCUMENT

1. **Update MANIFEST** — set status:
   - `"shipped"` if PUBLISH
   - `"staged"` if STAGING
   - Record version number if published
   - Record commit hash

2. **Update CURRENT_STATUS.md** — final entry:
   ```markdown
   ## Status: SHIPPED / STAGED
   - Committed: [commit hash]
   - Version: [if published]
   - Deployment: Pending user Publish in Replit UI
   ```

### Pipeline Complete (G7)

SHIP is the final phase. After commit, display completion summary:

```
/dev pipeline COMPLETE for [Feature Name].

Committed: [hash]
Status: [STAGED / SHIPPED]
Version: [if published]

To deploy: Click Publish in Replit Deployments tab.
Pipeline artifacts: docs/[Feature]/
```

No `▶ Next Up` block — pipeline is done.
If STAGED (not published): Remind user they can publish later via Replit UI.

---

## Replit Deployment Model

**`git push` does NOT deploy.** This is critical.

```
Workspace (IDE)                    Production (Autoscale)
───────────────                    ──────────────────────
Edit code here                     Separate cloud container
npm run dev for testing            Serves live users at thoven.co
Changes are instant                Only updates on "Publish" click
git commit = version history       git push ≠ deploy
```

**Deployment flow:**
1. Code changes made in workspace
2. `git commit` saves to version history
3. User clicks **Publish** in Replit UI (Deployments tab)
4. Replit snapshots workspace → deploys to production container
5. No CLI deploy command exists

**Never run `git push` as a deployment step.**

---

## Quick Reference

| Action | Staging | Publish |
|--------|---------|---------|
| CHANGELOG | Add to `[Unreleased]` | Rename `[Unreleased]` to version |
| Commit msg | Descriptive summary | `Publish vX.X.X: ...` |
| Commit footer | Co-Authored-By | Co-Authored-By + Publication Status |
| Deploys? | No | User clicks Publish in Replit UI |
| MANIFEST status | `staged` | `shipped` |

---

## Common Mistakes

| Mistake | Why It Breaks | Prevention |
|---------|--------------|------------|
| Skip G7 gate | User didn't choose publish vs stage | ALWAYS ask — gate is mandatory |
| `git add -A` | Commits secrets, node_modules, junk | Stage specific files by name |
| `git push` as deploy | Does nothing on Replit Autoscale | Remind user: click Publish in UI |
| Skip final verify | Broken code gets committed | Run type-check + lint even after VALIDATE |
| No HEREDOC | Commit message formatting breaks | Always use `$(cat <<'EOF' ... EOF)` |
| Commit without CHANGELOG | Changelog drifts from actual changes | Update CHANGELOG before commit |
| Wrong version bump | Confuses release history | Patch=fixes, Minor=features, Major=breaking |
| Missing Co-Authored-By | Inconsistent commit history | Include in every commit |
| Publish without `Publication Status` | Can't distinguish publish vs staging commits | Always add for publish commits |
| Amend previous commit on failure | Destroys previous work | Always create NEW commit |

---

## Rules (Non-Negotiable)

- NEVER skip G7 gate — always ask Publish or Staging
- NEVER run `git push` as deployment step
- NEVER `git add -A` or `git add .` — stage specific files
- NEVER commit secrets (.env, credentials, API keys)
- NEVER amend previous commits — always create new ones
- NEVER skip CHANGELOG update
- ALWAYS run final verify (type-check + lint) before commit
- ALWAYS use HEREDOC for commit messages
- ALWAYS include `Co-Authored-By: Claude Opus 4.5 <noreply@anthropic.com>`
- ALWAYS remind user to click Publish in Replit UI
- ALWAYS update MANIFEST and CURRENT_STATUS.md after commit
- Publish commits MUST include `Publication Status: Published`
