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

**Round-trip detection (MANDATORY for FE-initiated features):**

Check MANIFEST at runtime for the `Cross-Stack: frontend` tag (same check used in VALIDATE §4.7 routing):

```bash
grep -F "Cross-Stack: frontend" <feature-dir>/.dev/MANIFEST.md
```

If this is a round-trip handover (exit 0, exact match), perform this additional read before proceeding:

1. **Read `<BE-feature>/.dev/be-contract-decisions.md`** — the PLAN-time contract rows. Extract all rows and the initial `CONTRACT-LANDED` marker.
   - If file **does not exist**: emit warning to chat and set `round_trip_ledger = unavailable`:
     ```
     ⚠️ be-contract-decisions.md not found — this feature predates the shared ledger (5.3.0).
     Skipping ledger reconciliation. Will still produce prose handover + manual FE prompt.
     ```
   - If file exists: set `round_trip_ledger = available`, note current row count and highest SD-NN ID.

2. **Check VALIDATE runtime API evidence in `review-ship-readiness.md`** for the "Runtime API Verification" section.
   - If server was unavailable (flag: "skipping runtime API verification"): set `runtime_evidence = unavailable`.
   - If runtime verification ran: set `runtime_evidence = available`.

Record these flags in the Discuss artifact. They determine behavior in Stage 3 and Stage 4.

### WHAT Questions (AskUserQuestion, one at a time)

- What is the absolute path to the FE feature directory? (e.g., `/Users/andresmartinez/thoven/frontend/docs/[Feature]`) — **required for the FE Reconciliation Prompt; save as `discuss.feFeatureDir`**
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

#### 3f. Contract Delta Computation (CONDITIONAL — round-trip features only)

Runs when `round_trip_ledger = available` from Discuss. Runs **after** 3a/3b/3c/3d — requires 3a's mismatch report, 3c's auth table, and 3d's error catalog as inputs. The `technical-writer` (3d) produces the prose handover doc independently; 3f produces the structured delta artifact used only in Stage 4 Accept.

**Agent:** `api-designer`

**Task:** Compare PLAN-time contract rows in `be-contract-decisions.md` against the ship-time reality from:
- VALIDATE's `review-ship-readiness.md` (endpoint-by-endpoint runtime evidence)
- 3a api-designer mismatch report (structural contract diff)

For each row in `be-contract-decisions.md` with `Scope = contract` and `Status = ACTIVE`:

| Check | Input source |
|-------|-------------|
| Endpoint still exists | 3a mismatch report + VALIDATE `review-ship-readiness.md` routes evidence |
| Response shape unchanged | 3a serializer output vs row's `Decision` value |
| Auth type unchanged | 3c auth table vs row |
| Error codes unchanged | 3d error catalog (from `FRONTEND_HANDOVER_PROMPT.md` Error Catalog section) vs row |
| Status codes unchanged | 3a status code table vs row |

**Output:** A delta report with three lists:
1. **Unchanged rows** — PLAN-promised matches ship-time (no action needed)
2. **Drifted rows** — one entry per drifted row:
   - Original row ID (e.g., `SD-03`)
   - What changed (e.g., "response shape: added `student_count` field")
   - Proposed new ACTIVE row content (ID, Decision, Scope=contract, Status=ACTIVE, Changed By=BE, Date=today, Reason)
   - Whether the drift is **shape-affecting** (changes FE component data needs) vs **additive/non-breaking**
3. **New contract facts** (endpoints/behaviors that exist in the build but had no PLAN-time row)

If `runtime_evidence = unavailable`: output all rows as "delta unknown — runtime verification skipped." Do not mark any row as drifted or unchanged.

**Output stored in:** `.dev/handover/execute-contract-delta.md`

### Failure Handling

If a subagent fails: log the failure, continue with remaining agents, surface all failures in Review.

### Artifact: `.dev/handover/execute-handover-results.md`

Results from all dispatched subagents, mismatch report, generated document path, and (if round-trip) path to `execute-contract-delta.md`.

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

2. **Ledger reconciliation (round-trip features only — MANDATORY before Notion update):**

   **Only runs when `round_trip_ledger = available` (from Discuss). Skip entirely if `round_trip_ledger = unavailable`.**

   Read `execute-contract-delta.md` produced in Stage 3f.

   **a. Write superseded + new ACTIVE rows to `be-contract-decisions.md`:**

   For each drifted row in the delta report:
   - Start with the original row ID from the delta report (e.g., `SD-03`).
   - **Traverse the supersession chain** to find the current ACTIVE row:
     - Track visited IDs in a set (cycle detection).
     - If the row has `Status = SUPERSEDED`: follow `Superseded By` to the next ID and repeat.
     - Stop when `Status != SUPERSEDED` — this is the current ACTIVE row to supersede.
     - If the chain exceeds 20 hops, or a referenced ID does not exist in the file, or a cycle is detected: log a clear error ("Supersession chain broken at ID [X] — skipping this delta entry") and skip that entry rather than writing inconsistent rows. Surface all skipped entries in the review artifact.
   - Flip the located ACTIVE row's `Status` → `SUPERSEDED`, set `Superseded By` → next monotonic SD-NN.
   - Append a new ACTIVE row using the proposed content from the delta report.

   **If `runtime_evidence = unavailable`:** Structural-only adds are still safe to write. For rows where 3a's mismatch report detected a **new endpoint** (not present in PLAN-time rows), append those as new ACTIVE rows. Do NOT supersede any existing rows (cannot confirm drift without runtime evidence). All existing rows stay ACTIVE.

   For each new contract fact (no prior row): append as a new ACTIVE row directly.

   For unchanged rows: leave untouched.

   Format per `${PLUGIN_ROOT}/../shared/references/shared-decision-ledger-template.md` row format:
   ```
   | SD-NN | [Decision] | contract | ACTIVE | — | BE | <today ISO> | [Reason from delta] |
   ```

   **b. Re-stamp the `CONTRACT-LANDED` marker:**

   Append a new `CONTRACT-LANDED` row to the `## CONTRACT-LANDED` table in `be-contract-decisions.md`:
   ```
   | CONTRACT-LANDED | <today ISO> | BE | <BE-feature>/.dev/validate/review-ship-readiness.md | Delta: N rows superseded (ship-time) |
   ```
   Where N = count of drifted rows. If zero drift: "Delta: 0 rows — contract unchanged from PLAN."
   If `runtime_evidence = unavailable`: "Delta: UNKNOWN — runtime verification was skipped."

   The original PLAN-time marker row stays as history (append-only).

   **c. Run `ledger-validate`:**
   ```bash
   node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js ledger-validate <feature-dir> --plugin backend
   ```
   If FAIL: surface errors to user before continuing. Do not block — warn and document in the review artifact.

3. **Notion Update:** Move card to "Frontend Dev". Reference `references/notion-integration.md` for property names and MCP tool patterns.

   **If Notion MCP tools are unavailable or the update fails, warn but do NOT block the pipeline.**

   - Read the Notion card page ID from MANIFEST's `## Notion Integration > Card ID`
   - Update Dev Tracker card using `mcp__plugin_Notion_notion__notion-update-page`:
     - Page ID: card ID from MANIFEST
     - Properties: Status = `Frontend Dev`, Last Updated = today's ISO date, Notes = append "Handover complete — frontend can begin implementation"
   - Display: `📋 Notion: Moved — "[Feature Name]" → Frontend Dev`
   - If Card ID is empty: warn "No Notion card ID in MANIFEST — skipping Notion update" and continue

4. **Emit FE Reconciliation Prompt to chat (MANDATORY — always print, even if zero drift):**

   Populate the template below from the delta report and feature context. Print it as a visible chat message (not just an artifact) so it is immediately copy-pasteable.

   ```
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ▶ FE Reconciliation Required

   Backend handover complete for: [Feature Name]
   FE feature dir: [absolute path to FE feature dir from Discuss context]

   Contract delta — [N rows superseded / No drift]:
     [SD-NN] [one-line summary of what changed]
     (repeat for each drifted row)
     — or —
     No drift — contract delivered exactly as planned.

   Affected FE artifacts to re-review:
     • ALWAYS: .dev/plan/review-plan-approval.md
       (check locked decisions against the delta above)
     [IF any delta row is shape-affecting:]
     • DESIGN_SPEC sections: [list affected sections by name]

   [IF round_trip_ledger = unavailable:]
     ⚠️ LEDGER UNAVAILABLE (pre-5.3.0 feature). Manually compare
     .dev/plan/ artifacts with FRONTEND_HANDOVER_PROMPT.md before swapping mocks.

   [IF runtime_evidence = unavailable:]
     ⚠️ VALIDATE runtime verification was skipped (server unavailable).
     Treat all contract rows as unverified. Verify endpoints manually.

   Resume command (run from inside the FE worktree):
     /dev

   The /dev resume protocol will:
     1. Read be-contract-decisions.md and transcribe delta rows
     2. Surface SUPERSEDED decisions with reasons
     3. Prompt you to re-review PLAN before continuing

   When reconciled: continue from PLAN → DOCUMENT, or resume BUILD
   if no architecture changes are required.
   ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ```

5. **Display Next Up:**

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
| Writing ledger rows before Accept | Ledger writes happen ONLY on Accept — not in Execute, not on Retry |
| Skipping FE prompt because delta is zero | Always emit the FE Reconciliation Prompt, even for zero-drift. FE still needs to know it can swap mocks |
| Writing to the FE-owned canonical ledger | BE NEVER writes `<FE-feature>/.dev/shared-decision-ledger.md` — write to `be-contract-decisions.md` only |
| Silently claiming no drift when runtime evidence is missing | If VALIDATE skipped runtime verification, delta is UNKNOWN — say so in the FE prompt |

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
- **Ledger writes ONLY on Accept.** Back to Architect / Back to Discuss / Retry Execute = no writes to `be-contract-decisions.md`. The ledger is never partially written.
- **Idempotence on retry:** Re-running HANDOVER after a prior Accept re-computes the delta from the current VALIDATE evidence. On the next Accept, prior delta rows (already written as ACTIVE) are superseded again with a fresh supersession chain. Never double-write a row that is already ACTIVE for the same change.
- **BE never writes the FE-owned canonical ledger.** All writes stay in `<BE-feature>/.dev/be-contract-decisions.md`. The FE transcribes on `/dev` resume.
- **FE Reconciliation Prompt is always emitted on Accept** — even when delta is zero. Never silently skip it.
