---
name: persona
description: PERSONA sub-phase — runs between DISCOVER Zone 4 and DESIGN entry. Three personas (Frontend Designer, Product, Backend opt-in) grill the user with one question at a time using grill-me style. Captures answers to MANIFEST. Each Q+A that surfaces a decision becomes a Decision Ledger entry.
trigger_phrases: ["persona", "/dev:persona", "PERSONA"]
---

# PERSONA — Sub-phase between DISCOVER and DESIGN

## When this fires

Automatically after DISCOVER Zone 4 (HOW) closes, before DESIGN entry. Three personas execute sequentially:

1. **Frontend Designer Persona** — always runs (Frontend tag mandatory in this pipeline).
2. **Product Persona** — always runs (every feature has product implications).
3. **Backend Persona** — runs ONLY when MANIFEST has `Cross-Stack: backend` flag. Locked at user pre-flight 2026-05-07 — opt-in keeps friction proportional to incident evidence (no Teach Mode failure attributed to backend-persona absence).

## Question budget per persona (mode-propagated)

| Mode | Frontend Designer | Product | Backend (if Cross-Stack) |
|------|-------------------|---------|--------------------------|
| Reduction | 3 | 3 | skipped entirely |
| Hold | 5 | 5 | 5 |
| Expansion | 8 | 8 | 8 + No-ego cross-persona challenge round |

## Style (lifted from `~/.claude/skills/grill-me/SKILL.md`)

- **One question at a time.** Never bundle two questions into one AskUserQuestion call.
- **Recommended answer first.** Provide a default the user can accept with a single click. Mark as `(Recommended)` when there's a clear best choice.
- **Codebase-exploration shortcut.** Before asking, grep the repo for the answer. Example: question "Which design-system primitives are you reusing?" — first run `grep -rn "from '@/components/ui/" src/` and present the actual list. The user picks; doesn't author from scratch.
- **Relentless.** Do not skip a question because it feels obvious. The act of answering surfaces decisions.
- **Exit conditions:** user says "no more questions" OR question budget exhausted.

## Frontend Designer Persona — question pool

Pick `budget` questions from this list (Reduction = 3, Hold = 5, Expansion = 8). Order by feature relevance. Sequence is not random — start with the most-load-bearing question for THIS feature.

1. **Visual hierarchy / motion:** "What is the primary visual that the user must see in the first 200ms? What animation lead-in are you imagining?"
2. **State enumeration:** "Walk me through the empty / loading / partial / error / success states for the canonical screen. Which states have you not designed?"
3. **Responsive cutoffs:** "Which breakpoints does this feature change layout at? Mobile-first or desktop-first?"
4. **Design-system reuse:** "Of [grep `@/components/ui/` for the actual list], which are you reusing vs. introducing? Why introduce a new one?"
5. **Micro-interactions / haptics:** "On the primary action, what feedback does the user get within 100ms?"
6. **Accessibility:** "Keyboard nav path. Focus order. Screen reader announcements at key state changes."
7. **Brand consistency:** "Color and typography choices that depart from existing pages — name them."
8. **Error UX:** "When the backend rejects, what does the user see and what's their next step?"

## Product Persona — question pool

1. **Job to be Done framing:** "Complete the sentence: 'Users hire this feature to ___ when they ___ so they can ___.'"
2. **First-time experience:** "What does the very first session look like? What do they see at second 0, 30, 120?"
3. **Acceptance signal:** "What single observable user behavior tells you this shipped well?"
4. **Edge users:** "Who is the user this feature works *worst* for? At what scale of usage does it break?"
5. **Success metric:** "Which existing dashboard line do you expect to move? By how much, by when?"
6. **Monetization implication:** "Does this feature change pricing tier eligibility or unlock?"
7. **Scope boundaries:** "Name three near-adjacent features this *does not* include. Be specific so the team doesn't guess."
8. **Failure-of-imagination:** "If a competitor shipped a 10x version of this in 6 months, what would they have built that you didn't?"

## Backend Persona — question pool (Cross-Stack: backend only)

1. **Data model integrity:** "What's the entity ER for this feature? What's the parent record? What soft-delete or auth-bypass risk exists per LEARNINGS Lesson 5 (CD-010)?"
2. **API contract design:** "What's the response envelope? Status codes? Auth strategy? Idempotency keys?"
3. **Migration safety:** "Does this require schema migration? Backfill strategy?"
4. **Performance under load:** "Expected RPS at 90th percentile? N+1 risk on the primary query?"
5. **Authorization:** "Who can read each field? Tenant isolation strategy?"
6. **Infrastructure cost:** "Net incremental monthly cost at expected scale?"
7. **Observability:** "Which Datadog dashboards / Honeybadger alerts get added?"
8. **Data retention / compliance:** "PII fields? COPPA implications? Retention policy?"

## Expansion-mode "No-ego cross-persona challenge"

After all 3 personas complete, a 4th round runs (Expansion only): each persona challenges the others' answers. Frontend challenges Product on UX assumptions. Product challenges Backend on user-impact of API choices. Backend challenges Frontend on data-flow implications.

Example: Frontend persona answered "we'll show 100 cards in a virtualized list." Backend challenges: "What's the API page size? If user scrolls fast, do we hit rate limits? Who cancels in-flight requests?"

3 challenge questions per pair (FE↔Product, Product↔Backend, FE↔Backend) = 9 challenge questions total. Stretch budget; user can exit early.

## Persona answers feed MANIFEST

After each persona completes, write to MANIFEST:

```markdown
## Frontend Persona Answers
(Captured during PERSONA sub-phase. Each Q+A pair below; pairs that surfaced a decision are also logged in Decision Ledger as U-NN with Source=PERSONA:Frontend.)

**Q1 — Visual hierarchy / motion**
A: <user's answer verbatim>

**Q2 — State enumeration**
A: <user's answer verbatim>

[...]
```

Same shape for `## Product Persona Answers` and `## Backend Persona Answers`.

## Decision Ledger emission

For each Q+A that surfaces a structural decision (not just a free-text observation), emit:

```markdown
| U-NN | <decision in verbatim "We will X" or "X is Y" form> | LOCKED | PERSONA:<persona-name> | <ISO timestamp> |
```

Example: Frontend Q4 (Design-system reuse) answered "We're introducing a new `<ConfettiBurst>` primitive." → Decision Ledger gets `| U-23 | Introduce new design-system primitive ConfettiBurst | LOCKED | PERSONA:Frontend | 2026-05-09T... |`.

## Codebase-exploration shortcut

Before posing a question that has a code-derivable answer, run grep first. If the grep returns a definitive set, present it as the recommended-answer dropdown. Example questions with shortcuts:

- "Which design-system primitives are you reusing?" → `grep -rn "from '@/components/ui/" src/ | sort -u | head -20` → present as multi-select.
- "Which API endpoints does this feature touch?" → `grep -rn "fetch\\|api\\." src/ | wc -l` → present as starting count.
- "Which existing pages share visual language?" → `grep -rn "import.*Layout" src/pages/` → present as list.

If the grep is inconclusive (zero or too-many results), fall back to free-text question.

## Output

After PERSONA closes, the orchestrator writes a context bridge `<feature>/.dev/persona/review-persona.md` containing:

- Frontend persona Q+A summary (verbatim)
- Product persona Q+A summary (verbatim)
- Backend persona Q+A summary (if run)
- Cross-persona challenge findings (Expansion only)
- Decision Ledger entries surfaced
- DESIGN entry guidance: which design-system primitives need extending, which API contracts need negotiating, which JTBD framings need verification

## Mode propagation summary

- **Reduction:** Frontend 3 + Product 3 = 6 questions. Backend skipped. ~3-5 minutes.
- **Hold:** Frontend 5 + Product 5 + Backend 5 (if Cross-Stack) = 10–15 questions. ~10-15 minutes.
- **Expansion:** Frontend 8 + Product 8 + Backend 8 + 9 challenge = 33 questions max. ~25–35 minutes.

## Anti-patterns to avoid

- **AP-04 wire-in ceremony:** PERSONA must produce MANIFEST artifacts that DESIGN reads. Sub-phase is not "ask questions then forget" — answers feed downstream.
- **AP-07 aspirational:** every question has a concrete answer shape (count, name, list). No "ensure good UX" framing.
- **AP-13 advisory-as-gate:** *(superseded — see PERSONA → DESIGN gate semantics below).*

**PERSONA → DESIGN gate semantics (BLOCK):** PERSONA gates DESIGN entry on presence-of-sections — `dev/SKILL.md`'s Phase Boundary Aggregation table requires that `## Frontend Persona Answers` AND `## Product Persona Answers` (AND `## Backend Persona Answers` if Cross-Stack: backend) sections be populated in MANIFEST before DESIGN can begin. Empty placeholder sections do not count; each persona must have at least its mode-budgeted Q+A count.

This was clarified at Wave 6.5 quality gate — earlier draft phrased PERSONA as "advisory" which conflicted with the orchestrator's BLOCK semantics. Authoritative: BLOCK at presence-of-population. The questions themselves are user-driven (the user can exit any single question), but the section must be populated to advance.

## AP-15 Amendment Propagation

When a LOCKED Decision Ledger entry sourced from a persona (`Source=PERSONA:<name>`) is later amended (e.g., DESIGN amends U-NN that originated in PERSONA:Frontend Q4), the corresponding persona must be re-run for the questions that surface that decision.

**Trigger:** orchestrator detects a LOCKED-decision amendment via `git log` of MANIFEST `## Decisions Log` after the persona's bridge timestamp.

**Action:** orchestrator surfaces "PERSONA-sourced decision <U-NN> was amended after PERSONA closed. Re-run `/dev:persona --persona Frontend --question Q4` to refresh the answer." User confirms; persona re-runs the single question; MANIFEST `## <Persona> Persona Answers` updates the corresponding Q+A pair; new ledger row supersedes the old.

**Why:** AP-15 (LOCKED amendment propagation). Without this, persona-sourced decisions become stale signals — the answer was captured against an earlier scope.

**Mode propagation:** Reduction skips re-runs (lower bar). Hold + Expansion run the single-question refresh.

## Acceptance criteria

A new feature passing through PERSONA emits MANIFEST sections:
- `## Frontend Persona Answers` (3 Q+A pairs in Reduction, 5 in Hold, 8 in Expansion)
- `## Product Persona Answers` (same budget)
- `## Backend Persona Answers` (only if Cross-Stack: backend; same budget; skipped on Reduction)

A bridge file `.dev/persona/review-persona.md` is created with the persona summaries and Decision Ledger entries.
