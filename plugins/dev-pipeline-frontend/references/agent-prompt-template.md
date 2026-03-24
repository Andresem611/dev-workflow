# Agent Prompt Template

Standard template for ALL subagent prompts dispatched by the /dev pipeline. Use this template to ensure every dispatched agent receives sufficient context to produce quality work without the orchestrator needing to craft prompts from memory.

Inline execution contaminates the orchestrator's review context — if you wrote the code, you can't objectively verify it in Review. The subagent writes with fresh eyes; you review with fresh eyes. This separation is what makes the verification layer trustworthy.

---

## Template Structure

Every agent prompt dispatched by this pipeline MUST follow this structure:

```
Agent tool:
  subagent_type: "[agent-type from domain-agent-map.md]"
  model: "[opus|sonnet — opus for architecture/review, sonnet for implementation]"
  prompt: |
    ## Task
    [One clear sentence: what to produce]

    ## Context
    FEATURE: [name from MANIFEST]
    DOMAINS: [comma-separated from MANIFEST]
    PHASE: [current pipeline phase]

    ## Codebase Context
    [Paste the standard context block from references/codebase-context-block.md]
    [Add phase-specific context additions from the same file]

    ## Architecture Decisions
    [Paste relevant entries from MANIFEST decision log — especially D# entries that drive this task]

    ## Specific Instructions
    [Task-specific requirements — files to create/modify, acceptance criteria, patterns to follow]
    [Include exact file paths the agent needs to Read or modify]

    ## Files to Read First
    [List exact file paths the agent MUST read before starting work]
    - [filepath1] — [what to extract from it]
    - [filepath2] — [what to extract from it]

    ## Upstream Context (Completion Logs)
    <!-- Include this section for Wave 2+ tasks, or for sequential tasks after the first in a wave -->
    Prior wave discoveries relevant to this task:
    - [Discovery 1 from prior task completion log]
    - [Discovery 2 — e.g., "TASK_02 found that UserContext requires profileLoaded check before accessing role"]
    - [Discovery 3 — e.g., "TASK_03 renamed BookingSlot to TimeSlot across all types"]
    Read these completion logs before starting: [list task file paths]

    ## must_haves (from requirements.md)
    [Paste the specific must_haves this task addresses]

    ## Output Format
    [What the agent should produce: code files, analysis report, audit findings, etc.]

    ## Verification
    [How to verify the output is correct]
    - [ ] [Specific check 1]
    - [ ] [Specific check 2]
    - [ ] TypeScript strict passes
    - [ ] No lint errors
```

---

## Quick Reference: Agent Type Selection

Consult `references/domain-agent-map.md` for the full mapping. Common patterns:

| Task Type | Agent | Model |
|-----------|-------|-------|
| Component implementation | `frontend-developer` | sonnet |
| Architecture proposal/review | `feature-dev:code-architect` | opus |
| Code review | `code-reviewer` | opus |
| Codebase exploration | `Explore` | — |
| React state/hooks | `react-specialist` | sonnet |
| Next.js routing/RSC | `next-js-developer` | opus |
| TypeScript types | `typescript-pro` | opus |
| UI/design work | `ui-designer` | opus |
| Accessibility audit | `accessibility-tester` | sonnet |
| API design | `api-designer` | sonnet |
| Security review | `security-engineer` | opus |
| Performance analysis | `performance-analyzer` | opus |
| SEO audit | `seo-specialist` | opus |
| Debug investigation | `debug-specialist` | opus |

---

## Example: BUILD Phase Agent Prompt

```
Agent tool:
  subagent_type: "frontend-developer"
  model: "sonnet"
  prompt: |
    ## Task
    Implement the TeacherAvailabilityCard component (TASK_03 from Wave 2).

    ## Context
    FEATURE: Booking Wizard
    DOMAINS: routing, api-integration, design-system, responsive
    PHASE: BUILD — Wave 2

    ## Codebase Context
    Project: Thoven — Music education marketplace
    Stack: Next.js 14.2, React 18, TypeScript 5, Tailwind CSS 4.1
    Auth: Dual system (Parent/Teacher: localStorage 'token', Student: 'student_token')
    API: All calls via lib/*-api.ts, base URL from @/lib/api-config
    Design: amber-500 primary, font-display (Fredoka) headers only, font-sans (Montserrat) everything else
    3D buttons: shadow-[0_4px_0_0_rgb(217,119,6)] NO borders

    ## Architecture Decisions
    D1: State management = React Context (matches DashboardContext.tsx pattern)
    D3: Card layout = reuse TeacherCard.tsx grid pattern from marketplace
    D5: Availability data = new lib/booking-api.ts with getTeacherAvailability()

    ## Specific Instructions
    - Create: components/parent/booking/TeacherAvailabilityCard.tsx
    - Reuse pattern from: components/marketplace/TeacherCard.tsx (card shell, responsive grid)
    - Props: { teacher: TeacherProfile, availableSlots: TimeSlot[], onSlotSelect: (slot: TimeSlot) => void }
    - States: default, hover, selected, loading, empty (no slots), error
    - Mobile: full-width card, horizontal scroll for time slots
    - Desktop: card grid (3 columns), vertical slot list

    ## Files to Read First
    - components/marketplace/TeacherCard.tsx — reuse card shell pattern
    - types/booking-types.ts — TeacherProfile and TimeSlot interfaces
    - lib/motion-config.ts — spring presets for hover animation

    ## must_haves
    - Card displays teacher name, photo, instrument, and available time slots
    - Selecting a slot calls onSlotSelect and visually highlights the selection
    - Empty state shows "No available slots" message

    ## Output Format
    Write the component file directly. Include TypeScript interfaces inline if not in types/.

    ## Verification
    - [ ] No orange-* classes (amber-500 only)
    - [ ] font-display only on card title, font-sans everywhere else
    - [ ] All 6 visual states implemented
    - [ ] Mobile-responsive (full-width < 768px)
    - [ ] TypeScript strict passes
    - [ ] Accessible: ARIA labels on interactive slots, keyboard navigable
```

---

## Anti-Patterns

| Anti-Pattern | Why It Fails | Correct Approach |
|-------------|-------------|-----------------|
| Generic prompt: "Implement TASK_03" | Agent has no context, guesses at architecture | Include full context block + decision log + file paths |
| No files-to-read section | Agent works from assumptions, not codebase reality | Always list files to read with extraction instructions |
| Missing must_haves | Output can't be verified against requirements | Include specific must_haves from requirements.md |
| Missing verification criteria | Output can't be objectively checked | Include specific, testable verification items |
| Orchestrator crafts prompt from memory | Memory drifts from current file state | Read MANIFEST + wave plan + domain-agent-map FIRST, then craft prompt |
| Copy-pasting entire skill files into prompt | Overwhelms agent context with irrelevant rules | Extract only the relevant decisions and instructions |
