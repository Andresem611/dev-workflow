# TODO — wire team-kit skills into the dev pipelines

The `team-kit` plugin ships standalone, repo-agnostic skills (see `plugins/team-kit/`).
This is the **separate, optional, pipeline-owned** follow-up: have the
`dev-pipeline-frontend` / `dev-pipeline-backend` plugins *wrap* those skills so the
structural-quality step stops being ad-hoc ("sometimes code-simplifier, sometimes
code-reviewer, sometimes other skills").

Status: **not started.** team-kit works on its own without any of this.

## Background — current review slots (dev-pipeline-frontend@5.1.0)

- **BUILD** `skills/build/SKILL.md` → Stage 4 Review → **Layer 3 = `code-reviewer`**
  (independent, fresh-context, per wave) does correctness/security/requirements.
- **VALIDATE** `skills/validate/SKILL.md` → universal **`code-reviewer` + `typescript-pro`**.

`thermo-nuclear-code-quality-review` is a *different lens* (structural maintainability:
code-judo, 1k-line rule, spaghetti, boundaries). It complements `code-reviewer`, it
does not replace it.

## Tasks

- [ ] **Audit the ported skills** now in `plugins/team-kit/` (thermo-nuclear,
      deslop, verify-this, weekly-review) — confirm rubric/behavior, run each once.
- [ ] **Decide the wrapping points** for thermo-nuclear:
  - [ ] BUILD Stage 4 Review — add a structural-quality layer *after* Layer 3
        (`code-reviewer`), dispatching the `thermo-nuclear-code-quality-review`
        Task agent. Tier-gate it (HOLD / EXPANSION, or COMBINATION / NOVEL) so it
        doesn't run on trivial KNOWN-tier waves.
  - [ ] VALIDATE — add `thermo-nuclear-code-quality-review` alongside the universal
        `code-reviewer` + `typescript-pro`.
- [ ] **Decide `deslop` placement** — optional pre-review cleanup step in BUILD
      Execute→Review handoff (run `deslop` on the wave diff before the reviewer).
- [ ] **Update references**: `references/domain-agent-map.md` (add the agent to the
      relevant REVIEW rows) and `references/agent-prompt-template.md`.
- [ ] **Mode propagation**: respect `references/mode-propagation-reference.md`
      (REDUCTION skips the extra reviewer; HOLD/EXPANSION include it).
- [ ] **Mirror in `dev-pipeline-backend`** (done from a backend session) — same
      wrapping for the Rails pipeline; the skill is language-agnostic.
- [ ] **Bump versions**: `dev-pipeline-frontend` and `dev-pipeline-backend` (+ their
      entries in `.claude-plugin/marketplace.json`) when wired; note in CHANGELOGs.
- [ ] **Verify**: a HOLD/EXPANSION-tier BUILD wave dispatches the thermo-nuclear
      agent and surfaces structural findings; KNOWN-tier does not.

## Note

team-kit stays the single source for these skills. The pipelines should *reference/
dispatch* them, not copy them — so a future re-vendor of upstream improvements flows
through team-kit only.
