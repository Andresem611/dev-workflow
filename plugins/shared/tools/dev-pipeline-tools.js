#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

// --- Output Helpers (GSD pattern) ---
function output(result, raw, rawValue) {
  if (raw) process.stdout.write(String(rawValue));
  else process.stdout.write(JSON.stringify(result, null, 2) + "\n");
  process.exit(0);
}
function error(msg) { process.stderr.write(`ERROR: ${msg}\n`); process.exit(1); }

// --- File Utilities ---
function safeReadFile(fp) { try { return fs.readFileSync(fp, "utf8"); } catch (_) { return null; } }
function resolvePath(cwd, fp) { return path.isAbsolute(fp) ? fp : path.join(cwd, fp); }
function fileExists(fp) { try { return fs.statSync(fp).isFile(); } catch (_) { return false; } }
function dirExists(dp) { try { return fs.statSync(dp).isDirectory(); } catch (_) { return false; } }

function findArtifact(dirPath, prefix) {
  try {
    const m = fs.readdirSync(dirPath).filter((f) => f.startsWith(prefix) && f.endsWith(".md"));
    return m.length > 0 ? { name: m[0], path: path.join(dirPath, m[0]) } : null;
  } catch (_) { return null; }
}

// --- Phase Chains & Schemas ---
const PHASE_CHAINS = {
  backend: ["intake", "discover", "plan", "document", "build", "validate", "ship"],
  frontend: ["intake", "discover", "design", "plan", "document", "build", "validate", "ship"],
};

const STAGES = ["discuss", "architect", "execute", "review"];
const STAGE_ARTIFACTS = {
  intake: {
    discuss: "discuss-classification",
    architect: "architect-manifest-plan",
    execute: "execute-manifest-created",
    review: "review-classification-confirmed",
  },
  discover: {
    discuss: { frontend: "discuss-ui-requirements", backend: "discuss-feature-requirements" },
    architect: "architect-exploration-plan",
    execute: "execute-design-doc",
    review: "review-design-approval",
  },
  plan: {
    discuss: "discuss-architecture-direction",
    architect: "architect-decision-framework",
    execute: "execute-locked-decisions",
    review: "review-plan-approval",
  },
  design: {
    discuss: "discuss-visual-direction",
    architect: "architect-design-plan",
    execute: "execute-design-spec",
    review: "review-design-compliance",
  },
  document: {
    discuss: "discuss-documentation-scope",
    architect: "architect-documentation-plan",
    execute: "execute-docs-manifest",
    review: "review-documentation-quality",
  },
  build: {
    discuss: "discuss-implementation-path",
    architect: "architect-subagent-prompts",
    execute: "execute-build-results",
    review: "review-code-quality",
  },
  validate: {
    discuss: "discuss-validation-strategy",
    architect: "architect-validation-plan",
    execute: "execute-validation-results",
    review: "review-ship-readiness",
  },
  ship: {
    discuss: "discuss-release-scope",
    architect: "architect-release-plan",
    execute: "execute-release-output",
    review: "review-release-confirmation",
  },
};

// --- Field Patterns ---
const ARCHITECT_FIELDS = {
  subagent: /\b(subagent|agent\s+assign|agent\s+dispatch|agent\s+prompt)/im,
  success_criteria: /\b(success\s+criteria|acceptance\s+criteria|definition\s+of\s+done)/im,
  execution_order: /\b(execution\s+order|execution\s+plan|execution\s+sequence|step\s+order)/im,
};

const REVIEW_FIELDS = {
  verdict: /\b(verdict|pass|fail|approved|rejected|ship\s+ready|not\s+ready)/im,
};

// --- MANIFEST Parsing ---
function parseManifestTable(content) {
  const result = {};
  const tableRegex = /\|\s*\*\*(\w[\w\s]*)\*\*\s*\|\s*([^|]*)\|/g;
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    result[match[1].trim().toLowerCase().replace(/\s+/g, "_")] = match[2].trim();
  }
  return result;
}

function parseManifestBoldPairs(content) {
  const result = {};
  const boldRegex = /\*\*(\w[\w\s]*):\*\*\s*(.+)/g;
  let match;
  while ((match = boldRegex.exec(content)) !== null) {
    result[match[1].trim().toLowerCase().replace(/\s+/g, "_")] = match[2].trim();
  }
  return result;
}

function parseManifest(content) {
  const tableResult = parseManifestTable(content);
  if (Object.keys(tableResult).length >= 3) return tableResult;
  return parseManifestBoldPairs(content);
}

function parsePhaseProgress(content) {
  const phases = [];
  const rowRegex = /\|\s*\d+\s*\|\s*(\w+)\s*\|\s*([^|]+)\|/g;
  let match;
  while ((match = rowRegex.exec(content)) !== null) {
    phases.push({ name: match[1].trim().toLowerCase(), status: match[2].trim().toLowerCase() });
  }
  if (phases.length === 0) {
    const altRegex = /\|\s*([A-Z]+)\s*\|\s*(not[- ]started|in[- ]progress|complete|skipped|n\/a)\s*\|/gi;
    while ((match = altRegex.exec(content)) !== null) {
      phases.push({ name: match[1].trim().toLowerCase(), status: match[2].trim().toLowerCase().replace(/\s+/g, "-") });
    }
  }
  return phases;
}

// --- Routes Parser ---
function parseRoutesFile(routesPath) {
  const content = safeReadFile(routesPath);
  if (!content) return [];

  const routes = [];
  const lines = content.split("\n");

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip comments and blank lines
    if (!trimmed || trimmed.startsWith("#")) continue;

    // Explicit routes: get '/api/v1/events', to: 'api/v1/events#index'
    const explicitMatch = trimmed.match(
      /^(get|post|put|patch|delete)\s+['"]([^'"]+)['"]\s*,\s*to:\s*['"]([^'"]+)['"]/i
    );
    if (explicitMatch) {
      routes.push({
        method: explicitMatch[1].toUpperCase(),
        path: explicitMatch[2],
        controller: explicitMatch[3],
      });
      continue;
    }

    // Resources: resources :events (generates standard CRUD routes)
    const resourcesMatch = trimmed.match(/^resources\s+:(\w+)/);
    if (resourcesMatch) {
      const name = resourcesMatch[1];
      const basePath = `/${name}`;
      routes.push({ method: "GET",    path: basePath,          controller: `${name}#index` });
      routes.push({ method: "GET",    path: `${basePath}/:id`, controller: `${name}#show` });
      routes.push({ method: "POST",   path: basePath,          controller: `${name}#create` });
      routes.push({ method: "PATCH",  path: `${basePath}/:id`, controller: `${name}#update` });
      routes.push({ method: "DELETE", path: `${basePath}/:id`, controller: `${name}#destroy` });
    }
  }

  return routes;
}

// --- Helpers ---
function getArtifactPrefix(phase, stage, plugin) {
  const entry = STAGE_ARTIFACTS[phase];
  if (!entry) return null;
  const stageEntry = entry[stage];
  if (!stageEntry) return null;
  if (typeof stageEntry === "object" && stageEntry.frontend) {
    return stageEntry[plugin] || stageEntry.backend;
  }
  return stageEntry;
}

function getPhaseDir(resolvedDir, phase, wave) {
  if (phase === "build" && wave) {
    return path.join(resolvedDir, ".dev", "build", `wave-${String(wave).padStart(2, "0")}`);
  }
  return path.join(resolvedDir, ".dev", phase);
}

function getPrevPhase(phase, plugin) {
  const chain = PHASE_CHAINS[plugin];
  const idx = chain.indexOf(phase);
  return idx > 0 ? chain[idx - 1] : null;
}

function extractFilePaths(content) {
  const paths = [];
  const regex = /(?:^|\s)((?:\.\/|\.\.\/|\/)?(?:[\w._-]+\/)*[\w._-]+\.[\w]+)/gm;
  let m;
  while ((m = regex.exec(content)) !== null) {
    const p = m[1].trim();
    if (p.length > 3 && !p.startsWith("http")) paths.push(p);
  }
  return [...new Set(paths)];
}

function isPhaseComplete(phases, phaseName) {
  const entry = phases.find((p) => p.name === phaseName);
  if (!entry) return false;
  const done = ["complete", "done", "approved", "skipped", "auto", "auto-approved"];
  return done.some((s) => entry.status.includes(s)) || entry.status.includes("\u2705");
}

function baseResult(phase, stage, plugin) {
  return { valid: false, phase, stage, plugin, issues: [], warnings: [] };
}

// --- Command: validate-stage-entry ---
function cmdValidateStageEntry(args) {
  const phase = (args.positional[0] || "").toLowerCase();
  const stage = (args.positional[1] || "").toLowerCase();
  const featureDir = args.positional[2];

  if (!phase || !stage || !featureDir) {
    error("Usage: validate-stage-entry <phase> <stage> <feature-dir> --plugin backend|frontend [--wave N]");
  }

  const plugin = args.plugin;
  const chain = PHASE_CHAINS[plugin];
  const resolvedDir = resolvePath(args.cwd, featureDir);
  const res = baseResult(phase, stage, plugin);

  if (!STAGES.includes(stage)) {
    error(`Unknown stage '${stage}'. Valid: ${STAGES.join(", ")}`);
  }
  // PAUSE bypass
  if (phase === "pause") {
    output({ valid: true, phase, stage, plugin, note: "PAUSE is operational -- no stage validation", issues: [], warnings: [] },
      args.raw, "PASS: PAUSE is operational -- no stage validation");
    return;
  }
  if (!chain.includes(phase)) {
    error(`Unknown phase '${phase}' for plugin '${plugin}'. Valid: ${chain.join(", ")}`);
  }

  const phaseDir = getPhaseDir(resolvedDir, phase, args.wave);
  const manifestPath = path.join(resolvedDir, ".dev", "MANIFEST.md");
  const manifestContent = safeReadFile(manifestPath);

  if (stage === "discuss") {
    // Entry to Discuss (start of a phase)
    if (phase === "intake") {
      // INTAKE: MANIFEST may not exist yet (first phase)
      if (manifestContent) {
        const manifest = parseManifest(manifestContent);
        const phases = parsePhaseProgress(manifestContent);
        if (isPhaseComplete(phases, "intake")) {
          res.issues.push("INTAKE phase is already marked complete in MANIFEST. Cannot re-enter.");
        }
      }
      // No previous phase review needed for intake
    } else {
      // Non-intake: MANIFEST must exist
      if (!manifestContent) {
        res.issues.push(`MANIFEST.md not found at ${manifestPath}. Run INTAKE phase first.`);
      } else {
        const phases = parsePhaseProgress(manifestContent);
        if (isPhaseComplete(phases, phase)) {
          res.issues.push(`Phase '${phase}' is already marked complete in MANIFEST.`);
        }
        // Previous phase review bridge must exist
        const prevPhase = getPrevPhase(phase, plugin);
        if (prevPhase) {
          const prevDir = getPhaseDir(resolvedDir, prevPhase, args.wave);
          const reviewPrefix = getArtifactPrefix(prevPhase, "review", plugin);
          const found = reviewPrefix ? findArtifact(prevDir, reviewPrefix) : null;
          if (!found) {
            res.issues.push(`Review artifact from previous phase '${prevPhase}' not found in .dev/${prevPhase}/. Expected: ${reviewPrefix}-*.md`);
            res.recovery = `Complete the Review stage of the '${prevPhase}' phase before entering '${phase}'.`;
          }
        }
      }
    }
    // BUILD wave directory check
    if (phase === "build") {
      if (!dirExists(phaseDir)) {
        res.warnings.push(`Wave directory not found at ${phaseDir}. It should be created before executing build artifacts.`);
      }
      // Artifact trail enforcement: previous wave must have all 4 stage artifacts
      if (args.wave && args.wave > 1) {
        const prevWave = args.wave - 1;
        const prevWaveDir = path.join(resolvedDir, ".dev", "build", `wave-${String(prevWave).padStart(2, "0")}`);
        if (dirExists(prevWaveDir)) {
          for (const prefix of ["discuss-", "architect-", "execute-", "review-"]) {
            if (!findArtifact(prevWaveDir, prefix)) {
              res.issues.push(`Previous wave ${prevWave} missing ${prefix}*.md artifact`);
            }
          }
        }
      }
    }
  } else if (stage === "architect") {
    // Discuss artifact must exist
    const prefix = getArtifactPrefix(phase, "discuss", plugin);
    const found = findArtifact(phaseDir, prefix);
    if (!found) {
      res.issues.push(`Discuss artifact not found in ${phaseDir}. Expected file starting with '${prefix}'. Complete the Discuss stage first.`);
    }
  } else if (stage === "execute") {
    // Architect artifact must exist with required sections
    const prefix = getArtifactPrefix(phase, "architect", plugin);
    const found = findArtifact(phaseDir, prefix);
    if (!found) {
      res.issues.push(`Architect artifact not found in ${phaseDir}. Expected file starting with '${prefix}'. Complete the Architect stage first.`);
    } else {
      const content = safeReadFile(found.path) || "";
      for (const [field, pattern] of Object.entries(ARCHITECT_FIELDS)) {
        if (!pattern.test(content)) {
          res.issues.push(`Architect artifact '${found.name}' is missing required section: ${field.replace(/_/g, " ")}.`);
        }
      }
    }
  } else if (stage === "review") {
    // Execute artifact must exist, referenced files must exist on disk
    const prefix = getArtifactPrefix(phase, "execute", plugin);
    const found = findArtifact(phaseDir, prefix);
    if (!found) {
      res.issues.push(`Execute artifact not found in ${phaseDir}. Expected file starting with '${prefix}'. Complete the Execute stage first.`);
    } else {
      const content = safeReadFile(found.path) || "";
      const refs = extractFilePaths(content);
      const missing = refs.filter((r) => {
        const abs = path.isAbsolute(r) ? r : path.resolve(resolvedDir, r);
        return !fileExists(abs) && !dirExists(abs);
      });
      if (missing.length > 0 && missing.length <= 10) {
        res.warnings.push(`Execute artifact references ${missing.length} path(s) not found on disk: ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "..." : ""}`);
      }
    }
    // Completion log quality check for BUILD wave tasks
    if (phase === "build" && args.wave) {
      const wavePadded = String(args.wave).padStart(2, "0");
      const waveFile = path.join(resolvedDir, "waves", `WAVE_${wavePadded}.md`);
      const waveContent = safeReadFile(waveFile);
      if (waveContent) {
        const taskRefs = [...new Set((waveContent.match(/TASK_\d+/g) || []))];
        for (const taskRef of taskRefs) {
          const taskFile = path.join(resolvedDir, "tasks", `${taskRef}.md`);
          const taskContent = safeReadFile(taskFile);
          if (!taskContent) continue;
          const logMatch = taskContent.match(/## Completion Log[\s\S]*?(?=\n## |\n---|\s*$)/);
          if (!logMatch) {
            res.warnings.push(`${taskRef} has no ## Completion Log section`);
            continue;
          }
          const logSection = logMatch[0];
          const filesTouchedMatch = logSection.match(/Files touched[:\s]*(.*)/i);
          if (!filesTouchedMatch || !filesTouchedMatch[1].trim()) {
            res.warnings.push(`${taskRef} Completion Log missing "Files touched" content`);
          }
          const discoveriesMatch = logSection.match(/Discoveries[:\s]*(.*)/i);
          if (!discoveriesMatch || !discoveriesMatch[1].trim()) {
            res.warnings.push(`${taskRef} Completion Log missing "Discoveries" content`);
          }
        }
      }
    }
  }

  res.valid = res.issues.length === 0;
  if (res.issues.length > 0 && !res.recovery) {
    res.recovery = res.issues.map((i) => `Fix: ${i}`).join("\n");
  }

  output(res, args.raw,
    res.valid
      ? `PASS: Entry to ${phase}/${stage} -- all prerequisites met${res.warnings.length > 0 ? ` (${res.warnings.length} warnings)` : ""}`
      : `FAIL: Cannot enter ${phase}/${stage} -- ${res.issues.length} blocking issues: ${res.issues.join("; ")}`
  );
}

// --- Command: validate-stage-output ---
function cmdValidateStageOutput(args) {
  const phase = (args.positional[0] || "").toLowerCase();
  const stage = (args.positional[1] || "").toLowerCase();
  const featureDir = args.positional[2];

  if (!phase || !stage || !featureDir) {
    error("Usage: validate-stage-output <phase> <stage> <feature-dir> --plugin backend|frontend [--wave N]");
  }

  const plugin = args.plugin;
  const chain = PHASE_CHAINS[plugin];
  const resolvedDir = resolvePath(args.cwd, featureDir);
  const res = baseResult(phase, stage, plugin);

  if (!STAGES.includes(stage)) {
    error(`Unknown stage '${stage}'. Valid: ${STAGES.join(", ")}`);
  }
  // PAUSE bypass
  if (phase === "pause") {
    output({ valid: true, phase, stage, plugin, note: "PAUSE is operational -- no stage validation", issues: [], warnings: [] },
      args.raw, "PASS: PAUSE is operational -- no stage validation");
    return;
  }
  if (!chain.includes(phase)) {
    error(`Unknown phase '${phase}' for plugin '${plugin}'. Valid: ${chain.join(", ")}`);
  }

  const phaseDir = getPhaseDir(resolvedDir, phase, args.wave);
  const prefix = getArtifactPrefix(phase, stage, plugin);

  if (!prefix) {
    error(`No artifact schema defined for ${phase}/${stage} in plugin '${plugin}'.`);
  }

  const found = findArtifact(phaseDir, prefix);

  if (!found) {
    res.issues.push(`Stage artifact not found in ${phaseDir}. Expected file starting with '${prefix}'.`);
    res.recovery = `Create the ${stage} artifact for the ${phase} phase: ${prefix}.md in .dev/${phase}/`;
    res.valid = false;
    output(res, args.raw, `FAIL: ${stage} output missing for ${phase}: expected ${prefix}*.md`);
    return;
  }

  res.artifact = found.name;
  const content = safeReadFile(found.path) || "";

  if (stage === "discuss") {
    // Discuss artifacts should have substantive content
    if (content.trim().split("\n").length < 5) {
      res.warnings.push(`Discuss artifact '${found.name}' appears thin (fewer than 5 lines).`);
    }
  } else if (stage === "architect") {
    for (const [field, pattern] of Object.entries(ARCHITECT_FIELDS)) {
      if (!pattern.test(content)) {
        res.issues.push(`Architect artifact '${found.name}' missing required section: ${field.replace(/_/g, " ")}.`);
      }
    }
  } else if (stage === "execute") {
    const refs = extractFilePaths(content);
    if (refs.length === 0) {
      res.warnings.push(`Execute artifact '${found.name}' does not reference any file paths. Expected artifact references.`);
    } else {
      const missing = refs.filter((r) => {
        const abs = path.isAbsolute(r) ? r : path.resolve(resolvedDir, r);
        return !fileExists(abs) && !dirExists(abs);
      });
      if (missing.length > 0) {
        res.warnings.push(`Execute artifact references ${missing.length} missing path(s): ${missing.slice(0, 5).join(", ")}${missing.length > 5 ? "..." : ""}`);
      }
    }
  } else if (stage === "review") {
    // Review must contain verdict
    if (!REVIEW_FIELDS.verdict.test(content)) {
      res.issues.push(`Review artifact '${found.name}' missing verdict/pass-fail section.`);
    }
    // Check MANIFEST updated
    const manifestPath = path.join(resolvedDir, ".dev", "MANIFEST.md");
    const manifestContent = safeReadFile(manifestPath);
    if (manifestContent) {
      const phases = parsePhaseProgress(manifestContent);
      const phaseEntry = phases.find((p) => p.name === phase);
      if (phaseEntry) {
        const inProgress = ["in-progress", "in progress", "active"];
        if (inProgress.some((s) => phaseEntry.status.includes(s))) {
          res.warnings.push(`MANIFEST still shows phase '${phase}' as in-progress. Update phase status after review.`);
        }
      }
    }

    // --- BUILD phase review enforcement ---
    if (phase === "build") {
      if (/\/simplify/i.test(content) && !/post-simplify verification/i.test(content)) {
        res.warnings.push("Review artifact mentions /simplify but missing 'Post-simplify verification' field.");
      }
      if (/fix dispatch/i.test(content) && !/must_haves:\s*(?:[\u2713\u2705]|yes|no)/i.test(content)) {
        res.warnings.push("Review artifact mentions fix dispatch but missing context checklist.");
      }
    }

    // --- DESIGN phase review enforcement ---
    if (phase === "design") {
      const sectionsMatch = content.match(/sections\s+(?:designed|dispatched):\s*(\d+)/i);
      if (sectionsMatch) {
        const claimed = parseInt(sectionsMatch[1], 10);
        const dispatchMentions = (content.match(/dispatch/gi) || []).length;
        if (dispatchMentions < claimed) {
          res.warnings.push(`Design review claims ${claimed} sections designed/dispatched but only ${dispatchMentions} dispatch mention(s) found.`);
        }
      }
    }
  }

  res.valid = res.issues.length === 0;
  if (res.issues.length > 0) {
    res.recovery = res.issues.map((i) => `Fix: ${i}`).join("\n");
  }

  output(res, args.raw,
    res.valid
      ? `PASS: ${stage} output for ${phase} validated${res.warnings.length > 0 ? ` (${res.warnings.length} warnings)` : ""}`
      : `FAIL: ${stage} output for ${phase} has ${res.issues.length} issues: ${res.issues.join("; ")}`
  );
}

// --- Command: checkpoint-state ---
function cmdCheckpointState(args) {
  const featureDir = args.positional[0];
  const scope = args.scope || "wave";

  if (!featureDir) {
    error("Usage: checkpoint-state <feature-dir> --scope wave|phase --plugin backend|frontend");
  }

  const plugin = args.plugin;
  const resolvedDir = resolvePath(args.cwd, featureDir);
  const res = { valid: false, scope, plugin, feature_dir: resolvedDir, issues: [], warnings: [] };

  // MANIFEST must exist with current phase/stage
  const manifestPath = path.join(resolvedDir, ".dev", "MANIFEST.md");
  const manifestContent = safeReadFile(manifestPath);

  if (!manifestContent) {
    res.issues.push(`MANIFEST.md not found at ${manifestPath}.`);
  } else {
    const manifest = parseManifest(manifestContent);
    if (!manifest.current_phase) {
      res.issues.push("MANIFEST missing current_phase field.");
    }
    if (!/current.?stage|stage/i.test(manifestContent) && !manifest.current_stage) {
      res.warnings.push("MANIFEST does not indicate current stage within the phase.");
    }
  }

  // CURRENT_STATUS.md must exist
  const statusPath = path.join(resolvedDir, "CURRENT_STATUS.md");
  if (!fileExists(statusPath)) {
    res.issues.push(`CURRENT_STATUS.md not found at ${statusPath}.`);
  }

  // Scope-specific checks
  if (scope === "wave") {
    // Migration guard: only validate the current wave, not all waves retroactively
    const buildDir = path.join(resolvedDir, ".dev", "build");
    if (dirExists(buildDir)) {
      try {
        const currentWaveMatch = manifestContent && manifestContent.match(/current_wave[:\s|]*(\d+)/i);
        if (currentWaveMatch) {
          // Validate only the current wave directory
          const currentWaveNum = parseInt(currentWaveMatch[1], 10);
          const currentWaveDir = `wave-${String(currentWaveNum).padStart(2, "0")}`;
          if (!dirExists(path.join(buildDir, currentWaveDir))) {
            res.warnings.push(`Current wave directory '${currentWaveDir}' not found in .dev/build/.`);
          }
        } else {
          // Fallback: no current_wave in MANIFEST, check if any wave dirs exist
          const waveDirs = fs.readdirSync(buildDir).filter((d) => /^wave-\d+$/.test(d));
          if (waveDirs.length === 0) {
            res.warnings.push("No wave-NN directories found in .dev/build/.");
          }
        }
      } catch (_) {
        res.warnings.push("Could not read .dev/build/ directory.");
      }
    } else {
      res.warnings.push(".dev/build/ directory does not exist.");
    }
  }

  // Check for uncommitted state files
  try {
    const { execSync } = require("child_process");
    const gitStatus = execSync("git status --porcelain", {
      cwd: resolvedDir,
      encoding: "utf8",
      timeout: 5000,
    }).trim();

    if (gitStatus) {
      const stateFiles = ["MANIFEST.md", "CURRENT_STATUS.md"];
      const uncommitted = [];
      for (const line of gitStatus.split("\n")) {
        if (!line.trim()) continue;
        for (const sf of stateFiles) {
          if (line.includes(sf)) uncommitted.push(sf);
        }
      }
      if (uncommitted.length > 0) {
        res.warnings.push(`Uncommitted state files: ${uncommitted.join(", ")}. Commit before session break.`);
      }
    }
  } catch (_) {
    res.warnings.push("Could not check git status for uncommitted files.");
  }

  res.valid = res.issues.length === 0;
  if (res.issues.length > 0) {
    res.recovery = `Before session break: ${res.issues.map((i) => `(1) ${i}`).join(" ")} Then commit all state files.`;
  }

  output(res, args.raw,
    res.valid
      ? `PASS: ${scope} checkpoint -- state files present${res.warnings.length > 0 ? ` (${res.warnings.length} warnings)` : ""}`
      : `FAIL: ${scope} checkpoint -- ${res.issues.length} issues: ${res.issues.join("; ")}`
  );
}

// --- Command: validate-manifest ---
function cmdValidateManifest(args) {
  const featureDir = args.positional[0];

  if (!featureDir) {
    error("Usage: validate-manifest <feature-dir> --plugin backend|frontend");
  }

  const plugin = args.plugin;
  const chain = PHASE_CHAINS[plugin];
  const resolvedDir = resolvePath(args.cwd, featureDir);
  const manifestPath = path.join(resolvedDir, ".dev", "MANIFEST.md");
  const content = safeReadFile(manifestPath);
  const res = { valid: false, plugin, manifest_path: manifestPath, issues: [], warnings: [] };

  if (!content) {
    res.issues.push(`MANIFEST.md not found at ${manifestPath}.`);
    res.recovery = "Create MANIFEST.md during the INTAKE phase.";
    output(res, args.raw, `FAIL: MANIFEST not found at ${manifestPath}`);
    return;
  }

  const manifest = parseManifest(content);

  // Required metadata (NO tier field)
  if (!manifest.feature && !manifest.name && !manifest.feature_name) {
    res.issues.push("Missing required metadata: feature name.");
  }
  if (!manifest.current_phase) {
    res.issues.push("Missing required metadata: current_phase.");
  }
  if (!manifest.status) {
    res.issues.push("Missing required metadata: status.");
  }

  const validStatuses = ["in progress", "in-progress", "paused", "complete", "blocked", "not started", "not-started"];
  const status = (manifest.status || "").toLowerCase();
  if (status && !validStatuses.includes(status)) {
    res.issues.push(`Invalid status: '${manifest.status}'. Expected one of: ${validStatuses.join(", ")}.`);
  }

  // Phase progress table
  const phases = parsePhaseProgress(content);
  if (phases.length === 0) {
    res.issues.push("Phase progress table not found or empty in MANIFEST.");
  }

  // Artifacts section
  if (!/## Artifacts?|## Artifact Paths?/i.test(content)) {
    res.issues.push("Artifacts section not found in MANIFEST.");
  }

  // Cross-reference phase statuses against actual .dev/<phase>/ artifacts
  for (const phaseEntry of phases) {
    const phaseName = phaseEntry.name;
    if (!chain.includes(phaseName)) continue;

    const phaseDir = path.join(resolvedDir, ".dev", phaseName);
    const isComplete = isPhaseComplete([phaseEntry], phaseName);

    if (isComplete) {
      // Complete phase should have a review artifact
      const reviewPrefix = getArtifactPrefix(phaseName, "review", plugin);
      if (reviewPrefix) {
        let searchDir = phaseDir;
        // BUILD: check wave directories
        if (phaseName === "build") {
          const buildDir = path.join(resolvedDir, ".dev", "build");
          let foundReview = false;
          if (dirExists(buildDir)) {
            try {
              const waveDirs = fs.readdirSync(buildDir).filter((d) => /^wave-\d+$/.test(d));
              for (const wd of waveDirs) {
                if (findArtifact(path.join(buildDir, wd), reviewPrefix)) { foundReview = true; break; }
              }
            } catch (_) {}
          }
          if (!foundReview && !findArtifact(phaseDir, reviewPrefix)) {
            res.warnings.push(`Phase '${phaseName}' marked complete but no review artifact found in .dev/${phaseName}/ or wave directories.`);
          }
        } else if (!dirExists(phaseDir)) {
          res.warnings.push(`Phase '${phaseName}' marked complete but directory .dev/${phaseName}/ does not exist.`);
        } else if (!findArtifact(phaseDir, reviewPrefix)) {
          res.warnings.push(`Phase '${phaseName}' marked complete but review artifact '${reviewPrefix}*' not found in .dev/${phaseName}/.`);
        }
      }
    }

    // In-progress phase should have its directory
    const inProg = ["in-progress", "in progress", "active"];
    if (inProg.some((s) => phaseEntry.status.includes(s))) {
      if (phaseName !== "build" && !dirExists(phaseDir)) {
        res.warnings.push(`Phase '${phaseName}' is in-progress but directory .dev/${phaseName}/ does not exist.`);
      }
    }
  }

  res.valid = res.issues.length === 0;
  res.parsed_fields = manifest;
  res.phase_count = phases.length;

  if (res.issues.length > 0) {
    res.recovery = `Fix MANIFEST issues: ${res.issues.join("; ")}`;
  }

  output(res, args.raw,
    res.valid
      ? `PASS: MANIFEST valid (${Object.keys(manifest).length} fields, ${phases.length} phases)${res.warnings.length > 0 ? ` (${res.warnings.length} warnings)` : ""}`
      : `FAIL: MANIFEST has ${res.issues.length} issues: ${res.issues.join("; ")}`
  );
}

// --- Command: verify-must-haves ---
function cmdVerifyMustHaves(args) {
  const featureDir = args.positional[0];
  const wave = args.wave;

  if (!featureDir || !wave) {
    error("Usage: verify-must-haves <feature-dir> --plugin backend|frontend --wave N");
  }

  const plugin = args.plugin;
  const resolvedDir = resolvePath(args.cwd, featureDir);
  const wavePadded = String(wave).padStart(2, "0");
  const wavePath = path.join(resolvedDir, "waves", `WAVE_${wavePadded}.md`);
  const waveContent = safeReadFile(wavePath);
  const res = baseResult("build", "review", plugin);
  res.wave = wave;
  res.must_haves = {
    truths: { total: 0, verified: 0 },
    artifacts: { total: 0, found: 0, missing: [] },
    key_links: { total: 0, verified: 0, unverified: [] },
  };
  res.stubs = { errors: [], warnings: [] };

  if (!waveContent) {
    res.issues.push(`Wave file not found at ${wavePath}.`);
    res.valid = false;
    output(res, args.raw, `FAIL: Wave file not found at ${wavePath}`);
    return;
  }

  // Extract must_haves section (between ## must_haves and next ## or EOF)
  const mustHavesMatch = waveContent.match(/##\s*must_haves\b([\s\S]*?)(?=\n##\s|\n---\s*$|$)/i);
  if (!mustHavesMatch) {
    res.warnings.push("No ## must_haves section found in wave file.");
    res.valid = true;
    output(res, args.raw, `PASS: No must_haves section found in wave file (nothing to verify)`);
    return;
  }

  const mustHavesRaw = mustHavesMatch[1];

  // Parse three subsections: truths, artifacts, key_links
  function parseSubsection(raw, label) {
    const items = [];
    const pattern = new RegExp(`\\*\\*${label}\\*\\*[:\\s]*([\\s\\S]*?)(?=\\*\\*\\w|$)`, "i");
    const match = raw.match(pattern);
    if (!match) return items;
    const block = match[1];
    const lineRegex = /[-*]\s*"([^"]+)"/g;
    let m;
    while ((m = lineRegex.exec(block)) !== null) {
      items.push(m[1]);
    }
    return items;
  }

  const truths = parseSubsection(mustHavesRaw, "truths");
  const artifacts = parseSubsection(mustHavesRaw, "artifacts");
  const keyLinks = parseSubsection(mustHavesRaw, "key_links");

  res.must_haves.truths.total = truths.length;
  res.must_haves.truths.verified = truths.length; // Truths are declarative; count them as verified
  res.must_haves.artifacts.total = artifacts.length;
  res.must_haves.key_links.total = keyLinks.length;

  // --- Artifact existence ---
  for (const art of artifacts) {
    // Extract file path (before " — " or " - " description)
    const filePath = art.split(/\s+[—-]\s+/)[0].trim();
    const absPath = resolvePath(args.cwd, filePath);

    if (!fileExists(absPath)) {
      res.must_haves.artifacts.missing.push(filePath);
      res.issues.push(`Missing artifact: ${filePath}`);
    } else {
      res.must_haves.artifacts.found++;

      // --- Anti-stub scan ---
      const fileContent = safeReadFile(absPath) || "";
      const lines = fileContent.split("\n");

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        // Warning patterns (both plugins)
        if (/\bTODO\b|\bFIXME\b|\bHACK\b|\bXXX\b/.test(line)) {
          res.stubs.warnings.push(`${filePath}:${lineNum}: ${line.trim().substring(0, 80)}`);
        }

        // Error patterns (plugin-specific)
        if (plugin === "backend") {
          if (/raise\s+NotImplementedError|placeholder|TBD|TBC/i.test(line)) {
            res.stubs.errors.push(`${filePath}:${lineNum}: ${line.trim().substring(0, 80)}`);
          }
        } else {
          if (/placeholder|TBD|TBC|\(\)\s*=>\s*\{\s*\}|console\.log/i.test(line)) {
            res.stubs.errors.push(`${filePath}:${lineNum}: ${line.trim().substring(0, 80)}`);
          }
        }
      }

      // Backend: empty method bodies
      if (plugin === "backend") {
        if (/def\s+\w+[^;]*;\s*end/.test(fileContent)) {
          res.stubs.warnings.push(`${filePath}: contains empty method body (def...;end)`);
        }
      }

      // --- Spec coverage check ---
      if (/^spec\/|\.spec\.|\.test\./.test(filePath)) {
        if (!/\bit\s+['"]|\bit\s+do|\bdescribe\s+['"]|\bdescribe\s+do|\btest\s*\(/.test(fileContent)) {
          res.warnings.push(`Spec file ${filePath} has no test blocks (it/describe/test).`);
        }
      }
    }
  }

  // --- Key links verification ---
  if (plugin === "backend") {
    const routesPath = resolvePath(args.cwd, "config/routes.rb");
    const routesContent = safeReadFile(routesPath) || "";

    for (const link of keyLinks) {
      const routeMatch = link.match(/^route\s+(GET|POST|PUT|PATCH|DELETE)\s+(\S+)\s*->/i);
      if (routeMatch) {
        const method = routeMatch[1].toLowerCase();
        const routePath = routeMatch[2].replace(/:\w+/g, "");
        // Check if method and path pattern appear in routes.rb
        const methodPatterns = {
          get: /\bget\b/i, post: /\bpost\b/i, put: /\bput\b/i,
          patch: /\bpatch\b/i, delete: /\bdelete\b/i,
        };
        const pathSegments = routePath.split("/").filter((s) => s.length > 0);
        const hasMethod = methodPatterns[method] && methodPatterns[method].test(routesContent);
        const hasPath = pathSegments.length > 0 && pathSegments.some((seg) => routesContent.includes(seg));

        if (hasMethod && hasPath) {
          res.must_haves.key_links.verified++;
        } else {
          res.must_haves.key_links.unverified.push(link);
          res.warnings.push(`Route not verified in routes.rb: ${link}`);
        }
      } else {
        // Non-route key_link: extract class names and check they exist as files or in code
        const classes = link.match(/[A-Z][a-zA-Z0-9]+(?:::[A-Z][a-zA-Z0-9]+)*/g) || [];
        if (classes.length > 0) {
          res.must_haves.key_links.verified++;
        } else {
          res.must_haves.key_links.unverified.push(link);
          res.warnings.push(`Could not verify key_link: ${link}`);
        }
      }
    }
  } else {
    // Frontend: verify component file references exist
    for (const link of keyLinks) {
      const filePaths = link.match(/(?:[\w._-]+\/)*[\w._-]+\.[\w]+/g) || [];
      let allExist = filePaths.length > 0;
      for (const fp of filePaths) {
        if (!fileExists(resolvePath(args.cwd, fp))) {
          allExist = false;
          break;
        }
      }
      if (allExist && filePaths.length > 0) {
        res.must_haves.key_links.verified++;
      } else {
        res.must_haves.key_links.unverified.push(link);
        res.warnings.push(`Could not verify key_link: ${link}`);
      }
    }
  }

  // --- Auto-append API contract (backend only) ---
  if (plugin === "backend") {
    const apiDir = path.join(resolvedDir, "api");
    const contractPath = path.join(apiDir, "API_CONTRACT.md");
    const routesPath = resolvePath(args.cwd, "config/routes.rb");
    const discoveredRoutes = parseRoutesFile(routesPath);

    if (discoveredRoutes.length > 0) {
      let contractContent = safeReadFile(contractPath) || "";
      const existingKeys = new Set();

      // Collect already-present routes from the contract (match table rows)
      const rowRegex = /\|\s*(\S+)\s*\|\s*(GET|POST|PUT|PATCH|DELETE)\s*\|/gi;
      let rowMatch;
      while ((rowMatch = rowRegex.exec(contractContent)) !== null) {
        existingKeys.add(`${rowMatch[2].toUpperCase()} ${rowMatch[1]}`);
      }

      const missing = discoveredRoutes.filter(
        (r) => !existingKeys.has(`${r.method} ${r.path}`)
      );

      if (missing.length > 0) {
        // Ensure api/ directory exists
        if (!dirExists(apiDir)) {
          fs.mkdirSync(apiDir, { recursive: true });
        }

        if (!contractContent) {
          // Create new contract file with header
          const header = "# API Contract\n\n| Path | Method | Auth | Status | Response | Wave |\n|------|--------|------|--------|----------|------|\n";
          const rows = missing.map(
            (r) => `| ${r.path} | ${r.method} | TBD | NEW | TBD | Wave N (auto-discovered) |`
          ).join("\n");
          fs.writeFileSync(contractPath, header + rows + "\n", "utf8");
        } else {
          // Append missing rows to existing contract
          const rows = missing.map(
            (r) => `| ${r.path} | ${r.method} | TBD | NEW | TBD | Wave N (auto-discovered) |`
          ).join("\n");
          fs.appendFileSync(contractPath, "\n" + rows + "\n", "utf8");
        }

        res.auto_appended = missing.length;
        res.warnings.push(`Auto-appended ${missing.length} route(s) to API_CONTRACT.md from routes.rb`);
      }
    }
  }

  // Stub errors are blocking issues
  if (res.stubs.errors.length > 0) {
    res.issues.push(`${res.stubs.errors.length} stub/placeholder error(s) found in artifacts`);
  }
  // Stub warnings are non-blocking
  if (res.stubs.warnings.length > 0) {
    res.warnings.push(`${res.stubs.warnings.length} stub warning(s) found in artifacts (TODO/FIXME/HACK/XXX)`);
  }

  res.valid = res.issues.length === 0;

  output(res, args.raw,
    res.valid
      ? `PASS: Wave ${wave} must_haves verified (${res.must_haves.artifacts.found}/${res.must_haves.artifacts.total} artifacts, ${res.must_haves.key_links.verified}/${res.must_haves.key_links.total} links)${res.warnings.length > 0 ? ` (${res.warnings.length} warnings)` : ""}`
      : `FAIL: Wave ${wave} must_haves -- ${res.issues.length} issues: ${res.issues.join("; ")}`
  );
}

// --- Update Wave Tracking ---
function cmdUpdateWaveTracking(args) {
  const featureDir = args.positional[0];

  if (!featureDir) {
    error("Usage: update-wave-tracking <feature-dir> --plugin backend|frontend --wave N");
  }

  const wave = args.wave;
  if (!wave || isNaN(wave) || wave < 1) {
    error("--wave N is required and must be a positive integer.");
  }

  const resolvedDir = resolvePath(args.cwd, featureDir);
  const res = { updated: [], warnings: [] };
  const today = new Date().toISOString().split("T")[0];

  // 1. Update MANIFEST.md
  const manifestPath = path.join(resolvedDir, ".dev", "MANIFEST.md");
  const manifestContent = safeReadFile(manifestPath);
  if (manifestContent) {
    let updated = manifestContent;
    // Bold-pair format: **current_wave:** value
    updated = updated.replace(
      /(\*\*current[_ ]wave:\*\*)\s*.+/i,
      `$1 ${wave + 1}`
    );
    updated = updated.replace(
      /(\*\*build[_ ]progress:\*\*)\s*.+/i,
      `$1 Wave ${wave} of ${wave} complete`
    );
    // Table format: | **current_wave** | value |
    updated = updated.replace(
      /(\|\s*\*\*current[_ ]wave\*\*\s*\|)\s*[^|]*\|/i,
      `$1 ${wave + 1} |`
    );
    updated = updated.replace(
      /(\|\s*\*\*build[_ ]progress\*\*\s*\|)\s*[^|]*\|/i,
      `$1 Wave ${wave} complete |`
    );
    if (updated !== manifestContent) {
      fs.writeFileSync(manifestPath, updated, "utf8");
      res.updated.push("MANIFEST.md");
    } else {
      res.warnings.push("MANIFEST.md: no current_wave/build_progress fields found to update.");
    }
  } else {
    res.warnings.push("MANIFEST.md not found at " + manifestPath);
  }

  // 2. Update CURRENT_STATUS.md
  const statusPath = path.join(resolvedDir, "CURRENT_STATUS.md");
  const statusContent = safeReadFile(statusPath);
  if (statusContent) {
    const statusTable = [
      "## Current Status",
      "",
      "| Field | Value |",
      "|-------|-------|",
      `| Phase | BUILD |`,
      `| Wave | ${wave} complete |`,
      `| Updated | ${today} |`,
    ].join("\n");

    let updated;
    // Replace existing ## Current Status section (up to next ## heading or EOF)
    const sectionRegex = /## Current Status[\s\S]*?(?=\n## |\n#[^#]|$)/;
    if (sectionRegex.test(statusContent)) {
      updated = statusContent.replace(sectionRegex, statusTable);
    } else {
      // No existing section — prepend
      updated = statusTable + "\n\n" + statusContent;
    }
    if (updated !== statusContent) {
      fs.writeFileSync(statusPath, updated, "utf8");
      res.updated.push("CURRENT_STATUS.md");
    }
  } else {
    res.warnings.push("CURRENT_STATUS.md not found at " + statusPath);
  }

  // 3. Update next wave's upstream context with discoveries from current wave tasks
  const wavePad = String(wave).padStart(2, "0");
  const currentWavePath = path.join(resolvedDir, "waves", `WAVE_${wavePad}.md`);
  const nextWavePad = String(wave + 1).padStart(2, "0");
  const nextWavePath = path.join(resolvedDir, "waves", `WAVE_${nextWavePad}.md`);

  const currentWaveContent = safeReadFile(currentWavePath);
  const nextWaveContent = safeReadFile(nextWavePath);

  if (currentWaveContent && nextWaveContent) {
    // Find task references (TASK_XX) in the current wave file
    const taskRefs = [...new Set(
      (currentWaveContent.match(/TASK_(\d{2})/g) || []).map((t) => t)
    )];

    const discoveries = [];
    for (const taskRef of taskRefs) {
      const taskPath = path.join(resolvedDir, "tasks", `${taskRef}.md`);
      const taskContent = safeReadFile(taskPath);
      if (!taskContent) continue;

      // Extract Discoveries field from Completion Log
      // Patterns: **Discoveries:** value  or  | Discoveries | value |
      let disc = null;
      const boldMatch = taskContent.match(/\*\*Discoveries?:\*\*\s*(.+)/i);
      if (boldMatch) disc = boldMatch[1].trim();
      if (!disc) {
        const tableMatch = taskContent.match(/\|\s*Discoveries?\s*\|\s*([^|]+)\|/i);
        if (tableMatch) disc = tableMatch[1].trim();
      }
      if (disc && disc.toLowerCase() !== "none" && disc.length >= 4) {
        discoveries.push(`- **${taskRef}**: ${disc}`);
      }
    }

    if (discoveries.length > 0) {
      let updated = nextWaveContent;
      const discSection = /Key discoveries to carry forward[\s\S]*?(?=\n## |\n#[^#]|$)/i;
      const discBlock = `Key discoveries to carry forward\n\n${discoveries.join("\n")}`;
      if (discSection.test(updated)) {
        updated = updated.replace(discSection, discBlock);
      } else {
        // Append at end
        updated = updated.trimEnd() + "\n\n### " + discBlock + "\n";
      }
      if (updated !== nextWaveContent) {
        fs.writeFileSync(nextWavePath, updated, "utf8");
        res.updated.push(`WAVE_${nextWavePad}.md`);
      }
    }
  } else {
    if (!currentWaveContent) res.warnings.push(`Current wave file not found: ${currentWavePath}`);
    if (!nextWaveContent) res.warnings.push(`Next wave file not found: ${nextWavePath}`);
  }

  // 4. Warn about IMPLEMENTATION_STATUS
  const implStatusPath = path.join(resolvedDir, "01_IMPLEMENTATION_STATUS.md");
  if (fileExists(implStatusPath)) {
    res.warnings.push("01_IMPLEMENTATION_STATUS.md exists — recommend manual review (format too variable to auto-update).");
  }

  output(res, args.raw,
    res.updated.length > 0
      ? `DONE: Updated ${res.updated.length} tracking files (${res.updated.join(", ")})${res.warnings.length > 0 ? ` | Warnings: ${res.warnings.join("; ")}` : ""}`
      : `WARN: No tracking files updated${res.warnings.length > 0 ? ` (${res.warnings.join("; ")})` : ""}`
  );
}

// --- CLI Router ---
function main() {
  const argv = process.argv.slice(2);
  if (argv.length === 0) {
    error("Usage: dev-pipeline-tools.js <command> [args] --plugin backend|frontend [--raw] [--wave N] [--scope wave|phase]\nCommands: validate-stage-entry, validate-stage-output, checkpoint-state, validate-manifest, verify-must-haves, update-wave-tracking");
  }

  const command = argv[0];
  const raw = argv.includes("--raw");
  const pluginIdx = argv.indexOf("--plugin");
  const plugin = pluginIdx !== -1 && argv[pluginIdx + 1] ? argv[pluginIdx + 1] : "backend";

  if (!["backend", "frontend"].includes(plugin)) {
    error(`Invalid plugin: ${plugin}. Must be 'backend' or 'frontend'.`);
  }

  const cwd = process.cwd();
  const parsedArgs = { raw, plugin, cwd, positional: [] };

  for (let i = 1; i < argv.length; i++) {
    if (argv[i] === "--raw") continue;
    if (argv[i] === "--plugin") { i++; continue; }
    if (argv[i] === "--scope") { parsedArgs.scope = argv[++i]; continue; }
    if (argv[i] === "--wave") { parsedArgs.wave = parseInt(argv[++i], 10); continue; }
    parsedArgs.positional.push(argv[i]);
  }

  switch (command) {
    case "validate-stage-entry":
      cmdValidateStageEntry(parsedArgs);
      break;
    case "validate-stage-output":
      cmdValidateStageOutput(parsedArgs);
      break;
    case "checkpoint-state":
      cmdCheckpointState(parsedArgs);
      break;
    case "validate-manifest":
      cmdValidateManifest(parsedArgs);
      break;
    case "verify-must-haves":
      cmdVerifyMustHaves(parsedArgs);
      break;
    case "update-wave-tracking":
      cmdUpdateWaveTracking(parsedArgs);
      break;
    default:
      error(`Unknown command: ${command}. Valid: validate-stage-entry, validate-stage-output, checkpoint-state, validate-manifest, verify-must-haves, update-wave-tracking`);
  }
}

module.exports = { cmdValidateStageEntry, cmdValidateStageOutput, cmdCheckpointState, cmdValidateManifest, cmdVerifyMustHaves, cmdUpdateWaveTracking, parseRoutesFile };
if (require.main === module) main();
