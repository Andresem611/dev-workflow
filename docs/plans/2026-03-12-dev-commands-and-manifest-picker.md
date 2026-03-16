# Dev Pipeline Commands + Multi-MANIFEST Picker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a `commands/` directory to both pipeline plugins so `/dev:intake`, `/dev:plan`, etc. appear in Claude Code autocomplete, and update the `/dev` router to show a feature picker when multiple active MANIFESTs exist.

**Architecture:** Each plugin gets a thin `commands/` directory where each phase command file simply invokes the corresponding skill. The `dev.md` command handles routing: no args + 1 MANIFEST = resume, no args + 2+ MANIFESTs = picker, optional feature name arg = direct resume, no MANIFESTs = new feature. The `dev/SKILL.md` routing logic is updated to match. Both changes go in one v2.2.0 commit.

**Tech Stack:** Claude Code plugin system — Markdown command files, YAML frontmatter, `$ARGUMENTS` placeholder, `AskUserQuestion` tool for picker.

**Plugin source root:** `~/.claude/plugins/marketplaces/thoven-dev/`
**Cache root:** `~/.claude/plugins/cache/thoven-dev/`

---

### Task 1: Create frontend commands directory — phase delegation files

**Files:**
- Create: `plugins/dev-pipeline-frontend/commands/dev:intake.md`
- Create: `plugins/dev-pipeline-frontend/commands/dev:discover.md`
- Create: `plugins/dev-pipeline-frontend/commands/dev:plan.md`
- Create: `plugins/dev-pipeline-frontend/commands/dev:design.md`
- Create: `plugins/dev-pipeline-frontend/commands/dev:document.md`
- Create: `plugins/dev-pipeline-frontend/commands/dev:build.md`
- Create: `plugins/dev-pipeline-frontend/commands/dev:validate.md`
- Create: `plugins/dev-pipeline-frontend/commands/dev:ship.md`
- Create: `plugins/dev-pipeline-frontend/commands/dev:pause.md`

**Step 1: Create the directory**
```bash
mkdir -p ~/.claude/plugins/marketplaces/thoven-dev/plugins/dev-pipeline-frontend/commands
```

**Step 2: Create each delegation file**

`dev:intake.md`:
```markdown
---
description: Classify feature, scope work, create MANIFEST — frontend pipeline entry point
---

Invoke the `dev-pipeline-frontend:intake` skill to start the INTAKE phase.
```

`dev:discover.md`:
```markdown
---
description: Brainstorm requirements, research codebase, reuse audit — frontend DISCOVER phase
---

Invoke the `dev-pipeline-frontend:discover` skill to run the DISCOVER phase.
```

`dev:plan.md`:
```markdown
---
description: Architecture decisions, task breakdown, locked decisions — frontend PLAN phase
---

Invoke the `dev-pipeline-frontend:plan` skill to run the PLAN phase.
```

`dev:design.md`:
```markdown
---
description: UI spec, design system compliance, visual direction — frontend DESIGN phase (always runs)
---

Invoke the `dev-pipeline-frontend:design` skill to run the DESIGN phase.
```

`dev:document.md`:
```markdown
---
description: 5-layer docs, wave execution plans — frontend DOCUMENT phase
---

Invoke the `dev-pipeline-frontend:document` skill to run the DOCUMENT phase.
```

`dev:build.md`:
```markdown
---
description: Wave-based task execution, agent dispatch — frontend BUILD phase
---

Invoke the `dev-pipeline-frontend:build` skill to run the BUILD phase.
```

`dev:validate.md`:
```markdown
---
description: Type-check, lint, QA, domain audits — frontend VALIDATE phase
---

Invoke the `dev-pipeline-frontend:validate` skill to run the VALIDATE phase.
```

`dev:ship.md`:
```markdown
---
description: Changelog, commit, deployment reminder — frontend SHIP phase
---

Invoke the `dev-pipeline-frontend:ship` skill to run the SHIP phase.
```

`dev:pause.md`:
```markdown
---
description: Pause feature mid-pipeline with full handoff context — resume with /dev
---

Invoke the `dev-pipeline-frontend:pause` skill to pause the current feature and write a handoff.
```

**Step 3: Verify 9 files exist**
```bash
ls ~/.claude/plugins/marketplaces/thoven-dev/plugins/dev-pipeline-frontend/commands/
```
Expected: 9 files (`dev:intake.md`, `dev:discover.md`, `dev:plan.md`, `dev:design.md`, `dev:document.md`, `dev:build.md`, `dev:validate.md`, `dev:ship.md`, `dev:pause.md`)

---

### Task 2: Create frontend dev.md router command

**Files:**
- Create: `plugins/dev-pipeline-frontend/commands/dev.md`

**Step 1: Create the router command file**

`dev.md`:
```markdown
---
description: Frontend dev pipeline router — resume active feature, pick from multiple, or start new
argument-hint: [feature-name]
---

You are the /dev router for the frontend development pipeline.

`$ARGUMENTS` contains an optional feature name the user typed (e.g., `/dev Admin_Overhaul`).

## Routing Logic

**Step 1:** Scan `docs/**/.dev/MANIFEST.md` for all MANIFEST files where status is NOT "complete".

**Step 2:** Route based on what you find:

### If $ARGUMENTS is provided (not empty):
- Find the MANIFEST whose feature name matches `$ARGUMENTS` (case-insensitive, partial match ok)
- If found: resume it — read MANIFEST + latest `review-*.md`, invoke `dev-pipeline-frontend:dev`
- If not found: tell the user "No active feature matching '$ARGUMENTS' found" and show the picker (see below)

### If 0 MANIFESTs found:
- New feature — invoke `dev-pipeline-frontend:intake`

### If exactly 1 MANIFEST found (and no $ARGUMENTS):
- Resume it directly — read MANIFEST + latest `review-*.md`, invoke `dev-pipeline-frontend:dev`

### If 2+ MANIFESTs found (and no $ARGUMENTS):
- Show the picker using `AskUserQuestion`:

```
Active features:
1. [Feature_Name] — [CURRENT_PHASE] / [current_stage]  ([status: active|paused])
2. [Feature_Name] — [CURRENT_PHASE] / [current_stage]  ([status: active|paused])
→ start new feature
```

Present as a numbered list. Include "start new feature" as the last option.

- If user picks a number: resume that feature
- If user picks "start new feature" or types "new": invoke `dev-pipeline-frontend:intake`

## After routing:
Always read the selected MANIFEST fully before invoking the skill. Pass the feature name and current phase context to the skill invocation.
```

**Step 2: Verify file exists**
```bash
cat ~/.claude/plugins/marketplaces/thoven-dev/plugins/dev-pipeline-frontend/commands/dev.md
```

---

### Task 3: Update frontend dev/SKILL.md routing logic

**Files:**
- Modify: `plugins/dev-pipeline-frontend/skills/dev/SKILL.md`

The Routing Logic section needs to reflect the new multi-MANIFEST picker. Find this block and replace it:

**Find:**
```
1. Check for existing MANIFEST (docs/**/.dev/MANIFEST.md)
   |-- Found + status != COMPLETE → RESUME
   |   |-- Read MANIFEST
   |   |-- Read latest review-*.md from last completed phase
   |   |-- If paused: read .dev/pause-handoff.md
   |   |-- Report state to user, route to current phase
   +-- Not found → NEW FEATURE
       |-- Classify entry mode from user input
       |-- Route to starting phase per Entry Mode table
       +-- First phase is always INTAKE (creates MANIFEST)
```

**Replace with:**
```
1. Check for $ARGUMENTS (feature name passed via /dev command)
   |-- Provided → find matching MANIFEST → skip to resume
   +-- Not provided → scan docs/**/.dev/MANIFEST.md

2. MANIFEST scan results:
   |-- 0 found    → NEW FEATURE → INTAKE
   |-- 1 found    → RESUME directly
   +-- 2+ found   → SHOW PICKER
       |-- AskUserQuestion: list features with phase/stage/status
       |-- User picks feature → RESUME
       +-- User picks "new"   → INTAKE

3. On RESUME:
   |-- Read MANIFEST (current phase, domains, status)
   |-- Read latest review-*.md from last completed phase
   |-- If paused: read .dev/pause-handoff.md
   |-- Report state to user: "Resuming [feature] at [phase]. Last: [phase]."
   +-- Route to current phase skill

4. On phase invocation:
   |-- Skill(dev-pipeline-frontend:<phase>)
   |-- Read MANIFEST
   |-- Read review-*.md from previous phase for context bridge
   |-- If review-*.md missing:
   |     validate-stage-entry <current_phase> discuss <feature-dir> --plugin frontend
   |     If FAIL: show issues, suggest re-running previous phase Review
   |     If PASS with warnings: proceed with warning
   +-- Phase runs its own inner loop → Review → ▶ Next Up → STOP
```

Also add to the Common Mistakes table:
```
| Running /dev with multiple MANIFESTs and no picker | Auto-resuming first found feature silently | Always show picker when 2+ active MANIFESTs |
```

**Step 1: Edit the SKILL.md** (use Edit tool with the exact strings above)

**Step 2: Verify the routing section looks correct**
```bash
grep -A 30 "Routing Logic" ~/.claude/plugins/marketplaces/thoven-dev/plugins/dev-pipeline-frontend/skills/dev/SKILL.md
```

---

### Task 4: Create backend commands directory — phase delegation files

**Files:**
- Create: `plugins/dev-pipeline-backend/commands/dev:intake.md`
- Create: `plugins/dev-pipeline-backend/commands/dev:discover.md`
- Create: `plugins/dev-pipeline-backend/commands/dev:plan.md`
- Create: `plugins/dev-pipeline-backend/commands/dev:document.md`
- Create: `plugins/dev-pipeline-backend/commands/dev:build.md`
- Create: `plugins/dev-pipeline-backend/commands/dev:validate.md`
- Create: `plugins/dev-pipeline-backend/commands/dev:ship.md`
- Create: `plugins/dev-pipeline-backend/commands/dev:pause.md`
- Create: `plugins/dev-pipeline-backend/commands/dev:handover.md`

**Step 1: Create the directory**
```bash
mkdir -p ~/.claude/plugins/marketplaces/thoven-dev/plugins/dev-pipeline-backend/commands
```

**Step 2: Create each delegation file**

Same pattern as frontend but with `dev-pipeline-backend` skill names. Backend has `dev:handover.md` instead of `dev:design.md`:

`dev:intake.md` → `Invoke the \`dev-pipeline-backend:intake\` skill`
`dev:discover.md` → `Invoke the \`dev-pipeline-backend:discover\` skill`
`dev:plan.md` → `Invoke the \`dev-pipeline-backend:plan\` skill`
`dev:document.md` → `Invoke the \`dev-pipeline-backend:document\` skill`
`dev:build.md` → `Invoke the \`dev-pipeline-backend:build\` skill`
`dev:validate.md` → `Invoke the \`dev-pipeline-backend:validate\` skill`
`dev:ship.md` → `Invoke the \`dev-pipeline-backend:ship\` skill`
`dev:pause.md` → `Invoke the \`dev-pipeline-backend:pause\` skill`
`dev:handover.md`:
```markdown
---
description: Hand validated backend feature to frontend — produces self-contained handover prompt
---

Invoke the `dev-pipeline-backend:handover` skill to produce a frontend handover prompt.
```

**Step 3: Verify 9 files exist**
```bash
ls ~/.claude/plugins/marketplaces/thoven-dev/plugins/dev-pipeline-backend/commands/
```
Expected: 9 files (no `dev:design.md`, has `dev:handover.md` instead)

---

### Task 5: Create backend dev.md router command

**Files:**
- Create: `plugins/dev-pipeline-backend/commands/dev.md`

Same as frontend `dev.md` but replace all `dev-pipeline-frontend` references with `dev-pipeline-backend`, and update description:

```markdown
---
description: Backend dev pipeline router — resume active feature, pick from multiple, or start new
argument-hint: [feature-name]
---
```

Body is identical to frontend except skill invocations use `dev-pipeline-backend:*`.

---

### Task 6: Update backend dev/SKILL.md routing logic

**Files:**
- Modify: `plugins/dev-pipeline-backend/skills/dev/SKILL.md`

Same edit as Task 3 but for backend. Find and replace the same routing block. The routing logic is identical — only the skill names differ (already in the SKILL.md body).

---

### Task 7: Copy commands to both caches

**Step 1: Copy frontend commands to cache**
```bash
cp -r ~/.claude/plugins/marketplaces/thoven-dev/plugins/dev-pipeline-frontend/commands \
      ~/.claude/plugins/cache/thoven-dev/dev-pipeline-frontend/2.1.1/
```

**Step 2: Copy backend commands to cache**
```bash
cp -r ~/.claude/plugins/marketplaces/thoven-dev/plugins/dev-pipeline-backend/commands \
      ~/.claude/plugins/cache/thoven-dev/dev-pipeline-backend/2.1.1/
```

**Step 3: Copy updated SKILL.md files to cache**
```bash
cp ~/.claude/plugins/marketplaces/thoven-dev/plugins/dev-pipeline-frontend/skills/dev/SKILL.md \
   ~/.claude/plugins/cache/thoven-dev/dev-pipeline-frontend/2.1.1/skills/dev/SKILL.md

cp ~/.claude/plugins/marketplaces/thoven-dev/plugins/dev-pipeline-backend/skills/dev/SKILL.md \
   ~/.claude/plugins/cache/thoven-dev/dev-pipeline-backend/2.1.1/skills/dev/SKILL.md
```

**Step 4: Verify cache structure**
```bash
ls ~/.claude/plugins/cache/thoven-dev/dev-pipeline-frontend/2.1.1/commands/
ls ~/.claude/plugins/cache/thoven-dev/dev-pipeline-backend/2.1.1/commands/
```

---

### Task 8: Bump version and update CHANGELOG

**Files:**
- Modify: `plugins/dev-pipeline-frontend/.claude-plugin/plugin.json` — version `2.1.1` → `2.2.0`
- Modify: `plugins/dev-pipeline-backend/.claude-plugin/plugin.json` — version `2.1.1` → `2.2.0`
- Modify: `CHANGELOG.md` — add `[2.2.0]` entry

**Step 1: Update both plugin.json files**
Change `"version": "2.1.1"` to `"version": "2.2.0"` in both.

**Step 2: Add CHANGELOG entry above `[2.1.1]`:**
```markdown
## [2.2.0] - 2026-03-12

### Added
- **Commands directory (frontend)** — `/dev:intake`, `/dev:plan`, `/dev:design`, `/dev:document`, `/dev:build`, `/dev:validate`, `/dev:ship`, `/dev:pause` now appear as slash commands in Claude Code autocomplete. Each delegates to the corresponding `dev-pipeline-frontend:*` skill.
- **Commands directory (backend)** — Same set minus `design`, plus `/dev:handover`. Delegates to `dev-pipeline-backend:*` skills.
- **Multi-MANIFEST picker** — When `/dev` is invoked with 2+ active MANIFESTs, shows a numbered feature list (name, phase, stage, status) and routes to the selected feature. Supports optional feature name argument (`/dev Admin_Overhaul`) to skip the picker.
- **Feature name argument** — `/dev [feature-name]` directly resumes the matching feature without showing the picker.
```

---

### Task 9: Commit and push

**Step 1: Stage and commit**
```bash
cd ~/.claude/plugins/marketplaces/thoven-dev
git add -A
git status  # verify: commands/ dirs, SKILL.md changes, plugin.json versions, CHANGELOG
git commit -m "feat: add commands directory and multi-MANIFEST picker (v2.2.0)"
```

**Step 2: Push**
```bash
git push origin main
```

**Step 3: Verify on GitHub**
Check `https://github.com/Andresem611/dev-workflow` — confirm new `commands/` directories in both plugins.

---

## Verification Checklist

After completing all tasks, restart Claude Code in both frontend and backend Warp panes and verify:

- [ ] `/dev` shows the router (with picker logic)
- [ ] `/dev:intake` appears in autocomplete (frontend pane)
- [ ] `/dev:plan`, `/dev:build`, `/dev:ship` etc. all appear
- [ ] `/dev:design` appears in frontend, NOT in backend
- [ ] `/dev:handover` appears in backend, NOT in frontend
- [ ] `/dev Admin_Overhaul` (with arg) jumps directly to that feature
- [ ] `/dev` with 2 active MANIFESTs shows the picker list
