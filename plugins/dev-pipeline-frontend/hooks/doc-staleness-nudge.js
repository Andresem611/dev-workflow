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

      // Customize these mappings for your frontend framework
      const mappings = [
        {
          test: (p) => p.includes("src/components/") || p.includes("src/lib/components/"),
          desc: "a component",
          doc: "COMPONENT_ARCHITECTURE.md",
        },
        {
          test: (p) => p.includes("src/routes/") || p.includes("src/pages/"),
          desc: "a page/route",
          doc: "00_MASTER_PLAN.md",
        },
        {
          test: (p) => p.includes("src/lib/api/") || p.includes("src/lib/stores/"),
          desc: "API/state integration",
          doc: "FRONTEND_INTEGRATION_GUIDE.md",
        },
        {
          test: (p) => p.includes("src/styles/") || p.includes("tailwind.config"),
          desc: "styles/design system",
          doc: "COMPONENT_ARCHITECTURE.md",
        },
      ];

      for (const mapping of mappings) {
        if (mapping.test(filePath)) {
          process.stdout.write(
            `\u{1F4C4} You touched ${mapping.desc} \u2014 check if docs/${mapping.doc} needs updating\n`
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
