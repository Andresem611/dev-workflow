# Requirements Template — Frontend

Template for `.dev/discover/REQUIREMENTS.md` — checkable requirements that define "done" for a frontend feature.

## EARS Sentence Shapes (v5.0+)

Adopted in v5.0 (user-locked Wave 6 checkpoint 2026-05-09). Each requirement bullet — regardless of categorical prefix (UI-NN, A11Y-NN, RSP-NN, INT-NN, API-NN, PERF-NN, STATE-NN, FORM-NN, ANIM-NN, SEO-NN, TRK-NN, AUTH-NN, DS-NN) — uses one of four EARS sentence shapes plus a clear `shall` verb form.

EARS = Easy Approach to Requirements Syntax. The categorical prefix scheme defined elsewhere in this document (UI-NN etc.) is preserved; EARS is the **bullet-level grammar** that replaces free prose within each category.

### Four EARS shapes

**1. Ubiquitous (always-true behavior)**

```
<PREFIX-NN>: The <feature|component> shall <observable behavior>.
```

Example: `UI-03: The lobby header shall display the current room participant count to all joined users.`

**2. Event-driven (response to a trigger)**

```
<PREFIX-NN>: When <trigger event>, the <feature|component> shall <observable behavior>.
```

Example: `INT-04: When a teacher draws a stroke on the canvas, the sync layer shall propagate the stroke to all student clients within 200ms.`

**3. State-driven (behavior conditional on a state)**

```
<PREFIX-NN>: While <state>, the <feature|component> shall <observable behavior>.
```

Example: `STATE-07: While the recording is active, the canvas UI shall display a persistent recording indicator visible to all participants.`

**4. Optional/conditional (feature/role-gated)**

```
<PREFIX-NN>: Where <feature|role> applies, the <feature|component> shall <observable behavior>.
```

Example: `AUTH-12: Where the user has 'teacher' role, the lobby shall expose a 'Start Recording' control.`

### Combinations

EARS shapes can compose:

```
<PREFIX-NN>: When <event>, while <state>, the <feature> shall <response>.
<PREFIX-NN>: Where <feature>, when <event>, the <feature> shall <response>.
```

### Why EARS within existing prefix categories

The categorical prefix scheme answers **what kind of requirement** this is (UI vs accessibility vs API vs performance). EARS answers **what shape the verb takes** (always, on event, while state, when feature). They're orthogonal and complementary:

- Categorical prefixes → traceability (groups requirements by domain for skill dispatch).
- EARS shapes → mechanical clarity (forces a `shall` verb that maps to a single observable behavior).

Both must be present for v5.0+ features. Pre-v5.0 features remain on free-prose authoring within categorical prefixes; new features adopt EARS.

### Aggregation in MANIFEST (unchanged)

The `verify-requirements-coverage` tool (v4.5-Δ3) reads MANIFEST `## Requirements Coverage` table by row regex (column-oriented, not sentence-oriented). EARS lives in `requirements.md`, NOT the MANIFEST table — so the tool needs no extension for EARS. Existing column-oriented gates keep working unchanged.

### Mode propagation

- Reduction: shorter requirements list (3-5 typical); EARS shapes still required.
- Hold: full categorical authoring (8-15 requirements typical); EARS shapes required for each bullet.
- Expansion: + non-functional requirements section (PERF-NN); EARS shapes required for each bullet including non-functional.

### Acceptance criteria

A v5.0+ feature's `requirements.md`:
- Has at least one requirement of each EARS shape (Ubiquitous + at least one of Event/State/Optional).
- Every bullet has a categorical prefix (UI-NN / A11Y-NN / etc.) AND a `shall` verb form.
- Every requirement ID appears in MANIFEST `## Requirements Coverage` table.
- Out-of-scope items use `OOS-NN` prefix (still applies; EARS is for in-scope items).

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
