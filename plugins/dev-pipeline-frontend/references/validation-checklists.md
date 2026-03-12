# Validation Checklists Reference

Standard checklists used by `/dev:validate`. Domain-triggered checklists only run when the corresponding domain tag is in the MANIFEST.

## Contents
- [Always-Run Checks](#always-run-checks-all-features)
- [Validation Gates](#validation-gates)
  - [Judge Scoring](#judge-scoring-user-opt-in)
  - [Debate Mode](#debate-mode-on-request)
- [Domain-Triggered Checklists](#domain-triggered-checklists)
- [Post-Development Audit](#post-development-audit-absorbed-from-post_development_audit_template)

---

## Always-Run Checks (All Features)

### 1. Type-Check + Lint
```bash
timeout 60 npm run type-check
npm run lint
```
- Both must pass. Run both even if one fails.
- Show only errors in feature-related files.

### 2. Stub-Check
Search changed files for:

| Pattern | Severity |
|---|---|
| `TODO\|FIXME\|HACK\|XXX` | Warning |
| `lorem ipsum\|placeholder\|TBD\|TBC` | Error |
| `\{\s*\}\|=> \{\}\|return null.*//` (empty implementations) | Error |
| `localhost\|127\.0\.0\.1\|test@\|password123` (hardcoded test values) | Error |
| `console\.\(log\|debug\|warn\|error\)` | Warning |
| 3+ consecutive `//` lines (commented-out code) | Warning |
| `catch\s*\(\w*\)\s*\{\s*\}` (empty catch) | Error |

Errors block. Warnings are informational.

### 3. Docs Drift Scan
Check changed symbols against:
- `CLAUDE.md` — references to changed functions, endpoints, file paths
- `docs/**/*.md` — feature docs referencing changed logic
- `CHANGELOG.md` — `[Unreleased]` section mentions the change
- `types/*.ts` — type definitions match changed API responses
- Inline comments near changes (5 lines above/below each hunk)
- JSDoc/TSDoc on changed functions

Errors block. Warnings are informational.

### 4. QA Runbook

**Generation:** Read all feature files, extract test paths, write runbook with:
- Phase 1: Smoke test (automated + quick manual)
- Phase 2: Development QA (comprehensive, curl + browser)
- Phase 3: Production QA (post-deploy verification)

**Execution:** Both layers mandatory:
- **Curl/API first:** Login as test accounts, hit endpoints, verify status codes and response shapes
- **Browser QA second:** One test at a time, wait for user response, group by login account

### 5. Production Data Audit
```bash
# For each API endpoint the feature uses:
curl -s -H "Authorization: Bearer $TOKEN" "$API_BASE_URL/api/v1/endpoint" | python3 -m json.tool
```
- Verify response shapes match TypeScript types
- Verify required fields are present and correct types
- Verify auth guards return 401/403 for wrong roles
- Check against dev vs prod backend differences

---

## Validation Gates

### Judge Scoring (User Opt-In)

5-criterion rubric. **Default score is 2.** Justify any score above 2.

| Criterion | Weight | Evidence Required |
|---|---|---|
| Correctness | 30% | Does it solve the stated requirements? |
| Code Quality | 20% | Clean, readable, follows patterns? |
| Completeness | 20% | All cases handled? No stubs? |
| Pattern Adherence | 15% | Matches existing codebase conventions? |
| Documentation Accuracy | 15% | Comments, docs, types match code? |

- Weighted total >= 4.0 → PASS
- Weighted total < 4.0 → FAIL (list specific issues)
- After 3 failed attempts → escalate to user (matches BUILD 3-strikes rule)

### Debate Mode (On Request)

3 independent judges evaluate in parallel:
- Judge 1: Focus on CORRECTNESS and edge cases
- Judge 2: Focus on CODE QUALITY and patterns
- Judge 3: Focus on COMPLETENESS, documentation, and security

Scoring:
- Unanimous >= 4.0 → PASS
- All below 3.0 → FAIL (redesign needed)
- Split (disagreement > 1.5 on any criterion) → Round 2 (share all evaluations, each revises, majority rules)

---

## Domain-Triggered Checklists

### `a11y` — Accessibility (WCAG 2.1 AA)

- [ ] Color contrast meets 4.5:1 for text, 3:1 for large text
- [ ] All interactive elements have visible focus indicators
- [ ] Touch targets are 44x44px minimum
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation works for all interactive elements
- [ ] Skip links for repetitive navigation
- [ ] Form inputs have associated labels
- [ ] Error messages are announced to screen readers
- [ ] Modal focus trapping works correctly
- [ ] No content conveyed by color alone

### `responsive` — Mobile/Tablet/Desktop

- [ ] Layout works at 375px (mobile)
- [ ] Layout works at 768px (tablet)
- [ ] Layout works at 1440px (desktop)
- [ ] Touch targets appropriate for mobile
- [ ] No horizontal scroll on any breakpoint
- [ ] Text remains readable at all sizes
- [ ] Images/media scale appropriately
- [ ] Navigation adapts correctly (hamburger menu, etc.)

### `performance` — Core Web Vitals

```bash
# Lighthouse audit
npx lighthouse http://localhost:5000/[page] --output=json
```
- [ ] LCP < 2.5s
- [ ] FID < 100ms
- [ ] CLS < 0.1
- [ ] Bundle size check (no regression beyond threshold)
- [ ] No unnecessary re-renders (React DevTools Profiler)
- [ ] Images lazy-loaded where appropriate
- [ ] Code splitting for heavy components

### `analytics` — Event Verification

- [ ] All tracked events fire at correct time
- [ ] Event properties contain expected values
- [ ] Console shows `[Analytics] Event tracked: [name]`
- [ ] No duplicate event fires
- [ ] Events work across user roles (parent, teacher, student)
- [ ] If no events exist, flag analytics gap with suggestions

### `design-system` — Thoven Compliance

**Colors:**
- [ ] Primary CTA uses `amber-500` (NOT `orange-500`, NOT `amber-600`)
- [ ] 3D shadows use `rgb(217,119,6)` for amber
- [ ] Page backgrounds use `bg-amber-50` (NOT `bg-orange-50`)
- [ ] No rainbow card grids

**Typography:**
- [ ] Headers/titles use `font-display` (Fredoka)
- [ ] Buttons use `font-sans font-bold` (Montserrat)
- [ ] Body text uses `font-sans` (Montserrat)

**Patterns:**
- [ ] 3D buttons have NO borders
- [ ] Floating panels have spring animation, NO dark backdrop
- [ ] No left-hand colored accent bars on cards
- [ ] Icons used selectively, not on every element
- [ ] Selected states dominate unselected (amber-500, not amber-600 for resting)

### `seo` — Search Engine Optimization

- [ ] Page has unique `<title>` tag
- [ ] Meta description present and unique
- [ ] OpenGraph tags (og:title, og:description, og:image)
- [ ] Twitter card tags
- [ ] Canonical URL set
- [ ] Heading hierarchy (single h1, proper nesting)
- [ ] Images have alt text
- [ ] Structured data (JSON-LD) where applicable

---

## Post-Development Audit (Absorbed from POST_DEVELOPMENT_AUDIT_TEMPLATE)

Final checklist before SHIP:

- [ ] All acceptance criteria from PLAN met
- [ ] Custom gate criteria from PLAN checked
- [ ] No console errors or warnings in feature
- [ ] Loading states implemented for all async operations
- [ ] Error states implemented with retry/recovery actions
- [ ] Empty states handled (no data scenario)
- [ ] Auth guards in place for protected routes
- [ ] API calls go through `lib/*-api.ts` (no direct fetch in components)
- [ ] Feature works on mobile, tablet, and desktop
- [ ] No regressions in existing features
