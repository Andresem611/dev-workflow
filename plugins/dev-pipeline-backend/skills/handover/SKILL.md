---
name: handover
description: Hands a validated backend feature to frontend for implementation. Conditional phase — only runs if feature has frontend component. Triggers on dev-pipeline-backend:handover or pipeline advancement past VALIDATE when Cross-Stack tag is present.
---

# /dev:handover — Frontend Handover

Conditional phase of the /dev pipeline. Takes a validated backend feature and produces everything the frontend needs to implement the UI. Only runs if the feature has frontend work (detected by `Cross-Stack: frontend` tag in MANIFEST or explicit user request).

**Default: SKIP.** Only runs if MANIFEST `Cross-Stack` tag includes `frontend` or the user explicitly requests handover.

## Inner Loop: Discuss > Architect > Execute > Review

---

## Stage 1: Discuss — Handover Scope

**Tool:** `validate-stage-entry handover discuss <feature-dir> --plugin backend`

### Context Bridge

Read `.dev/validate/review-ship-readiness.md` for validation results, caveats, and what was validated.
Read MANIFEST for `Cross-Stack` tag and domain tags.

### WHAT Questions (AskUserQuestion, one at a time)

- What frontend framework/repo will consume this API?
- Any frontend-specific constraints (state management, routing, auth UI)?
- Does the frontend need real-time features (WebSocket/Action Cable)?
- Are there existing frontend patterns to follow?
- Does frontend need design work or just API integration?
- Are there any endpoints the frontend will NOT use (backend-only / admin-only)?

### HOW Meta-Questions

- "Full API contract verification or quick check?"
- "Generate curl examples for every endpoint or just key ones?"
- "Include frontend design kickoff or API-only handover?"
- "Detailed error response catalog or summary?"

No cap on questions. User says "enough" or "move on" to proceed.

### Artifact: `.dev/handover/discuss-handover-scope.md`

All Q&A, locked decisions (frontend framework, constraints, real-time needs, design scope), user preferences.

**Tool:** `validate-stage-output handover discuss <feature-dir> --plugin backend`

---

## Stage 2: Architect — Handover Plan

**Tool:** `validate-stage-entry handover architect <feature-dir> --plugin backend`

**MANDATORY: D04 Enforcement Protocol.** Use `/prompt-generator` to craft every subagent prompt. If unavailable, follow the D04 fallback sequence (see inner-loop-reference.md Section 10). Log prompt-generator status in the Orchestration Log.

### Subagent Assignments

| Field | `api-designer` | `rails-expert` | `security-engineer` | `technical-writer` |
|-------|----------------|-----------------|----------------------|---------------------|
| **Task** | Verify API contract matches implementation (routes, params, responses, errors) | Generate curl/fetch examples for each endpoint | Document auth requirements per endpoint (which token, which role, COPPA) | Produce the handover document |
| **Prompt** | Crafted via `/prompt-generator` | Crafted via `/prompt-generator` | Crafted via `/prompt-generator` | Crafted via `/prompt-generator` |
| **Success criteria** | Zero mismatches between contract and implementation | Working curl example for every endpoint | Auth table with token type, role, COPPA flag per endpoint | Complete handover document with all sections |
| **Input context** | `docs/[feature]/api/`, `config/routes.rb`, controllers, serializers | Routes, controller actions, strong params | Auth controllers, Devise config, policies | All other subagent outputs |
| **Execution order** | Parallel with rails-expert and security-engineer | Parallel with api-designer and security-engineer | Parallel with api-designer and rails-expert | Sequential — after all others complete |

### Overall Success Criteria

- Handover document covers all endpoints, auth, errors, and examples
- API contract matches actual implementation with zero mismatches
- Auth requirements correctly distinguish User vs Student auth systems

### Escalation Rules

- If api-designer finds mismatches: surface to user before proceeding to Execute
- If security-engineer finds auth gaps: surface to user before proceeding to Execute

### Artifact: `.dev/handover/architect-handover-plan.md`

Subagent assignments, success criteria, execution order, escalation rules.

**Must include:**

```markdown
## Orchestration Log
- **Agents selected:** [list with domain justification]
- **Prompt generator:** used / unavailable (fallback) / user-skipped
- **Cross-stack signals:** none / detected ([details])
- **Multi-domain dispatch:** N/A / parallel ([agents listed])
```

**Tool:** `validate-stage-output handover architect <feature-dir> --plugin backend`

---

## Stage 3: Execute — Build Handover

**Tool:** `validate-stage-entry handover execute <feature-dir> --plugin backend`

**MANDATORY:** Dispatch subagents. Orchestrator NEVER executes inline.

### Subagent Tasks

#### 3a. API Contract Verification (`api-designer`)

Cross-reference `docs/[feature]/api/` contract with actual implementation:
- Endpoints match routes (`rails routes | grep [feature]`)
- Request params match strong params in controllers
- Response shapes match serializer output
- Error responses match actual error handling
- Status codes match controller responses

**Output:** Mismatch report (or clean bill of health).

#### 3b. Curl/Fetch Examples (`rails-expert`)

Generate working examples for each endpoint:
- curl command with correct headers, auth token, params
- Expected response body (from serializer)
- Error response examples for key failure modes

#### 3c. Auth Requirements (`security-engineer`)

Document per endpoint:
- Which auth system (User JWT vs Student JWT vs public)
- Which role required (admin, teacher, parent, student)
- COPPA considerations (student-facing endpoints)
- Rate limits (if applicable)

#### 3d. Handover Document (`technical-writer`)

Produce `docs/implementation/frontend/[feature]/FRONTEND_HANDOVER_PROMPT.md` containing:

1. **Feature Overview** — what the backend provides
2. **Endpoints Table** — URL, method, params, response shape, error responses (per endpoint)
3. **Auth Requirements** — JWT Bearer format, role required, User vs Student auth
4. **Pagination** — format, default page size, cursor vs offset (if list endpoints)
5. **WebSocket Channels & Events** — channel name, subscription params, event payloads (if real-time)
6. **Workflow Examples** — end-to-end flows with curl snippets (e.g., "Create booking", "Fetch student dashboard")
7. **Error Catalog** — all error codes, status codes, JSON body shapes
8. **"What We Don't Care About"** — frontend owns its own architecture, state management, component structure, routing. Handover specifies WHAT the API provides, not HOW frontend should build.

#### 3e. Frontend Design Spec (CONDITIONAL)

Only if user opted in during Discuss:
- UI component suggestions based on API shape
- Recommended data flow
- Real-time update handling suggestions

### Failure Handling

If a subagent fails: log the failure, continue with remaining agents, surface all failures in Review.

### Artifact: `.dev/handover/execute-handover-results.md`

Results from all dispatched subagents, mismatch report, generated document path.

**Tool:** `validate-stage-output handover execute <feature-dir> --plugin backend`

---

## Stage 4: Review — Handover Completeness

**Tool:** `validate-stage-entry handover review <feature-dir> --plugin backend`

Check Execute output against Architect's success criteria with evidence-based pass/fail.

### Verification Checklist

| Criterion | Evidence |
|-----------|----------|
| All endpoints documented with URL, method, params, response | Endpoint count matches routes |
| Auth requirements per endpoint (correct auth system: User vs Student) | Auth table present, no "TBD" entries |
| Error responses for each failure mode (status codes + JSON body) | Error catalog section populated |
| Pagination documented (if applicable) | Pagination section present or marked N/A |
| WebSocket channels documented (if applicable) | WebSocket section present or marked N/A |
| Workflow examples present | At least one end-to-end flow with curl |
| API contract matches actual implementation (no mismatches) | Mismatch report shows zero issues |
| "What we don't care about" section present | Section exists in handover doc |

### Present to User (AskUserQuestion)

```
Handover document: docs/implementation/frontend/[feature]/FRONTEND_HANDOVER_PROMPT.md

Endpoints documented: [count]
Auth requirements: [complete / gaps noted]
Error catalog: [complete / partial]
API contract: [matches / mismatches found]
Design spec: [included / skipped]

Options: Accept / Retry Execute / Back to Architect / Back to Discuss
```

| Option | Action |
|--------|--------|
| **Accept** | Update MANIFEST, move Notion card, advance to SHIP |
| **Retry Execute** | Re-dispatch failed subagents with adjusted prompts |
| **Back to Architect** | Redesign the execution plan |
| **Back to Discuss** | Revisit requirements or direction |

### On Accept

1. **Update MANIFEST:** Set `HANDOVER = complete`

2. **Notion Update:** Move card to "Frontend Dev". Reference `references/notion-integration.md` for property names and MCP tool patterns.

   **If Notion MCP tools are unavailable or the update fails, warn but do NOT block the pipeline.**

   - Read the Notion card page ID from MANIFEST's `## Notion Integration > Card ID`
   - Update Dev Tracker card using `mcp__plugin_Notion_notion__notion-update-page`:
     - Page ID: card ID from MANIFEST
     - Properties: Status = `Frontend Dev`, Last Updated = today's ISO date, Notes = append "Handover complete — frontend can begin implementation"
   - Display: `📋 Notion: Moved — "[Feature Name]" → Frontend Dev`
   - If Card ID is empty: warn "No Notion card ID in MANIFEST — skipping Notion update" and continue

3. **Display Next Up:**

```
▶ Next Up

Phase: SHIP — Changelog + Commit + Deploy
Invoke: /dev:ship

/clear first → fresh context window
```

### Artifact: `.dev/handover/review-handover-complete.md`

Verification results, user decision, handover document path, Notion update status. This artifact IS the context bridge to SHIP.

**Must contain:**
- Summary of what was produced
- Caveats or warnings for SHIP phase
- Recommended focus areas for SHIP

**Tool:** `validate-stage-output handover review <feature-dir> --plugin backend`

---

## After Review: Validate MANIFEST

```bash
validate-manifest <feature-dir> --plugin backend
```

If FAIL: update MANIFEST before ending session.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| API contract doesn't match implementation | ALWAYS verify contract against actual code (routes, controllers, serializers) before generating handover |
| Missing error response documentation | Frontend needs EVERY error code and response shape — incomplete error docs cause frontend guesswork |
| Telling frontend HOW to build their side | Handover specifies WHAT the API provides, not HOW frontend should implement. Include the "What we don't care about" section |
| Skipping handover for "simple" features | If it has frontend work, it gets handover. Period. No exceptions |
| Using v1.x tool names or patterns | Use `validate-stage-entry` (NOT `validate-entry`), no `prompt-transitions/` directory, no `reports/validation-report.md` |
| Mixing User and Student auth in endpoint docs | Thoven has dual auth — document which system each endpoint uses. NEVER say "requires auth" without specifying User JWT or Student JWT |
| Orchestrator executing work inline | Execute stage MUST dispatch subagents. Orchestrator coordinates, never does the work |
| Skipping `/prompt-generator` in Architect | D04 is mandatory. If unavailable, follow the fallback protocol and log it |

---

## Rules (Non-Negotiable)

- HANDOVER is CONDITIONAL — only runs if `Cross-Stack: frontend` in MANIFEST or user requests it
- MANIFEST updated to `HANDOVER = complete` on acceptance
- Handover document lives at `docs/implementation/frontend/[feature]/FRONTEND_HANDOVER_PROMPT.md`
- AskUserQuestion for every question — one at a time, no batching
- Subagent dispatch in Execute — orchestrator never executes inline
- `/prompt-generator` in Architect — mandatory (D04)
- Notion updates: warn on failure, never block pipeline
- The `review-handover-complete.md` artifact is the context bridge to SHIP — no separate transition files
- ALWAYS distinguish User auth vs Student auth in endpoint documentation
- NEVER reference `prompt-transitions/`, `validate-entry`, or `reports/validation-report.md`
