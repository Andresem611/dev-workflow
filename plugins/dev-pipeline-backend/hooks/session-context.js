#!/usr/bin/env node
"use strict";

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const TIMEOUT = 5000;
const PROJECT_ROOT = process.cwd();

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

function runSessionContinuity() {
  const result = {};

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

  try {
    const docsDir = path.join(PROJECT_ROOT, "docs");
    if (fs.existsSync(docsDir)) {
      const manifests = findManifests(docsDir);
      if (manifests.length > 0) {
        result.pipelines = [];
        for (const mf of manifests) {
          try {
            const content = fs.readFileSync(mf, "utf8");
            let featureName = "";
            let currentPhase = "";
            for (const line of content.split("\n")) {
              const phaseMatch = line.match(/^current_phase:\s*(.+)/i);
              if (phaseMatch) currentPhase = phaseMatch[1].trim();
              const nameMatch = line.match(/^(?:feature_name|name|title):\s*(.+)/i);
              if (nameMatch && !featureName) featureName = nameMatch[1].trim();
            }
            if (currentPhase) {
              result.pipelines.push({
                name: featureName || path.basename(path.dirname(path.dirname(mf))),
                phase: currentPhase,
              });
            }
          } catch (_) {}
        }
      }
    }
  } catch (_) {}

  return result;
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
      }
    }
  } catch (_) {}

  process.stdout.write(lines.join("\n") + "\n");
} catch (_) {}
