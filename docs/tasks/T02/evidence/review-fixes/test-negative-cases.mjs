import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
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

// Build every digest case from a manifest accepted by the production parser.
const validDockerManifest = JSON.parse(fs.readFileSync('docs/tasks/T02/manifests/joomla.draft.json', 'utf8'));
delete validDockerManifest.manifestType;
delete validDockerManifest.source.note;
validDockerManifest.runtime.imageDigest = `sha256:${'a'.repeat(64)}`;
parseApplicationManifest(validDockerManifest);

// --- Negative Test 1: Wrong upstream SHA through runVerification() ---
console.log('\n--- NegTest 1: Wrong upstream SHA detection through runner ---');
{
  const expected = '0000000000000000000000000000000000000000';
  const actual = '44de235a5eedda9b80d9f0babd9fd5cb8c6943bd';
  const result = runVerification({
    overrideUpstreamPins: [{ app: 'bludit', repo: 'https://github.com/bludit/bludit', tag: 'refs/tags/2.3.4', expectedCommit: expected, isPeeled: false }],
    commandExecutor: (file, args, options) => file === 'git' && args[0] === 'ls-remote'
      ? `${actual} refs/tags/2.3.4\n`
      : execFileSync(file, args, options),
    writeEvidence: false,
    silent: true,
    applyProcessExitCode: false,
  });
  const outcome = result.results.find(item => item.id === 'PROVENANCE_BLUDIT');
  recordNegTest('NEG_WRONG_SHA', 'runVerification reports FAIL when upstream commit differs from the pinned SHA', outcome?.status === 'FAIL', outcome?.details || 'Runner produced no Bludit provenance result');
}

// --- Negative Test 2: Inject a network error into runVerification() ---
console.log('\n--- NegTest 2: Network error must NOT be interpreted as tag absence ---');
{
  const result = runVerification({
    overrideUpstreamPins: [{ app: 'claroline', repo: 'https://github.com/claroline/Claroline', tag: 'refs/tags/1.11.10', expectedCommit: 'NOT_VERIFIED', isPeeled: false }],
    commandExecutor: (file, args, options) => {
      if (file === 'git' && args[0] === 'ls-remote') throw Object.assign(new Error('simulated DNS lookup failed'), { code: 'ENOTFOUND' });
      return execFileSync(file, args, options);
    },
    writeEvidence: false,
    silent: true,
    applyProcessExitCode: false,
  });
  const outcome = result.results.find(item => item.id === 'PROVENANCE_CLAROLINE');
  recordNegTest('NEG_NETWORK_ERROR_HANDLING', 'runVerification classifies injected network failure as BLOCKED', outcome?.status === 'BLOCKED', outcome?.details || 'Runner produced no Claroline provenance result');
}

// --- Negative Test 3: Missing imageDigest is the only mutation ---
console.log('\n--- NegTest 3: Valid Docker manifest fails specifically for missing image digest ---');
{
  const invalidManifest = structuredClone(validDockerManifest);
  delete invalidManifest.runtime.imageDigest;
  let errorMessage = '';
  try { parseApplicationManifest(invalidManifest); } catch (error) { errorMessage = error.message; }
  const expectedMessage = 'Docker runtime requires an image and a pinned sha256 digest';
  recordNegTest('NEG_MISSING_IMAGE_DIGEST', 'Docker manifest with only imageDigest removed fails on the digest requirement', errorMessage === expectedMessage, errorMessage || 'Manifest unexpectedly passed validation');
}

// --- Negative Test 4: Invalid digest value is checked independently ---
console.log('\n--- NegTest 4: Invalid Docker image digest is rejected specifically ---');
{
  const invalidManifest = structuredClone(validDockerManifest);
  invalidManifest.runtime.imageDigest = 'NOT_PULLED_STATIC_AUDIT';
  let errorMessage = '';
  try { parseApplicationManifest(invalidManifest); } catch (error) { errorMessage = error.message; }
  const expectedMessage = 'Docker runtime requires an image and a pinned sha256 digest';
  recordNegTest('NEG_INVALID_IMAGE_DIGEST', 'Docker manifest with malformed imageDigest fails on the digest requirement', errorMessage === expectedMessage, errorMessage || 'Manifest unexpectedly passed validation');
}

// --- Negative Test 5: Draft marker is independently rejected ---
console.log('\n--- NegTest 5: Draft marker is rejected independently of image digest ---');
{
  const markedDraft = { ...structuredClone(validDockerManifest), manifestType: 'DRAFT_STATIC_AUDIT_NOT_PRODUCTION' };
  let errorMessage = '';
  try { parseApplicationManifest(markedDraft); } catch (error) { errorMessage = error.message; }
  const expectedMessage = 'ApplicationManifest contains unsupported fields: manifestType';
  recordNegTest('NEG_DRAFT_MARKER', 'Valid Docker manifest with only the draft marker added is rejected for that marker', errorMessage === expectedMessage, errorMessage || 'Draft marker unexpectedly passed validation');
}

// --- Negative Test 6: Runner script process exit code behavior on simulated failure ---
console.log('\n--- NegTest 6: Runner script process exit code behavior on simulated failure ---');
{
  const tempScriptPath = 'docs/tasks/T02/evidence/review-fixes/_temp_fail_runner.mjs';
  const tempScriptContent = `
    import { runVerification } from './verify-review-fixes.mjs';
    runVerification({
      overrideBaseSha: '0000000000000000000000000000000000000000',
      overrideUpstreamPins: [],
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
