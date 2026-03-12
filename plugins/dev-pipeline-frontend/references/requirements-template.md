# Requirements Template — Frontend

Template for `.dev/discover/REQUIREMENTS.md` — checkable requirements that define "done" for a frontend feature.

## Table of Contents

1. [Template](#template)
2. [Guidelines](#guidelines)
3. [must_haves Block Format](#must_haves-block-format)
4. [Traceability](#traceability)
5. [Evolution](#evolution)
6. [Example: Teacher Profile Card](#example-teacher-profile-card)

---

## Template

```markdown
# Requirements: [Feature Name]

**Defined:** [date] | **Domain Tags:** [from INTAKE] | **Core Value:** [what the user gains]

## v1 Requirements

### Visual / UI
- [ ] **UI-01**: [User-observable visual behavior]

### Accessibility
- [ ] **A11Y-01**: [WCAG 2.1 AA testable criterion]

### [Domain-specific categories — add only those matching domain tags]
- [ ] **[PREFIX]-01**: [Testable requirement]

## Deferred Requirements
Acknowledged but not in current wave plan. No checkboxes.
- **[CAT]-01**: [Requirement description]

## Out of Scope
| Feature | Reason |
|---------|--------|
| [Feature] | [Why excluded] |

## Traceability
| Requirement | Wave | Task(s) | Status |
|-------------|------|---------|--------|
| UI-01 | W1 | T03 | Pending |

**Coverage:** v1: [X] total | Mapped: [Y] | Unmapped: [Z]

---
*Requirements defined: [date] | Last updated: [date] after [trigger]*
```

---

## Guidelines

### Where requirements come from

Requirements are derived from two sources:
1. **Domain tags** from INTAKE (e.g., `a11y`, `responsive`, `api-integration`) determine which categories apply.
2. **User answers** from Discuss stage in DISCOVER refine scope within those categories.

Do not use generic categories. If the feature has tags `forms` and `api-integration`, only include those categories — not SEO or animation.

### Category-to-prefix mapping

Pick categories matching the feature's domain tags from `domain-agent-map.md`:

| Domain Tag | Category | Prefix | Domain Tag | Category | Prefix |
|------------|----------|--------|------------|----------|--------|
| `routing` | Navigation | NAV | `auth-ui` | Auth UI | AUTH |
| `state` | State Mgmt | STATE | `design-system` | Design System | DS |
| `forms` | Form Behavior | FORM | `performance` | Performance | PERF |
| `animation` | Motion | ANIM | `seo` | SEO / Metadata | SEO |
| `a11y` | Accessibility | A11Y | `analytics` | Tracking | TRK |
| `responsive` | Responsive | RSP | `api-integration` | API Integration | API |

Visual/UI (`UI`) and Interaction (`INT`) are always included — every frontend feature has them.

### Testability rule

Every requirement must be testable. If you cannot write a pass/fail check, rewrite it.

```
Bad:  UI-01: The page looks good on mobile
Good: UI-01: Card grid collapses to single column below 640px viewport width
```

---

## must_haves Block Format

Wave files (`.dev/build/wave-N.md`) include a `must_haves` block the verifier checks against:

```yaml
must_haves:
  truths:        # User-observable behaviors (mapped from requirement IDs)
    - "Hero section renders at full viewport width"
    - "Form shows inline validation errors on blur"
  artifacts:     # Files that must exist after the wave
    - "src/components/TeacherCard/TeacherCard.tsx"
    - "src/components/TeacherCard/TeacherCard.test.tsx"
  key_links:     # Connections between system parts
    - "TeacherCard -> useTeacherProfile (hook)"
    - "TeacherCard -> /api/v1/teachers/:id (API)"
```

Each `truths` entry maps back to a requirement ID. The verifier uses these to confirm the wave is complete.

---

## Traceability

Each v1 requirement maps to exactly one wave. Unmapped requirements after PLAN = planning gap. Every v1 requirement must appear in the traceability table before BUILD begins.

**Status values:** Pending (not started) | In Progress (wave active) | Complete (verified by VALIDATE) | Blocked (external dependency)

---

## Evolution

**After each wave:** Mark covered requirements Complete, update timestamp, note scope changes.

**After VALIDATE:** Cross-check every v1 requirement is Complete. Any still Pending = VALIDATE failure.

**Scope changes during BUILD:** Prefix revised requirements with `[REVISED]`, add rationale, update traceability.

---

## Example: Teacher Profile Card

```markdown
# Requirements: Teacher Profile Card

**Defined:** 2026-03-12 | **Domain Tags:** api-integration, responsive, a11y, design-system
**Core Value:** Parents can quickly evaluate a teacher's qualifications and availability

## v1 Requirements

### Visual / UI
- [ ] **UI-01**: Card displays teacher avatar, name, instruments, and star rating
- [ ] **UI-02**: Instrument tags wrap to second line when more than 3
- [ ] **UI-03**: Skeleton loader shows while teacher data is fetching
- [ ] **UI-04**: Card matches design system spacing tokens (8px grid)

### Accessibility
- [ ] **A11Y-01**: All images have descriptive alt text including teacher name
- [ ] **A11Y-02**: Star rating announced as "N out of 5 stars" by screen readers
- [ ] **A11Y-03**: Card is keyboard-navigable with visible focus ring

### Responsive
- [ ] **RSP-01**: Grid shows 3 columns desktop (>1024px), 2 tablet, 1 mobile
- [ ] **RSP-02**: Avatar scales proportionally without cropping across breakpoints

### API Integration
- [ ] **API-01**: Card fetches teacher data from GET /api/v1/teachers/:id
- [ ] **API-02**: Failed API call shows retry button with error message
- [ ] **API-03**: Stale data revalidates on window focus (SWR pattern)

### Performance
- [ ] **PERF-01**: LCP under 2.5s on mobile 4G (Lighthouse)
- [ ] **PERF-02**: Avatar images served as WebP with lazy loading

## Deferred Requirements

### Interaction
- **INT-01**: Hovering the card shows a brief bio tooltip
- **INT-02**: Card flip animation reveals teacher schedule on back

### Analytics
- **TRK-01**: Track card impressions in viewport (Intersection Observer)

## Out of Scope
| Feature | Reason |
|---------|--------|
| Inline booking from card | Separate feature with its own pipeline |
| Video intro embed | Storage/bandwidth cost; defer to v2 |
| Real-time availability | Requires WebSocket — out of scope for card |

## Traceability
| Requirement | Wave | Task(s) | Status |
|-------------|------|---------|--------|
| UI-01..04 | W2 | T05, T06 | Pending |
| A11Y-01..03 | W3 | T09, T10 | Pending |
| RSP-01..02 | W2 | T07 | Pending |
| API-01..03 | W1 | T02, T03 | Pending |
| PERF-01..02 | W3 | T08, T11 | Pending |

**Coverage:** v1: 15 total | Mapped: 15 | Unmapped: 0
```
