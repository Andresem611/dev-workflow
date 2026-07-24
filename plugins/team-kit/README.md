# team-kit plugin

Repo-agnostic team workflow skills, curated from external sources. A standalone
peer plugin in the `thoven-dev` marketplace — install it on its own, alongside
(but independent of) `dev-pipeline-frontend` and `dev-pipeline-backend`. Works in
any repo: Next.js frontend, Rails backend, or anything else.

## Installation

Enable at user scope in `~/.claude/settings.json`:

```json
"enabledPlugins": {
  "team-kit@thoven-dev": true
}
```

Then refresh the marketplace (`/plugin marketplace update thoven-dev`). Home-level
enable applies to every repo's sessions.

## Skills

| Skill | What it does | When to use |
|:------|:-------------|:------------|
| `thermo-nuclear-code-quality-review` | Extremely strict structural maintainability review: code-judo simplification, 1k-line file rule, spaghetti-condition detection, boundary/abstraction cleanliness. User-invoked only (`disable-model-invocation`). | A harsh, ambitious quality pass after writing a feature. The canonical *structural* lens — complements (does not replace) a correctness/security review. |
| `thermo-nuclear-review` | Deep correctness/security branch audit: bugs, breaking changes, devex regressions, feature-flag leaks. User-invoked only (`disable-model-invocation`). | A harsh, ambitious *correctness/security* pass — the sibling of `thermo-nuclear-code-quality-review`, not a replacement for `code-reviewer`. |
| `thermos` | Orchestrator — dispatches `thermo-nuclear-review` and `thermo-nuclear-code-quality-review` in parallel, then synthesizes deduplicated findings. User-invoked only (`disable-model-invocation`). | "Double review" of a branch/PR: one command for both the deep-review and code-quality passes. |
| `deslop` | Removes AI-generated slop from the current branch's diff vs main (stray comments, defensive try/catch, `any` casts, deep nesting). Surgical, behavior-preserving. | Right after generating code, before review. For a general clarity refactor of existing code, use `code-simplifier` instead. Pair: `deslop` → `thermos` (or `thermo-nuclear-code-quality-review` alone). |
| `verify-this` | Falsifies a specific claim with baseline/treatment evidence and returns VERIFIED / NOT VERIFIED / INCONCLUSIVE. | Proving a fix or behavior claim. Distinct from the Thoven `verify` skill, which runs pre-commit task-completion checks. |
| `weekly-review` | Weekly synthesis of authored commits, grouped into bugfix / tech-debt / net-new. | Status updates, retros. Can be wired to a scheduled trigger. |

## Agents

| Agent | What it does |
|:------|:-------------|
| `thermo-nuclear-code-quality-review` | Task subagent that runs the structural rubric against a diff with fresh context. A parent gathers `git diff` + changed-file contents, then dispatches this agent. Loads its rubric from the skill of the same name. |
| `thermo-nuclear-review` | Task subagent that runs the deep correctness/security rubric against a diff with fresh context. Same dispatch pattern as above; loads its rubric from the `thermo-nuclear-review` skill. |

## Provenance & updates

Ported from [`cursor/plugins`](https://github.com/cursor/plugins) (MIT) — originally
`cursor-team-kit`, with `thermo-nuclear-review` and `thermos` added from upstream's
`thermos` plugin (the successor Cursor split `thermo-nuclear-code-quality-review` into,
alongside deep review and an orchestrator). Pinned commit, file map, and local
customizations are recorded in `NOTICE`. There is no auto-update; re-vendor from a
newer upstream commit and bump the version when you want to refresh (see `NOTICE`).
