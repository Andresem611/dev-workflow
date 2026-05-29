# Mode Propagation Reference — v4.0

## Purpose

The execution mode controls how deep each phase goes — how many questions Discuss asks, how many agents Execute dispatches, how thorough Review is. Mode is set ONCE in DISCOVER Zone 4 and propagates to all downstream phases.

## Mode Selection

Mode is selected by the user during DISCOVER Zone 4 (HOW zone) and LOCKED in the Decision Ledger.

| Mode | When to Use | Typical Features |
|------|------------|-----------------|
| **Expansion** | New features, strategic bets, ambitious work, "go big" | Large features, new subsystems, 5+ components |
| **Hold** | Standard features, well-understood work, moderate scope | Most features, API integrations, page additions |
| **Reduction** | Quick fixes, time pressure, well-defined small scope | Bug fixes, small enhancements, polish work |

## Mode Rules

1. **Set once.** Mode is set in DISCOVER Zone 4 and LOCKED in the Decision Ledger.
2. **Can upgrade, never downgrade.** If a phase discovers the feature is more complex than expected, mode can be upgraded (Reduction → Hold, Hold → Expansion). Never downgraded.
3. **User controls.** Mode is a user decision. The pipeline can recommend ("This looks complex — recommend upgrading to Expansion") but the user decides.
4. **Propagates automatically.** Once set, every phase reads the mode from the Decision Ledger and adjusts its depth accordingly.

## Depth Matrix

### DISCOVER Phase

| Component | REDUCTION | HOLD | EXPANSION |
|-----------|-----------|------|-----------|
| Zone 1: WHY | 2 questions max | Full zone | Full + deep premise challenge |
| Zone 2: WHO | Skip | Full zone | Full + 11-star exercise |
| Zone 3: WHAT | Quick IN/OUT | Full zone | Full + constraint removal + solution tree |
| Zone 4: HOW | Quick prefs | Full zone | Full + temporal interrogation |
| GROUND agent | Quick scan | Standard scan | Thorough scan (parallel agents) |
| Execute agents | Explore only | Explore + ui-designer | Explore + ui-designer + boardroom |

### DESIGN Phase

| Component | REDUCTION | HOLD | EXPANSION |
|-----------|-----------|------|-----------|
| Discuss depth | Quick visual direction (2-3 questions) | Standard WHAT + HOW | Deep + wireframe skill (5 options) |
| Execute agents | 1 agent (Explore for dedup) | 2 agents (Explore + ui-designer) | 2 agents + boardroom debate |
| DESIGN_SPEC detail | Core components only, minimal states | All components, standard states | All components + all states + animation + responsive |
| Backend check | List unmet data needs | Full Backend Requirements Check | Full check + feature brief |

### PLAN Phase

| Component | REDUCTION | HOLD | EXPANSION |
|-----------|-----------|------|-----------|
| Discuss depth | Quick architecture (2-3 questions) | Standard WHAT + HOW + doneness | Deep + challenger agent |
| Execute outputs | Task list + wave groupings | All 6 outputs (decisions, tasks, waves, criteria, backend, diagrams) | All 6 + D2 diagrams + test plan |
| Task granularity | Coarse (1-3hr tasks OK) | Standard (30min-2.5hr) | Fine (30min-1hr, more tasks) |
| Requirements doc | Simplified | Full requirements.md | Full + acceptance test specs |
| Eng review offer | Skip | Offer | Recommend strongly |

### DOCUMENT Phase

| Component | REDUCTION | HOLD | EXPANSION |
|-----------|-----------|------|-----------|
| Doc set | Master plan + wave files only | Standard 5-layer docs | Full 8-doc set |
| Wave file detail | Task list only | Tasks + must_haves | Tasks + must_haves + diagrams + test specs |
| Agent prompts | Brief | Standard via /prompt-generator | Detailed with context blocks |

### BUILD Phase

| Component | REDUCTION | HOLD | EXPANSION |
|-----------|-----------|------|-----------|
| Agents per task | 1 (primary domain agent) | Per domain-agent-map | Per domain-map + independent reviewer |
| Review depth | Quick check (type-check + lint) | Standard (criteria + must_haves) | Deep + devil's advocate agent |
| Error handling | Basic | Standard | Comprehensive (all shadow paths) |
| Test expectations | Smoke tests | Happy path + key errors | Full coverage + edge cases |

### VALIDATE Phase

| Component | REDUCTION | HOLD | EXPANSION |
|-----------|-----------|------|-----------|
| Universal agents | `typescript-pro` only | `code-reviewer` + `typescript-pro` | Both + independent re-verification |
| Domain agents | Skip | Per domain tags | All domain agents regardless of tags |
| QA depth | Type-check + lint pass | Standard checklist | Full QA runbook + manual testing |
| Requirements check | Mechanical aggregation gate (verify-requirements-coverage) — cannot reduce | Full requirements.md verification | Line-by-line with evidence |
| Manual line-by-line | Spot check | Full requirements.md verification | Line-by-line with evidence |

### SHIP Phase

| Component | REDUCTION | HOLD | EXPANSION |
|-----------|-----------|------|-----------|
| Changelog | One-line entry | Standard entry with details | Comprehensive with migration notes |
| Final review | Skip | Quick code-reviewer | Full pre-commit review |
| Docs update | Skip | Standard docs-freshness | Full docs audit |

## Upgrade Protocol

When a phase discovers the feature is more complex than the current mode supports:

1. The phase's Discuss or Review surfaces the complexity: "This feature has [reason]. Current mode is [X]. Recommend upgrading to [Y]."
2. Present via AskUserQuestion:
   - A) Upgrade to [Y] — deeper investigation, more agents, more thorough
   - B) Keep [X] — accept the risk of less thorough coverage
3. If upgraded: update Decision Ledger, log in bridge
4. Never downgrade. If the user wants to go faster mid-pipeline, they can skip optional agents but the mode stays.

## Reading Mode in Each Phase

Every phase's Discuss Stage 0 (Mandatory Context Loading) reads the Decision Ledger from the MANIFEST. The mode is one of the LOCKED decisions:

```
Decision Ledger entry:
| U-XX | Execution mode: Hold | User:Zone4 | LOCKED | DISCOVER |
```

The phase then applies the depth matrix above to all its stages.
