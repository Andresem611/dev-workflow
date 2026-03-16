# Domain-Agent Map v3.0 — Backend

Agent assignments by phase and domain for the backend dev pipeline.

---

## INTAKE Phase Agents

| Task Type | Agent | Purpose |
|-----------|-------|---------|
| Codebase scan | `Explore` | Search for similar features, existing patterns |
| Pattern detection | `rails-expert` | Identify Rails conventions relevant to the feature |

---

## DISCOVER Phase Agents

| Task Type | Agent | Purpose |
|-----------|-------|---------|
| Codebase exploration | `Explore` (multiple, parallel) | Scan models, services, routes, tests separately |
| Schema analysis | `master-backend-ai-rails` | Database structure, existing tables, migration history |
| Architecture review | `architecture-reviewer` | Evaluate design approach against existing system |
| Pattern research | `rails-expert` | Find reusable patterns in existing codebase |

---

## PLAN Phase Agents

| Task Type | Agent | Purpose |
|-----------|-------|---------|
| Migration planning | `postgres-pro` | Index strategy, constraint design, zero-downtime |
| API contract design | `api-designer` | Endpoint design, response shapes, versioning |
| Architecture validation | `architecture-reviewer` | Validate decisions against system architecture |
| Security assessment | `security-engineer` | Auth boundaries, COPPA, threat model (if auth/payments domain) |
| Rails patterns | `rails-expert` | Service layer design, model associations |

---

## DOCUMENT Phase Agents

| Task Type | Agent | Purpose |
|-----------|-------|---------|
| Technical documentation | `technical-writer` or `documentation-engineer` | Master plan, API contract docs |
| Code examples | `rails-expert` | Usage examples, service call patterns |
| API contract docs | `api-designer` | Endpoint documentation with request/response shapes |

---

## BUILD Phase Agents

| Task Type | Agent | Skills |
|-----------|-------|--------|
| Models/migrations | `master-backend-ai-rails` | `/safe-migrate` |
| Controllers/routes | `rails-expert` | -- |
| Services | `rails-expert` or `backend-service-developer` | -- |
| Auth/security | `security-engineer` | `/security-review` |
| Background jobs | `rails-expert` | -- |
| Mailers | `rails-expert` | `/email` |
| API design | `api-designer` | -- |
| Tests (RSpec) | `rails-expert` or `test-automator` | -- |
| Complex bugs | `bug-hunter` | `/investigate` |
| Performance | `performance-engineer` | -- |

---

## VALIDATE Phase Agents

| Agent | Use For |
|-------|---------|
| `qa-expert` | Test strategy review, QA runbook validation |
| `rails-expert` | Rails convention compliance, N+1 detection |
| `security-engineer` | Auth boundary testing, Brakeman scan, COPPA (domain: auth, security) |
| `performance-engineer` | N+1 query scan, index coverage (domain: performance) |

---

## SHIP Phase Agents

| Task Type | Agent | Purpose |
|-----------|-------|---------|
| Pre-commit review | `code-reviewer` | Final code quality check |
| Secrets scan | `security-engineer` | Credential leak prevention |

---

## REVIEW Stage Agents (All Phases)

| Purpose | Agent |
|---------|-------|
| Code quality | `code-reviewer` |
| Architecture check | `architecture-reviewer` |
| Security (auth/payments) | `security-engineer` |

---

## Domain-Triggered Agents

When a task touches one of these domains, the listed agents are automatically suggested:

| Domain | Agents | Skills |
|--------|--------|--------|
| `auth` | `security-engineer`, `rails-expert` | `/security-review` |
| `database/models` | `master-backend-ai-rails`, `postgres-pro` | `/safe-migrate`, `/production-data-audit` |
| `payments` | `security-engineer`, `backend-service-developer` | `/security-review` |
| `students` | `security-engineer` (COPPA) | `/security-review` |
| `real-time` | `websocket-engineer` | -- |
| `email/mailers` | `rails-expert` | `/email` |
| `external-api` | `backend-service-developer` | `/security-review` |
| `performance` | `performance-engineer`, `database-optimizer` | -- |
| `background-jobs` | `rails-expert` | -- |
| `api-design` | `api-designer` | -- |

---

## Domain Combination Patterns

Common domain combinations and their implications:

| Combination | Extra Considerations |
|-------------|---------------------|
| `auth` + `students` | COPPA compliance required; dual auth system -- never mix User and Student models |
| `database/models` + `performance` | Index analysis, N+1 query prevention, production data audit before migration |
| `payments` + `external-api` | PCI compliance, webhook idempotency, retry logic with exponential backoff |
| `email/mailers` + `background-jobs` | All mailers must use Solid Queue; never send email synchronously in request cycle |
| `auth` + `api-design` | Token handling, rate limiting, proper 401/403 responses |
| `real-time` + `auth` | Action Cable authentication, channel authorization checks |

---

## Multi-Domain Resolution Rule

When a task touches multiple domains, dispatch ONE agent per domain in PARALLEL.
Synthesize outputs in Review stage.

Example: Task touches `auth` + `database/models`
- Dispatch `security-engineer` (auth concerns) in parallel with `master-backend-ai-rails` (schema concerns)
- Review synthesizes both outputs, flags conflicts

Example: Task touches `payments` + `external-api`
- Dispatch `security-engineer` (PCI compliance) in parallel with `backend-service-developer` (integration design)
- Review checks for conflicting recommendations before proceeding
