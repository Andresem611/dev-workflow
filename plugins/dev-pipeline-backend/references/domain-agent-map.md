# Domain-Agent Map v4.0 — Backend

Agent assignments by phase and domain for the backend dev pipeline.
Updated 2026-03-18: Aligned with subagent ecosystem cleanup (117 → 32 agents).

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
| API endpoint design | `rails-expert` | Endpoint design, response shapes, versioning |
| Architecture validation | `architecture-reviewer` | Validate decisions against system architecture |
| Security assessment | `security-engineer` | Auth boundaries, COPPA, threat model (if auth/payments domain) |
| Rails patterns | `rails-expert` | Service layer design, model associations |
| Workflow mapping | `workflow-architect` | Failure modes, handoff contracts, cleanup inventories |

---

## DOCUMENT Phase Agents

| Task Type | Agent | Purpose |
|-----------|-------|---------|
| Technical documentation | `rails-expert` | Master plan, code examples, service call patterns |
| API documentation | `api-documenter` | OpenAPI specs, endpoint documentation |

---

## BUILD Phase Agents

| Task Type | Agent | Skills |
|-----------|-------|--------|
| Models/migrations | `master-backend-ai-rails` | `/safe-migrate` |
| Controllers/routes | `rails-expert` | -- |
| Services | `rails-expert` | -- |
| Auth/security | `security-engineer` | `/security-review` |
| Background jobs | `rails-expert` | -- |
| Mailers | `rails-expert` | `/email` |
| Tests (RSpec) | `rails-expert` | -- |
| Complex bugs | `bug-hunter` | `/investigate` |
| Performance | `master-backend-ai-rails` | -- |

---

## VALIDATE Phase Agents

| Agent | Use For |
|-------|---------|
| `rails-expert` | Rails convention compliance, N+1 detection, test verification |
| `security-engineer` | Auth boundary testing, Brakeman scan, COPPA (domain: auth, security) |
| `master-backend-ai-rails` | N+1 query scan, index coverage (domain: performance) |

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
| `payments` | `security-engineer`, `rails-expert` | `/security-review` |
| `students` | `security-engineer` (COPPA), `legal-compliance-checker` | `/security-review` |
| `real-time` | `websocket-engineer` | -- |
| `email/mailers` | `rails-expert` | `/email` |
| `external-api` | `security-engineer`, `rails-expert` | `/security-review` |
| `performance` | `master-backend-ai-rails`, `postgres-pro` | -- |
| `background-jobs` | `rails-expert` | -- |
| `api-design` | `rails-expert`, `api-documenter` | -- |
| `workflows` | `workflow-architect` | -- |

---

## Verification Agents

Independent verification agents dispatched during BUILD:Review and VALIDATE:Execute. These agents receive must_haves and requirements only — no build context.

### BUILD:Review (Per Wave)

| Layer | Agent | Purpose |
|-------|-------|---------|
| Mechanical gate | `dev-pipeline-tools.js verify-must-haves` | File existence, route matching, spec non-empty, anti-stub scan |
| Semantic check | `rails-expert` | Independent must_haves verification against actual code |

### VALIDATE:Execute (Comprehensive)

| Agent | Purpose |
|-------|---------|
| `rails-expert` (primary) | Independent verification of ALL requirements.md + ALL must_haves — clean context, no build history |
| `security-engineer` (domain) | Auth, COPPA, payment security (domain-triggered) |
| `master-backend-ai-rails` (domain) | Query plans, index coverage (domain-triggered) |

The independent `rails-expert` verifier runs BEFORE domain-specific agents. Its Requirements Coverage table is the primary source of truth for the Review verdict.

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
- Dispatch `security-engineer` (PCI compliance) in parallel with `rails-expert` (integration design)
- Review checks for conflicting recommendations before proceeding
