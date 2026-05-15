---
name: design
description: Creates visual specifications for a frontend feature. Reads DISCOVER bridge, performs backend requirements check, produces contract stubs when endpoints are missing AND MANIFEST Dependencies reconciliation against package.json. Produces full DESIGN_SPEC with Tailwind classes, typography, animation, responsive behavior, and accessibility. ALWAYS RUNS in frontend pipeline. Triggers on /dev:design or when /dev router advances past DISCOVER.
---

# /dev:design — Visual Specification + Design System Compliance

**Phase 3 of /dev pipeline (v4.0: runs BEFORE PLAN). ALWAYS RUNS in the frontend pipeline (D15).** This phase is not conditional on domain tags. Every frontend feature gets a design spec.

## Hard Rules

1. **Read before acting.** Use the Read tool on context bridges, MANIFEST, and design system references before Discuss. Designing from memory produces specs that conflict with existing patterns.
2. **Dispatch agents for spec creation.** The orchestrator reviews and confirms — agents (ui-designer, Explore) produce specs and audit for dedup. Inline spec-writing means you review your own design.
3. **Use agent-prompt-template for dispatches.** Follow `references/agent-prompt-template.md`. Include design system references and decision log.
4. **Show visual mockups inline.** When presenting design options, use visual tools in priority order: (a) `/wireframe` skill for 5-option interactive HTML prototypes, (b) Excalidraw CLI (`excalidraw-cli create --dsl "..." --output`) for quick PNG sketches, (c) ASCII mockups in chat with AskUserQuestion preview. The user should SEE the design before it's written to the spec file (D17). **User MUST approve a layout direction before ui-designer dispatch.**

---

## Inner Loop: Discuss > Architect > Execute > Review

See `inner-loop-reference.md` for canonical stage definitions.

**Artifact directory:** `docs/[Feature]/.dev/design/`

---

## Stage 1: Discuss — Visual Direction

**Read context bridge first:** `.dev/discover/review-design-approval.md`

If the file does not exist, STOP and surface the missing prerequisite to the user.

### Tool Check (MANDATORY)

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry design discuss docs/[feature] --plugin frontend
```

If FAIL, fix missing prerequisites before proceeding.

### MANDATORY CONTEXT LOADING — Step 0

Use the Read tool on each file. Do not proceed to WHAT questions until all reads complete.

1. `Read(.dev/discover/review-design-approval.md)` → extract: confirmed requirements, reuse decisions, user flows, LOCKED decisions from Decision Ledger
2. `Read(references/domain-agent-map.md)` → extract: agent assignments for DESIGN phase (ui-designer, Explore)
3. `Read(references/codebase-context-block.md)` → extract: design system rules, color palette, typography, 3D button pattern
4. `Read(references/bridge-template.md)` → extract: structured bridge format, echo-back protocol
5. `Read(references/decision-ledger-template.md)` → extract: ledger format, how to add OPEN entries for design decisions
6. **CONDITIONAL — strategic context:** If `PRODUCT.md` exists at repo root, `Read(PRODUCT.md)` → extract: register, users, brand personality, anti-references, design principles, voice & copy rules. If absent, note "PRODUCT.md not present — proceeding with bridge context only; recommend `/impeccable teach` for future setup."
7. **CONDITIONAL — design system:** If `DESIGN.md` exists at repo root, `Read(DESIGN.md)` → extract: full token palette, typography hierarchy, component patterns, motion presets, breakpoints. If absent, note "DESIGN.md not present — using inline Brand Rules Reference as fallback; recommend `/impeccable document` for future setup."

If any of items 1-5 is missing, STOP and surface the gap to the user. Items 6-7 are optional and skipped silently when absent.

**Echo-Back (v4.0):** After loading, echo back LOCKED decisions from the DISCOVER bridge:

```
Loaded context from DISCOVER:
- [N] LOCKED decisions: U-01 (description), U-02 (description), ...
- Execution mode: [Expansion/Hold/Reduction]
- Star target: [from Zone 2]
- Scope IN items: [from Zone 3]
- PRODUCT.md status: [loaded with N principles / not present]
- DESIGN.md status: [loaded / not present — using inline fallback]
```

If echo-back is incomplete → re-read bridge.

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

### Context-Aware Design Decisions (MANDATORY — before mockups)

After WHAT questions, scan the codebase for design context using an Explore agent. Then ask these via `AskUserQuestion`, one at a time. Skip questions where the answer is obvious from context. Lead with a recommendation.

1. **Existing patterns:** "We recommend matching [component X] found in the codebase. It handles [similar pattern]. Match that style, extend it, or create something new?"
   - Only ask if Explore found similar components
2. **Installed packages — MANIFEST Dependencies reconciliation (was animation/UI/effect-only check):**

   **Pre-check:** If MANIFEST `## Dependencies (typed)` section is MISSING entirely (e.g., feature predates v4.5 INTAKE), this is itself a BLOCKING escalation:

   > **DESIGN escalation:** MANIFEST has no `## Dependencies (typed)` section. The feature was created before v4.5 INTAKE structured-capture. Run `/dev:intake` Stage 4 in retrospect-mode to populate the table, then resume DESIGN. Bridge cannot advance to PLAN until populated.

   Read MANIFEST `## Dependencies (typed)` for any rows where `Type=npm`. For each such row:

   ```bash
   grep -n "<pkg-name>" /path/to/repo/package.json
   ```

   If the named npm package is NOT present in package.json, surface as a Discuss escalation (BLOCKING):

   > **DESIGN escalation:** INTAKE captured `<pkg-name>` as required (decision <U-NN>) but it is not in `package.json`. Resolve before BUILD — either install (`npm install <pkg-name>@<version>`) or amend the source decision (`U-NN`) to remove the dependency. Bridge cannot advance to PLAN until resolved.

   Generalizes the narrower v4.4 question that asked only about animation/UI/effect libraries.
3. **Design direction:** "Current app tone is [playful with 3D buttons / clean minimal]. We recommend [matching / enhancing] for this feature. Match, enhance, or contrast?"
4. **Component reuse:** "These existing components could work here: [list from dedup audit]. We recommend [reusing X / extending Y]. Reuse directly, extend, or build new?"
5. **Micro-interactions:** "We recommend [specific animation] for [specific interaction]. Want micro-interactions? (hover effects, page transitions, loading animations, reveal-on-scroll)"

**RULE:** Every question uses `AskUserQuestion` with a concrete recommendation first (D17). Present choices, not open-ended questions.

### Layout Mockup + Approval Gate (MANDATORY — Gate 1)

Before dispatching any design agent, the orchestrator MUST produce an ASCII layout mockup based on Discuss answers. Present via `AskUserQuestion` with preview pane:

"Here's my understanding of the layout based on our discussion:"

[ASCII mockup using box-drawing characters showing the page structure: header, sidebar, content areas, component placeholders]

"Approve this layout direction before I create the full design spec?"
  A) Approve — proceed to full design spec
  B) Adjust — [user describes changes], re-render mockup
  C) Reject — revisit visual direction

**GATE 1: User MUST approve the layout before Execute stage begins.** If rejected, iterate on the mockup with feedback. If adjusted, update and re-present. Do not dispatch ui-designer until approved.

Record in discuss artifact: `Layout approved: yes / no`

### Component Decomposition (Expansion Mode Only)

**Skip entirely if execution mode is Hold or Reduction.**

If the approved layout has 4+ visually distinct sections (e.g., hero, pricing grid, testimonials, footer), ask via `AskUserQuestion`:

"This page has [N] distinct sections: [list them]. We recommend designing as one unit for consistency, but separate section design gives deeper creative exploration per section."
  A) Design as one unit (faster, standard approach)
  B) Design sections separately (deeper per-section exploration, then assembly)

**If B:** Execute dispatches one ui-designer agent per section. Each gets: approved layout context + brand rules + section scope. After all complete, orchestrator assembles partial specs into a single DESIGN_SPEC and reviews cross-section consistency: spacing rhythm, typography scale, color usage, responsive breakpoints, animation language. Any inconsistencies → same-agent fix before final spec.

**If A:** Standard single ui-designer dispatch (unchanged from current behavior).

### HOW Meta-Questions

These let the user control execution depth and strategy:

- "Should I dispatch a ui-designer agent for the full spec, or is a lighter treatment enough?"
- "Want a dedup audit against existing components before we design?"
- "How many creative options to explore — 2-3, or go straight to one direction?"
- "Want a boardroom debate on creative direction, or do you already have a clear vision?"
- "Is this a high-stakes peak moment (first-run, paywall, celebration/completion, share, recital, milestone)? If yes, I can route through the `customer-obsession-design-thinking` 11-star framework before mockups."
- "Any design system docs I should pull in beyond the standard set?"

### Stage Artifact

**File:** `.dev/design/discuss-visual-direction.md`

Contents: all Q&A captured, locked visual direction decisions, user preferences for execution depth.

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output design discuss docs/[feature] --plugin frontend
```

---

## Stage 2: Architect — Design Plan

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry design architect docs/[feature] --plugin frontend
```

If FAIL, fix missing prerequisites before proceeding.

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

| Agent / Skill | Role | When |
|---|---|---|
| **ui-designer** | Produce full DESIGN_SPEC with all visual details | Always — core agent for DESIGN |
| **Explore** | Component dedup audit across existing codebase | Always — prevents duplicate component creation |
| **GSAP specialist** (gsap-react, gsap-scrolltrigger, gsap-timeline, etc.) | Motion spec author | When Discuss flagged scroll animation / parallax / timeline / reveal — route to the specific GSAP skill matching the interaction (see Motion Routing below) |
| **customer-obsession-design-thinking** | 11-star + peak-end framing | When Discuss flagged this as a peak moment (first-run, paywall, celebration, share, milestone) |

#### Motion Routing (when animation is in scope)

If Discuss locked any motion primitives, the Architect MUST name the specific GSAP skill in the ui-designer dispatch prompt:

| Interaction | Route to (skill) |
|---|---|
| Scroll-triggered reveals, parallax, pin/unpin | `gsap-scrolltrigger` |
| Multi-step orchestrated sequences | `gsap-timeline` |
| React-specific patterns (useGSAP, context, cleanup) | `gsap-react` |
| Performance budgets / will-change / FLIP transitions | `gsap-performance` |
| Base tweens, easings, stagger | `gsap-core` |
| Plugin-specific (Flip, Draggable, MorphSVG, SplitText) | `gsap-plugins` |
| Next.js App Router / SSR-aware GSAP | `gsap-frameworks` |
| Utility math (clamp, mapRange, interpolate) | `gsap-utils` |

The DESIGN_SPEC must specify: which GSAP skill the motion conforms to, exact timing/easing values, reduced-motion fallback. **If GSAP skills are not installed in the project, recommend installing the specific skill needed; do not force framer-motion as fallback without surfacing the choice to the user.**

#### Optional Project-Local Design Enforcer

If the project has a `thoven-designer` skill installed (Thoven projects), chain the `ui-designer` dispatch through it so its references (`brand-identity.md`, `brand-colors.md`, `component-patterns.md`, `error-messaging.md`, `viewport-constraint.md`) override the inline brand defaults. See `codebase-context-block.md` Phase-Specific Context Additions for DESIGN for the full reference list.

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

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry design execute docs/[feature] --plugin frontend
```

If FAIL, fix missing prerequisites before proceeding.

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

### Entry Validation

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-entry design review docs/[feature] --plugin frontend
```

If FAIL, fix missing prerequisites before proceeding.

Check Execute output against Architect's success criteria. Every check is evidence-based: pass or fail with specific evidence.

### Backend Requirements Check (v4.0 — MANDATORY)

After verifying the design spec, check all interactions in the DESIGN_SPEC for backend API dependencies.

**Step 1: Derive API calls from design interactions**

For each component interaction in the DESIGN_SPEC (button clicks, form submissions, data displays, real-time updates), identify what backend endpoint it requires.

**Step 2: Check endpoint status**

| Interaction | Endpoint Needed | Method | Status |
|-------------|----------------|--------|--------|
| [from DESIGN_SPEC] | [endpoint] | [GET/POST/etc] | EXISTS / MISSING |

Check against `lib/*-api.ts` files and `docs/API_ENDPOINTS_REFERENCE.md` if available.

**Step 3: If any MISSING endpoints detected**

Produce `backend-contract-stub.md` using the template from `references/backend-contract-stub-template.md`. Place it at `.dev/design/backend-contract-stub.md`.

Present via AskUserQuestion:

> "[N] backend endpoints needed for this design don't exist yet."
>
> - **A) Proceed to PLAN with typed mocks** — Frontend builds against mock data. Swap for real API when backend delivers. Backend contract stub saved for handoff.
> - **B) Pause frontend, hand off to backend** — Produce the contract stub and pause. Resume after backend `/dev:handover` delivers confirmed contract.
> - **C) Both in parallel** — Frontend proceeds with mocks AND backend starts building from the contract stub.

Record the choice in the Decision Ledger as a LOCKED decision.

**Step 4: If all endpoints exist**

State: "All backend endpoints exist. No contract stub needed." Proceed to the brand rules checklist.

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

### Voice & Copy Verification (when PRODUCT.md present)

If PRODUCT.md was loaded in Step 0, verify the DESIGN_SPEC against its Voice & Copy section:

- [ ] All button labels, headings, microcopy match the project voice (encouraging, never accusatory)
- [ ] No anti-references surfaced in copy (no streak-shaming, no SaaS jargon, no AI buzzwords)
- [ ] Empty states framed positively per voice guidance
- [ ] Error messages follow the project's error-tone rules (e.g., Thoven: amber not red, "let's try again" not "invalid")
- [ ] Specific over generic ("Day 47 of practice" > "Great job!")

If any item fails AND `impeccable` is installed: recommend `/impeccable clarify` before Gate 2.

If PRODUCT.md not loaded, state "PRODUCT.md not present — voice check skipped; relying on inline brand rules only."

### Optional Quality Layer (impeccable, if installed)

If the `impeccable` plugin is installed, offer to route the spec through one or more opt-in passes BEFORE Gate 2. Present via `AskUserQuestion`:

"Want to run any quality passes before final approval?"

| Option | Pass | When |
|---|---|---|
| A | `/impeccable critique` | UX heuristic review (hierarchy, clarity, emotional resonance) |
| B | `/impeccable audit` | Technical pass — a11y deep-check + perf + responsive |
| C | `/impeccable harden` | Edge cases, errors, empty states, i18n |
| D | `/impeccable onboard` | First-run, activation, peak moments |
| E | `/impeccable polish` | Pre-ship final pass |
| F | `/impeccable clarify` | Voice/copy rewrite (when PRODUCT.md present) |
| G | Skip | Proceed to Gate 2 |

Multiple passes allowed. Each pass's output annotates the spec; user re-approves after each. **If impeccable is NOT installed, skip this subsection silently — but for any future frontend project, recommend installing it as the opt-in design quality layer.**

### Final Design Approval (Gate 2 — MANDATORY)

After all review checks pass (brand rules, dedup, responsive, accessibility, backend requirements), present the complete design to the user via `AskUserQuestion`:

"Design spec complete. Summary: [N components, responsive at 3 breakpoints, brand rules: all 5 pass, backend: all endpoints exist / N missing with contract stub]."

"Review the full spec at `.dev/design/execute-design-spec.md` and approve before advancing to PLAN."
  A) Approve — advance to PLAN
  B) Request changes — [user specifies adjustments]
  C) Back to Discuss — revisit visual direction entirely

**GATE 2: User MUST approve before DESIGN phase completes.** Record in review artifact: `Final design approved: yes / no`

### Gap Resolution

Surface any gaps or failures to the user via `AskUserQuestion`. The user decides next action:

| Option | When |
|--------|------|
| **Retry Execute** | Re-dispatch failed subagents with adjusted prompts |
| **Back to Architect** | Redesign the execution plan |
| **Back to Discuss** | Revisit visual direction or requirements |
| **Accept** | Approve and advance to PLAN |

No auto-looping (D08). User decides.

#### Dispatch Mandate for Next Phase

The review artifact's context bridge MUST include a "Dispatch Mandate" section listing:
- **Mandatory agents** from domain-agent-map.md for the NEXT phase
- **Conditional agents** with their trigger conditions
- **Skipped agents** with reason

The next phase's Architect must address each listed agent — silent omission is not allowed.

### Stage Artifact

**File:** `.dev/design/review-design-compliance.md`

This artifact IS the context bridge to the PLAN phase. It must follow `references/bridge-template.md` format. It must contain:
- LOCKED decisions from Decision Ledger (including any new design decisions made in this phase)
- Backend requirements status (all exist / contract stub produced)
- Summary of what was designed (component inventory, visual direction)
- Brand compliance verdict (all 5 checks with evidence)
- Dedup decision and rationale
- Responsive behavior summary
- Accessibility requirements summary
- Caveats or warnings for PLAN phase
- Recommended focus areas for architecture and task breakdown

```bash
node ${PLUGIN_ROOT}/../shared/tools/dev-pipeline-tools.js validate-stage-output design review docs/[feature] --plugin frontend
```

### Notion Update

After acceptance, update the Dev Tracker card with design decisions. Read the Card ID from MANIFEST's `## Notion Integration > Card ID`.

1. **Update card** using `mcp__plugin_Notion_notion__notion-update-page`:
   - Page ID: Card ID from MANIFEST
   - Properties: Notes = append design spec summary (visual direction, component inventory, responsive strategy, brand compliance verdict), Last Updated = today's ISO date

2. Display: `📋 Notion: Updated notes — "[Feature Name]" (design spec complete, bridges to PLAN)`

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

Phase: PLAN — Architecture decisions + task breakdown (informed by this design)

/dev:plan

/clear first — fresh context window
```

State persists to disk (MANIFEST + stage artifacts). Nothing is lost on `/clear`.

**STOP.** Do not invoke PLAN. Do not offer to continue in the same session.

---

## Brand Rules Reference

This inline block is the **non-negotiable cheatsheet** for the `ui-designer` dispatch. It is the **fallback** when no project-level `DESIGN.md` exists.

**Precedence (locked):**
- **`DESIGN.md` present** → treat DESIGN.md as source-of-truth. This inline table becomes the must-not-violate guardrail set; pull deeper tokens, scales, and component patterns from DESIGN.md.
- **`PRODUCT.md` present** → its design principles + voice rules govern intent; this block governs visual mechanics.
- **Project-local design enforcer installed (e.g., `thoven-designer`)** → the enforcer's references override these inline defaults.

### Non-Negotiables (always enforce)

| Token | Value | Rule |
|---|---|---|
| Primary CTA accent | `amber-500` | NEVER `orange-*`. `amber-600` is hover-only |
| Display font | Fredoka (`font-display`) | h1/h2 ONLY |
| Body / button font | Montserrat (`font-sans`) | Buttons use `font-sans font-bold` — NEVER `font-display` |
| 3D shadow RGB | `rgb(217,119,6)` | NEVER `rgb(194,65,12)` or `rgb(180,83,9)` |
| 3D button borders | None | No borders on 3D buttons, ever |
| Card base | `rounded-2xl shadow-lg` | No left-hand accent bars, no rainbow grids |

### Reference 3D Button Pattern

```tsx
className="bg-amber-500 hover:bg-amber-600 text-white font-sans font-bold
  rounded-lg
  shadow-[0_4px_0_0_rgb(217,119,6)]
  hover:shadow-[0_2px_0_0_rgb(217,119,6)]
  active:shadow-[0_1px_0_0_rgb(217,119,6)]
  active:translate-y-1 transition-all duration-200"
```

No borders. No `font-display`. Shadow uses `rgb(217,119,6)` exclusively.

### For Everything Else

- **`DESIGN.md`** (if present at repo root): full amber palette tokens, slate scale, typography sizes/weights, motion presets, responsive breakpoints, overlay system, skeuomorphic depth rules, reusable component inventory.
- **`PRODUCT.md`** (if present at repo root): design principles (match tone to surface, trust before delight, design peaks not baselines, soft over alarming, handcrafted not templated, design for promoters, one metaphor per surface), voice & copy rules, anti-references.

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
| Reading plan bridge instead of discover | v4.0: DESIGN reads `.dev/discover/review-design-approval.md`, not PLAN bridge |
| Skipping backend requirements check | Backend check is MANDATORY in DESIGN Review — missing endpoints not caught until BUILD otherwise |
| Routing to DOCUMENT after DESIGN | v4.0: PLAN comes after DESIGN — Next Up must route to `/dev:plan` |
| Not adding design decisions to ledger | Add OPEN entries for design decisions, promote to LOCKED in Review — otherwise PLAN can't reference them |
| Ignoring DESIGN.md when present | If `DESIGN.md` loaded in Step 0, it IS source-of-truth; inline rules are guardrails only |
| Auto-invoking impeccable | Impeccable passes are opt-in via menu at Review, never auto-applied |
| Routing all motion to "framer-motion default" | Use the GSAP routing table — scroll → `gsap-scrolltrigger`, timeline → `gsap-timeline`, etc. |
| Skipping 11-star prompt on peak moments | Discuss must offer `customer-obsession-design-thinking` for first-run, paywall, share, celebration features |
| Voice drift on empty/error states | If PRODUCT.md present, Voice & Copy verification is MANDATORY before Gate 2 |

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
