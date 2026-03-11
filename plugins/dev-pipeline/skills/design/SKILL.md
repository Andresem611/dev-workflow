---
name: design
description: Use when dev-pipeline:design is invoked or MANIFEST shows DESIGN phase. CONDITIONAL — only runs when MANIFEST domains include design-system, responsive, or animation. Handles UI specification and Thoven design system compliance.
---

# dev-pipeline:design — UI Specification + Design System Compliance

**Phase 4 of /dev pipeline. CONDITIONAL — only runs when MANIFEST domains include: `design-system`, `responsive`, or `animation`.**

If none of those domains are tagged, skip directly to DOCUMENT phase. Write transition file noting design was skipped.

---

## Inner Loop: RESEARCH > EXECUTE > DOCUMENT > GATE

### 1. RESEARCH

Read these files before any design work:

1. **MANIFEST** — `docs/[feature]/.dev/MANIFEST.md` for tier, domains, requirements, architecture decisions
2. **Transition file** — `docs/[feature]/prompt-transitions/plan-to-design.md` for PLAN output
3. **Design system docs** (from `.claude/skills/thoven-designer/references/`):
   - `brand-identity.md` — Design philosophy, personality, inspiration sites
   - `brand-colors.md` — Color palette and 3D shadow system
   - `typography.md` — Font usage rules
   - `component-patterns.md` — Standard patterns and anti-patterns

Dispatch **Explore agent** for component deduplication:

```
Subagent type: "Explore"
Prompt: "Search for existing components similar to [description from MANIFEST]:
1. Check components/ui/, components/shared/, components/landing/
2. Search by type: *Card*.tsx, *Panel*.tsx, *Modal*.tsx, etc.
3. For each found: name, path, similarity level, can it be reused?"
```

---

### 2. EXECUTE

#### Step A: Deduplication Decision

Based on Explore agent results, recommend ONE approach:

| Recommendation | When |
|---|---|
| **Reuse directly** | Existing component does exactly what's needed |
| **Extend existing** | Existing component is 70%+ there, needs minor additions |
| **Create new** | Nothing similar exists or design need is genuinely different |

**Default to "create new" when in doubt.** Don't force-fit existing components.

Known reference components worth checking:

| Pattern | Reference |
|---------|-----------|
| 3D button | `components/unified-navigation.tsx` |
| Floating panel | `components/student/StudentMaterialsPanel.tsx` |
| Teacher card | `components/marketplace/TeacherCard.tsx` |
| Dashboard section | `components/teacher/CalendarSection.tsx` |
| Modal with form | `components/teacher/BookingModal.tsx` |

#### Step B: UI Specification

Launch **ui-designer agent** with:
- Requirements from MANIFEST
- Reuse decision from Step A
- Design system reference docs listed above

The spec MUST include:
- **All visual states:** default, hover, active, disabled, selected, loading, empty, error
- **Color usage** with exact Tailwind classes
- **Typography** with exact font classes
- **Animation specs** using springs from `lib/motion-config.ts`
- **Responsive behavior:** mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- **Accessibility:** ARIA labels, focus states, touch targets (44x44px min), contrast (4.5:1 min)

#### Step C: Creative Option (When Context Allows)

Present TWO options when the feature suits it:
1. **Clean standard** — follows design system exactly
2. **Musical/educational skeuomorphic** — e.g., calendar as real pages, homework on notebook paper, progress as a musical staff

Let the user choose. Don't force skeuomorphism on every design.

#### Step D: External Reference Transformation

When user provides screenshots, URLs, or external code — transform to Thoven:

| External | Thoven Equivalent |
|----------|-------------------|
| Primary color | `amber-500` |
| Secondary color | `amber-100` or `yellow-100` |
| Sans-serif font | `font-sans` (Montserrat) |
| Display font | `font-display` (Fredoka) |
| Flat buttons | 3D buttons with shadow |
| Modal backdrop | No backdrop (spring panel) |
| Left accent bars | Remove |
| Icon on every card | Remove most — keep only where functional |

---

## Brand Rules (from thoven-designer — MANDATORY)

### NEVER:
- Use `orange-500` for buttons/CTAs or `orange-50` for backgrounds (use `amber-500` / `amber-50`)
- Add borders to 3D buttons
- Use `font-display` on buttons (use `font-sans font-bold`)
- Use dark backdrop on floating panels
- Add left-hand colored accent bars on cards
- Put icons on every card/section unless functional
- Use different accent colors per card in a grid (rainbow cards)
- Give unselected states 3D shadows (only selected/active gets depth)
- Use `amber-600` for resting selected state (that's hover-only; use `amber-500`)

### ALWAYS:
- Run deduplication check before creating new components
- Cite specific Thoven tokens: `amber-500`, `font-display`, spring params
- Validate against design system checklist before gate
- Use `font-display` (Fredoka) for headers/titles ONLY
- Use `font-sans` (Montserrat) for everything else
- Use spring animations: `{ type: "spring", stiffness: 500, damping: 35, mass: 0.6 }`

### 3D Button Pattern

```tsx
className="bg-amber-500 hover:bg-amber-600 text-white font-sans font-bold
  rounded-lg
  shadow-[0_4px_0_0_rgb(217,119,6)]
  hover:shadow-[0_2px_0_0_rgb(217,119,6)]
  active:shadow-[0_1px_0_0_rgb(217,119,6)]
  active:translate-y-1 transition-all duration-200"
```

---

### 3. DOCUMENT

After design spec is complete:

1. **Update MANIFEST** — Add design decisions:
   - Dedup result (reuse / extend / create new)
   - Component names and paths
   - Design option chosen (standard vs skeuomorphic)
   - Responsive breakpoint decisions

2. **Write design spec artifact** — `docs/[feature]/DESIGN_SPEC.md` with full visual spec

3. **Generate transition file** — `docs/[feature]/prompt-transitions/design-to-document.md`:
   - Feature summary
   - Design decisions locked
   - Component inventory (new, reused, extended)
   - Responsive behavior summary
   - Accessibility requirements
   - Instructions for DOCUMENT phase

---

### 4. GATE: G3 — Mandatory When Phase Runs

Present the design spec with all states. Include:
- Visual specification summary
- Dedup decision and rationale
- Responsive behavior overview
- Accessibility requirements

**Options: Approve / Revise / Pause**

---

## Design System Review Checklist

Run before presenting G3. Every item must pass.

**Colors:**
- [ ] Primary CTA uses `amber-500` (NOT `orange-500`, NOT `amber-600`)
- [ ] 3D shadows use `rgb(217,119,6)`
- [ ] Backgrounds use `bg-amber-50` (NOT `bg-orange-50`)
- [ ] No rainbow card grids

**Typography:**
- [ ] Headers use `font-display` (Fredoka)
- [ ] Buttons use `font-sans font-bold` (Montserrat)
- [ ] Body text uses `font-sans` (Montserrat)

**Patterns:**
- [ ] 3D buttons have NO borders
- [ ] Floating panels use spring animation, NO dark backdrop
- [ ] Selected states dominate unselected (contrast, not competition)
- [ ] No left-hand accent bars on cards
- [ ] Icons used selectively
- [ ] Badge pills only for real status/categories

**Accessibility:**
- [ ] Color contrast meets 4.5:1
- [ ] Touch targets 44x44px minimum
- [ ] Focus states visible
- [ ] ARIA labels on interactive elements

**Errors:**
- [ ] Amber background for errors (not red), except field validation
- [ ] All errors have retry/recovery actions

---

## Design Inspiration Sites

Use the closest-matching reference when designing:

| Site | Best For |
|------|----------|
| **Duolingo** | 3D button depth, gamified progress, playful micro-interactions |
| **Preply** | Teacher marketplace cards, booking flows, profile layouts |
| **Airbnb** | Card design, whitespace, search UX |
| **Notion** | Clean spacing, sidebar nav, empty states |
| **Linear** | Crisp typography, subtle animations |
| **Anthropic** | Typography hierarchy, sophisticated simplicity |

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping dedup and jumping to spec | Always run Explore agent first |
| `orange-500` on buttons | `amber-500` |
| `amber-600` for resting selected | `amber-500` (600 is hover-only) |
| `font-display` on buttons | `font-sans font-bold` |
| Borders on 3D buttons | Remove all borders |
| Dark backdrop on panels | No overlay; panel floats freely |
| Shadow `rgb(194,65,12)` or `rgb(180,83,9)` | `rgb(217,119,6)` |
| Left accent bar on cards | Remove |
| Icon on every card | Remove unless functional |
| Unselected state with 3D shadow | Neutral: `bg-white text-gray-600` |
| Rainbow card grid | Consistent amber or neutral |
| Decorative badge pills | Only for real status/categories |
| Missing responsive spec | Must specify mobile/tablet/desktop |
| Missing accessibility | Must include ARIA, focus, contrast, touch targets |
| Forcing skeuomorphism | Present as option alongside clean standard |
| Skipping G3 gate | Mandatory when design phase runs |
