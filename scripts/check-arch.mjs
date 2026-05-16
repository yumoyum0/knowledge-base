/*
 * check-arch.mjs — Architectural rule checker
 *
 * Enforces: Renderer must never directly import/require Node.js built-in modules.
 * All system access must go through the preload bridge (window.kbAPI).
 *
 * Part of the Feedback subsystem — makes architectural constraints executable.
 *
 * Usage: node scripts/check-arch.mjs
 * Exit:   0 = clean (no violations found)
 *         1 = violations detected (with agent-oriented error messages)
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join, extname, resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// ---- Configuration ----

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

// Renderer directories to scan (current vanilla JS + future TypeScript target)
// Note: preload is intentionally excluded — it IS allowed to use Node.js built-ins
// as the sole bridge layer.
const RENDERER_DIRS = [
  join(PROJECT_ROOT, 'src', 'renderer'),
];

// Individual renderer files at project root (current state before migration)
const RENDERER_FILES = [
  join(PROJECT_ROOT, 'renderer.js'),
  join(PROJECT_ROOT, 'index.html'),
];

// Node.js built-in modules that must never appear in renderer code.
const FORBIDDEN_BUILTINS = [
  'fs',
  'fs/promises',
  'path',
  'electron',
  'child_process',
  'os',
  'crypto',
  'http',
  'https',
  'net',
  'stream',
  'util',
  'buffer',
  'process',
  'cluster',
  'dgram',
  'dns',
  'domain',
  'readline',
  'tls',
  'v8',
  'vm',
  'worker_threads',
  'zlib',
];

// ---- Helpers ----

function collectFiles(dirs, extensions) {
  const results = [];
  for (const dir of dirs) {
    try {
      const entries = readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = join(dir, entry.name);
        if (entry.isFile() && extensions.includes(extname(entry.name))) {
          results.push(fullPath);
        }
      }
    } catch {
      // Directory doesn't exist yet (e.g. src/renderer is a future target)
    }
  }
  return results;
}

function scanFile(filePath, patterns) {
  const violations = [];
  try {
    const content = readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      for (const pattern of patterns) {
        if (pattern.regex.test(line)) {
          violations.push({
            file: filePath,
            line: lineNum,
            code: line.trim(),
            module: pattern.module,
          });
        }
      }
    }
  } catch {
    // File not readable — skip
  }
  return violations;
}

// ---- Main check ----

function runCheck() {
  // Build regex patterns for all forbidden built-ins
  const requirePatterns = FORBIDDEN_BUILTINS.map(mod => ({
    module: mod,
    // Matches: require('fs'), require("path"), require('electron').app, etc.
    regex: new RegExp(`require\\s*\\(\\s*['"]` + escapeRegex(mod) + `['"]`),
  }));

  const importPatterns = FORBIDDEN_BUILTINS.map(mod => ({
    module: mod,
    // Matches: import ... from 'fs'; import { ... } from "path"; etc.
    regex: new RegExp(`import\\s+[^'"]*['"]` + escapeRegex(mod) + `['"]`),
  }));

  // Collect all files to scan
  const scanPatterns = [...requirePatterns, ...importPatterns];
  const files = [
    ...collectFiles(RENDERER_DIRS, ['.js', '.ts', '.tsx', '.jsx']),
    ...RENDERER_FILES.filter(f => {
      try { statSync(f); return true; } catch { return false; }
    }),
  ];

  let allViolations = [];
  for (const file of files) {
    const fileViolations = scanFile(file, scanPatterns);
    allViolations = allViolations.concat(fileViolations);
  }

  if (allViolations.length === 0) {
    console.log('OK: No forbidden Node.js imports in renderer layer.');
    return 0;
  }

  // Agent-oriented error output
  console.log('='.repeat(72));
  console.log(`ARCHITECTURAL VIOLATION: ${allViolations.length} forbidden import(s) found`);
  console.log('='.repeat(72));
  console.log('');

  for (const v of allViolations) {
    const relativePath = v.file.replace(PROJECT_ROOT + '\\', '');
    console.log(`  WHAT: ${relativePath}:${v.line} — direct use of Node.js built-in '${v.module}'`);
    console.log(`        ${v.code}`);
    console.log('');
    console.log(`  WHY:  The renderer process has nodeIntegration: false and contextIsolation: true.`);
    console.log(`        Direct Node.js API access is blocked for security. If the renderer were`);
    console.log(`        compromised, direct filesystem/process access would enable RCE.`);
    console.log('');
    console.log(`  HOW:  Move the ${v.module} operation to the main process or a service, then:`);
    console.log(`        1. Add an IPC handler in src/main/main.js for the new channel`);
    console.log(`        2. Expose it in src/preload/preload.js via contextBridge`);
    console.log(`        3. Call it from the renderer via window.kbAPI.<method>()`);
    console.log('');
    console.log('  ---');
    console.log('');
  }

  return 1;
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
}

const exitCode = runCheck();
process.exit(exitCode);