---
name: dev-pause
description: Use when pausing the /dev pipeline at any phase. Captures current state, generates handoff context for resumption, and handles backend dependency pauses. Triggers on /dev:pause, "pause", "stop here", "continue later", or when backend endpoints are missing.
---

# /dev:pause — Explicit Pause with Handoff

Can be invoked at ANY point during the /dev pipeline. Captures full context so a future session (or different agent) can resume exactly where work stopped.

## When This Runs

- User explicitly says "pause", "stop here", "continue later"
- Backend dependency detected during PLAN (auto-triggered)
- 3 strikes during BUILD (error escalation)
- User chooses "Pause" at any gate
- Session ending with incomplete work

---

## Step 1: Capture Current State

Gather everything needed for seamless resume.

### 1a. Identify Position

```
Current phase:     [INTAKE | DISCOVER | PLAN | DESIGN | DOCUMENT | BUILD | VALIDATE | SHIP]
Step within phase: [e.g., "EXECUTE step 2c — wave 2 task 3"]
Inner loop stage:  [RESEARCH | EXECUTE | DOCUMENT | GATE]
```

### 1b. Inventory Completed Work

- Which phases are fully complete
- Which tasks/waves finished (if in BUILD)
- Which gates passed
- Artifacts generated (list file paths)
- Decisions locked in MANIFEST

### 1c. Inventory Remaining Work

- Current phase remaining steps
- Subsequent phases still needed
- Outstanding tasks in current wave
- Custom acceptance criteria not yet met

### 1d. Identify Blockers

- Why pausing? (user choice, backend dependency, error escalation, session limit)
- Specific blockers with detail
- If backend: what endpoints are missing, what contracts are needed

---

## Step 2: Generate Handoff

### 2a. Update MANIFEST

Add pause context block to MANIFEST (`docs/[feature]/.dev/MANIFEST.md`):

```markdown
## Pause Context

- **Paused at:** [phase] / [step] / [inner loop stage]
- **Pause reason:** [user-choice | awaiting-backend | error-escalation | session-limit]
- **Paused on:** 2026-03-10
- **Completed phases:** INTAKE, DISCOVER, PLAN, ...
- **Current phase progress:** [e.g., "BUILD wave 2: tasks 1-3 done, task 4 in progress"]
- **Blockers:** [specific blockers]
- **Resume action:** [exact next step to take]
```

Set MANIFEST status to `"paused"`.

### 2b. Generate Pause Handoff File

Create `docs/[feature]/prompt-transitions/pause-handoff.md`:

```markdown
# Pause Handoff — [Feature Name]

## Resume Instructions

1. Read MANIFEST at `docs/[feature]/.dev/MANIFEST.md`
2. Current phase: [PHASE]
3. Next action: [exact step description]

## Context Summary

### What Was Done
- [Bulleted list of completed work]

### What Remains
- [Bulleted list of remaining work]

### Key Decisions (from MANIFEST decision log)
- [Decision 1]: [choice] — [reasoning]
- [Decision 2]: [choice] — [reasoning]

### Active Artifacts
- [File path]: [what it contains, current state]

### Blockers
- [Blocker description + what resolves it]
```

### 2c. Backend Dependency Handoff (if applicable)

When pause reason is `awaiting-backend`, generate an additional file:

`docs/[feature]/prompt-transitions/backend-handoff.md`:

```markdown
# Backend Handoff — [Feature Name]

## API Contract Needed

### Endpoint 1: [METHOD /api/v1/resource]
- **Purpose:** [what frontend needs this for]
- **Auth:** [JWT required, role restrictions]
- **Request body:**
  ```json
  {
    "field": "type — description"
  }
  ```
- **Expected response:**
  ```json
  {
    "field": "type — description"
  }
  ```
- **Error cases:** [expected error responses]

### Endpoint 2: ...

## Data Models Needed
- [Model name]: [fields and relationships]

## Auth Requirements
- [Which auth system: parent/teacher JWT or student JWT]
- [Role restrictions: Admin, Parent, Teacher, Student]

## Frontend Readiness
- API module scaffolded: [yes/no, path if yes]
- Components waiting: [list of components blocked on this data]
- Mock data in use: [yes/no, location if yes]

## Resume Trigger
When backend endpoints are deployed to dev server, resume /dev with:
"Backend is ready for [Feature Name]"
Entry mode: backend-handoff → routes to [PLAN | DESIGN | BUILD]
```

---

### 2d. Display Resume Block Inline

After writing all handoff files, display inline:

```
Pipeline paused for [Feature Name].

Resume with: `dev-pipeline:[paused-phase]`
Read MANIFEST first: `docs/[feature]/.dev/MANIFEST.md`
Read handoff: `docs/[feature]/prompt-transitions/pause-handoff.md`

/clear first → fresh context window
```

**STOP.** Session ends here.

---

## Step 3: Resume Protocol

When `/dev` is invoked and MANIFEST shows `status: "paused"`:

1. **Read MANIFEST** — detect paused state
2. **Read pause-handoff.md** — get full context
3. **Route to paused phase** — resume at exact step
4. **If backend pause:** verify endpoints exist before resuming
   ```bash
   curl -s "${API_BASE_URL}/api/v1/[endpoint]" -H "Authorization: Bearer ${TOKEN}" | head -20
   ```
5. **Clear pause context** from MANIFEST once resumed
6. **Continue pipeline** from where it stopped

---

## Pause Scenarios

| Trigger | Pause Reason | Extra Output | Resume Condition |
|---------|-------------|-------------|-----------------|
| User says "pause" | `user-choice` | pause-handoff.md | User invokes /dev |
| Missing backend endpoints | `awaiting-backend` | + backend-handoff.md | User says "backend ready" |
| 3 strikes in BUILD | `error-escalation` | + error details in handoff | User provides fix guidance |
| Gate → Pause option | `user-choice` | pause-handoff.md | User invokes /dev |
| Session ending | `session-limit` | pause-handoff.md | New session, invoke /dev |

---

## Common Mistakes

| Mistake | Why It Breaks | Prevention |
|---------|--------------|------------|
| Pause without updating MANIFEST | Next session can't find where to resume | ALWAYS write pause context to MANIFEST |
| Vague "resume action" | Agent doesn't know exact next step | Be specific: "Run wave 2 task 4: implement BookingCard" |
| Missing backend contract details | Backend dev builds wrong API shape | Include full request/response JSON schemas |
| No artifact inventory | Resuming agent re-does completed work | List every generated file with its current state |
| Skipping decision log | Resuming agent re-debates settled decisions | Copy locked decisions from MANIFEST into handoff |
| Not setting MANIFEST status | /dev orchestrator doesn't detect pause | Set status to `"paused"` explicitly |
| Backend handoff without auth details | Backend builds endpoint without proper auth | Always specify JWT system and role restrictions |
| Pause during GATE without recording gate state | Resume doesn't know if gate passed | Record gate status: pending, passed, or revision-needed |

---

## Rules (Non-Negotiable)

- ALWAYS update MANIFEST with pause context before stopping
- ALWAYS generate pause-handoff.md with structured resume instructions
- ALWAYS specify the exact next action (not just "continue BUILD")
- ALWAYS include decision log in handoff (decisions must not be re-debated)
- ALWAYS generate backend-handoff.md when pausing for backend dependencies
- ALWAYS list all artifact file paths with their current state
- NEVER leave a pause without a handoff file — context WILL be lost
- NEVER resume from pause without reading MANIFEST + pause-handoff.md first
- NEVER skip endpoint verification when resuming from backend pause
- NEVER re-debate locked decisions on resume — they are settled
