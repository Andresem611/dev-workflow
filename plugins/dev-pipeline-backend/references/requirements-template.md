# Requirements Template — Backend

Template for `.dev/plan/requirements.md` — checkable requirements that define "done" for a backend feature.

## Table of Contents

1. [Template](#template)
2. [Guidelines](#guidelines)
3. [must_haves Block Format](#must_haves-block-format)
4. [Traceability](#traceability)
5. [Evolution](#evolution)
6. [Example: Booking Cancellation Endpoint](#example-booking-cancellation-endpoint)

---

## Template

```markdown
# Requirements: [Feature Name]

**Defined:** [date] | **Domain Tags:** [from INTAKE] | **Source:** DISCOVER review + PLAN Discuss

## v1 Requirements

### API Contract
- [ ] **API-01**: [METHOD /api/v1/resource returns status with expected shape]

### Data Model
- [ ] **DATA-01**: [Table/column definition with constraints]

### Authentication / Authorization
- [ ] **AUTH-01**: [Who can access, expected 401/403 behavior]

### Business Logic
- [ ] **BIZ-01**: [Service behavior, validation rule, state transition]

### Migration Safety
- [ ] **MIGR-01**: [Migration is reversible and runs on both helium and Neon]

### Performance
- [ ] **PERF-01**: [Index requirement, N+1 prevention, query plan expectation]

### Security
- [ ] **SEC-01**: [Input sanitization, authorization boundary, rate limiting]

### Background Jobs
- [ ] **JOB-01**: [Async processing requirement, idempotency, retry behavior]

## v2 Requirements (Deferred)
- **[CAT]-01**: [Requirement description]

## Out of Scope
| Feature | Reason |
|---------|--------|
| [Feature] | [Why excluded] |

## Traceability
| Requirement | Wave | Task(s) | Status |
|-------------|------|---------|--------|
| API-01 | W1 | T03 | Pending |

**Coverage:** v1: [X] total | Mapped: [Y] | Unmapped: [Z]
```

---

## Guidelines

**Where requirements come from:** (1) Domain tags from INTAKE (see `domain-agent-map.md`) determine which categories apply. A feature tagged `auth + api-design` needs AUTH and API categories; a pure migration may only need MIGR and DATA. (2) User answers from the Discuss stage surface constraints and edge cases. Do not use generic categories — match the feature's actual domains.

**Every requirement must be testable.** Either RSpec can assert it (preferred) or a manual check is defined. Example: `MIGR-01` — run `rails db:migrate:status` in both environments. If you cannot define verification, the requirement is too vague.

**must_haves and the verifier.** Requirements feed into wave file `must_haves` blocks. If a requirement is not in a must_haves block, the verifier will not check it.

**Rails-specific mandatory categories** — every backend feature MUST include:
- **Migration Safety** — reversibility, dual-DB (helium + Neon), lock duration, data vs schema separation
- **API Contract** — request/response shapes, status codes, error codes, auth type per endpoint

**Requirement ID format:** `[CATEGORY]-[NUMBER]`

| Tag | When to Include |
|-----|-----------------|
| `API` | Any new/modified endpoint |
| `DATA` | New tables, columns, associations |
| `AUTH` | Auth-gated endpoints, role checks |
| `BIZ` | Validations, state machines, service rules |
| `MIGR` | Any schema change |
| `PERF` | Queries on large tables, new indexes |
| `SEC` | Input handling, rate limiting, COPPA |
| `JOB` | Async work, scheduled tasks |

---

## must_haves Block Format

Wave files reference requirements via `must_haves`:

```yaml
must_haves:
  truths:
    - "API-01: GET /api/v1/bookings returns 200 with paginated JSON"
    - "AUTH-01: Unauthenticated requests return 401"
  artifacts:
    - "app/services/booking_cancellation_service.rb"
    - "spec/requests/api/v1/bookings_spec.rb — cancellation examples"
  key_links:
    - "route DELETE /api/v1/bookings/:id -> BookingsController#destroy"
    - "BookingsController#destroy -> BookingCancellationService"
```

- **truths**: API behaviors and data integrity rules. Map 1:1 to requirement IDs.
- **artifacts**: Models, controllers, services, specs that must exist.
- **key_links**: Controller-to-service, service-to-model, route-to-controller wiring.

---

## Traceability

Every v1 requirement maps to exactly one wave and one or more tasks. Unmapped requirements = incomplete plan. Run coverage check after PLAN:Execute. **Status values:** Pending, In Progress, Complete, Blocked.

---

## Evolution

**After each wave completes:** Mark requirements Complete. Add new requirements if implementation revealed constraints. Note scope changes with reason.

**After PLAN re-entry:** Verify existing requirements still valid. Add/move requirements as scope changes. Re-run traceability — no unmapped requirements allowed.

**Completion criteria:** Implementation committed + RSpec passes (or manual check documented) + verifier must_haves truths pass in BUILD:Review.

---

## Example: Booking Cancellation Endpoint

```markdown
# Requirements: Booking Cancellation Endpoint

**Defined:** 2026-03-12 | **Domain Tags:** api-design, database/models, auth, background-jobs

## v1 Requirements

### API Contract
- [ ] **API-01**: DELETE /api/v1/bookings/:id returns 200 with cancelled booking JSON
- [ ] **API-02**: DELETE /api/v1/bookings/:id returns 422 when booking is in the past
- [ ] **API-03**: DELETE /api/v1/bookings/:id returns 404 for nonexistent or archived booking

### Data Model
- [ ] **DATA-01**: bookings.cancelled_at is a nullable timestamp column
- [ ] **DATA-02**: bookings.cancellation_reason is a nullable string (max 500 chars)
- [ ] **DATA-03**: Cancelled bookings remain queryable (soft delete, not hard delete)

### Authentication / Authorization
- [ ] **AUTH-01**: Unauthenticated requests return 401 with standard error format
- [ ] **AUTH-02**: Parents can only cancel their own children's bookings
- [ ] **AUTH-03**: Teachers can cancel bookings assigned to them
- [ ] **AUTH-04**: Admins can cancel any booking

### Business Logic
- [ ] **BIZ-01**: Cancellation within 24h of lesson triggers late-cancel policy
- [ ] **BIZ-02**: Cancelling a recurring booking cancels only the single occurrence
- [ ] **BIZ-03**: Teacher availability slot is released after cancellation

### Migration Safety
- [ ] **MIGR-01**: Migration is reversible and runs on both helium and Neon
- [ ] **MIGR-02**: Adding columns to bookings uses safe ADD COLUMN (no table lock)

### Performance
- [ ] **PERF-01**: Index on bookings.cancelled_at for filtered queries
- [ ] **PERF-02**: Cancellation service uses single query for authorization check

### Security
- [ ] **SEC-01**: cancellation_reason is sanitized (strip HTML, enforce max length)

### Background Jobs
- [ ] **JOB-01**: Cancellation email sent via Solid Queue, not inline
- [ ] **JOB-02**: Teacher notification job is idempotent (safe to retry)

## v2 Requirements (Deferred)
- **NOTF-01**: In-app push notification to teacher on cancellation
- **ANLYT-01**: Cancellation event tracked in analytics materialized view

## Out of Scope
| Feature | Reason |
|---------|--------|
| Bulk cancellation | High complexity, defer to v2 |
| Refund processing | Handled by separate Stripe webhook flow |
| Cancellation by students | Students lack booking management access |

## Traceability
| Requirement | Wave | Task(s) | Status |
|-------------|------|---------|--------|
| DATA-01, DATA-02, MIGR-01, MIGR-02, PERF-01 | W1 | T01 | Pending |
| DATA-03 | W1 | T02 | Pending |
| BIZ-01, BIZ-02, PERF-02 | W2 | T03 | Pending |
| BIZ-03 | W2 | T04 | Pending |
| API-01..03, AUTH-01..04, SEC-01 | W3 | T05 | Pending |
| JOB-01, JOB-02 | W4 | T06 | Pending |

**Coverage:** v1: 20 total | Mapped: 20 | Unmapped: 0
```
