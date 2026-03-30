# Backend Contract Stub Template

## Purpose

When the frontend DESIGN phase discovers that backend API endpoints don't exist yet, it produces a contract stub. This stub documents what the frontend needs from the backend — response shapes, auth requirements, error expectations — without dictating HOW the backend should implement it.

The stub feeds into the backend `/dev:intake` as a "frontend handoff" entry mode.

## When to Produce

Produced during DESIGN Review's "Backend Requirements Check" section, when any endpoint in the interaction table has status = MISSING.

## File Location

```
docs/[Feature_Name]/.dev/design/backend-contract-stub.md
```

## Template

```markdown
# Backend Contract Stub: [Feature Name]

**Produced by:** frontend /dev:design
**Date:** [YYYY-MM-DD]
**Status:** STUB (awaiting backend confirmation)
**Frontend feature:** [link to MANIFEST]

---

## How to Use This Stub

This document describes what the frontend UI needs from the backend. It is:
- **Requirements**, not architecture. Backend decides schema, indexes, serializers.
- **Suggested shapes**, not demands. If a shape needs to change, update this stub and hand back via /dev:handover.
- **Consumable by backend /dev:intake** as "frontend handoff" entry mode.

To start backend work: run `/dev` in the backend repo and paste this stub when asked "What are you building?"

---

## Endpoints Needed

### 1. [Endpoint Name]

- **Method:** GET | POST | PATCH | PUT | DELETE
- **Suggested URL:** /api/v1/[resource]
- **Auth:** [User JWT (token) | Student JWT (student_token) | Public]
- **Auth role:** [admin | teacher | parent | student | any authenticated]

**Frontend sends:**

    {
      "field": "type (description)"
    }

Or: URL params only (e.g., `:id` in path)

**Frontend expects back:**

    {
      "resource": {
        "id": "number",
        "field": "type",
        "nested": {
          "field": "type"
        }
      }
    }

**Error expectations:**
- `404` — Resource not found (`{ "error": "Not found" }`)
- `403` — Unauthorized access
- `422` — Validation errors (`{ "errors": { "field": ["message"] } }`)

**UI context:** [Brief description of where/how the frontend uses this data. Helps backend understand priority and what fields matter most.]

---

### 2. [Next Endpoint]

[Same format as above]

---

## Real-Time Needs (if applicable)

| Channel | Subscription Params | Events | Payload Shape |
|---------|-------------------|--------|---------------|
| [name] | `{ param: value }` | [event_name] | `{ field: type }` |

If no real-time needs: "None — polling or on-demand fetch only."

## Pagination (if applicable)

For list endpoints:
- **Preferred format:** offset-based (`page` + `per_page`) or cursor-based
- **Default page size:** [number]
- **Frontend expects:** `{ data: [...], meta: { total: N, page: N, per_page: N } }`

## Notes for Backend

- Response shapes above are what the frontend UI is designed around. If the shape needs to differ significantly, please update this stub and hand back via `/dev:handover` so we can adjust the UI.
- Auth context: Thoven uses dual JWT auth — `token` in localStorage for Parents/Teachers, `student_token` for Students. Each endpoint should specify which.
- Error format: Frontend error handling expects `{ error: "message" }` for single errors and `{ errors: { field: ["messages"] } }` for validation errors.
```

## Principles

1. **Requirements only.** Never suggest database tables, columns, indexes, model relationships, or service architecture. The backend pipeline makes those decisions.

2. **Shapes are requests.** Every JSON shape is labeled "Frontend expects" — not "Backend must return." If the backend has a good reason to differ, that's fine — just communicate it back.

3. **Auth is specific.** Never say "requires authentication." Always specify: User JWT or Student JWT, and which role.

4. **Context helps.** The "UI context" field explains WHY the frontend needs this data. This helps the backend prioritize fields and understand which parts of the response are critical vs nice-to-have.

5. **Errors matter.** Frontend error handling is designed around specific status codes and JSON shapes. Specifying error expectations avoids the frontend guessing.

## After the Stub

The stub enters one of three flows (chosen by the user during DESIGN Review):

| Option | Flow |
|--------|------|
| **Proceed with mocks** | Frontend PLAN uses the stub shapes as typed mock data. BUILD creates mock API modules. Swap for real API when backend delivers. |
| **Pause + handoff** | Frontend pauses at DESIGN. Stub is handed to backend /dev:intake. Frontend resumes after backend /dev:handover delivers confirmed contract. |
| **Both in parallel** | Frontend proceeds with mocks AND backend starts building. Contract confirmed when backend catches up. |
