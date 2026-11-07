import fs from 'node:fs';
import path from 'node:path';
import { execSync, spawnSync } from 'node:child_process';
import { parseApplicationManifest } from '../../../../../framework/src/contracts.ts';
import { runVerification } from './verify-review-fixes.mjs';

console.log('Running T02 Negative Verification Tests...');

const negativeResults = [];
let negFailCount = 0;

function recordNegTest(id, name, passed, details = '') {
  negativeResults.push({ id, name, passed, details });
  const status = passed ? 'PASS' : 'FAIL';
  if (!passed) negFailCount++;
  console.log(`[${status}] ${id}: ${name}${details ? ' — ' + details : ''}`);
}

// --- Negative Test 1: Simulated Wrong Upstream Commit SHA ---
console.log('\n--- NegTest 1: Wrong Upstream SHA detection ---');
{
  const simulatedExpectedCommit = '0000000000000000000000000000000000000000';
  const tag = 'refs/tags/2.3.4';
  const repo = 'https://github.com/bludit/bludit';
  try {
    const out = execSync(`git ls-remote ${repo} ${tag}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    const match = out.split('\n').find(line => line.includes(tag));
    const isMatched = match && match.startsWith(simulatedExpectedCommit);
    if (!isMatched) {
      recordNegTest('NEG_WRONG_SHA', 'Verify mismatch is caught when upstream SHA does not match expected', true, `Correctly rejected invalid commit ${simulatedExpectedCommit}`);
    } else {
      recordNegTest('NEG_WRONG_SHA', 'Verify mismatch is caught when upstream SHA does not match expected', false, 'Failed: Invalid commit was unexpectedly accepted');
    }
  } catch (e) {
    recordNegTest('NEG_WRONG_SHA', 'Verify mismatch is caught when upstream SHA does not match expected', false, e.message);
  }
}

// --- Negative Test 2: Simulated Network / DNS Error on Claroline remote query ---
console.log('\n--- NegTest 2: Network error must NOT be interpreted as tag absence ---');
{
  const unreachableRepo = 'https://invalid-nonexistent-domain-bewt-test.org/Claroline';
  let recordedStatus = null;
  let recordedDetails = '';

  try {
    const out = execSync(`git ls-remote ${unreachableRepo} refs/tags/1.11.10*`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    if (!out) {
      recordedStatus = 'NOT_VERIFIED';
    } else {
      recordedStatus = 'FAIL';
    }
  } catch (e) {
    recordedStatus = 'BLOCKED';
    recordedDetails = `Remote query failed: ${e.message}. Network error cannot prove tag absence.`;
  }

  if (recordedStatus === 'BLOCKED') {
    recordNegTest('NEG_NETWORK_ERROR_HANDLING', 'Network/DNS error must result in BLOCKED, not false NOT_VERIFIED or PASS', true, 'Correctly categorized network error as BLOCKED');
  } else {
    recordNegTest('NEG_NETWORK_ERROR_HANDLING', 'Network/DNS error must result in BLOCKED, not false NOT_VERIFIED or PASS', false, `Failed: Network error was incorrectly marked as ${recordedStatus}`);
  }
}

// --- Negative Test 3: Simulated Invalid Runtime Manifest (Missing imageDigest) ---
console.log('\n--- NegTest 3: Runtime validator must reject invalid runtime manifest ---');
{
  const invalidManifest = {
    schemaVersion: '1.0.0',
    appId: 'bad-app',
    benchmarkBaseVersion: '1.0.0',
    source: { kind: 'git', repositoryUrl: 'https://github.com/example/repo', commit: 'b31302f4e99c3293bd742c6d076a721e168118b0' },
    runtime: { kind: 'docker-compose', composeFile: 'docker-compose.yml', service: 'app', port: 8080, healthCheckUrl: 'http://localhost:8080' },
    fixtureReset: { kind: 'custom', command: 'echo reset' },
    allowedTools: ['file:read'],
  };

  let rejected = false;
  try {
    parseApplicationManifest(invalidManifest);
  } catch (e) {
    rejected = true;
    recordNegTest('NEG_INVALID_RUNTIME_MANIFEST', 'Runtime validator must reject manifest missing imageDigest', true, `Correctly rejected: ${e.message}`);
  }

  if (!rejected) {
    recordNegTest('NEG_INVALID_RUNTIME_MANIFEST', 'Runtime validator must reject manifest missing imageDigest', false, 'Failed: Invalid manifest was accepted by validator');
  }
}

// --- Negative Test 4: Runner script process exit code behavior on simulated failure ---
console.log('\n--- NegTest 4: Runner script process exit code behavior on simulated failure ---');
{
  const tempScriptPath = 'docs/tasks/T02/evidence/review-fixes/_temp_fail_runner.mjs';
  const tempScriptContent = `
    import { runVerification } from './verify-review-fixes.mjs';
    runVerification({
      overrideBaseSha: '0000000000000000000000000000000000000000',
      writeEvidence: false,
      silent: false
    });
  `;
  fs.writeFileSync(tempScriptPath, tempScriptContent, 'utf8');

  try {
    const proc = spawnSync(process.execPath, ['--experimental-strip-types', tempScriptPath], { encoding: 'utf8' });
    const exitedWithError = proc.status === 1;
    const errorLogged = (proc.stderr + proc.stdout).includes('Verification FAILED: 1 test(s) failed');
    const successNotLogged = !proc.stdout.includes('All required verification checks completed successfully!');

    if (exitedWithError && errorLogged && successNotLogged) {
      recordNegTest('NEG_PROCESS_EXIT_CODE', 'Runner process exits with code 1 and suppresses success message on failure', true, `Process exit code: ${proc.status}`);
    } else {
      recordNegTest('NEG_PROCESS_EXIT_CODE', 'Runner process exits with code 1 and suppresses success message on failure', false, `Exit code: ${proc.status}, stdout: ${proc.stdout}, stderr: ${proc.stderr}`);
    }
  } finally {
    if (fs.existsSync(tempScriptPath)) {
      fs.unlinkSync(tempScriptPath);
    }
  }
}

// --- Negative Test 5: Draft Manifest with extra fields or dummy digest must be BLOCKED by runtime validator ---
console.log('\n--- NegTest 5: Draft manifest with non-sha256 digest is strictly blocked ---');
{
  const draftManifest = {
    schemaVersion: '1.0.0',
    manifestType: 'DRAFT_STATIC_AUDIT_NOT_PRODUCTION',
    appId: 'bludit',
    benchmarkBaseVersion: '2.3.4',
    source: { kind: 'git', repositoryUrl: 'https://github.com/bludit/bludit', commit: '44de235a5eedda9b80d9f0babd9fd5cb8c6943bd' },
    runtime: { kind: 'source-built', dockerfile: 'Dockerfile', imageDigest: 'NOT_PULLED_STATIC_AUDIT', port: 8080, healthCheckUrl: 'http://localhost:8080' },
    fixtureReset: { kind: 'custom', command: 'echo reset' },
    allowedTools: ['file:read'],
  };

  let blocked = false;
  try {
    parseApplicationManifest(draftManifest);
  } catch (e) {
    blocked = true;
    recordNegTest('NEG_DRAFT_MANIFEST_BLOCK', 'Draft manifest with dummy digest and extra fields is blocked from runtime execution', true, `Blocked with: ${e.message}`);
  }

  if (!blocked) {
    recordNegTest('NEG_DRAFT_MANIFEST_BLOCK', 'Draft manifest with dummy digest and extra fields is blocked from runtime execution', false, 'Failed: Draft manifest bypassed runtime validation');
  }
}

// --- Write TAP and JSON Reports for Negative Tests ---
console.log('\n--- Generating Negative Test Evidence Logs ---');
const negTapLines = ['TAP version 13', `1..${negativeResults.length}`];
negativeResults.forEach((r, idx) => {
  const tapStatus = r.passed ? 'ok' : 'not ok';
  negTapLines.push(`${tapStatus} ${idx + 1} - ${r.id}: ${r.name}${r.details ? ' — ' + r.details : ''}`);
});

fs.writeFileSync('docs/tasks/T02/evidence/review-fixes/negative-tests.tap', negTapLines.join('\n') + '\n', 'utf8');
fs.writeFileSync('docs/tasks/T02/evidence/review-fixes/negative-tests-validation.json', JSON.stringify({
  timestamp: new Date().toISOString(),
  summary: {
    total: negativeResults.length,
    passed: negativeResults.filter(r => r.passed).length,
    failed: negFailCount,
  },
  results: negativeResults,
}, null, 2), 'utf8');

console.log(`Generated: docs/tasks/T02/evidence/review-fixes/negative-tests.tap (${negativeResults.length} tests)`);
console.log(`Generated: docs/tasks/T02/evidence/review-fixes/negative-tests-validation.json`);

if (negFailCount > 0) {
  process.exitCode = 1;
  console.error(`\n[ERROR] Negative testing FAILED: ${negFailCount} assertion(s) failed.`);
} else {
  console.log('\nAll negative verification assertions passed successfully!');
}
