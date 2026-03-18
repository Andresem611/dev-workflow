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
| Architecture review | `code-reviewer` | Evaluate approach against existing frontend architecture |
| UX research | `ux-researcher` | User insights, usability considerations, interaction patterns |
| Performance baseline | `performance-analyzer` | Current bundle size, Core Web Vitals, Lighthouse scores |

---

## PLAN Phase Agents

| Task Type | Agent | Purpose |
|-----------|-------|---------|
| Component architecture | `code-reviewer` | Component hierarchy, data flow, state boundaries |
| API integration design | `api-designer` | Endpoint contract review, REST patterns, error response design |
| API implementation plan | `frontend-developer` | `lib/*-api.ts` structure, fetch patterns, loading states |
| Routing architecture | `next-js-developer` | App Router structure, layout nesting, middleware, RSC boundaries |
| Security assessment | `security-engineer` | Auth UI boundaries, COPPA/PCI compliance (if auth/payments domain) |
| SEO strategy | `seo-specialist` | Metadata, structured data, rendering strategy (if SEO domain) |
| Accessibility planning | `accessibility-tester` | WCAG requirements, keyboard nav, screen reader support |
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

Agent selection follows a 3-tier priority: (1) task-level `agent:` hint, (2) keyword match from routing table, (3) domain default.

| Task Type | Agent | Notes |
|-----------|-------|-------|
| TypeScript types/interfaces | `typescript-pro` | Type definitions, generics, discriminated unions, branded types |
| API layer design | `api-designer` | Endpoint contract review, response shapes, error formats |
| API layer implementation | `frontend-developer` | `lib/*-api.ts` fetch wrappers, error handling, auth headers |
| State management | `react-specialist` | Context optimization, hooks patterns, re-render prevention |
| UI components | `frontend-developer` or `ui-designer` | Simple = frontend-developer; design-heavy = ui-designer |
| Pages/routing | `next-js-developer` | Next.js pages, layouts, middleware, SSR/RSC, generateMetadata |
| React optimization | `react-specialist` | React.memo, useMemo, useCallback, Suspense, useTransition |
| Animation/motion | `ui-designer` | Framer Motion, CSS transitions |
| Accessibility impl | `accessibility-tester` | ARIA attributes, keyboard nav, screen reader, focus management |
| Design system | `ui-designer` + `frontend-developer` | Shared components, design tokens |
| Tests | `frontend-developer` | Unit, integration, E2E |
| Complex bugs | `debug-specialist` | Hypothesis-driven debugging |
| General UI work | `frontend-developer` | Default for styling, layout, forms, general components |

### Task-Level Agent Hints

Wave task files can include an `agent:` field to override the default routing:

```markdown
## Task: Create teacher availability page
agent: next-js-developer
domain: routing
```

When present, the `agent:` hint takes priority over keyword matching and domain defaults. The DOCUMENT phase auto-assigns hints based on the keyword routing table above.

---

## VALIDATE Phase Agents

| Agent | Use For |
|-------|---------|
| `code-reviewer` | Code quality review, pattern compliance (always runs) |
| `typescript-pro` | Type safety audit, strict mode compliance, type coverage (always runs) |
| `security-engineer` | Auth UI review, XSS scan (domain: auth-ui) |
| `performance-analyzer` | Lighthouse, bundle size, LCP/FID/CLS (domain: performance) |
| `seo-specialist` | Metadata audit, structured data validation (domain: seo) |
| `ui-designer` | Design system compliance, visual regression (domain: design-system) |
| `accessibility-tester` | WCAG 2.1 AA audit, screen reader, keyboard nav (domain: a11y) |
| `next-js-developer` | RSC boundary check, SSR correctness, App Router patterns (domain: routing) |

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
| Architecture check | `code-reviewer` |
| Security (auth/payments) | `security-engineer` |

---

## Domain-Triggered Agents

When a task touches one of these domains, the listed agents are automatically suggested:

| Domain | BUILD Agents | VALIDATE Agents | Phases Affected |
|--------|-------------|-----------------|-----------------|
| `routing` | `next-js-developer`, `frontend-developer` | `next-js-developer`, `code-reviewer` | PLAN, BUILD, VALIDATE |
| `state` | `react-specialist`, `frontend-developer` | `code-reviewer`, `debug-specialist` | PLAN, BUILD, VALIDATE |
| `forms` | `frontend-developer` | `code-reviewer`, `debug-specialist` | PLAN, DESIGN, BUILD, VALIDATE |
| `animation` | `ui-designer` | `ui-designer` | DESIGN, BUILD, VALIDATE |
| `a11y` | `accessibility-tester`, `frontend-developer` | `accessibility-tester`, `ui-designer` | DESIGN, BUILD, VALIDATE |
| `responsive` | `frontend-developer`, `ui-designer` | `frontend-developer`, `ui-designer` | DESIGN, BUILD, VALIDATE |
| `api-integration` | `api-designer`, `frontend-developer` | `code-reviewer`, `api-designer` | PLAN, BUILD, VALIDATE |
| `auth-ui` | `frontend-developer`, `security-engineer` | `security-engineer`, `code-reviewer` | PLAN, BUILD, VALIDATE |
| `design-system` | `ui-designer`, `frontend-developer` | `ui-designer` | DESIGN, BUILD, VALIDATE |
| `performance` | `react-specialist`, `performance-analyzer` | `performance-analyzer` | BUILD, VALIDATE |
| `seo` | `seo-specialist`, `frontend-developer` | `seo-specialist` | PLAN, BUILD, VALIDATE |
| `analytics` | `frontend-developer` | `code-reviewer` | BUILD, VALIDATE |

**Note**: `typescript-pro` runs as a universal VALIDATE agent across ALL domains (type safety audit). `code-reviewer` runs as universal primary verifier.

---

## Verification Agents

Independent verification agents dispatched during BUILD:Review and VALIDATE:Execute. These agents receive must_haves and requirements only — no build context.

### BUILD:Review (Per Wave)

| Layer | Agent | Purpose |
|-------|-------|---------|
| Mechanical gate | `dev-pipeline-tools.js verify-must-haves` | File existence, import resolution, anti-stub scan |
| Semantic check | `code-reviewer` | Independent must_haves verification against actual code |

### VALIDATE:Execute (Comprehensive)

**Universal agents** (always run):

| Agent | Purpose |
|-------|---------|
| `code-reviewer` (primary) | Independent verification of ALL requirements.md + ALL must_haves — clean context, no build history |
| `typescript-pro` (universal) | Type safety audit — strict mode compliance, type coverage, no `any` leaks |

**Domain-triggered agents** (run when domain tag present):

| Agent | Triggered By Domain |
|-------|-------------------|
| `security-engineer` | `auth-ui` — Auth boundaries, XSS scan |
| `performance-analyzer` | `performance` — Lighthouse, bundle size, CWV |
| `seo-specialist` | `seo` — Metadata audit, structured data |
| `ui-designer` | `design-system` — Design compliance, visual regression |
| `accessibility-tester` | `a11y` — WCAG 2.1 AA audit, screen reader, keyboard |
| `next-js-developer` | `routing` — RSC boundaries, SSR correctness, App Router patterns |
| `api-designer` | `api-integration` — API contract compliance, error format consistency |

The independent `code-reviewer` + `typescript-pro` verifiers run BEFORE domain-specific agents. The code-reviewer Requirements Coverage table is the primary source of truth for the Review verdict.

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
- BUILD: Dispatch `security-engineer` (auth boundary concerns) in parallel with `frontend-developer` (form validation/submission)
- VALIDATE: `security-engineer` + `code-reviewer` + `typescript-pro`

Example: Task touches `routing` + `api-integration`
- BUILD: Dispatch `next-js-developer` (page/layout structure) in parallel with `api-designer` (endpoint contract)
- VALIDATE: `next-js-developer` + `api-designer` + `code-reviewer` + `typescript-pro`

Example: Task touches `design-system` + `a11y` + `animation`
- BUILD: Dispatch `ui-designer` (design tokens, animation specs) in parallel with `accessibility-tester` (WCAG compliance, reduced-motion)
- VALIDATE: `ui-designer` + `accessibility-tester` + `code-reviewer` + `typescript-pro`
