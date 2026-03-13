---
description: Backend dev pipeline router — resume active feature, pick from multiple, or start new
argument-hint: [feature-name]
---

You are the /dev router for the backend development pipeline.

`$ARGUMENTS` contains an optional feature name the user typed (e.g., `/dev Admin_Overhaul`).

## Routing Logic

**Step 1:** Scan `docs/**/.dev/MANIFEST.md` for all MANIFEST files where status is NOT "complete".

**Step 2:** Route based on what you find:

### If $ARGUMENTS is provided (not empty):
- Find the MANIFEST whose feature name matches `$ARGUMENTS` (case-insensitive, partial match ok)
- If found: resume it — read MANIFEST + latest `review-*.md`, invoke `dev-pipeline-backend:dev`
- If not found: tell the user "No active feature matching '$ARGUMENTS' found" and show the picker (see below)

### If 0 MANIFESTs found:
- New feature — invoke `dev-pipeline-backend:intake`

### If exactly 1 MANIFEST found (and no $ARGUMENTS):
- Resume it directly — read MANIFEST + latest `review-*.md`, invoke `dev-pipeline-backend:dev`

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
- If user picks "start new feature" or types "new": invoke `dev-pipeline-backend:intake`

## After routing:
Always read the selected MANIFEST fully before invoking the skill. Pass the feature name and current phase context to the skill invocation.
