# Behavior-Slice Task Template

Canonical task file template for behavior-slice tasks. Referenced by both backend and frontend DOCUMENT skills. All task files created during the DOCUMENT Execute stage MUST follow this template.

---

## Grouping Principle

**Files that import/call each other belong in the same task.**

- Controller calls service? Same task.
- Two independent services? Separate tasks.
- Component imports a hook that calls an API? Same task.
- One task = one testable behavior slice through the stack.

**Sizing rules:**
- 2-4 tasks per wave
- 1-3 hours each
- If a task exceeds 3 hours, split into two behavior slices along a natural boundary (e.g., read path vs write path)
- If a task is under 1 hour, combine with a related behavior slice

---

## Task File Template

```markdown
## TASK_NN: [Behavior Name]

**Goal:** [One sentence — what becomes true when this task is done]

**Estimated effort:** [1-3 hours]
**Wave:** [N]
**Dependencies:** [TASK_XX or "none"]

### Acceptance Criteria (must_haves)

**truths:**
- "[Specific verifiable statement about behavior]"
- "[Another specific statement]"

**artifacts:**
- "[path/to/file — description]"
- "[path/to/spec_or_test — description]"

**key_links:**
- "[route/import/call chain that must be wired]"

### Locked Decisions (from PLAN — non-negotiable)

- D-XX: [Specific engineering constraint from execute-locked-decisions.md]
- D-YY: [Another constraint relevant to this task]

### Context

- **Architecture:** See `.dev/plan/execute-locked-decisions.md` for full decisions
- **Existing patterns:** [Specific file path to use as implementation reference]
- **Prior task output:** [What TASK_N-1 produced that this task depends on, or "none"]

### Suggested Approach (optional — agent decides)

[Brief notes on recommended approach if non-obvious. NOT mandatory TDD steps.
The agent is expected to use TDD and follow the BUILD skill's instructions.
This section provides hints, not recipes.]

### Completion Log

| Field | Value |
|-------|-------|
| **Status** | Pending |
| **Planned** | [from Goal above] |
| **Actual** | |
| **Deviations** | |
| **Discoveries** | |
| **Files touched** | |
```

---

## Anti-Patterns

| DO NOT | Instead |
|--------|---------|
| Create one task per file type (model task, controller task, service task) | Group files that call each other into one behavior-slice task |
| Include TDD step-by-step instructions | Agent follows BUILD skill's TDD guidance. Use Suggested Approach for hints only |
| Prescribe exact method signatures | Acceptance criteria define WHAT. Agent decides HOW within locked decisions |
| List more than 5 locked decisions per task | Extract only the decisions that constrain THIS task's behavior |
| Create tasks smaller than 1 hour | Combine with related behavior slices |
| Create tasks larger than 3 hours | Split along a natural behavior boundary |

---

## Examples

### Good: Behavior-Slice Task

```markdown
## TASK_01: Events API Endpoint

**Goal:** Users can create and list events via REST API with proper authorization.

**Estimated effort:** 2 hours
**Wave:** 1
**Dependencies:** none

### Acceptance Criteria (must_haves)

**truths:**
- "POST /api/v1/events creates an event linked to the authenticated user"
- "GET /api/v1/events returns paginated events for the authenticated user"
- "Unauthorized requests receive 401"

**artifacts:**
- "app/models/event.rb — Event model with validations"
- "app/controllers/api/v1/events_controller.rb — create + index actions"
- "app/services/event_creator.rb — creation logic with validation"
- "spec/requests/api/v1/events_spec.rb — request specs for both endpoints"

**key_links:**
- "routes.rb → EventsController → EventCreator → Event model"

### Locked Decisions (from PLAN — non-negotiable)

- D-03: Use UUID primary keys for all new models
- D-07: API pagination via Pagy gem, 25 items per page default

### Context

- **Architecture:** See `.dev/plan/execute-locked-decisions.md`
- **Existing patterns:** `app/controllers/api/v1/users_controller.rb` (auth pattern)
- **Prior task output:** none

### Suggested Approach (optional — agent decides)

The users_controller.rb has the exact auth + pagination pattern to follow.
Event model needs: title (required), description (optional), starts_at (required), user_id (FK).
```

### Bad: File-Type Task (DO NOT DO THIS)

```markdown
## TASK_01: Event Model

Goal: Create the Event model
Files: app/models/event.rb, spec/models/event_spec.rb

Step 1: Write failing test for validations...
Step 2: Run test to see it fail...
Step 3: Create migration...
Step 4: Add validations...

## TASK_02: Events Controller

Goal: Create the Events controller
Files: app/controllers/api/v1/events_controller.rb

Step 1: Write failing request spec...
```

This splits one behavior (Events API) into disconnected file-type tasks. The controller task has no context about the model it depends on, and the step-by-step instructions prevent the agent from adapting when the recipe doesn't fit.
