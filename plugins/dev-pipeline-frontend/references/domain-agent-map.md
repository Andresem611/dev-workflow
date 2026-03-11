# Domain-Agent Map

Complete mapping of the 12 domain tags to agents, phase effects, and validation triggers. Set during INTAKE, referenced throughout BUILD and VALIDATE.

---

## Domain Overview

| Domain | Phases Affected | BUILD Agents | VALIDATE Agents | VALIDATE Checks |
|--------|----------------|--------------|-----------------|-----------------|
| `routing` | PLAN, BUILD, VALIDATE | frontend-developer | code-reviewer | Route testing, guard verification |
| `state` | PLAN, BUILD, VALIDATE | frontend-developer | debug-specialist, code-reviewer | State flow verification, race conditions |
| `forms` | PLAN, DESIGN, BUILD, VALIDATE | frontend-developer | code-reviewer, debug-specialist | Form edge cases, validation rules |
| `animation` | DESIGN, BUILD, VALIDATE | frontend-developer | ui-designer | Visual review, motion compliance |
| `a11y` | DESIGN, BUILD, VALIDATE | frontend-developer | ui-designer, frontend-developer | WCAG 2.1 AA full audit |
| `responsive` | DESIGN, BUILD, VALIDATE | frontend-developer | frontend-developer, ui-designer | Mobile audit, breakpoint testing |
| `api-integration` | PLAN, BUILD, VALIDATE | frontend-developer | code-reviewer, debug-specialist | API contract verification, prod data audit |
| `auth-ui` | PLAN, BUILD, VALIDATE | frontend-developer | security-engineer, code-reviewer | Auth boundary testing, token handling |
| `design-system` | DESIGN, BUILD, VALIDATE | frontend-developer | ui-designer | Design system compliance |
| `performance` | BUILD, VALIDATE | frontend-developer | performance-analyzer | Lighthouse, bundle size, re-renders |
| `seo` | PLAN, BUILD, VALIDATE | frontend-developer | seo-specialist | SEO audit, metadata, structured data |
| `analytics` | BUILD, VALIDATE | frontend-developer | code-reviewer | Analytics event verification |

---

## Detailed Domain Definitions

### 1. `routing`

**Signals:** New pages, URL patterns, route guards, redirects, dynamic segments, parallel routes.

**Phase effects:**
- **PLAN:** Define route structure, layout nesting, middleware needs
- **BUILD:** Create page.tsx files, layout.tsx if needed, update middleware
- **VALIDATE:** Test route access, guard behavior, redirect chains

**Agent prompt template (VALIDATE):**
```
Review the routing implementation for [FEATURE_NAME].

Check:
- All new routes follow App Router conventions (page.tsx, layout.tsx)
- Route guards check correct auth: useAuth() for Parent/Teacher, student_token for Student
- Dynamic segments use proper typing ([id]: string from params)
- Redirects are 301 permanent where appropriate (configured in next.config.mjs)
- Loading states exist for each new route (loading.tsx or Suspense boundaries)
- No duplicate routes or path conflicts
- Middleware in middleware.ts updated if auth protection needed

Files to review: [LIST_OF_ROUTE_FILES]
```

---

### 2. `state`

**Signals:** New Context providers, Redux usage, shared state, cross-component data flow.

**Phase effects:**
- **PLAN:** Decide state approach (Context vs Redux vs local vs URL params)
- **BUILD:** Implement providers, hooks, selectors
- **VALIDATE:** Verify state flow, check for race conditions and stale data

**Agent prompt template (VALIDATE):**
```
Review state management for [FEATURE_NAME].

Check:
- State approach matches decision log (Context for new features, Redux only for bundleSlice legacy)
- Context providers placed at appropriate level (not too high, not too low)
- No prop drilling bypassing state management
- useEffect cleanup prevents memory leaks on unmount
- Loading/error/empty states all handled
- No race conditions in async state updates
- Memoization used where appropriate (useMemo, useCallback)
- Redux selectors memoized if Redux is used

Files to review: [LIST_OF_STATE_FILES]
```

---

### 3. `forms`

**Signals:** User input, validation, multi-step wizards, file uploads, form submission.

**Phase effects:**
- **PLAN:** Define validation rules, multi-step flow, error states
- **DESIGN:** Form layout, error message placement, field grouping
- **BUILD:** Implement form logic, validation, submission handling
- **VALIDATE:** Test edge cases, validation boundaries, error recovery

**Agent prompt template (VALIDATE):**
```
Review form implementation for [FEATURE_NAME].

Check:
- All inputs have proper validation (client-side + server-side error display)
- Required fields marked and enforced
- Error messages are user-friendly (no technical jargon)
- Form submission has loading state and disables submit button
- Network errors during submission handled gracefully with retry option
- Multi-step forms preserve state on back navigation
- File uploads validate type and size before sending
- Form state resets appropriately after successful submission
- Tab order and autofocus work correctly
- Keyboard submission (Enter key) works

Files to review: [LIST_OF_FORM_FILES]
```

---

### 4. `animation`

**Signals:** Framer Motion usage, transitions, page transitions, hover effects, spring animations.

**Phase effects:**
- **DESIGN:** Define animation behavior, timing, spring presets
- **BUILD:** Implement motion components using lib/motion-config.ts presets
- **VALIDATE:** Visual review of animation smoothness and brand compliance

**Agent prompt template (VALIDATE):**
```
Review animation implementation for [FEATURE_NAME].

Check:
- Spring animations use presets from lib/motion-config.ts (snappy, smooth, gentle, bounce)
- Floating panels use snappy preset (stiffness: 500, damping: 35, mass: 0.6) with NO backdrop overlay
- Animations respect prefers-reduced-motion media query
- No janky or stuttering animations (check for layout thrashing)
- Entry/exit animations use AnimatePresence correctly
- Hover animations use cardHover or subtleHover from motion-config.ts
- Stagger animations use staggers export for consistent timing
- No hardcoded spring values that duplicate existing presets

Files to review: [LIST_OF_ANIMATED_COMPONENTS]
```

---

### 5. `a11y`

**Signals:** Interactive elements, modals, dropdowns, focus management, dynamic content.

**Phase effects:**
- **DESIGN:** Ensure designs meet contrast ratios, touch targets, semantic structure
- **BUILD:** Implement ARIA attributes, keyboard handlers, focus traps
- **VALIDATE:** Full WCAG 2.1 AA audit

**Agent prompt template (VALIDATE):**
```
Conduct a WCAG 2.1 AA accessibility audit for [FEATURE_NAME].

Check:
- Semantic HTML: proper heading hierarchy (h1 > h2 > h3, no skipping)
- ARIA labels on all interactive elements (buttons, links, inputs, custom controls)
- Keyboard navigation: all interactive elements reachable via Tab, operable via Enter/Space
- Focus management: focus moves logically, trapped in modals, restored on close
- Screen reader: dynamic content announced via aria-live regions
- Color contrast: 4.5:1 minimum for normal text, 3:1 for large text (18px+ or 14px+ bold)
- Touch targets: minimum 44x44px on mobile
- Focus indicators: clearly visible on all focusable elements (not removed via outline:none)
- Images: meaningful images have alt text, decorative images have alt=""
- Form inputs: associated labels via htmlFor or aria-labelledby

Files to review: [LIST_OF_COMPONENT_FILES]
```

---

### 6. `responsive`

**Signals:** Layout changes across breakpoints, mobile-specific behavior, grid/flex layouts.

**Phase effects:**
- **DESIGN:** Mobile-first layout, breakpoint behavior, touch considerations
- **BUILD:** Implement responsive classes, conditional rendering
- **VALIDATE:** Mobile audit across all breakpoints

**Agent prompt template (VALIDATE):**
```
Conduct a responsive design audit for [FEATURE_NAME].

Check at each breakpoint (sm: 640px, md: 768px, lg: 1024px, xl: 1280px, 2xl: 1536px):
- Mobile-first approach: base styles are mobile, breakpoints add desktop
- No horizontal scrolling at any breakpoint
- Content reflows gracefully (no overlapping, no cut-off text)
- Touch targets minimum 44x44px on mobile
- Primary actions in thumb zone on mobile (bottom half of screen)
- Images use responsive sizing (fill, or explicit width/height with sizes prop)
- Tables convert to card layout on mobile or use horizontal scroll container
- Modals are full-screen on mobile, centered on desktop
- Navigation collapses appropriately (hamburger menu on mobile)
- Font sizes readable on all screen sizes (min 14px body text on mobile)

Files to review: [LIST_OF_LAYOUT_FILES]
```

---

### 7. `api-integration`

**Signals:** New API calls, data fetching, new lib/*-api.ts files, backend endpoints.

**Phase effects:**
- **PLAN:** Define API contracts, identify endpoints, check backend availability
- **BUILD:** Create lib/*-api.ts files, implement fetch wrappers
- **VALIDATE:** API contract verification, production data audit

**Agent prompt template (VALIDATE):**
```
Review API integration for [FEATURE_NAME].

Check:
- All API calls live in lib/*-api.ts files (NEVER direct fetch in components)
- Uses API_BASE_URL from @/lib/api-config (not hardcoded URLs)
- Auth requests use getAuthenticatedRailsHeaders() from @/lib/rails-headers
- Public requests use getRailsHeaders() from @/lib/rails-headers
- Correct HTTP methods (GET, POST, PUT, DELETE, PATCH) per API contract
- Request/response types defined as TypeScript interfaces
- Error handling: try-catch with user-friendly messages
- 401 errors trigger auth redirect (not silent failure)
- Loading states shown during all fetch operations
- Empty states handled when API returns empty arrays
- No N+1 query patterns (batch where possible)
- NEVER import fetchTeacherProfile from teacher-api.ts (use marketplace-api.ts)

Production data audit: curl real dev endpoints, verify response shapes match TypeScript types.

Files to review: [LIST_OF_API_FILES]
```

---

### 8. `auth-ui`

**Signals:** Login flows, protected routes, role-based rendering, token handling.

**Phase effects:**
- **PLAN:** Determine which auth system (Parent/Teacher vs Student), role guards
- **BUILD:** Implement auth checks, role-based rendering, redirect logic
- **VALIDATE:** Auth boundary testing, token handling security

**Agent prompt template (VALIDATE):**
```
Review auth UI implementation for [FEATURE_NAME].

Check:
- Correct auth system used:
  - Parent/Teacher: localStorage 'token' (fallback 'authToken'), useAuth() hook
  - Student: localStorage 'student_token', studentLogin()/studentLogout()
- Protected routes check isAuthenticated, redirect to home if not
- Role checks use profile_type_name string ('Admin', 'Parent', 'Teacher', 'Student'), not numeric IDs
- Auth state loading shows skeleton/spinner (not flash of unauthorized content)
- Token expiry handled gracefully (redirect to login, not cryptic error)
- No sensitive data exposed in client-side code
- CSRF tokens included where required
- Auth headers not sent to third-party endpoints
- Logout clears all relevant localStorage keys

Files to review: [LIST_OF_AUTH_FILES]
```

---

### 9. `design-system`

**Signals:** New UI components, design tokens, visual patterns, brand elements.

**Phase effects:**
- **DESIGN:** Deduplication check, brand rule compliance
- **BUILD:** Implement using Thoven design tokens
- **VALIDATE:** Full design system compliance check

**Agent prompt template (VALIDATE):**
```
Review design system compliance for [FEATURE_NAME].

Thoven Brand Rules — verify ALL of these:
- Colors: Primary is amber-500 (NOT orange-500). Custom token --color-thoven-orange: #ff8c1a
  - ZERO new orange-* Tailwind classes added
- Typography: font-display (Fredoka) for h1/h2 ONLY. Everything else uses font-sans (Montserrat)
  - Buttons MUST use font-sans font-bold (never font-display)
- 3D Buttons: shadow-[0_4px_0_0_rgb(217,119,6)] pattern, NO borders
  - Hover: shadow reduces to 2px, Active: 1px + translate-y-1
  - Shadow RGB by color: Amber rgb(217,119,6), Blue rgb(29,78,216), Red rgb(185,28,28)
- Floating panels: snappy spring preset, NO dark backdrop overlay
- Spacing: Consistent Tailwind scale (no arbitrary values without justification)
- Icons: Consistent icon library usage (Lucide React)
- Component patterns: Match existing codebase conventions (check similar components)

Files to review: [LIST_OF_UI_FILES]
```

---

### 10. `performance`

**Signals:** Heavy components, large lists, image galleries, data tables, real-time updates.

**Phase effects:**
- **BUILD:** Implement lazy loading, memoization, code splitting
- **VALIDATE:** Lighthouse audit, bundle size check, re-render analysis

**Agent prompt template (VALIDATE):**
```
Review performance for [FEATURE_NAME].

Check:
- No unnecessary re-renders (React.memo on pure components, useMemo/useCallback where beneficial)
- Lazy loading: dynamic(() => import(...)) for route-level code splitting
- Images: Next.js Image component with proper width/height/sizes, lazy loading below fold
- Bundle size: new dependencies justified, tree-shakeable imports used
- Lists: virtualized if >50 items (react-window or similar)
- useEffect cleanup: all subscriptions, timers, listeners cleaned up on unmount
- No memory leaks: check for event listeners not removed, intervals not cleared
- API calls: no redundant fetches, proper caching/deduplication
- Initial load: <200KB gzipped JavaScript budget for new routes

Run: Lighthouse performance audit on affected pages (target: 90+ score)

Files to review: [LIST_OF_COMPONENT_FILES]
```

---

### 11. `seo`

**Signals:** Marketing pages, public-facing content, metadata, OpenGraph tags.

**Phase effects:**
- **PLAN:** Define metadata strategy, canonical URLs, structured data needs
- **BUILD:** Implement metadata in layout.tsx, add structured data
- **VALIDATE:** Full SEO audit

**Agent prompt template (VALIDATE):**
```
Review SEO implementation for [FEATURE_NAME].

Check:
- Metadata exported from layout.tsx (not page.tsx) for marketing/public pages
- Title tag: unique, descriptive, <60 characters
- Meta description: compelling, <160 characters
- OpenGraph tags: og:title, og:description, og:image, og:url
- Twitter card tags: twitter:card, twitter:title, twitter:description, twitter:image
- Canonical URL set correctly (no duplicate content)
- Heading hierarchy: single h1, logical h2/h3 nesting
- Images have descriptive alt text
- Internal links use Next.js Link component (not <a> tags)
- Structured data (JSON-LD) for relevant content types
- Page included in sitemap.ts if public-facing
- robots.ts allows indexing for public pages

Files to review: [LIST_OF_PAGE_AND_LAYOUT_FILES]
```

---

### 12. `analytics`

**Signals:** User actions to track, conversion events, page views, identify calls.

**Phase effects:**
- **BUILD:** Implement tracking calls via AnalyticsProvider
- **VALIDATE:** Verify events fire correctly with proper properties

**Agent prompt template (VALIDATE):**
```
Review analytics implementation for [FEATURE_NAME].

Check:
- Track events use consistent naming convention (snake_case)
- All user actions with business significance have tracking events
- Event properties include relevant context (page, component, user role)
- Page views tracked on route changes
- Identify calls made on login/signup with user properties
- No PII in event properties (no email, full name, or student data)
- Analytics calls wrapped in try-catch (never break UX on tracking failure)
- ERR_BLOCKED_BY_CLIENT errors expected (ad blockers) — not treated as bugs
- Events documented in a tracking plan or comment block

Files to review: [LIST_OF_TRACKED_COMPONENTS]
```

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
