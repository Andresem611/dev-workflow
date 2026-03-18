---
name: design
description: Creates visual specifications for a frontend feature. Produces full DESIGN_SPEC with Tailwind classes, typography, animation, responsive behavior, and accessibility. ALWAYS RUNS in frontend pipeline. Triggers on /dev:design or when /dev router advances past PLAN.
---

# /dev:design — Visual Specification + Design System Compliance

**Phase 4 of /dev pipeline. ALWAYS RUNS in the frontend pipeline (D15).** This phase is not conditional on domain tags. Every frontend feature gets a design spec.

## Hard Rules

1. **Read before acting.** Use the Read tool on context bridges, MANIFEST, and design system references before Discuss. Designing from memory produces specs that conflict with existing patterns.
2. **Dispatch agents for spec creation.** The orchestrator reviews and confirms — agents (ui-designer, Explore) produce specs and audit for dedup. Inline spec-writing means you review your own design.
3. **Use agent-prompt-template for dispatches.** Follow `references/agent-prompt-template.md`. Include design system references and decision log.
4. **Show visual mockups inline.** When presenting design options, render ASCII mockups in chat and confirm via AskUserQuestion with preview. The user should SEE the design before it's written to the spec file (D17).

---

## Inner Loop: Discuss > Architect > Execute > Review

See `inner-loop-reference.md` for canonical stage definitions.

**Artifact directory:** `docs/[Feature]/.dev/design/`

---

## Stage 1: Discuss — Visual Direction

**Read context bridge first:** `.dev/plan/review-plan-approval.md`

If the file does not exist, STOP and surface the missing prerequisite to the user.

### Tool Check (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry design discuss docs/[feature] --plugin frontend
```

If FAIL, fix missing prerequisites before proceeding.

### MANDATORY CONTEXT LOADING — Step 0

Use the Read tool on each file. Do not proceed to WHAT questions until all reads complete.

1. `Read(.dev/plan/review-plan-approval.md)` → extract: locked decisions, architecture, component hierarchy
2. `Read(references/domain-agent-map.md)` → extract: agent assignments for DESIGN phase (ui-designer, Explore)
3. `Read(references/codebase-context-block.md)` → extract: design system rules, color palette, typography, 3D button pattern

If any file is missing, STOP and surface the gap to the user.

### WHAT Questions

Use `AskUserQuestion` for each question. One at a time. No batching. No cap — user says "enough" to move on.

Explore these areas as relevant:

- **Visual references:** Any inspiration sites, screenshots, or existing pages to match?
- **Creative direction:** Clean and minimal? Playful and skeuomorphic? Something in between?
- **Brand compliance concerns:** Any departures from Thoven design system needed?
- **Responsive requirements:** Mobile-first? Any breakpoints with significant layout changes?
- **Animation needs:** Page transitions, micro-interactions, loading states, reveal animations?
- **Accessibility requirements:** Beyond baseline WCAG AA? Specific assistive technology support?
- **Component scope:** Which components need full visual specs? Which are standard enough to skip detail?
- **State coverage:** Any unusual states beyond the standard set (default, hover, active, disabled, loading, error, empty)?

### HOW Meta-Questions

These let the user control execution depth and strategy:

- "Should I dispatch a ui-designer agent for the full spec, or is a lighter treatment enough?"
- "Want a dedup audit against existing components before we design?"
- "How many creative options to explore — 2-3, or go straight to one direction?"
- "Want a boardroom debate on creative direction, or do you already have a clear vision?"
- "Any design system docs I should pull in beyond the standard set?"

### Stage Artifact

**File:** `.dev/design/discuss-visual-direction.md`

Contents: all Q&A captured, locked visual direction decisions, user preferences for execution depth.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output design discuss docs/[feature] --plugin frontend
```

---

## Stage 2: Architect — Design Plan

**D04 ENFORCEMENT:** Follow the D04 Enforcement Protocol from `inner-loop-reference.md`. Every subagent prompt MUST go through `/prompt-generator`. Log status in the Orchestration Log section of this artifact.

**MANDATORY:** Use `/prompt-generator` skill to craft every subagent prompt. No exceptions.

#### Architect Step 0: Verify Context Loaded

Before designing agent prompts, confirm:
- [ ] `domain-agent-map.md` was Read in Step 0 — list ALL agents from the map for this phase as either "dispatched" or "skipped (reason)"
- [ ] Domain Combination Patterns checked — read the Domain Combination Patterns table from domain-agent-map.md and apply any extra considerations (e.g., `routing + auth-ui` = test both authenticated and unauthenticated access)
- [ ] Previous phase review artifact was Read — decisions and context carried forward

This verification appears in the Orchestration Log under `Map compliance`.

### Subagent Assignments

Define each subagent using this structure:

| Field | Description |
|-------|-------------|
| **Agent type** | From domain-agent-map or phase-specific table below |
| **Prompt** | Crafted via `/prompt-generator` |
| **Success criteria** | What the output must contain to pass |
| **Input context** | Files and docs to feed the agent |
| **Execution order** | Parallel vs sequential, dependencies |

#### Phase-Specific Agents

| Agent | Role | When |
|-------|------|------|
| **ui-designer** | Produce full DESIGN_SPEC with all visual details | Always — this is the core agent for DESIGN |
| **Explore** | Component dedup audit across existing codebase | Always — prevents duplicate component creation |

### Spec Structure Definition

Define what the ui-designer must produce:

- **Component list:** Which components need visual specs
- **State matrix:** Which states to cover per component (default, hover, active, disabled, loading, error, empty — plus any custom states from Discuss)
- **Responsive strategy:** Mobile-first or desktop-first? Which breakpoints? Where do major layout shifts occur?
- **Brand rules to validate against:** See Thoven Brand Rules in Review stage

### Dedup Audit Scope

Define what the Explore agent searches:

- Directories: `components/ui/`, `components/shared/`, `components/landing/`, and any feature-specific component dirs
- Search patterns: match by component type (Card, Panel, Modal, Button, etc.)
- Output: name, path, similarity level, reuse recommendation

### Execution Order

Explore agent runs first (or in parallel with ui-designer if independent). Dedup results feed into ui-designer prompt when sequential.

### Overall Success Criteria

- DESIGN_SPEC covers every component identified in Discuss
- All states specified per component
- Tailwind classes are exact (not approximate)
- Responsive behavior defined for all breakpoints
- Accessibility requirements present for every interactive element
- No brand rule violations

### Stage Artifact

**File:** `.dev/design/architect-design-plan.md`

Contents: subagent assignments with prompts, success criteria, execution order, spec structure. Must include the Orchestration Log section.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output design architect docs/[feature] --plugin frontend
```

---

## Stage 3: Execute — Design Spec

**MANDATORY:** Dispatch subagents. The orchestrator NEVER produces design specs inline.

### Dispatch Subagents

Both agents use prompts crafted via `/prompt-generator` in Architect.

**Explore agent** produces: list of existing similar components with name, path, similarity level (exact/high/low/none), and reuse recommendation (reuse directly / extend / create new).

**ui-designer agent** produces the full DESIGN_SPEC with ALL of these sections:

1. **Visual states per component** — default, hover, active, disabled, loading, error, empty. Each state with exact Tailwind classes. No placeholders — concrete values only.

2. **Typography** — `font-display` (Fredoka) for h1/h2, `font-sans` (Montserrat) for everything else, `font-sans font-bold` for buttons. Exact size and weight classes per element.

3. **Animation specs** — trigger (mount/hover/click/scroll/state change), timing/easing, spring params when applicable (`{ type: "spring", stiffness: 500, damping: 35, mass: 0.6 }`), duration for non-spring.

4. **Responsive behavior** — layout at each breakpoint (mobile < 768px, tablet 768-1024px, desktop > 1024px). What changes: grid columns, visibility, spacing, font sizes, component arrangement.

5. **Accessibility** — ARIA roles/labels, keyboard navigation (tab order, arrow keys, escape), focus management (open/close/submit), color contrast (4.5:1 text, 3:1 large text), touch targets (44x44px min).

If multiple creative directions were explored, document which was chosen and why.

### Failure Handling

If a subagent fails: log the failure, continue with remaining agents, surface all failures in Review.

### Stage Artifact

**File:** `.dev/design/execute-design-spec.md`

Contents: full DESIGN_SPEC from ui-designer, dedup audit results from Explore, creative option chosen (if applicable), any subagent failures logged.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output design execute docs/[feature] --plugin frontend
```

---

## Stage 4: Review — Design Compliance

Check Execute output against Architect's success criteria. Every check is evidence-based: pass or fail with specific evidence.

### Thoven Brand Rules Checklist (MANDATORY)

All five checks must pass. No exceptions.

- [ ] **Accent colors:** Uses `amber-500` for CTAs and accents — NOT `orange-*`, NOT `amber-600` for resting state
- [ ] **Typography:** `font-display` (Fredoka) on h1/h2 headings ONLY, `font-sans` (Montserrat) for all other text including buttons
- [ ] **3D button pattern:** Gradient background + `shadow-[0_4px_0_0_rgb(217,119,6)]` + `hover:shadow-[0_2px_0_0_rgb(217,119,6)]` + `active:translate-y-1`, NO borders on 3D buttons
- [ ] **Card components:** Consistent `rounded-2xl shadow-lg` base pattern, no left-hand accent bars, no rainbow card grids
- [ ] **Icons:** All icons from Lucide React library, used selectively (not decorative on every card)

### Component Dedup Verification

- Explore audit results reviewed
- No duplicate components being created when reusable ones exist
- Reuse/extend/create-new decision documented with rationale

### Responsive Coverage

- All breakpoints addressed (mobile, tablet, desktop)
- Layout changes specified at each breakpoint
- No breakpoint left as "same as desktop" without explicit confirmation

### Accessibility Verification

- ARIA roles and labels present on all interactive elements
- Keyboard navigation defined (tab order, arrow keys, escape)
- Focus management specified (open/close/submit transitions)
- Color contrast meets 4.5:1 minimum
- Touch targets meet 44x44px minimum

### Gap Resolution

Surface any gaps or failures to the user via `AskUserQuestion`. The user decides next action:

| Option | When |
|--------|------|
| **Retry Execute** | Re-dispatch failed subagents with adjusted prompts |
| **Back to Architect** | Redesign the execution plan |
| **Back to Discuss** | Revisit visual direction or requirements |
| **Accept** | Approve and advance to DOCUMENT |

No auto-looping (D08). User decides.

#### Dispatch Mandate for Next Phase

The review artifact's context bridge MUST include a "Dispatch Mandate" section listing:
- **Mandatory agents** from domain-agent-map.md for the NEXT phase
- **Conditional agents** with their trigger conditions
- **Skipped agents** with reason

The next phase's Architect must address each listed agent — silent omission is not allowed.

### Stage Artifact

**File:** `.dev/design/review-design-compliance.md`

This artifact IS the context bridge to the DOCUMENT phase. It must contain:
- Summary of what was designed (component inventory, visual direction)
- Brand compliance verdict (all 5 checks with evidence)
- Dedup decision and rationale
- Responsive behavior summary
- Accessibility requirements summary
- Caveats or warnings for DOCUMENT phase
- Recommended focus areas for documentation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output design review docs/[feature] --plugin frontend
```

### Notion Update

After acceptance, update the Dev Tracker card with design decisions. Read the Card ID from MANIFEST's `## Notion Integration > Card ID`.

1. **Update card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: Card ID from MANIFEST
   - Properties: Notes = append design spec summary (visual direction, component inventory, responsive strategy, brand compliance verdict), Last Updated = today's ISO date

2. Display: `📋 Notion: Updated notes — "[Feature Name]" (design spec complete)`

**Notion Protocol:** Follow the Retry + Warning Protocol in `references/notion-integration.md`.
- Phase type: Downstream (status update — check Card ID first)
- Target status: (notes update, no status change)
- Persist warning in: `.dev/design/review-design-compliance.md`

### MANIFEST Update

After Review acceptance, update MANIFEST with:
- Design phase status: complete
- Component inventory (new, reused, extended)
- Design direction chosen
- Responsive strategy summary

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-manifest docs/[feature] --plugin frontend
```

### Phase Transition

After acceptance, display the Next Up block and STOP:

```
---
Next Up

Phase: DOCUMENT — 5-layer docs + wave execution plans

/dev:document

/clear first — fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke DOCUMENT. Do not offer to continue in the same session.

---

## Thoven Brand Rules Reference

Feed this section to the ui-designer agent. The Review checklist validates against these rules.

| Token | Value | Rule |
|-------|-------|------|
| Primary CTA | `amber-500` | NEVER `orange-*`. `amber-600` is hover-only, never resting state |
| Light backgrounds | `amber-50`, `yellow-100` | NEVER `orange-50` |
| Text | `text-slate-900`, `text-slate-600` | Slate palette |
| Display font | Fredoka (`font-display`) | h1/h2 headings ONLY |
| Body font | Montserrat (`font-sans`) | Everything else, including buttons (`font-sans font-bold`) |
| Card base | `rounded-2xl shadow-lg` | No accent bars, no rainbow grids, icons only where functional |
| Icons | Lucide React | Selective and functional, not decorative |
| Spring animation | `{ type: "spring", stiffness: 500, damping: 35, mass: 0.6 }` | Floating panels: no dark backdrop |
| 3D shadow color | `rgb(217,119,6)` | NEVER `rgb(194,65,12)` or `rgb(180,83,9)` |
| Unselected states | `bg-white text-gray-600` | No 3D shadows on unselected items |

### 3D Button Pattern

```tsx
className="bg-amber-500 hover:bg-amber-600 text-white font-sans font-bold
  rounded-lg
  shadow-[0_4px_0_0_rgb(217,119,6)]
  hover:shadow-[0_2px_0_0_rgb(217,119,6)]
  active:shadow-[0_1px_0_0_rgb(217,119,6)]
  active:translate-y-1 transition-all duration-200"
```

No borders. No `font-display`. Shadow uses `rgb(217,119,6)` exclusively.

---

## Common Mistakes

| Mistake | Fix |
|---------|-----|
| Skipping dedup | Always dispatch Explore agent first |
| `orange-500` on CTAs | `amber-500` |
| `amber-600` resting state | `amber-500` (600 is hover-only) |
| `font-display` on buttons | `font-sans font-bold` |
| Borders on 3D buttons | Remove all borders |
| Dark backdrop on panels | No overlay — panel floats freely |
| Wrong shadow RGB | `rgb(217,119,6)` only |
| Producing spec inline | Always dispatch ui-designer agent |
| Missing responsive/a11y | Must specify all breakpoints + ARIA/focus/contrast/touch |

---

## Design Inspiration Sites

| Site | Best For |
|------|----------|
| **Duolingo** | 3D buttons, gamified progress, micro-interactions |
| **Preply** | Marketplace cards, booking flows, profiles |
| **Airbnb** | Card design, whitespace, search UX |
| **Notion** | Clean spacing, sidebar nav, empty states |
| **Linear** | Crisp typography, subtle animations |

---

## Session Breaks

Checkpoint before pausing mid-phase:

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js checkpoint-state docs/[feature] --scope phase --plugin frontend
```

To resume, read the latest stage artifact in `.dev/design/` and continue from that point.
