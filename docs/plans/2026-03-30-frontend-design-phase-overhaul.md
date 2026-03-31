# Frontend DESIGN Phase Overhaul — Design Document

**Date:** 2026-03-30
**Status:** Approved (brainstorm complete, all decisions locked)
**Target:** dev-pipeline-frontend plugin v4.1.0 (thoven-dev marketplace)
**Related:** BUILD Phase Overhaul (backend v4.0.0) shares patterns (verify-fix loop, Agent Teams opt-in)

## Problem Statement

The DESIGN phase (dev-pipeline-frontend v4.0.0) has 6 enforcement failures and a missing component decomposition pattern.

### 6 Enforcement Failures

1. Hard Rule 4 ("show mockups inline") is prose at line 15, never referenced in any stage
2. `/wireframe` skill outputs HTML to browser (`open`), not to chat
3. Excalidraw outputs PNG to disk — can't display inline in terminal
4. No gate checking mockup approval at Discuss-to-Architect transition
5. thoven-designer's GATE 1.5 (mandatory wireframe approval) is bypassed — pipeline invokes its own DESIGN skill, never calls thoven-designer
6. 21st Magic MCP tools (`mcp__magic__*`) are available but zero references in any pipeline file

### Missing: Component Decomposition

Complex designs (landing pages, dashboards, multi-section views) are treated as one monolithic design task. A single `ui-designer` agent writes the entire DESIGN_SPEC. No breakdown into components, no per-component approval, no assembly/unification step.

## Architecture Decisions (Locked)

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Component granularity | Adaptive — lead agent decides per feature | Landing pages need section-level (hero, pricing, footer). Dashboards may need component-level for data-heavy parts. Simple settings pages need no decomposition. One size doesn't fit all. |
| Lead agent | thoven-designer | Already has brand context, 7 reference files, Phase 0 understand + Phase 1.5 wireframe gate. Upgrade to handle decomposition and unification. |
| Mockup format | Mixed — lead agent picks per context | ASCII for quick layouts, 21st Magic for component ideas, /wireframe for interactive prototypes. Lead picks based on complexity. |
| Pre-mockup decisions | Mandatory design decisions via AskUserQuestion BEFORE any mockup work | Context-aware questions based on existing design system, installed packages, and codebase patterns. |

## Updated DESIGN Phase Flow

### Pipeline DESIGN Skill (updated stages)

```
Stage 1: DISCUSS — Visual Direction
  (existing WHAT + HOW questions, unchanged)

Stage 2: ARCHITECT — Design Plan
  Invoke thoven-designer as lead agent
  (replaces dispatching ui-designer directly)

Stage 3: EXECUTE — thoven-designer leads the design
  (see thoven-designer flow below)

Stage 4: REVIEW — Design Compliance
  Brand rules checklist
  Component dedup verification
  Responsive + accessibility verification
  (existing, plus unification check)
```

### thoven-designer Flow (Lead Agent)

```
Phase 0: CONTEXT LOAD
  - Read design system (existing components, patterns, colors)
  - Read thoven-designer/references/ (7 files: brand rules, palette, typography)
  - Scan codebase for existing similar features
  - Know installed packages (emoji, animation, icons, component libraries)
  - Read previous DESIGN_SPECs for visual language consistency

Phase 0.5: DESIGN DECISIONS (AskUserQuestion — BEFORE any mockup work)
  Context-aware questions based on what was found in Phase 0:
  - "This feature is similar to [existing feature]. Match that style or diverge?"
  - "You have [memoji/lottie/framer-motion] installed. Use it here?"
  - "Current app tone is [playful/serious]. Enhance, match, or contrast?"
  - "These existing components could be reused: [X, Y, Z]. Reuse or redesign?"
  - "Do you want [specific package] for this? (e.g., emoji picker, confetti, etc.)"

  RULE: Present as concrete AskUserQuestion choices, not open-ended questions.
  RULE: Each decision is its own AskUserQuestion. One at a time.

Phase 1: LAYOUT MOCKUP
  - Create full page/feature layout with decisions applied
  - Show in chat (format chosen by lead: ASCII, AskUserQuestion preview, or 21st Magic)
  - GATE: User MUST approve layout direction before proceeding
  - If rejected: iterate on layout with feedback, re-show

Phase 1.5: DECOMPOSE
  - Lead breaks approved layout into design sections/components
  - Granularity is adaptive:
    - Landing page: 3-6 sections (hero, pricing, testimonials, footer)
    - Dashboard: section-level for layout, component-level for data widgets
    - Settings page: may skip decomposition entirely (single agent)
    - Simple feature: may skip decomposition (single agent)
  - Each section gets a brief: scope, context from layout, brand rules, decisions from 0.5
  - Present decomposition plan to user for confirmation

Phase 2: COMPONENT DESIGN (subagents)
  - Dispatch one subagent per section/component
  - Each subagent:
    1. Gets: layout context + section scope + brand rules + Phase 0.5 decisions
    2. Designs their section
    3. Shows mockup in chat (format picked by lead per component complexity)
    4. Gets user approval before writing to spec
  - Sequential by default (user sees each one in order)
  - Parallel opt-in if sections are visually independent

Phase 3: UNIFY (lead reviews all components)
  - Lead agent reviews all approved component designs together
  - Checks cross-component consistency:
    - Spacing rhythm matches across sections
    - Typography scale is consistent
    - Color usage follows brand rules
    - Responsive breakpoints align
    - Animation/motion language is cohesive
  - Flags inconsistencies -> same-agent fix (mirrors BUILD verify-fix pattern)
  - Produces unified DESIGN_SPEC with all components assembled

Phase 4: FINAL APPROVAL
  - Show assembled full design in chat
  - User final approval
  - GATE: must approve before DESIGN phase completes
  - Write final DESIGN_SPEC to docs/[feature]/
```

### Mockup Format Selection (Lead Picks Per Context)

| Context | Recommended Format | Why |
|---------|-------------------|-----|
| Quick layout direction (Phase 1) | ASCII in AskUserQuestion preview | Fast iteration, 2-3 options side by side |
| Component with specific visual needs | 21st Magic `component_inspiration` | Visual richness for creative decisions |
| Detailed interactive prototype | `/wireframe` skill (opens in browser) | Full HTML, 5 options, interactive |
| Simple component (button, card) | ASCII directly in chat | No tool overhead needed |
| Complex data visualization | 21st Magic `component_builder` | Needs visual fidelity |

**Rule: Lead agent picks format. User always SEES something in chat before anything is written to a file. Files are supplements, not the primary presentation.**

### Tools Integration

| Tool | Phase | Purpose |
|------|-------|---------|
| `mcp__magic__21st_magic_component_inspiration` | Phase 0.5 + Phase 2 | Explore visual directions, generate component ideas |
| `mcp__magic__21st_magic_component_builder` | Phase 2 | Build approved component variants |
| `mcp__magic__21st_magic_component_refiner` | Phase 3 | Iterate on components after unification feedback |
| `/wireframe` skill | Phase 1 (if Expansion mode) | Full HTML prototype with 5 options |
| thoven-designer references (7 files) | Phase 0 | Brand rules, color palette, typography, design system |
| AskUserQuestion (preview panes) | All phases | In-chat mockup display and approval |

### Enforcement Mechanisms

| Gate | Location | Enforcement |
|------|----------|-------------|
| Phase 0.5 decisions complete | Before Phase 1 | Artifact: list of decisions made, stored in discuss artifact |
| Layout approved | Phase 1 -> Phase 1.5 | AskUserQuestion confirmation. Artifact field: "Layout approved: yes" |
| Decomposition confirmed | Phase 1.5 -> Phase 2 | User confirms section breakdown |
| Each component approved | Phase 2 (per subagent) | AskUserQuestion per component. Artifact field per section. |
| Unification clean | Phase 3 -> Phase 4 | Lead agent sign-off on consistency |
| Final design approved | Phase 4 -> REVIEW stage | AskUserQuestion final approval |

## Relationship to BUILD Phase Overhaul

### Shared Patterns

| Pattern | BUILD Overhaul | DESIGN Overhaul |
|---------|---------------|-----------------|
| Lead + subagent dispatch | Orchestrator dispatches wave agents | thoven-designer dispatches component agents |
| Verify-fix loop | rspec + must-haves + code-review -> retry | Unification consistency check -> same-agent fix |
| Living artifact | API_CONTRACT.md updated by orchestrator | DESIGN_SPEC assembled by lead from components |
| Agent Teams opt-in | User opts in per wave during Discuss | User opts in for parallel component design |
| Sequential default | Parallel subagents (unchanged) | Sequential component presentation (user sees each) |

### Implementation Sequencing

Both overhauls ship as plugin updates:
- Backend plugin v4.0.0: BUILD overhaul (Phase 1 + Phase 2 of that plan)
- Frontend plugin v4.1.0: DESIGN overhaul (this plan)

Frontend depends on backend for shared `inner-loop-reference.md` (Item 2 of BUILD overhaul).

## NOT in Scope

- **Changing the DESIGN phase position** — v4.0.0 moved DESIGN before PLAN. This stays.
- **Replacing thoven-designer** — Upgrading it, not replacing it.
- **Making 21st Magic mandatory** — Added to tool list, lead decides when to use. MCP tools can be flaky.
- **Automated visual regression testing** — Computer Use verification (BUILD overhaul Item 7) may cover this later.
- **Design token system** — Extracting spacing/color/typography into a formal design token file. Possible future improvement.

## What Already Exists (Reused)

- **thoven-designer skill** — 350 lines, 7 reference files, Phase 0-4 flow with GATE 1.5. Upgraded, not rewritten.
- **DESIGN skill stages** — Discuss/Architect/Execute/Review pattern. Architect stage updated to invoke thoven-designer as lead.
- **`/wireframe` skill** — 405 lines, generates 5 HTML options. Used as supplement, not primary.
- **21st Magic MCP tools** — Available in environment. Added to tool list for lead and component agents.
- **Brand rules checklist** — 5 mandatory checks in Review stage. Unchanged.
- **Mode-propagation-reference.md** — Already defines wireframe usage per mode. Now actually enforced.

## Open Questions

1. **21st Magic reliability** — Need to test the MCP tools in a real DESIGN run before relying on them. If unreliable, ASCII + /wireframe are the fallback stack.
2. **thoven-designer location** — Currently in frontend project (`.claude/skills/`). Should it move to the plugin? Or stay project-level since it has Thoven-specific brand context?
3. **Cross-feature design consistency** — The lead agent checks consistency within a feature. Cross-feature consistency (does the new dashboard match the existing one?) requires reading previous DESIGN_SPECs. This works but gets expensive for large apps.

## Audit Evidence

### Files Examined
- Plugin DESIGN skill: `~/.claude/plugins/cache/thoven-dev/dev-pipeline-frontend/4.0.0/skills/design/SKILL.md` (448 lines)
- Previous version: `3.3.1/skills/design/SKILL.md` (394 lines)
- Wireframe skill: `~/.claude/skills/wireframe/SKILL.md` (405 lines)
- thoven-designer: `/Users/andresmartinez/thoven/frontend/.claude/skills/thoven-designer/SKILL.md` (350 lines)
- thoven-designer references: 7 files in `references/`
- Pipeline references: 5 files in `4.0.0/references/`
- Mode-propagation-reference: wireframe usage is mode-dependent but never enforced

### Key Finding
Hard Rule 4 about inline mockups is identical in v3.3.1 and v4.0.0. The rule has never been operationalized in any version of the plugin. The thoven-designer skill has the correct enforcement pattern (GATE 1.5) but the pipeline bypasses it entirely.
