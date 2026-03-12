# Domain-Agent Map v2.0 — Frontend

Agent assignments by phase and domain for the frontend dev pipeline.

---

## BUILD Phase Agents

| Task Type | Agent | Notes |
|-----------|-------|-------|
| TypeScript types | `typescript-pro` | Type definitions, interfaces, generics |
| API layer | `frontend-developer` | Fetch hooks, API clients, error handling |
| State management | `react-specialist` | Zustand stores, React Query, context |
| UI components | `frontend-developer` or `react-specialist` | Simple = frontend-developer; complex interactive = react-specialist |
| Pages/routing | `frontend-developer` | Next.js pages, layouts, navigation |
| Animation/motion | `ui-designer` | Framer Motion, CSS transitions |
| Accessibility | `accessibility-tester` | ARIA, keyboard nav, screen reader |
| Design system | `ui-designer` + `frontend-developer` | Shared components, brand tokens |
| Tests | `test-automator` | Unit, integration, E2E |
| Complex bugs | `bug-hunter` + `/investigate` | Hypothesis-driven debugging |

---

## DISCOVER / PLAN / DESIGN Phase Agents

| Phase | Agents | Purpose |
|-------|--------|---------|
| DISCOVER | `ui-designer`, `Explore` | Research, competitive analysis, optional boardroom |
| PLAN | `architecture-reviewer`, `frontend-developer` | Technical design, dependency mapping |
| DESIGN | `ui-designer`, `Explore` | Component design, deduplication check |

---

## REVIEW Stage Agents (All Phases)

| Purpose | Agent |
|---------|-------|
| Code quality | `code-reviewer` |
| Architecture check | `architecture-reviewer` |
| Security (auth/payments) | `security-engineer` |

---

## Domain Tag Reference

The 12 frontend domain tags and their BUILD agent assignments:

| Domain | BUILD Agent(s) | VALIDATE Agent(s) | Phases Affected |
|--------|---------------|-------------------|-----------------|
| `routing` | `frontend-developer` | `code-reviewer` | PLAN, BUILD, VALIDATE |
| `state` | `react-specialist` | `code-reviewer`, `debug-specialist` | PLAN, BUILD, VALIDATE |
| `forms` | `frontend-developer` | `code-reviewer`, `debug-specialist` | PLAN, DESIGN, BUILD, VALIDATE |
| `animation` | `ui-designer` | `ui-designer` | DESIGN, BUILD, VALIDATE |
| `a11y` | `accessibility-tester` | `ui-designer`, `accessibility-tester` | DESIGN, BUILD, VALIDATE |
| `responsive` | `frontend-developer` | `frontend-developer`, `ui-designer` | DESIGN, BUILD, VALIDATE |
| `api-integration` | `frontend-developer` | `code-reviewer`, `debug-specialist` | PLAN, BUILD, VALIDATE |
| `auth-ui` | `frontend-developer` | `security-engineer`, `code-reviewer` | PLAN, BUILD, VALIDATE |
| `design-system` | `ui-designer` + `frontend-developer` | `ui-designer` | DESIGN, BUILD, VALIDATE |
| `performance` | `frontend-developer` | `performance-analyzer` | BUILD, VALIDATE |
| `seo` | `frontend-developer` | `seo-specialist` | PLAN, BUILD, VALIDATE |
| `analytics` | `frontend-developer` | `code-reviewer` | BUILD, VALIDATE |

---

## Domain Combination Patterns

Common domain combinations and their implications:

| Combination | Extra Considerations |
|-------------|---------------------|
| `routing` + `auth-ui` | Route guards must match auth system; test both authenticated and unauthenticated access |
| `forms` + `api-integration` | Form submission error handling must display API error messages; optimistic updates need rollback |
| `design-system` + `responsive` | 3D buttons must work on touch; mobile layouts must maintain brand consistency |
| `a11y` + `animation` | All animations must respect prefers-reduced-motion; focus must not be lost during transitions |
| `seo` + `performance` | Marketing pages need both fast LCP and proper metadata; image optimization critical |
| `state` + `api-integration` | Loading/error/empty states for all async data; cache invalidation strategy needed |
| `analytics` + `auth-ui` | Track auth events (login, signup, logout); identify calls on auth state change |

---

## VALIDATE Phase Agents

| Agent | Use For |
|-------|---------|
| `qa-expert` | Test strategy review, QA runbook validation |
| `code-reviewer` | Code quality review, pattern compliance |
| `accessibility-tester` | WCAG compliance audit (domain: a11y) |
| `performance-engineer` | Lighthouse, bundle size, LCP/FID/CLS (domain: performance) |
| `security-engineer` | Auth UI review, XSS scan (domain: auth-ui) |
