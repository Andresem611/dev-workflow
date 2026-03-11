#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

// --- Output Helpers (GSD pattern) ---

function output(result, raw, rawValue) {
  if (raw) {
    process.stdout.write(String(rawValue));
  } else {
    process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  }
  process.exit(0);
}

function error(msg) {
  process.stderr.write(`ERROR: ${msg}\n`);
  process.exit(1);
}

// --- File Utilities ---

function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8");
  } catch (_) {
    return null;
  }
}

function resolvePath(cwd, filePath) {
  return path.isAbsolute(filePath) ? filePath : path.join(cwd, filePath);
}

function fileExists(filePath) {
  try {
    return fs.statSync(filePath).isFile();
  } catch (_) {
    return false;
  }
}

// --- Schema Definitions ---

const BACKEND_TRANSITION_FILES = {
  intake: { next: ["discover.md", "plan.md", "build.md", "handover.md"] },
  discover: { next: ["plan.md"] },
  plan: { next: ["document.md"] },
  document: { next: ["build.md"] },
  build: { next: ["validate.md"] },
  validate: { next: ["handover.md", "ship.md"] },
  handover: { next: ["ship.md"] },
};

const FRONTEND_TRANSITION_FILES = {
  intake: { next: ["intake-to-discover.md", "intake-to-plan.md", "intake-to-design.md", "intake-to-build.md"] },
  discover: { next: ["discover-to-plan.md"] },
  plan: { next: ["plan-to-design.md", "plan-to-document.md"] },
  design: { next: ["design-to-document.md"] },
  document: { next: ["document-to-build.md"] },
  build: { next: ["build-to-validate.md"] },
  validate: { next: ["validate-to-ship.md"] },
};

const FIELD_PATTERNS = {
  // Heading-anchored patterns (^#+ or key:) for collision-prone fields
  feature_summary: /^#+\s*feature\s+summary|^feature[\s_]*name:|^##\s*summary/im,
  tier: /^#+\s*tier|^\*?\*?tier\*?\*?[:\s]+\*?\*?(KNOWN|COMBINATION|NOVEL)/im,
  domain_tags: /^#+\s*domain|^domains?:/im,
  entry_mode: /^#+\s*entry\s+mode|^entry[\s_]*mode:/im,
  manifest_path: /^#+\s*manifest|manifest[\s_]*path:|MANIFEST\.md/im,
  specs_refs: /^#+\s*spec|^#+\s*reference|specs?[\s_]*(provided|attached)/im,
  next_phase_instructions: /^#+\s*instruction|^#+\s*next\s+phase|instructions?\s+for\s+(the\s+)?next/im,
  design_decisions: /^#+\s*design\s+decision|^#+\s*approach|approved\s+design/im,
  models_identified: /^#+\s*model|models?\s+(and\s+)?domains?\s+identified/im,
  open_questions: /^#+\s*open\s+question|questions?\s+for\s+(PLAN|research)/im,
  agent_assignments: /^#+\s*agent|agents?\s+to\s+dispatch|agent[\s_]*assign/im,
  reference_paths: /^#+\s*reference\s+path|^#+\s*artifact|reference[\s_]*paths?:/im,
  decision_log: /^#+\s*decision\s+log|^#+\s*decisions?\b|D0[1-9]/im,
  wave_groupings: /^#+\s*wave\s+group|^#+\s*wave\s+[0-9]|wave[\s_]*grouping/im,
  acceptance_criteria: /^#+\s*acceptance\s+criteria|acceptance[\s_]*criteria/im,
  design_doc_path: /^#+\s*design\s+doc|design[\s_]*doc[\s_]*path/im,
  files_hints: /files?\s+to\s+(create|modify)|file[\s_]*hint/im,
  wave_plan_paths: /wave[\s_]*(execution\s+)?plan[\s_]*path|WAVE_\d+/im,
  task_paths: /task[\s_]*path|task[\s_]*file|TASK_\d+/im,
  codebase_assumptions: /codebase[\s_]*state|codebase[\s_]*assumption/im,
  changed_files: /^#+\s*changed?\s+files?|files?\s+(changed|modified)/im,
  test_results: /^#+\s*test\s+result|test[\s_]*results?:/im,
  domains_touched: /^#+\s*domain.*touch|domains?\s+touched/im,
  deviations: /^#+\s*deviation|deviations?\s+from\s+plan/im,
  tech_debt: /^#+\s*tech[\s_]*debt|known[\s_]*tech[\s_]*debt/im,
  validation_results: /^#+\s*validation\s+result|validation[\s_]*results?:/im,
  warnings: /^#+\s*warning|^#+\s*caveat|warnings?\s+or\s+caveats?/im,
  validation_status: /^#+\s*validation\s+status|validation[\s_]*status:/im,
  handover_status: /^#+\s*handover\s+status|handover[\s_]*status:/im,
  changelog_hints: /^#+\s*changelog|changelog[\s_]*hint/im,
  reuse_findings: /^#+\s*reuse|reuse[\s_]*(audit|finding)/im,
  dedup_decision: /^#+\s*dedup|deduplication[\s_]*decision/im,
  component_inventory: /^#+\s*component\s+inventory|component[\s_]*inventory/im,
  responsive_behavior: /^#+\s*responsive|responsive[\s_]*behavior/im,
  accessibility_requirements: /^#+\s*accessib|accessibility[\s_]*requirement/im,
  design_system_compliance: /^#+\s*design\s+system|design[\s_]*system[\s_]*compliance/im,
};

const TRANSITION_SCHEMAS = {
  backend: {
    intake: ["feature_summary", "tier", "domain_tags", "entry_mode", "manifest_path", "next_phase_instructions"],
    discover: ["feature_summary", "design_decisions", "models_identified", "open_questions", "agent_assignments", "reference_paths", "tier"],
    plan: ["feature_summary", "decision_log", "wave_groupings", "acceptance_criteria", "design_doc_path", "manifest_path", "agent_assignments", "files_hints"],
    document: ["feature_summary", "tier", "wave_plan_paths", "task_paths", "decision_log", "acceptance_criteria", "agent_assignments", "codebase_assumptions", "reference_paths"],
    build: ["feature_summary", "changed_files", "test_results", "acceptance_criteria", "domains_touched", "deviations", "tech_debt"],
    validate: ["feature_summary", "validation_results", "changed_files", "acceptance_criteria", "warnings"],
    handover: ["feature_summary", "validation_status", "handover_status", "changelog_hints"],
  },
  frontend: {
    intake: ["feature_summary", "tier", "domain_tags", "entry_mode", "manifest_path", "next_phase_instructions"],
    discover: ["feature_summary", "design_decisions", "models_identified", "open_questions", "agent_assignments", "reference_paths", "tier", "reuse_findings"],
    plan: ["feature_summary", "decision_log", "wave_groupings", "acceptance_criteria", "design_doc_path", "manifest_path", "agent_assignments", "files_hints"],
    design: ["feature_summary", "dedup_decision", "component_inventory", "responsive_behavior", "accessibility_requirements", "design_system_compliance"],
    document: ["feature_summary", "tier", "wave_plan_paths", "task_paths", "decision_log", "acceptance_criteria", "agent_assignments", "codebase_assumptions", "reference_paths"],
    build: ["feature_summary", "changed_files", "test_results", "acceptance_criteria", "domains_touched", "deviations", "tech_debt"],
    validate: ["feature_summary", "validation_results", "changed_files", "acceptance_criteria", "warnings"],
  },
};

const PHASE_CHAINS = {
  backend: ["intake", "discover", "plan", "document", "build", "validate", "handover", "ship"],
  frontend: ["intake", "discover", "plan", "design", "document", "build", "validate", "ship"],
};

// --- MANIFEST Parsing ---

function parseManifestTable(content) {
  const result = {};
  const tableRegex = /\|\s*\*\*(\w[\w\s]*)\*\*\s*\|\s*([^|]*)\|/g;
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    const key = match[1].trim().toLowerCase().replace(/\s+/g, "_");
    result[key] = match[2].trim();
  }
  return result;
}

function parseManifestBoldPairs(content) {
  const result = {};
  const boldRegex = /\*\*(\w[\w\s]*):\*\*\s*(.+)/g;
  let match;
  while ((match = boldRegex.exec(content)) !== null) {
    const key = match[1].trim().toLowerCase().replace(/\s+/g, "_");
    result[key] = match[2].trim();
  }
  return result;
}

function parseManifest(content) {
  // Try table format first (frontend), fall back to bold-pair (backend)
  const tableResult = parseManifestTable(content);
  if (Object.keys(tableResult).length >= 3) return tableResult;
  return parseManifestBoldPairs(content);
}

function parsePhaseProgress(content) {
  const phases = [];
  const rowRegex = /\|\s*\d+\s*\|\s*(\w+)\s*\|\s*([^|]+)\|/g;
  let match;
  while ((match = rowRegex.exec(content)) !== null) {
    phases.push({
      name: match[1].trim().toLowerCase(),
      status: match[2].trim().toLowerCase(),
    });
  }
  // Also handle format without phase number column (case-insensitive status)
  if (phases.length === 0) {
    const altRegex = /\|\s*([A-Z]+)\s*\|\s*(not[- ]started|in[- ]progress|complete|skipped|n\/a)\s*\|/gi;
    while ((match = altRegex.exec(content)) !== null) {
      phases.push({
        name: match[1].trim().toLowerCase(),
        status: match[2].trim().toLowerCase().replace(/\s+/g, "-"),
      });
    }
  }
  return phases;
}

// --- Commands (placeholders — implemented in subsequent tasks) ---

function cmdValidateTransition(args) {
  const phase = args.positional[0];
  const featureDir = args.positional[1];

  if (!phase || !featureDir) {
    error("Usage: validate-transition <phase> <feature-dir> --plugin backend|frontend");
  }

  const schemas = TRANSITION_SCHEMAS[args.plugin];
  if (!schemas[phase]) {
    error(`No transition schema for phase '${phase}' in plugin '${args.plugin}'.`);
  }

  const resolvedDir = resolvePath(args.cwd, featureDir);
  const transDir = path.join(resolvedDir, "prompt-transitions");

  const transFiles = args.plugin === "backend"
    ? BACKEND_TRANSITION_FILES[phase]
    : FRONTEND_TRANSITION_FILES[phase];

  if (!transFiles) {
    error(`No transition file mapping for phase '${phase}' in plugin '${args.plugin}'.`);
  }

  let foundFile = null;
  let content = null;
  for (const candidate of transFiles.next) {
    const fullPath = path.join(transDir, candidate);
    const fileContent = safeReadFile(fullPath);
    if (fileContent) {
      foundFile = candidate;
      content = fileContent;
      break;
    }
  }

  if (!content) {
    const tried = transFiles.next.map((f) => `prompt-transitions/${f}`).join(", ");
    output(
      { valid: false, phase, plugin: args.plugin, error: "Transition file not found", tried, recovery: `Re-invoke /prompt-generator to create the transition file. Expected one of: ${tried}` },
      args.raw,
      `FAIL: Transition file not found. Expected one of: ${tried}`
    );
    return;
  }

  const requiredFields = schemas[phase];
  const missing = [];
  const found = [];

  for (const field of requiredFields) {
    const pattern = FIELD_PATTERNS[field];
    if (pattern && pattern.test(content)) {
      found.push(field);
    } else {
      missing.push(field);
    }
  }

  const valid = missing.length === 0;

  output(
    {
      valid,
      phase,
      plugin: args.plugin,
      file: `prompt-transitions/${foundFile}`,
      total_fields: requiredFields.length,
      found: found.length,
      missing_count: missing.length,
      missing_fields: missing,
      ...(missing.length > 0 && {
        recovery: `Re-invoke /prompt-generator with explicit instructions to include: ${missing.join(", ")}`,
      }),
    },
    args.raw,
    valid
      ? `PASS: ${foundFile} contains all ${requiredFields.length} required fields`
      : `FAIL: ${foundFile} missing ${missing.length} fields: ${missing.join(", ")}`
  );
}
function cmdValidateManifest(args) {
  const featureDir = args.positional[0];

  if (!featureDir) {
    error("Usage: validate-manifest <feature-dir> --plugin backend|frontend");
  }

  const resolvedDir = resolvePath(args.cwd, featureDir);
  const manifestPath = path.join(resolvedDir, ".dev", "MANIFEST.md");
  const content = safeReadFile(manifestPath);

  if (!content) {
    if (args.plugin === "frontend") {
      output(
        { valid: true, note: "No MANIFEST found — may be bug/issue mode (validation skipped)" },
        args.raw,
        "PASS: No MANIFEST (bug mode — validation skipped)"
      );
      return;
    }
    output(
      { valid: false, error: "MANIFEST not found", path: manifestPath, recovery: "Create MANIFEST using the manifest-template.md reference" },
      args.raw,
      `FAIL: MANIFEST not found at ${manifestPath}`
    );
    return;
  }

  const manifest = parseManifest(content);
  const phases = parsePhaseProgress(content);
  const issues = [];

  const requiredKeys = ["current_phase", "status", "tier"];
  for (const key of requiredKeys) {
    const found = manifest[key] || manifest[key.replace(/_/g, " ")];
    if (!found) {
      issues.push(`Missing metadata field: ${key}`);
    }
  }

  if (!manifest.feature && !manifest.name && !manifest.feature_name) {
    issues.push("Missing metadata field: feature name");
  }

  const validStatuses = ["in progress", "in-progress", "paused", "complete", "blocked"];
  const status = (manifest.status || "").toLowerCase();
  if (status && !validStatuses.includes(status)) {
    issues.push(`Invalid status: '${manifest.status}'. Expected: ${validStatuses.join(", ")}`);
  }

  if (phases.length === 0) {
    issues.push("Phase Progress table not found or empty");
  }

  if (!/## Artifacts|## Artifact Paths/i.test(content)) {
    issues.push("Artifacts section not found");
  }

  if (!/## Decision/i.test(content)) {
    issues.push("Decisions section not found");
  }

  const valid = issues.length === 0;

  output(
    {
      valid,
      plugin: args.plugin,
      manifest_path: manifestPath,
      parsed_fields: manifest,
      phase_count: phases.length,
      issues,
      ...(issues.length > 0 && {
        recovery: `Fix the following MANIFEST issues: ${issues.join("; ")}`,
      }),
    },
    args.raw,
    valid
      ? `PASS: MANIFEST valid (${Object.keys(manifest).length} fields, ${phases.length} phases)`
      : `FAIL: MANIFEST has ${issues.length} issues: ${issues.join("; ")}`
  );
}
function cmdCheckpointState(args) {
  const featureDir = args.positional[0];
  const scope = args.scope || "wave";

  if (!featureDir) {
    error("Usage: checkpoint-state <feature-dir> --scope wave|task --plugin backend|frontend");
  }

  const resolvedDir = resolvePath(args.cwd, featureDir);
  const issues = [];

  const manifestPath = path.join(resolvedDir, ".dev", "MANIFEST.md");
  const manifestContent = safeReadFile(manifestPath);

  if (!manifestContent) {
    issues.push("MANIFEST not found");
  } else {
    if (!/build_progress|current_wave/i.test(manifestContent)) {
      issues.push("MANIFEST missing build_progress or current_wave field");
    }
  }

  const statusPath = path.join(resolvedDir, "CURRENT_STATUS.md");
  const statusContent = safeReadFile(statusPath);

  if (!statusContent) {
    issues.push("CURRENT_STATUS.md not found");
  } else {
    if (scope === "wave" && !/wave/i.test(statusContent)) {
      issues.push("CURRENT_STATUS.md does not mention current wave");
    }
  }

  const implStatusPath = path.join(resolvedDir, "01_IMPLEMENTATION_STATUS.md");
  if (!fileExists(implStatusPath)) {
    issues.push("01_IMPLEMENTATION_STATUS.md not found");
  }

  if (scope === "wave") {
    try {
      const { execSync } = require("child_process");
      const gitStatus = execSync("git status --porcelain", {
        cwd: args.cwd,
        encoding: "utf8",
        timeout: 5000,
      }).trim();

      const stateFiles = ["MANIFEST.md", "CURRENT_STATUS.md", "01_IMPLEMENTATION_STATUS.md"];
      const uncommitted = [];
      for (const line of gitStatus.split("\n")) {
        if (!line.trim()) continue;
        for (const sf of stateFiles) {
          if (line.includes(sf)) {
            uncommitted.push(sf);
          }
        }
      }
      if (uncommitted.length > 0) {
        issues.push(`Uncommitted state files: ${uncommitted.join(", ")} — commit before wave break`);
      }
    } catch (_) {}
  }

  const valid = issues.length === 0;

  output(
    {
      valid,
      scope,
      plugin: args.plugin,
      feature_dir: resolvedDir,
      issues,
      ...(issues.length > 0 && {
        recovery: scope === "wave"
          ? "Before /clear: (1) Update MANIFEST build_progress + current_wave, (2) Update CURRENT_STATUS.md with wave state, (3) Update 01_IMPLEMENTATION_STATUS.md, (4) git add + commit"
          : "After each task: (1) Update task file with actuals, (2) Update 01_IMPLEMENTATION_STATUS.md",
      }),
    },
    args.raw,
    valid
      ? `PASS: ${scope} checkpoint — all state files present and committed`
      : `FAIL: ${scope} checkpoint — ${issues.length} issues: ${issues.join("; ")}`
  );
}
function cmdValidateEntry(args) {
  const phase = args.positional[0];
  const featureDir = args.positional[1];

  if (!phase || !featureDir) {
    error("Usage: validate-entry <phase> <feature-dir> --plugin backend|frontend [--same-session]");
  }

  // NOTE: --same-session should be used AFTER updating the MANIFEST phase progress table
  // (i.e., after the previous phase's GATE updates MANIFEST, not between approval and update)

  const resolvedDir = resolvePath(args.cwd, featureDir);
  const chain = PHASE_CHAINS[args.plugin];
  const phaseIndex = chain.indexOf(phase.toLowerCase());

  if (phaseIndex === -1) {
    error(`Unknown phase '${phase}' for plugin '${args.plugin}'. Valid: ${chain.join(", ")}`);
  }

  if (phaseIndex === 0) {
    output(
      { valid: true, phase, plugin: args.plugin, note: "INTAKE — no prerequisites" },
      args.raw,
      "PASS: INTAKE — no prerequisites needed"
    );
    return;
  }

  const issues = [];
  const warnings = [];

  const manifestPath = path.join(resolvedDir, ".dev", "MANIFEST.md");
  const manifestContent = safeReadFile(manifestPath);

  if (!manifestContent) {
    if (args.plugin === "frontend") {
      warnings.push("No MANIFEST found — if this is a bug/issue, proceed. Otherwise, run INTAKE first.");
    } else {
      issues.push("MANIFEST not found — run INTAKE first to create it");
    }
  } else {
    const manifest = parseManifest(manifestContent);
    const currentPhase = (manifest.current_phase || "").toLowerCase();

    const prevPhase = chain[phaseIndex - 1];
    if (currentPhase && currentPhase !== phase.toLowerCase() && currentPhase !== prevPhase) {
      warnings.push(`MANIFEST shows current phase as '${currentPhase}', expected '${phase}' or '${prevPhase}'`);
    }

    const phases = parsePhaseProgress(manifestContent);
    const prevPhaseEntry = phases.find((p) => p.name === prevPhase);
    if (prevPhaseEntry) {
      const completedStatuses = ["complete", "✅", "done", "approved", "auto", "auto-approved", "skipped"];
      if (!completedStatuses.some((s) => prevPhaseEntry.status.includes(s))) {
        issues.push(`Previous phase '${prevPhase}' status is '${prevPhaseEntry.status}' — must be completed before starting '${phase}'`);
      }
    }
  }

  if (!args.sameSession) {
    const prevPhase = chain[phaseIndex - 1];
    const transDir = path.join(resolvedDir, "prompt-transitions");
    const transFiles = args.plugin === "backend"
      ? (BACKEND_TRANSITION_FILES[prevPhase] || { next: [] })
      : (FRONTEND_TRANSITION_FILES[prevPhase] || { next: [] });

    let foundTransition = false;
    for (const candidate of transFiles.next) {
      if (fileExists(path.join(transDir, candidate))) {
        foundTransition = true;
        break;
      }
    }

    if (!foundTransition && transFiles.next.length > 0) {
      const expected = transFiles.next.join(" or ");
      issues.push(`Transition file from '${prevPhase}' not found. Expected: prompt-transitions/${expected}`);
      warnings.push(`Recovery: Read MANIFEST + design doc to reconstruct context, or re-run ${prevPhase} TRANSITION section`);
    }
  }

  if (phase.toLowerCase() === "build") {
    const waveDir = args.plugin === "backend"
      ? path.join(resolvedDir, "tasks")
      : path.join(resolvedDir, "waves");

    try {
      const files = fs.readdirSync(waveDir);
      const wavePlans = files.filter((f) => /wave/i.test(f));
      if (wavePlans.length === 0) {
        issues.push("No wave execution plans found — DOCUMENT phase must create these before BUILD");
      }
    } catch (_) {
      issues.push(`Wave plans directory not found at ${waveDir}`);
    }
  }

  if (phase.toLowerCase() === "validate") {
    const implStatus = path.join(resolvedDir, "01_IMPLEMENTATION_STATUS.md");
    if (!fileExists(implStatus)) {
      warnings.push("01_IMPLEMENTATION_STATUS.md not found — BUILD should have created this");
    }
  }

  const valid = issues.length === 0;

  output(
    {
      valid,
      phase,
      plugin: args.plugin,
      issues,
      warnings,
      ...(issues.length > 0 && {
        recovery: issues.map((i) => `Fix: ${i}`).join("\n"),
      }),
    },
    args.raw,
    valid
      ? `PASS: Entry to ${phase.toUpperCase()} — all ${warnings.length > 0 ? `prerequisites met (${warnings.length} warnings)` : "prerequisites met"}`
      : `FAIL: Cannot enter ${phase.toUpperCase()} — ${issues.length} blocking issues: ${issues.join("; ")}`
  );
}

// --- CLI Router ---

function main() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    error("Usage: dev-pipeline-tools.js <command> [args] [--plugin backend|frontend] [--raw]");
  }

  const command = args[0];
  const raw = args.includes("--raw");
  const pluginIdx = args.indexOf("--plugin");
  const plugin = pluginIdx !== -1 && args[pluginIdx + 1] ? args[pluginIdx + 1] : "backend";

  if (!["backend", "frontend"].includes(plugin)) {
    error(`Invalid plugin: ${plugin}. Must be 'backend' or 'frontend'.`);
  }

  const cwd = process.cwd();
  const parsedArgs = { raw, plugin, cwd, positional: [] };

  for (let i = 1; i < args.length; i++) {
    if (args[i] === "--raw" || args[i] === "--plugin") {
      if (args[i] === "--plugin") i++; // skip value
      continue;
    }
    if (args[i] === "--scope") {
      parsedArgs.scope = args[++i];
      continue;
    }
    if (args[i] === "--same-session") {
      parsedArgs.sameSession = true;
      continue;
    }
    parsedArgs.positional.push(args[i]);
  }

  switch (command) {
    case "validate-transition":
      cmdValidateTransition(parsedArgs);
      break;
    case "validate-manifest":
      cmdValidateManifest(parsedArgs);
      break;
    case "checkpoint-state":
      cmdCheckpointState(parsedArgs);
      break;
    case "validate-entry":
      cmdValidateEntry(parsedArgs);
      break;
    default:
      error(`Unknown command: ${command}. Valid: validate-transition, validate-manifest, checkpoint-state, validate-entry`);
  }
}

main();
