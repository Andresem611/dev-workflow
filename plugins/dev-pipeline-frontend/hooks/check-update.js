#!/usr/bin/env node
// Check for thoven-dev plugin updates in background
// Called by SessionStart hook - runs once per session
//
// Security note: All execSync calls use hardcoded git commands with no user input.
// This follows the same pattern as gsd-check-update.js (the GSD SessionStart hook).

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

const homeDir = os.homedir();

// Marketplace directory location
const marketplaceDir = path.join(homeDir, '.claude', 'plugins', 'marketplaces', 'thoven-dev');

// Cache file for update status
const cacheDir = path.join(homeDir, '.claude', 'cache');
const cacheFile = path.join(cacheDir, 'thoven-dev-update-check.json');

// Ensure cache directory exists
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

// Only check if marketplace dir exists and is a git repo
if (!fs.existsSync(path.join(marketplaceDir, '.git'))) {
  process.exit(0);
}

// Read current version
let installed = '0.0.0';
try {
  const backendPkg = path.join(marketplaceDir, 'plugins', 'dev-pipeline-backend', '.claude-plugin', 'plugin.json');
  if (fs.existsSync(backendPkg)) {
    const pkg = JSON.parse(fs.readFileSync(backendPkg, 'utf8'));
    installed = pkg.version || '0.0.0';
  }
} catch (e) {}

// Run check in background (detached child process)
// Uses execSync with hardcoded git commands only - no user input involved
const child = spawn(process.execPath, ['-e', `
  const fs = require('fs');
  const { execSync } = require('child_process');

  const cacheFile = ${JSON.stringify(cacheFile)};
  const marketplaceDir = ${JSON.stringify(marketplaceDir)};
  const installed = ${JSON.stringify(installed)};

  let updateAvailable = false;
  let localHead = '';
  let remoteHead = '';

  try {
    execSync('git fetch origin', { cwd: marketplaceDir, encoding: 'utf8', timeout: 15000, windowsHide: true, stdio: 'ignore' });
    localHead = execSync('git rev-parse HEAD', { cwd: marketplaceDir, encoding: 'utf8', timeout: 5000, windowsHide: true }).trim();
    remoteHead = execSync('git rev-parse origin/main', { cwd: marketplaceDir, encoding: 'utf8', timeout: 5000, windowsHide: true }).trim();
    updateAvailable = localHead !== remoteHead;
  } catch (e) {}

  const result = {
    update_available: updateAvailable,
    installed: installed,
    local_head: localHead.substring(0, 7),
    remote_head: remoteHead.substring(0, 7),
    checked: Math.floor(Date.now() / 1000)
  };

  fs.writeFileSync(cacheFile, JSON.stringify(result));
`], {
  stdio: 'ignore',
  windowsHide: true,
  detached: true
});

child.unref();
