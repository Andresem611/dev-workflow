#!/usr/bin/env node
"use strict";

/**
 * Smoke-test script for dev-pipeline-tools.js
 *
 * Creates temp directories with realistic fixtures, spawns tool commands,
 * and validates stdout/stderr for expected PASS/FAIL patterns.
 *
 * Usage: node plugins/shared/tools/test-dev-pipeline-tools.js
 * Exit 0 = all pass, Exit 1 = any fail
 */

const os = require("os");
const fs = require("fs");
const path = require("path");
// Security note: execSync is used here ONLY with hardcoded commands and
// controlled file paths (temp dirs). No user input is interpolated.
const { execSync, execFileSync } = require("child_process");

const TOOL_PATH = path.join(__dirname, "dev-pipeline-tools.js");

let passed = 0;
let failed = 0;
const results = [];

function report(name, ok, detail) {
  if (ok) {
    passed++;
    results.push(`PASS: ${name}`);
  } else {
    failed++;
    results.push(`FAIL: ${name}${detail ? " - " + detail : ""}`);
  }
}

/**
 * Run a tool command via execFileSync (no shell injection risk).
 * Returns { stdout, stderr, status }. Never throws.
 */
function run(cmdArgs, cwd) {
  try {
    const stdout = execFileSync("node", [TOOL_PATH, ...cmdArgs], {
      cwd: cwd || process.cwd(),
      encoding: "utf8",
      timeout: 15000,
      stdio: ["pipe", "pipe", "pipe"],
    });
    return { stdout, stderr: "", status: 0 };
  } catch (err) {
    return {
      stdout: (err.stdout || "").toString(),
      stderr: (err.stderr || "").toString(),
      status: err.status || 1,
    };
  }
}

function mktemp(prefix) {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix + "-"));
}

function writeFile(base, relPath, content) {
  const full = path.join(base, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, content, "utf8");
  return full;
}

// ─────────────────────────────────────────────────
// Test 1: Phase chain ordering
// ─────────────────────────────────────────────────
function test1_phaseChainOrdering() {
  const name = "phase chain ordering";
  const tmp = mktemp("t1");
  try {
    // Read source file and verify "design" appears before "plan" in frontend chain
    const source = fs.readFileSync(TOOL_PATH, "utf8");
    const frontendMatch = source.match(/frontend:\s*\[([^\]]+)\]/);
    if (!frontendMatch) {
      report(name, false, "could not find frontend PHASE_CHAINS definition in source");
      return;
    }
    const phases = frontendMatch[1].split(",").map((s) => s.trim().replace(/['"]/g, ""));
    const designIdx = phases.indexOf("design");
    const planIdx = phases.indexOf("plan");

    if (designIdx === -1 || planIdx === -1) {
      report(name, false, `design index=${designIdx}, plan index=${planIdx}`);
      return;
    }
    report(name, designIdx < planIdx);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────────
// Test 2: parseRoutesFile extracts routes
// ─────────────────────────────────────────────────
function test2_parseRoutesFile() {
  const name = "parseRoutesFile extracts routes";
  const tmp = mktemp("t2");
  try {
    const routesContent = [
      "Rails.application.routes.draw do",
      "  get '/api/v1/events', to: 'api/v1/events#index'",
      "  post '/api/v1/events', to: 'api/v1/events#create'",
      "  resources :users",
      "end",
    ].join("\n");
    const routesPath = writeFile(tmp, "config/routes.rb", routesContent);

    // Require the module and call parseRoutesFile directly
    const tool = require(TOOL_PATH);
    const routes = tool.parseRoutesFile(routesPath);

    // Should have: 2 explicit + 5 from resources :users = 7
    if (routes.length !== 7) {
      report(name, false, `expected 7 routes, got ${routes.length}`);
      return;
    }
    // First route should be GET /api/v1/events
    const first = routes[0];
    if (first.method !== "GET" || first.path !== "/api/v1/events") {
      report(name, false, `first route: ${JSON.stringify(first)}`);
      return;
    }
    // Check resources generated correct CRUD routes
    const userRoutes = routes.filter((r) => r.path.startsWith("/users"));
    if (userRoutes.length !== 5) {
      report(name, false, `expected 5 user resource routes, got ${userRoutes.length}`);
      return;
    }
    report(name, true);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────────
// Test 3: verify-must-haves auto-append
// ─────────────────────────────────────────────────
function test3_verifyMustHavesAutoAppend() {
  const name = "verify-must-haves auto-append";
  const tmp = mktemp("t3");
  try {
    // Create a feature dir inside tmp
    const feat = path.join(tmp, "feat");
    fs.mkdirSync(feat, { recursive: true });

    // Wave file with must_haves section
    writeFile(feat, "waves/WAVE_01.md", [
      "# Wave 1",
      "",
      "## must_haves",
      "",
      "**truths**",
      '- "Events API must exist"',
      "",
      "**artifacts**",
      "",
      "**key_links**",
      "",
    ].join("\n"));

    // API directory with an existing (but mostly empty) API_CONTRACT.md
    writeFile(feat, "api/API_CONTRACT.md", [
      "# API Contract",
      "",
      "| Path | Method | Auth | Status | Response | Wave |",
      "|------|--------|------|--------|----------|------|",
    ].join("\n"));

    // routes.rb with routes NOT in the contract
    writeFile(tmp, "config/routes.rb", [
      "Rails.application.routes.draw do",
      "  get '/api/v1/events', to: 'api/v1/events#index'",
      "  post '/api/v1/events', to: 'api/v1/events#create'",
      "end",
    ].join("\n"));

    // Run verify-must-haves from tmp (so config/routes.rb is found relative to cwd)
    const result = run(
      ["verify-must-haves", feat, "--plugin", "backend", "--wave", "1"],
      tmp
    );

    // Check that API_CONTRACT.md was updated with new entries
    const contractAfter = fs.readFileSync(path.join(feat, "api/API_CONTRACT.md"), "utf8");
    const hasNewRoutes = contractAfter.includes("/api/v1/events") && contractAfter.includes("auto-discovered");

    if (!hasNewRoutes) {
      report(name, false, "contract not updated with auto-discovered routes");
      return;
    }

    // Verify output mentions auto-append
    const output = result.stdout + result.stderr;
    const mentionsAppend = output.includes("auto-appended") || output.includes("Auto-appended") || contractAfter.includes("auto-discovered");
    report(name, mentionsAppend);
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────────
// Test 4: validate-stage-entry artifact check
// ─────────────────────────────────────────────────
function test4_validateStageEntryArtifactCheck() {
  const name = "validate-stage-entry artifact check (prev wave missing)";
  const tmp = mktemp("t4");
  try {
    const feat = path.join(tmp, "feat");

    // MANIFEST is needed for non-intake phases
    writeFile(feat, ".dev/MANIFEST.md", [
      "# MANIFEST",
      "",
      "| **Feature** | test-feature |",
      "| **Current Phase** | build |",
      "| **Status** | in-progress |",
      "",
      "## Phase Progress",
      "",
      "| # | Phase | Status |",
      "|---|-------|--------|",
      "| 1 | intake | complete |",
      "| 2 | discover | complete |",
      "| 3 | design | complete |",
      "| 4 | plan | complete |",
      "| 5 | document | complete |",
      "| 6 | build | in-progress |",
    ].join("\n"));

    // Previous phase review artifact for document (so build discuss entry check passes)
    writeFile(feat, ".dev/document/review-documentation-quality-001.md", "## Review\nVerdict: PASS\n");

    // Wave 1 build dir with ONLY discuss artifact (missing architect, execute, review)
    writeFile(feat, ".dev/build/wave-01/discuss-implementation-path-001.md", "# Discuss\nContent here.\n");

    // Run validate-stage-entry for build discuss at wave 2
    // This should detect wave 1 is missing 3 artifacts
    const result = run(
      ["validate-stage-entry", "build", "discuss", feat, "--plugin", "frontend", "--wave", "2"],
      tmp
    );

    const output = result.stdout + result.stderr;
    const hasMissing = output.toLowerCase().includes("missing");
    report(name, hasMissing, hasMissing ? undefined : "expected 'missing' in output: " + output.substring(0, 200));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────────
// Test 5: validate-stage-entry completion log
// ─────────────────────────────────────────────────
function test5_validateStageEntryCompletionLog() {
  const name = "validate-stage-entry completion log warnings";
  const tmp = mktemp("t5");
  try {
    const feat = path.join(tmp, "feat");

    // MANIFEST
    writeFile(feat, ".dev/MANIFEST.md", [
      "# MANIFEST",
      "",
      "| **Feature** | test-feature |",
      "| **Current Phase** | build |",
      "| **Status** | in-progress |",
      "",
      "## Phase Progress",
      "",
      "| # | Phase | Status |",
      "|---|-------|--------|",
      "| 1 | intake | complete |",
      "| 2 | discover | complete |",
      "| 3 | plan | complete |",
      "| 4 | document | complete |",
      "| 5 | build | in-progress |",
    ].join("\n"));

    // Wave file referencing TASK_01
    writeFile(feat, "waves/WAVE_01.md", [
      "# Wave 1",
      "",
      "## Tasks",
      "- TASK_01: Build the widget",
    ].join("\n"));

    // Task file with empty Completion Log fields
    writeFile(feat, "tasks/TASK_01.md", [
      "# TASK_01",
      "",
      "## Description",
      "Build the widget.",
      "",
      "## Completion Log",
      "Files touched: ",
      "Discoveries: ",
    ].join("\n"));

    // Execute artifact must exist for review stage entry
    writeFile(feat, ".dev/build/wave-01/execute-build-results-001.md", [
      "# Execute Build Results",
      "",
      "Built the widget successfully.",
    ].join("\n"));

    // Run validate-stage-entry build review at wave 1 with backend plugin
    const result = run(
      ["validate-stage-entry", "build", "review", feat, "--plugin", "backend", "--wave", "1"],
      tmp
    );

    const output = result.stdout + result.stderr;
    // Should warn about empty completion log fields
    const hasWarning =
      output.toLowerCase().includes("completion log") ||
      output.toLowerCase().includes("files touched") ||
      output.toLowerCase().includes("discoveries");

    report(name, hasWarning, hasWarning ? undefined : "expected completion log warnings in output: " + output.substring(0, 300));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────────
// Test 6: update-wave-tracking
// ─────────────────────────────────────────────────
function test6_updateWaveTracking() {
  const name = "update-wave-tracking updates tracking files";
  const tmp = mktemp("t6");
  try {
    const feat = path.join(tmp, "feat");

    // MANIFEST with bold-pair format fields
    writeFile(feat, ".dev/MANIFEST.md", [
      "# MANIFEST",
      "",
      "**current_wave:** 1",
      "**build_progress:** Wave 1 in progress",
    ].join("\n"));

    // CURRENT_STATUS.md with Current Status section
    writeFile(feat, "CURRENT_STATUS.md", [
      "# Feature Status",
      "",
      "## Current Status",
      "",
      "| Field | Value |",
      "|-------|-------|",
      "| Phase | BUILD |",
      "| Wave | 1 in progress |",
      "| Updated | 2026-01-01 |",
    ].join("\n"));

    // Wave 1 file referencing TASK_01
    writeFile(feat, "waves/WAVE_01.md", [
      "# Wave 1",
      "",
      "## Tasks",
      "- TASK_01: Implement events API",
    ].join("\n"));

    // Wave 2 file with "Key discoveries" section
    writeFile(feat, "waves/WAVE_02.md", [
      "# Wave 2",
      "",
      "## Tasks",
      "- TASK_02: Add validation",
      "",
      "### Key discoveries to carry forward",
      "",
      "- (none yet)",
    ].join("\n"));

    // Task file with Completion Log containing discoveries
    writeFile(feat, "tasks/TASK_01.md", [
      "# TASK_01",
      "",
      "## Description",
      "Implement events API.",
      "",
      "## Completion Log",
      "Files touched: app/controllers/events_controller.rb",
      "**Discoveries:** The events model requires a polymorphic association for attachments",
    ].join("\n"));

    // Run update-wave-tracking
    const result = run(
      ["update-wave-tracking", feat, "--plugin", "backend", "--wave", "1"],
      tmp
    );

    const output = result.stdout + result.stderr;

    // Check MANIFEST was updated
    const manifestAfter = fs.readFileSync(path.join(feat, ".dev/MANIFEST.md"), "utf8");
    const manifestUpdated = manifestAfter.includes("current_wave:** 2") && manifestAfter.includes("Wave 1");

    // Check CURRENT_STATUS was updated
    const statusAfter = fs.readFileSync(path.join(feat, "CURRENT_STATUS.md"), "utf8");
    const statusUpdated = statusAfter.includes("1 complete");

    // Check WAVE_02 has discoveries from TASK_01
    const wave02After = fs.readFileSync(path.join(feat, "waves/WAVE_02.md"), "utf8");
    const hasDiscoveries = wave02After.includes("TASK_01") && wave02After.includes("polymorphic");

    const allGood = manifestUpdated && statusUpdated && hasDiscoveries;
    if (!allGood) {
      const details = [];
      if (!manifestUpdated) details.push("MANIFEST not updated");
      if (!statusUpdated) details.push("CURRENT_STATUS not updated");
      if (!hasDiscoveries) details.push("WAVE_02 missing discoveries");
      report(name, false, details.join("; "));
    } else {
      report(name, true);
    }
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────────
// Test 7: checkpoint-state migration guard
// ─────────────────────────────────────────────────
function test7_checkpointStateMigrationGuard() {
  const name = "checkpoint-state migration guard";
  const tmp = mktemp("t7");
  try {
    const feat = path.join(tmp, "feat");
    fs.mkdirSync(feat, { recursive: true });

    // Initialize as a git repo so the git status check works
    execFileSync("git", ["init"], { cwd: feat, encoding: "utf8", stdio: "pipe" });

    // MANIFEST with current_wave: 3
    writeFile(feat, ".dev/MANIFEST.md", [
      "# MANIFEST",
      "",
      "| **Feature** | test-migration |",
      "| **Current Phase** | build |",
      "| **Status** | in-progress |",
      "",
      "**current_wave:** 3",
    ].join("\n"));

    // CURRENT_STATUS.md (required for checkpoint-state)
    writeFile(feat, "CURRENT_STATUS.md", [
      "# Status",
      "",
      "## Current Status",
      "Build wave 3 in progress.",
    ].join("\n"));

    // Empty old wave dirs (simulating completed waves with no artifacts)
    fs.mkdirSync(path.join(feat, ".dev/build/wave-01"), { recursive: true });
    fs.mkdirSync(path.join(feat, ".dev/build/wave-02"), { recursive: true });

    // Current wave dir exists (wave-03)
    fs.mkdirSync(path.join(feat, ".dev/build/wave-03"), { recursive: true });

    // Run checkpoint-state
    const result = run(
      ["checkpoint-state", feat, "--scope", "wave", "--plugin", "backend"],
      feat
    );

    const output = result.stdout + result.stderr;

    // Should PASS because migration guard only checks current wave (wave-03),
    // not retroactively failing on empty wave-01/wave-02
    const passes = output.includes("PASS") || (result.status === 0);

    // Should NOT mention wave-01 or wave-02 as issues
    const mentionsOldWaves = output.includes("wave-01") || output.includes("wave-02");

    report(name, passes && !mentionsOldWaves,
      (!passes ? "expected PASS" : "") + (mentionsOldWaves ? " unexpectedly mentions old waves" : ""));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────────
// Test 8: validate-stage-output enforcement
// ─────────────────────────────────────────────────
function test8_validateStageOutputEnforcement() {
  const name = "validate-stage-output /simplify enforcement";
  const tmp = mktemp("t8");
  try {
    const feat = path.join(tmp, "feat");

    // Review artifact that mentions /simplify but lacks post-simplify verification
    writeFile(feat, ".dev/build/wave-01/review-code-quality-001.md", [
      "# Review: Code Quality",
      "",
      "## Summary",
      "Code review complete. Used /simplify on the controller layer.",
      "",
      "## Verdict",
      "PASS with warnings.",
      "",
      "## Notes",
      "The /simplify pass reduced complexity but post verification was skipped.",
    ].join("\n"));

    // Run validate-stage-output build review at wave 1
    const result = run(
      ["validate-stage-output", "build", "review", feat, "--plugin", "backend", "--wave", "1"],
      tmp
    );

    const output = result.stdout + result.stderr;

    // Should warn about missing post-simplify verification
    const hasWarning =
      output.toLowerCase().includes("simplify") ||
      output.toLowerCase().includes("post-simplify");

    report(name, hasWarning, hasWarning ? undefined : "expected simplify warning in output: " + output.substring(0, 300));
  } finally {
    fs.rmSync(tmp, { recursive: true, force: true });
  }
}

// ─────────────────────────────────────────────────
// Run all tests
// ─────────────────────────────────────────────────
function main() {
  const tests = [
    test1_phaseChainOrdering,
    test2_parseRoutesFile,
    test3_verifyMustHavesAutoAppend,
    test4_validateStageEntryArtifactCheck,
    test5_validateStageEntryCompletionLog,
    test6_updateWaveTracking,
    test7_checkpointStateMigrationGuard,
    test8_validateStageOutputEnforcement,
  ];

  for (const testFn of tests) {
    try {
      testFn();
    } catch (err) {
      const name = testFn.name.replace(/^test\d+_/, "").replace(/([A-Z])/g, " $1").trim().toLowerCase();
      report(name, false, `unexpected error: ${err.message}`);
    }
  }

  console.log("");
  for (const r of results) console.log(r);
  console.log(`\n${passed}/${passed + failed} tests passed`);
  process.exit(failed > 0 ? 1 : 0);
}

main();
