#!/usr/bin/env node
"use strict";

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
          process.stdout.write(
            `\u{1F4C4} You touched ${mapping.desc} \u2014 check if .claude/docs/${mapping.doc} needs updating\n`
          );
          break;
        }
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
