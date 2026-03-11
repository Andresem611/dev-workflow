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

function cmdValidateTransition(args) { error("Not implemented yet"); }
function cmdValidateManifest(args) { error("Not implemented yet"); }
function cmdCheckpointState(args) { error("Not implemented yet"); }
function cmdValidateEntry(args) { error("Not implemented yet"); }

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
