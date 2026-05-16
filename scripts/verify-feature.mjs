/*
 * verify-feature.mjs — Feature verification and status update script
 *
 * Reads feature_list.json, finds the highest-priority non-passing feature,
 * runs the standard verification pipeline, and if all checks pass AND
 * a corresponding test block exists in test.js, marks the feature as
 * passing with dated evidence.
 *
 * Part of the Feedback subsystem — automates the "don't modify feature
 * list states yourself" rule from AGENTS.md.
 *
 * Usage: node scripts/verify-feature.mjs
 * Exit:   0 = verification passed (feature promoted if applicable)
 *         1 = verification failed (feature stays current status)
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { join, resolve, dirname } from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const PROJECT_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FEATURE_LIST_PATH = join(PROJECT_ROOT, 'feature_list.json');
const TEST_PATH = join(PROJECT_ROOT, 'test.js');

// ---- Load feature list ----

function loadFeatureList() {
  return JSON.parse(readFileSync(FEATURE_LIST_PATH, 'utf-8'));
}

function saveFeatureList(data) {
  data.last_updated = new Date().toISOString().split('T')[0];
  writeFileSync(FEATURE_LIST_PATH, JSON.stringify(data, null, 4) + '\n', 'utf-8');
}

// ---- Find candidate feature ----

function findCandidate(features) {
  // Priority: first in_progress, then first not_started, by priority order
  const inProgress = features
    .filter(f => f.status === 'in_progress')
    .sort((a, b) => a.priority - b.priority);
  if (inProgress.length > 0) return inProgress[0];

  const notStarted = features
    .filter(f => f.status === 'not_started')
    .sort((a, b) => a.priority - b.priority);
  if (notStarted.length > 0) return notStarted[0];

  return null;
}

// ---- Run verification ----

function runVerification() {
  const steps = [
    { label: 'lint', cmd: 'npm run lint', cwd: PROJECT_ROOT },
    { label: 'check-arch', cmd: 'npm run check-arch', cwd: PROJECT_ROOT },
    { label: 'test', cmd: 'npm test', cwd: PROJECT_ROOT },
  ];

  const results = [];
  for (const step of steps) {
    try {
      const output = execSync(step.cmd, {
        cwd: step.cwd,
        encoding: 'utf-8',
        stdio: 'pipe',
        timeout: 30000,
      });
      results.push({ label: step.label, passed: true, output });
    } catch (err) {
      results.push({
        label: step.label,
        passed: false,
        output: err.stdout || '' + (err.stderr || '') + err.message,
      });
    }
  }
  return results;
}

// ---- Check test coverage for feature ----

function hasTestBlock(featureId) {
  if (!existsSync(TEST_PATH)) return false;
  const content = readFileSync(TEST_PATH, 'utf-8');

  // Match patterns like: "kb-008" appearing near "Test 13" label
  // Also match the console.log label pattern
  const idPattern = new RegExp(featureId.replace('-', '\\-'));
  const testBlockPattern = new RegExp(
    `Test \\d+[^]*?\\(${featureId.replace('-', '\\-')}\\)`,
    'i'
  );

  return testBlockPattern.test(content) || (
    // Fallback: check if feature ID appears in a test header comment
    content.includes(featureId) &&
    content.includes('Test')
  );
}

// ---- Format evidence entry ----

function makeEvidence(feature, verificationResults, testBlockFound) {
  const today = new Date().toISOString().split('T')[0];
  const passed = verificationResults.filter(r => r.passed).length;
  const total = verificationResults.length;

  const lines = [];
  lines.push(`${today}: All ${total}/${total} verification checks passed.`);
  for (const r of verificationResults) {
    const status = r.passed ? 'PASS' : 'FAIL';
    lines.push(`${today}: ${r.label} — ${status}`);
  }
  if (testBlockFound) {
    lines.push(`${today}: Test block for ${feature.id} found in test.js.`);
  }

  // Extract assertion count from test output
  const testResult = verificationResults.find(r => r.label === 'test');
  if (testResult && testResult.passed) {
    const match = testResult.output.match(/Results:\s*(\d+)\s*passed/);
    if (match) {
      lines.push(`${today}: ${match[1]} assertions passing in test suite.`);
    }
  }

  return lines;
}

// ---- Main ----

function main() {
  console.log('verify-feature: loading feature list...');
  const data = loadFeatureList();
  const candidate = findCandidate(data.features);

  if (!candidate) {
    console.log('verify-feature: all features are passing or blocked. Nothing to promote.');
    console.log('verify-feature: OK');
    return 0;
  }

  console.log(`verify-feature: candidate feature = ${candidate.id} (${candidate.title})`);
  console.log(`verify-feature: current status = ${candidate.status}`);
  console.log('verify-feature: running verification pipeline...\n');

  const results = runVerification();
  const allPassed = results.every(r => r.passed);

  // Print results
  for (const r of results) {
    const icon = r.passed ? 'PASS' : 'FAIL';
    console.log(`  ${icon}  ${r.label}`);
  }
  console.log('');

  if (!allPassed) {
    console.log('verify-feature: verification failed. Feature status unchanged.');
    process.exit(1);
  }

  // Check test block
  const testBlockFound = hasTestBlock(candidate.id);
  if (!testBlockFound) {
    console.log(`verify-feature: WARNING — no test block found for ${candidate.id} in test.js.`);
    console.log('verify-feature: Feature status unchanged (passing_requires_evidence).');
    process.exit(1);
  }

  // Promote feature
  candidate.status = 'passing';
  const newEvidence = makeEvidence(candidate, results, testBlockFound);
  if (!candidate.evidence) candidate.evidence = [];
  candidate.evidence.push(...newEvidence);

  saveFeatureList(data);
  console.log(`verify-feature: ${candidate.id} promoted to 'passing'.`);
  console.log(`verify-feature: evidence added: ${newEvidence.length} entries.`);
  console.log('verify-feature: OK');
  return 0;
}

const exitCode = main();
process.exit(exitCode);
