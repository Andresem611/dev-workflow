# Codebase Context Block

Embed this context in ALL subagent prompts dispatched by the /dev pipeline. Keeps subagents grounded in project reality.

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

Design System (Thoven):
- Primary color: amber-500 (NOT orange-500)
- Custom token: --color-thoven-orange: #ff8c1a
- Headers: font-display (Fredoka)
- Body/buttons: font-sans (Montserrat)
- 3D buttons: shadow-[0_4px_0_0_rgb(217,119,6)], NO borders
- Spring animations: { type: "spring", stiffness: 500, damping: 35, mass: 0.6 }
- Floating panels: NO dark backdrop

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
Design References:
- Brand identity: .claude/skills/thoven-designer/references/brand-identity.md
- Color palette: .claude/skills/thoven-designer/references/brand-colors.md
- Typography: .claude/skills/thoven-designer/references/typography.md
- Component patterns: .claude/skills/thoven-designer/references/component-patterns.md
- Error messaging: .claude/skills/thoven-designer/references/error-messaging.md

Design Inspiration:
- Duolingo: 3D depth, gamified progress
- Preply: Teacher marketplace cards, booking
- Airbnb: Card design, whitespace, search UX
- Notion: Clean spacing, sidebar nav
- Linear: Crisp typography, subtle animations
```
