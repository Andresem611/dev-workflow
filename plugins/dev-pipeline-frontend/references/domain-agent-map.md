# Domain-Agent Map v3.0 — Frontend

Agent assignments by phase and domain for the frontend dev pipeline.

---

## INTAKE Phase Agents

| Task Type | Agent | Purpose |
|-----------|-------|---------|
| Codebase scan | `Explore` | Search for similar components, existing patterns, shared utilities |
| Pattern detection | `frontend-developer` | Identify Next.js/React conventions relevant to the feature |

---

## DISCOVER Phase Agents

| Task Type | Agent | Purpose |
|-----------|-------|---------|
| Codebase exploration | `Explore` (multiple, parallel) | Scan components, pages, hooks, stores, API layer separately |
| Design system audit | `ui-designer` | Existing components, tokens, brand consistency |
| Architecture review | `architecture-reviewer` | Evaluate approach against existing frontend architecture |
| UX research | `ux-researcher` | User insights, usability considerations, interaction patterns |
| Performance baseline | `performance-analyzer` | Current bundle size, Core Web Vitals, Lighthouse scores |

---

## PLAN Phase Agents

| Task Type | Agent | Purpose |
|-----------|-------|---------|
| Component architecture | `architecture-reviewer` | Component hierarchy, data flow, state boundaries |
| API integration design | `frontend-developer` | Endpoint consumption, error handling, loading states |
| Security assessment | `security-engineer` | Auth UI boundaries, COPPA/PCI compliance (if auth/payments domain) |
| SEO strategy | `seo-specialist` | Metadata, structured data, rendering strategy (if SEO domain) |
| Accessibility planning | `frontend-developer` | WCAG requirements, keyboard nav, screen reader support |
| Performance budget | `performance-analyzer` | Bundle impact, lazy loading strategy, image optimization |

---

## DESIGN Phase Agents

| Task Type | Agent | Purpose |
|-----------|-------|---------|
| Visual design | `ui-designer` | Component design, layout, spacing, brand compliance |
| Component deduplication | `Explore` | Check for existing similar components to extend or reuse |
| Interaction design | `ui-designer` | Animations, transitions, micro-interactions |
| Responsive layouts | `ui-designer` + `frontend-developer` | Breakpoint strategy, mobile-first patterns |
| Accessibility design | `frontend-developer` | ARIA patterns, focus management, reduced-motion support |

---

## DOCUMENT Phase Agents

| Task Type | Agent | Purpose |
|-----------|-------|---------|
| Technical documentation | `technical-writer` | Master plan, component API docs |
| Component usage examples | `frontend-developer` | Props, variants, composition patterns |
| Design specs | `ui-designer` | Design tokens, spacing rules, animation values |

---

## BUILD Phase Agents

| Task Type | Agent | Notes |
|-----------|-------|-------|
| TypeScript types | `frontend-developer` | Type definitions, interfaces, generics |
| API layer | `frontend-developer` | Fetch hooks, API clients, error handling |
| State management | `frontend-developer` | Zustand stores, React Query, context |
| UI components | `frontend-developer` or `ui-designer` | Simple = frontend-developer; design-heavy = ui-designer |
| Pages/routing | `frontend-developer` | Next.js pages, layouts, navigation |
| Animation/motion | `ui-designer` | Framer Motion, CSS transitions |
| Accessibility | `frontend-developer` | ARIA, keyboard nav, screen reader |
| Design system | `ui-designer` + `frontend-developer` | Shared components, design tokens |
| Tests | `frontend-developer` | Unit, integration, E2E |
| Complex bugs | `frontend-developer` | Hypothesis-driven debugging |

---

## VALIDATE Phase Agents

| Agent | Use For |
|-------|---------|
| `code-reviewer` | Code quality review, pattern compliance |
| `security-engineer` | Auth UI review, XSS scan (domain: auth-ui) |
| `performance-analyzer` | Lighthouse, bundle size, LCP/FID/CLS (domain: performance) |
| `seo-specialist` | Metadata audit, structured data validation (domain: seo) |
| `ui-designer` | Design system compliance, visual regression (domain: design-system) |
| `frontend-developer` | Accessibility audit, WCAG compliance (domain: a11y) |

---

## SHIP Phase Agents

| Task Type | Agent | Purpose |
|-----------|-------|---------|
| Pre-commit review | `code-reviewer` | Final code quality check |
| Secrets scan | `security-engineer` | Credential leak prevention, env var audit |

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

| Domain | Agents | Phases Affected |
|--------|--------|-----------------|
| `routing` | `frontend-developer` | PLAN, BUILD, VALIDATE |
| `state` | `frontend-developer` | PLAN, BUILD, VALIDATE |
| `forms` | `frontend-developer` | PLAN, DESIGN, BUILD, VALIDATE |
| `animation` | `ui-designer` | DESIGN, BUILD, VALIDATE |
| `a11y` | `frontend-developer`, `ui-designer` | DESIGN, BUILD, VALIDATE |
| `responsive` | `frontend-developer`, `ui-designer` | DESIGN, BUILD, VALIDATE |
| `api-integration` | `frontend-developer` | PLAN, BUILD, VALIDATE |
| `auth-ui` | `frontend-developer`, `security-engineer` | PLAN, BUILD, VALIDATE |
| `design-system` | `ui-designer` + `frontend-developer` | DESIGN, BUILD, VALIDATE |
| `performance` | `performance-analyzer` | BUILD, VALIDATE |
| `seo` | `seo-specialist`, `frontend-developer` | PLAN, BUILD, VALIDATE |
| `analytics` | `frontend-developer` | BUILD, VALIDATE |

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

## Multi-Domain Resolution Rule

When a task touches multiple domains, dispatch ONE agent per domain in PARALLEL.
Synthesize outputs in Review stage.

Example: Task touches `auth-ui` + `forms`
- Dispatch `security-engineer` (auth boundary concerns) in parallel with `frontend-developer` (form validation/submission)
- Review synthesizes both outputs, flags conflicts

Example: Task touches `design-system` + `a11y` + `animation`
- Dispatch `ui-designer` (design tokens, animation specs) in parallel with `frontend-developer` (WCAG compliance, reduced-motion)
- Review checks for conflicting recommendations before proceeding
