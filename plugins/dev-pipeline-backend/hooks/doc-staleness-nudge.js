#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

try {
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => { input += chunk; });
  process.stdin.on("end", () => {
    try {
      const data = JSON.parse(input);
      const toolName = data.tool_name;

      if (toolName !== "Edit" && toolName !== "Write") {
        process.exit(0);
      }

      const filePath = data.tool_input && data.tool_input.file_path;
      if (!filePath || typeof filePath !== "string") {
        process.exit(0);
      }

      const DOC_PREFIX = ".claude/docs/";

      // --- Helper: is this an actual source code file? ---
      function isCodeFile(p) {
        if (p.endsWith(".md")) return false;
        if (p.includes("/.dev/")) return false;
        if (p.includes("/node_modules/")) return false;
        return true;
      }

      // --- Helper: find nearest MANIFEST.md by walking up from filePath ---
      function findManifest(fromPath) {
        let dir = path.dirname(fromPath);
        for (let i = 0; i < 10; i++) {
          const candidate = path.join(dir, ".dev", "MANIFEST.md");
          if (fs.existsSync(candidate)) return candidate;
          const parent = path.dirname(dir);
          if (parent === dir) break;
          dir = parent;
        }
        return null;
      }

      // --- Helper: parse phase/stage from MANIFEST content ---
      function parseManifest(manifestPath) {
        try {
          const content = fs.readFileSync(manifestPath, "utf8");
          const currentPhase = content.match(/\*\*Current Phase\*\*\s*\|\s*([^|]+)\|/)?.[1]?.trim()
            || content.match(/\*\*Current Phase:\*\*\s*(.+)/)?.[1]?.trim()
            || null;
          const currentStage = content.match(/\*\*Current Stage\*\*\s*\|\s*([^|]+)\|/)?.[1]?.trim()
            || content.match(/\*\*Current Stage:\*\*\s*(.+)/)?.[1]?.trim()
            || null;
          return { phase: currentPhase, stage: currentStage };
        } catch (_) {
          return { phase: null, stage: null };
        }
      }

      // --- Helper: find nearest CURRENT_STATUS.md ---
      function findCurrentStatus(fromPath) {
        let dir = path.dirname(fromPath);
        for (let i = 0; i < 10; i++) {
          const candidate = path.join(dir, ".dev", "CURRENT_STATUS.md");
          if (fs.existsSync(candidate)) return candidate;
          const buildCandidate = path.join(dir, ".dev", "build", "CURRENT_STATUS.md");
          if (fs.existsSync(buildCandidate)) return buildCandidate;
          const parent = path.dirname(dir);
          if (parent === dir) break;
          dir = parent;
        }
        return null;
      }

      const nudges = [];

      // ========================================
      // CHECK 1: Standard doc mapping nudges
      // ========================================
      const mappings = [
        {
          test: (p) => p.includes("db/migrate/") || p.includes("app/models/"),
          desc: "a model or migration",
          doc: "ARCHITECTURE.md",
        },
        {
          test: (p) => p.includes("config/routes.rb") || p.includes("app/controllers/"),
          desc: "a route or controller",
          doc: "API_ROUTES.md",
        },
        {
          test: (p) => p.includes("app/jobs/") || p.includes("app/mailers/"),
          desc: "a job or mailer",
          doc: "BACKGROUND_JOBS.md",
        },
        {
          test: (p) =>
            p.includes(".replit") ||
            p.includes("replit.nix") ||
            p.includes("config/deploy"),
          desc: "deployment config",
          doc: "DEPLOYMENT.md",
        },
        {
          test: (p) => {
            if (!p.includes("app/services/")) return false;
            return toolName === "Write";
          },
          desc: "a new service",
          doc: "COMMON_ERRORS.md",
        },
      ];

      for (const mapping of mappings) {
        if (mapping.test(filePath)) {
          nudges.push(
            `\u{1F4C4} You touched ${mapping.desc} \u2014 check if ${DOC_PREFIX}${mapping.doc} needs updating`
          );
          break;
        }
      }

      // ========================================
      // CHECK 2: Dev pipeline artifact consistency
      // ========================================
      if (filePath.includes("/.dev/")) {
        // Extract phase from path: .../.dev/<phase>/artifact.md
        const devMatch = filePath.match(/\/.dev\/([^/]+)\//);
        if (devMatch) {
          const editedPhase = devMatch[1].toLowerCase();
          const manifestPath = findManifest(filePath);
          if (manifestPath) {
            const { phase } = parseManifest(manifestPath);
            if (phase) {
              const manifestPhase = phase.toLowerCase();
              if (editedPhase !== manifestPhase && editedPhase !== "build") {
                nudges.push(
                  `\u{26A0}\u{FE0F} Cross-phase edit: you edited a .dev/${editedPhase}/ artifact but MANIFEST says current phase is "${phase}". Intentional?`
                );
              }
            }
          }
        }
      }

      // ========================================
      // CHECK 3: Code change during non-execute stage
      // ========================================
      if (!filePath.includes("/.dev/") && isCodeFile(filePath)) {
        const manifestPath = findManifest(filePath);
        if (manifestPath) {
          const { stage } = parseManifest(manifestPath);
          if (stage) {
            const stageLower = stage.toLowerCase();
            if (stageLower.includes("discuss") || stageLower.includes("architect")) {
              nudges.push(
                `\u{26A0}\u{FE0F} Code change during "${stage}" stage \u2014 MANIFEST suggests you should still be in discussion/design. Update MANIFEST if you're moving to implementation.`
              );
            }
          }
        }
      }

      // ========================================
      // CHECK 4: CURRENT_STATUS.md staleness
      // ========================================
      if (!filePath.includes("/.dev/") && isCodeFile(filePath)) {
        const statusPath = findCurrentStatus(filePath);
        if (statusPath) {
          nudges.push(
            `\u{1F4CB} Code changed \u2014 consider updating CURRENT_STATUS.md if this affects progress tracking`
          );
        }
      }

      // Output all nudges
      if (nudges.length > 0) {
        process.stdout.write(nudges.join("\n") + "\n");
      }

      process.exit(0);
    } catch (_) {
      process.exit(0);
    }
  });

  process.stdin.on("error", () => {
    process.exit(0);
  });
} catch (_) {
  process.exit(0);
}
