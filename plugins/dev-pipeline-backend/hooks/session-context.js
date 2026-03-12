#!/usr/bin/env node
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TIMEOUT = 5000;
const PROJECT_ROOT = process.cwd();

const PLUGIN = "backend";
const PHASE_CHAIN = ["intake", "discover", "plan", "document", "build", "validate", "ship"];

const STAGE_PREFIXES = {
  intake: {
    discuss: "discuss-classification",
    architect: "architect-manifest-plan",
    execute: "execute-manifest-created",
    review: "review-classification-confirmed",
  },
  discover: {
    discuss: "discuss-feature-requirements",
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

function git(cmd) {
  return execSync(cmd, {
    cwd: PROJECT_ROOT,
    timeout: TIMEOUT,
    encoding: "utf8",
    stdio: ["pipe", "pipe", "pipe"],
  }).trim();
}

function runDocsAudit() {
  const mappings = [
    {
      doc: "ARCHITECTURE.md",
      codeDirs: ["db/migrate/", "app/models/"],
      label: "models/migrations changed",
    },
    {
      doc: "API_ROUTES.md",
      codeDirs: ["config/routes.rb", "app/controllers/"],
      label: "controllers changed",
    },
    {
      doc: "BACKGROUND_JOBS.md",
      codeDirs: ["app/jobs/", "app/mailers/"],
      label: "jobs/mailers changed",
    },
    {
      doc: "DEPLOYMENT.md",
      codeDirs: [".replit", "replit.nix", "Procfile"],
      label: "deploy config changed",
    },
    {
      doc: "COMMON_ERRORS.md",
      codeDirs: ["app/services/", "app/controllers/"],
      label: "services/controllers changed",
    },
  ];

  const stale = [];
  const upToDate = [];

  for (const mapping of mappings) {
    try {
      const docPath = `.claude/docs/${mapping.doc}`;
      const docCommit = git(`git log -1 --format=%H -- ${docPath}`);
      if (!docCommit) {
        upToDate.push(mapping.doc);
        continue;
      }

      const codePaths = mapping.codeDirs.join(" ");
      const codeCommit = git(`git log -1 --format=%H -- ${codePaths}`);
      if (!codeCommit) {
        upToDate.push(mapping.doc);
        continue;
      }

      if (docCommit === codeCommit) {
        upToDate.push(mapping.doc);
        continue;
      }

      const countStr = git(
        `git rev-list --count ${docCommit}..${codeCommit}`
      );
      const count = parseInt(countStr, 10);

      if (count >= 3) {
        stale.push({ doc: mapping.doc, count, label: mapping.label });
      } else {
        upToDate.push(mapping.doc);
      }
    } catch (_) {
      upToDate.push(mapping.doc);
    }
  }

  return { stale, upToDate };
}

function findManifests(dir) {
  const results = [];
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (entry.name === ".dev") {
          const manifest = path.join(full, "MANIFEST.md");
          if (fs.existsSync(manifest)) {
            results.push(manifest);
          }
        } else {
          results.push(...findManifests(full));
        }
      }
    }
  } catch (_) {}
  return results;
}

// --- v2.0 Stage Detection ---

function hasArtifactWithPrefix(dirPath, prefix) {
  try {
    const entries = fs.readdirSync(dirPath);
    return entries.some((f) => f.startsWith(prefix) && f.endsWith(".md"));
  } catch (_) {
    return false;
  }
}

function getLatestWaveDir(buildDir) {
  try {
    const entries = fs.readdirSync(buildDir).filter((d) => /^wave-\d+$/.test(d));
    if (entries.length === 0) return null;
    entries.sort();
    return path.join(buildDir, entries[entries.length - 1]);
  } catch (_) {
    return null;
  }
}

function detectStageInPhase(devDir, phase) {
  let phaseDir = path.join(devDir, phase);

  // BUILD phase uses wave-NN subdirectories -- scan latest wave
  if (phase === "build") {
    const buildDir = path.join(devDir, "build");
    const latestWave = getLatestWaveDir(buildDir);
    if (latestWave) {
      phaseDir = latestWave;
    } else if (!fs.existsSync(buildDir)) {
      // No build dir at all -- stage is Discuss (just entering)
      return "discuss";
    }
  }

  if (!fs.existsSync(phaseDir)) {
    return "discuss";
  }

  const prefixes = STAGE_PREFIXES[phase];
  if (!prefixes) return "discuss";

  const hasReview = hasArtifactWithPrefix(phaseDir, prefixes.review);
  const hasExecute = hasArtifactWithPrefix(phaseDir, prefixes.execute);
  const hasArchitect = hasArtifactWithPrefix(phaseDir, prefixes.architect);
  const hasDiscuss = hasArtifactWithPrefix(phaseDir, prefixes.discuss);

  if (hasReview) return "complete";
  if (hasExecute) return "review";
  if (hasArchitect) return "execute";
  if (hasDiscuss) return "architect";
  return "discuss";
}

function detectCompletedPhases(devDir) {
  const completed = [];
  for (const phase of PHASE_CHAIN) {
    let phaseDir = path.join(devDir, phase);

    // BUILD: check wave directories
    if (phase === "build") {
      const buildDir = path.join(devDir, "build");
      if (fs.existsSync(buildDir)) {
        try {
          const waveDirs = fs.readdirSync(buildDir).filter((d) => /^wave-\d+$/.test(d));
          let found = false;
          for (const wd of waveDirs) {
            const waveDir = path.join(buildDir, wd);
            const prefixes = STAGE_PREFIXES.build;
            if (hasArtifactWithPrefix(waveDir, prefixes.review)) {
              found = true;
              break;
            }
          }
          if (found) completed.push(phase);
        } catch (_) {}
      }
      continue;
    }

    if (!fs.existsSync(phaseDir)) continue;
    const prefixes = STAGE_PREFIXES[phase];
    if (prefixes && hasArtifactWithPrefix(phaseDir, prefixes.review)) {
      completed.push(phase);
    }
  }
  return completed;
}

function detectContextBridges(devDir) {
  const bridges = [];
  for (const phase of PHASE_CHAIN) {
    let phaseDir = path.join(devDir, phase);
    const prefixes = STAGE_PREFIXES[phase];
    if (!prefixes) continue;

    // BUILD: check wave directories
    if (phase === "build") {
      const buildDir = path.join(devDir, "build");
      if (fs.existsSync(buildDir)) {
        try {
          const waveDirs = fs.readdirSync(buildDir).filter((d) => /^wave-\d+$/.test(d));
          for (const wd of waveDirs) {
            const waveDir = path.join(buildDir, wd);
            if (hasArtifactWithPrefix(waveDir, prefixes.review)) {
              try {
                const entries = fs.readdirSync(waveDir);
                const reviewFile = entries.find((f) => f.startsWith(prefixes.review) && f.endsWith(".md"));
                if (reviewFile) bridges.push(`build/${wd}/${reviewFile}`);
              } catch (_) {}
            }
          }
        } catch (_) {}
      }
      continue;
    }

    if (!fs.existsSync(phaseDir)) continue;
    if (hasArtifactWithPrefix(phaseDir, prefixes.review)) {
      try {
        const entries = fs.readdirSync(phaseDir);
        const reviewFile = entries.find((f) => f.startsWith(prefixes.review) && f.endsWith(".md"));
        if (reviewFile) bridges.push(`${phase}/${reviewFile}`);
      } catch (_) {}
    }
  }
  return bridges;
}

function parseManifestFields(content) {
  const result = {};
  // Table format: | **Key** | Value |
  const tableRegex = /\|\s*\*\*(\w[\w\s]*)\*\*\s*\|\s*([^|]*)\|/g;
  let match;
  while ((match = tableRegex.exec(content)) !== null) {
    result[match[1].trim().toLowerCase().replace(/\s+/g, "_")] = match[2].trim();
  }
  if (Object.keys(result).length >= 2) return result;
  // Bold-pair format: **Key:** Value
  const boldRegex = /\*\*(\w[\w\s]*):\*\*\s*(.+)/g;
  while ((match = boldRegex.exec(content)) !== null) {
    result[match[1].trim().toLowerCase().replace(/\s+/g, "_")] = match[2].trim();
  }
  // Legacy frontmatter
  const legacyPhase = content.match(/^current_phase:\s*(.+)/im);
  if (legacyPhase && !result.current_phase) result.current_phase = legacyPhase[1].trim();
  const legacyName = content.match(/^(?:feature_name|name|title):\s*(.+)/im);
  if (legacyName && !result.feature && !result.name && !result.feature_name) {
    result.feature_name = legacyName[1].trim();
  }
  return result;
}

function runValidateManifest(featureDir) {
  try {
    const toolPath = path.join(__dirname, "..", "..", "shared", "tools", "dev-pipeline-tools.js");
    if (!fs.existsSync(toolPath)) return null;
    const valResult = execSync(
      `node "${toolPath}" validate-manifest "${featureDir}" --plugin ${PLUGIN} --raw`,
      { timeout: 3000, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] }
    ).trim();
    return valResult;
  } catch (_) {
    return null;
  }
}

function runSessionContinuity() {
  const result = {};

  // --- TODO.md parsing ---
  try {
    const todoPath = path.join(PROJECT_ROOT, "TODO.md");
    if (fs.existsSync(todoPath)) {
      const content = fs.readFileSync(todoPath, "utf8");
      const lines = content.split("\n");
      let pending = 0;
      let done = 0;
      for (const line of lines) {
        if (/^- \[ \]/.test(line)) pending++;
        if (/^- \[x\]/i.test(line)) done++;
      }
      result.todos = { pending, done };
    }
  } catch (_) {}

  // --- v2.0 Pipeline Detection ---
  try {
    const docsDir = path.join(PROJECT_ROOT, "docs");
    if (fs.existsSync(docsDir)) {
      const manifests = findManifests(docsDir);
      if (manifests.length > 0) {
        result.pipelines = [];
        for (const mf of manifests) {
          try {
            const content = fs.readFileSync(mf, "utf8");
            const fields = parseManifestFields(content);
            const featureName = fields.feature || fields.name || fields.feature_name || "";
            const currentPhase = (fields.current_phase || "").toLowerCase();

            if (!currentPhase) continue;

            const featureDir = path.dirname(path.dirname(mf)); // up from .dev/MANIFEST.md
            const devDir = path.dirname(mf); // .dev/

            // Detect current stage within the current phase
            const stageResult = detectStageInPhase(devDir, currentPhase);
            const currentStage = stageResult === "complete" ? "Complete" : stageResult.charAt(0).toUpperCase() + stageResult.slice(1);

            // Detect completed phases
            const completedPhases = detectCompletedPhases(devDir);

            // Detect context bridges
            const contextBridges = detectContextBridges(devDir);

            // Validate manifest (non-blocking, 3s timeout)
            const manifestValidation = runValidateManifest(featureDir);
            let manifestStatus = "unknown";
            if (manifestValidation) {
              manifestStatus = manifestValidation.startsWith("PASS") ? "valid" : "invalid";
            }

            const pipeline = {
              name: featureName || path.basename(featureDir),
              phase: currentPhase.toUpperCase(),
              stage: currentStage,
              completedPhases: completedPhases.map((p) => p.toUpperCase()),
              contextBridges,
              manifestStatus,
            };

            if (manifestStatus === "invalid") {
              pipeline.manifestWarning = manifestValidation;
            }

            result.pipelines.push(pipeline);
          } catch (_) {}
        }
      }
    }
  } catch (_) {}

  return result;
}

// --- Main ---
try {
  const lines = [];
  lines.push("\u{1F4CB} Session Context");
  lines.push("\u2501".repeat(17));
  lines.push("");

  try {
    const { stale, upToDate } = runDocsAudit();

    if (stale.length > 0) {
      lines.push("\u{1F4C4} Possibly stale docs:");
      for (const s of stale) {
        lines.push(
          `  \u26A0\uFE0F  ${s.doc} \u2014 ${s.count} commits behind (${s.label})`
        );
      }
      lines.push("");
      if (upToDate.length > 0) {
        lines.push(`\u2705 Up to date: ${upToDate.join(", ")}`);
      }
    } else {
      lines.push("\u2705 All documentation up to date");
    }
  } catch (_) {
    lines.push("\u2705 All documentation up to date");
  }

  try {
    const continuity = runSessionContinuity();

    if (continuity.todos) {
      lines.push(
        `\u{1F4DD} TODOs: ${continuity.todos.pending} pending / ${continuity.todos.done} done`
      );
    }

    if (continuity.pipelines && continuity.pipelines.length > 0) {
      for (const p of continuity.pipelines) {
        lines.push(
          `\u{1F527} Active pipeline: "${p.name}" at ${p.phase} phase`
        );
        lines.push(
          `  \u{1F4CD} Stage: ${p.stage}`
        );
        if (p.completedPhases.length > 0) {
          lines.push(
            `  \u2705 Completed: ${p.completedPhases.join(", ")}`
          );
        }
        if (p.contextBridges.length > 0) {
          lines.push(
            `  \u{1F517} Context bridges: ${p.contextBridges.join(", ")}`
          );
        }
        if (p.manifestStatus === "valid") {
          lines.push(`  \u2705 MANIFEST: valid`);
        } else if (p.manifestStatus === "invalid") {
          lines.push(`  \u26A0\uFE0F  MANIFEST: invalid`);
          if (p.manifestWarning) {
            lines.push(`    ${p.manifestWarning}`);
          }
        } else {
          lines.push(`  \u2753 MANIFEST: validation skipped`);
        }
      }
    }
  } catch (_) {}

  process.stdout.write(lines.join("\n") + "\n");
} catch (_) {}
