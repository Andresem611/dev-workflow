# Codebase Context Block

Embed this context in ALL subagent prompts dispatched by the /dev pipeline. Keeps subagents grounded in project reality.

## Contents
- [Standard Context Block](#standard-context-block)
- [Phase-Specific Context Additions](#phase-specific-context-additions)

---

## Standard Context Block

```
CODEBASE CONTEXT:

Project: Thoven — Music education marketplace
Stack: Next.js 14.2, React 18, TypeScript 5, Tailwind CSS 4.1 (CSS-first config)
Package Manager: npm
Dev Server: port 5000 (not 3000)

Authentication (DUAL SYSTEM):
- Parent/Teacher: localStorage key 'token', JWT-based
- Student: localStorage key 'student_token', separate auth system
- Role check: use profile_type_name ('Admin', 'Parent', 'Teacher', 'Student')
- Auth headers: import { getAuthenticatedRailsHeaders } from '@/lib/rails-headers'

API Layer:
- All calls go through lib/*-api.ts files (NEVER fetch directly in components)
- Base URL: import { API_BASE_URL } from '@/lib/api-config'
- Dev backend: https://002b2ecb-77e9-4fdb-bd0f-186a75cdb79d-00-2bm97h8bunlz9.janeway.replit.dev/
- Prod backend: https://thovenbackend-am-andres234.replit.app
- NEVER use production backend in dev

State Management:
- Primary: React Context (contexts/)
- Legacy: Redux Toolkit (store/slices/bundleSlice only)
- Do NOT add new Redux slices

Design System:
- Strategic context: PRODUCT.md at repo root (if present) — register, users, principles, voice
- Visual system: DESIGN.md at repo root (if present) — full tokens, components, motion presets
- Primary color: amber-500 (NOT orange-500) — NEVER use orange-* Tailwind classes
- Custom token: --color-thoven-orange: #ff8c1a
- Headers: font-display (Fredoka) — h1/h2 ONLY
- Body/buttons: font-sans (Montserrat) — buttons are font-sans font-bold
- 3D buttons: shadow-[0_4px_0_0_rgb(217,119,6)], NO borders
- Spring animations: { type: "spring", stiffness: 500, damping: 35, mass: 0.6 }
- Floating panels: NO dark backdrop
- Animation library: GSAP (if `.claude/skills/gsap-*` installed) — see Motion Routing in design/SKILL.md
- Design quality layers: impeccable plugin (if installed) — opt-in critique/audit/polish/harden/onboard/clarify

Key Directories:
- Pages: app/[role]/ (parent, teacher, student, admin)
- Components: components/[role]/, components/ui/, components/shared/
- API modules: lib/*-api.ts (54 modules)
- Types: types/, lib/*-types.ts
- Hooks: hooks/, lib/
- Contexts: contexts/
- State: store/slices/

Critical Rules:
- NEVER import fetchTeacherProfile from teacher-api.ts (deprecated, use marketplace-api.ts)
- NEVER use orange-* Tailwind classes (use amber-*)
- NEVER create feature branches (commit to main)
- All components must work on mobile, tablet, desktop
- Marketing pages use *PageClient.tsx pattern
```

---

## Phase-Specific Context Additions

### For DISCOVER/PLAN agents (add to standard block):
```
Existing Patterns to Check:
- components/ui/ — shared UI primitives
- components/shared/ — cross-role components
- lib/*-api.ts — API integration patterns
- hooks/ — custom React hooks
- Similar features in the codebase for pattern reference
```

### For BUILD agents (add to standard block):
```
Build Standards:
- TDD where applicable: failing test → implement → pass → commit
- Commit format: descriptive summary + Co-Authored-By
- Run type-check + lint after changes
- Loading states required for all async operations
- Error states required with retry/recovery
- Empty states handled
```

### For VALIDATE agents (add to standard block):
```
Validation Commands:
- Type check: timeout 60 npm run type-check
- Lint: npm run lint
- Tests: npm run test:run
- Single test: npm run test:run -- path/to/file.test.ts
- Coverage: npm run test:coverage (80% threshold)
- Build: npm run build
```

### For DESIGN agents (add to standard block):
```
Strategic + Visual Context:
- PRODUCT.md (repo root) — IF PRESENT: register, users, principles, voice, anti-references
- DESIGN.md (repo root) — IF PRESENT: full token palette, typography, components, motion

Thoven Project Design Enforcer (Thoven-only — chain through if installed):
- Brand identity: .claude/skills/thoven-designer/references/brand-identity.md
- Color palette: .claude/skills/thoven-designer/references/brand-colors.md
- Typography: .claude/skills/thoven-designer/references/typography.md
- Component patterns: .claude/skills/thoven-designer/references/component-patterns.md
- Error messaging: .claude/skills/thoven-designer/references/error-messaging.md
- Viewport constraints: .claude/skills/thoven-designer/references/viewport-constraint.md
- Reusable inventory: .claude/skills/thoven-designer/references/reusable-inventory.md

Optional Quality Layer (any project — install impeccable plugin to enable):
- /impeccable critique — UX heuristic review
- /impeccable audit — deep a11y + perf + responsive technical pass
- /impeccable polish — pre-ship final pass
- /impeccable harden — edge cases, errors, i18n
- /impeccable onboard — first-run, empty states, peak moments
- /impeccable clarify — voice/copy fixes (requires PRODUCT.md)

Animation Library (any project — install gsap-* skills to enable):
- gsap-core, gsap-react, gsap-scrolltrigger, gsap-timeline, gsap-plugins,
  gsap-performance, gsap-frameworks, gsap-utils — see Motion Routing in design/SKILL.md

High-Stakes Peak Moments:
- customer-obsession-design-thinking skill — 11-star framework + peak-end rule
  (offer at Discuss HOW for first-run / paywall / celebration / share features)

Design Inspiration:
- Duolingo: 3D depth, gamified progress
- Preply: Teacher marketplace cards, booking
- Airbnb: Card design, whitespace, search UX
- Notion: Clean spacing, sidebar nav
- Linear: Crisp typography, subtle animations
```
