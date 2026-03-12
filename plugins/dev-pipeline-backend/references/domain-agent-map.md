# Domain-Agent Map v2.0 — Backend

Agent assignments by phase and domain for the backend dev pipeline.

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

## DISCOVER / PLAN Phase Agents

| Phase | Agents | Purpose |
|-------|--------|---------|
| DISCOVER | `rails-expert`, `master-backend-ai-rails`, `Explore` | Codebase research, schema analysis |
| PLAN | `rails-expert`, `security-engineer`, `postgres-pro` | Technical design, migration planning, security review |

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

## VALIDATE Phase Agents

| Agent | Use For |
|-------|---------|
| `qa-expert` | Test strategy review, QA runbook validation |
| `rails-expert` | Rails convention compliance, N+1 detection |
| `security-engineer` | Auth boundary testing, Brakeman scan, COPPA (domain: auth, security) |
| `performance-engineer` | N+1 query scan, index coverage (domain: performance) |
