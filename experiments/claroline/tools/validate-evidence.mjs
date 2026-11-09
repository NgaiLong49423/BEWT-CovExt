import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APP_IMAGE_REF,
  APP_TEST_CLASS,
  APPLICATION_SOURCE_COMMIT,
  BROWSER_IMAGE_REF,
  HOST_FIREWALL_PUBLISHED_NETWORK_POLICY,
  ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY,
  SOURCE_COMMIT,
  parseSurefireXml,
  validateRunId,
} from './claroline-g0.mjs';
import { isPrivateInventoryFile, resolveEvidenceDirectoryById, validateEvidenceId, verifySha256Manifest } from './cloud-controller.mjs';

const EXPECTED_APP_DIGEST = APP_IMAGE_REF.slice(APP_IMAGE_REF.indexOf('@') + 1);
const EXPECTED_BROWSER_DIGEST = BROWSER_IMAGE_REF.slice(BROWSER_IMAGE_REF.indexOf('@') + 1);

const SECRET_PATTERNS = [
  { name: 'oauth_token', regex: /\bya29\.[A-Za-z0-9._-]+\b/ },
  { name: 'private_key', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'fixture_secret', regex: /\bn0tl[\w-]+\b/i },
  { name: 'windows_user_path', regex: /\b[A-Z]:\\Users\\[^\s"'<>]+/i },
  { name: 'linux_home_path', regex: /\/home\/[a-zA-Z0-9._-]+\/[^\s"'<>]+/ },
];

export function scanEvidenceForSecretsAndLeaks(dirPath) {
  const findings = [];
  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
    return { outcome: 'FAIL', findings: ['directory does not exist'] };
  }
  const entries = readdirSync(dirPath, { withFileTypes: true }).filter(e => e.isFile());
  for (const entry of entries) {
    if (entry.name !== 'sha256-manifest.json' && isPrivateInventoryFile(entry.name)) {
      findings.push(`private inventory file present in public evidence directory: ${entry.name}`);
    }
    const content = readFileSync(join(dirPath, entry.name), 'utf8');
    for (const pattern of SECRET_PATTERNS) {
      if (pattern.regex.test(content)) {
        findings.push(`secret/path pattern '${pattern.name}' matched in ${entry.name}`);
      }
    }
  }
  return {
    outcome: findings.length === 0 ? 'PASS' : 'FAIL',
    findings,
  };
}

export function validateEvidenceDirectory(dirPath, { requireManifest = true } = {}) {
  const errors = [];
  const contradictions = [];
  const warnings = [];

  if (!existsSync(dirPath) || !statSync(dirPath).isDirectory()) {
    return {
      valid: false,
      status: 'EVIDENCE_MISSING',
      errors: [`Evidence directory does not exist: ${dirPath}`],
      contradictions: [],
    };
  }

  const folderRunId = basename(resolve(dirPath));
  try {
    validateRunId(folderRunId);
  } catch (error) {
    errors.push(`Invalid folder runId '${folderRunId}': ${error.message}`);
  }

  const readJsonIfPresent = name => {
    const p = join(dirPath, name);
    if (!existsSync(p)) return null;
    try {
      return JSON.parse(readFileSync(p, 'utf8'));
    } catch (error) {
      errors.push(`Invalid JSON in ${name}: ${error.message}`);
      return null;
    }
  };

  const runRecord = readJsonIfPresent('run-record.json');
  if (!runRecord) {
    errors.push('Missing required run-record.json');
  } else {
    if (runRecord.runId !== folderRunId) {
      contradictions.push(`EVIDENCE_CONTRADICTION: run-record.json runId (${runRecord.runId}) !== directory (${folderRunId})`);
    }
    if (runRecord.benchmarkRepositoryCommit !== SOURCE_COMMIT) {
      contradictions.push(`EVIDENCE_CONTRADICTION: benchmarkRepositoryCommit (${runRecord.benchmarkRepositoryCommit}) !== ${SOURCE_COMMIT}`);
    }
    if (runRecord.applicationSourceCommit !== null && runRecord.applicationSourceCommit !== undefined && runRecord.applicationSourceCommit !== APPLICATION_SOURCE_COMMIT) {
      contradictions.push(`EVIDENCE_CONTRADICTION: applicationSourceCommit (${runRecord.applicationSourceCommit}) !== ${APPLICATION_SOURCE_COMMIT}`);
    }
    if (runRecord.imageDigest !== EXPECTED_APP_DIGEST) {
      contradictions.push(`EVIDENCE_CONTRADICTION: app imageDigest (${runRecord.imageDigest}) !== ${EXPECTED_APP_DIGEST}`);
    }
    if (runRecord.browserImageDigest !== EXPECTED_BROWSER_DIGEST) {
      contradictions.push(`EVIDENCE_CONTRADICTION: browserImageDigest (${runRecord.browserImageDigest}) !== ${EXPECTED_BROWSER_DIGEST}`);
    }
    if (runRecord.createdAtUtc && runRecord.startedAtUtc) {
      if (Date.parse(runRecord.createdAtUtc) > Date.parse(runRecord.startedAtUtc)) {
        contradictions.push('EVIDENCE_CONTRADICTION: run-record createdAtUtc is after startedAtUtc');
      }
    }
  }

  // Memory preflight check
  const memoryPreflight = readJsonIfPresent('memory-preflight.json');
  if (!memoryPreflight) {
    errors.push('Missing required memory-preflight.json');
  } else if (Array.isArray(memoryPreflight.samples)) {
    for (let i = 1; i < memoryPreflight.samples.length; i += 1) {
      if (Date.parse(memoryPreflight.samples[i - 1].capturedAtUtc) > Date.parse(memoryPreflight.samples[i].capturedAtUtc)) {
        contradictions.push('EVIDENCE_CONTRADICTION: memory-preflight sample timestamps are out of order');
      }
    }
  }

  // Image inspect check
  const imageInspect = readJsonIfPresent('image-inspect-sanitized.json') || readJsonIfPresent('image-inspect.json');
  if (imageInspect) {
    const appDigests = imageInspect.app?.repoDigests || imageInspect.app?.RepoDigests || [];
    const browserDigests = imageInspect.browser?.repoDigests || imageInspect.browser?.RepoDigests || [];
    if (!appDigests.includes(APP_IMAGE_REF)) {
      contradictions.push(`EVIDENCE_CONTRADICTION: inspected app image RepoDigests do not contain ${APP_IMAGE_REF}`);
    }
    if (!browserDigests.includes(BROWSER_IMAGE_REF)) {
      contradictions.push(`EVIDENCE_CONTRADICTION: inspected browser image RepoDigests do not contain ${BROWSER_IMAGE_REF}`);
    }
  }

  // Network policy check
  const networkPolicy = readJsonIfPresent('network-policy-verification.json');
  if (networkPolicy) {
    if (networkPolicy.policy === ROUTE_ISOLATED_PUBLISHED_NETWORK_POLICY || networkPolicy.policy === HOST_FIREWALL_PUBLISHED_NETWORK_POLICY) {
      if (networkPolicy.ipv6Enabled !== false || networkPolicy.ipMasquerade !== 'false') {
        contradictions.push('EVIDENCE_CONTRADICTION: network-policy-verification claims PASS without ipv6Enabled=false and ipMasquerade="false"');
      }
    }
  }

  // Diagnostic / Runtime result & DB / JUnit checks
  const diagnosticResult = readJsonIfPresent('diagnostic-result.json');
  const dbReadiness = readJsonIfPresent('database-readiness.json');
  const dbBefore = readJsonIfPresent('database-before.json');
  const dbAfter = readJsonIfPresent('database-after.json');
  const httpReadiness = readJsonIfPresent('http-readiness.json');
  const mavenExit = readJsonIfPresent('maven-exit.json');
  const junitSummary = readJsonIfPresent('junit-result.json') || readJsonIfPresent('junit-summary.json');
  const surefireXmlPath = join(dirPath, 'TEST-test.Claroline_AddUserTest.xml');

  let parsedSurefire = { outcome: 'NOT_RUN', tests: 0, failures: 0, errors: 0 };
  if (existsSync(surefireXmlPath)) {
    const xmlText = readFileSync(surefireXmlPath, 'utf8');
    parsedSurefire = parseSurefireXml(xmlText, APP_TEST_CLASS);
    if (junitSummary && junitSummary.outcome === 'PASS' && parsedSurefire.outcome !== 'PASS') {
      contradictions.push(`EVIDENCE_CONTRADICTION: junit-result.json claims PASS but real Surefire XML parsed as ${parsedSurefire.outcome}`);
    }
  } else if (junitSummary && junitSummary.outcome === 'PASS') {
    contradictions.push('EVIDENCE_CONTRADICTION: junit-result.json claims PASS but TEST-test.Claroline_AddUserTest.xml is missing');
  }

  if (dbReadiness) {
    const dbOk = dbReadiness.exitCode === 0 && dbReadiness.expectedDatabasePresent === true;
    if (!dbOk && diagnosticResult?.outcome === 'PASS') {
      contradictions.push('EVIDENCE_CONTRADICTION: database-readiness failed but diagnostic-result claims PASS');
    }
  }

  if (diagnosticResult) {
    if (diagnosticResult.outcome === 'PASS') {
      if (!httpReadiness || httpReadiness.outcome !== 'PASS') {
        contradictions.push('EVIDENCE_CONTRADICTION: diagnostic-result claims PASS without http-readiness PASS');
      }
      if (!dbReadiness || dbReadiness.exitCode !== 0 || dbReadiness.expectedDatabasePresent !== true) {
        contradictions.push('EVIDENCE_CONTRADICTION: diagnostic-result claims PASS without database-readiness PASS');
      }
      const routeVer = readJsonIfPresent('app-route-verification.json');
      if (!routeVer || routeVer.outcome !== 'PASS') {
        contradictions.push('EVIDENCE_CONTRADICTION: diagnostic-result claims PASS without app-route-verification PASS');
      }
    }
    if (diagnosticResult.selenium === 'PASS' && parsedSurefire.outcome !== 'PASS') {
      contradictions.push('EVIDENCE_CONTRADICTION: diagnostic-result claims selenium PASS without passing Surefire XML');
    }
  }

  if (mavenExit && mavenExit.exitCode !== 0 && junitSummary?.outcome === 'PASS') {
    contradictions.push('EVIDENCE_CONTRADICTION: maven-exit.json has nonzero exitCode but junit-result claims PASS');
  }

  // Cleanup & residual verification
  const cleanupResult = readJsonIfPresent('cleanup-result.json');
  const cleanupRecovery = readJsonIfPresent('cleanup-recovery-r1.json');
  const effectiveCleanup = (cleanupResult?.outcome === 'PASS') ? cleanupResult : (cleanupRecovery?.outcome === 'PASS' ? cleanupRecovery : cleanupResult);
  const inventorySummary = readJsonIfPresent('post-cleanup-independent-check.json') || readJsonIfPresent('docker-inventory-sanitized-summary.json');
  let computedResidualCount = null;
  if (effectiveCleanup) {
    const inner = effectiveCleanup.result || effectiveCleanup;
    if (typeof inner.residualCount === 'number') {
      computedResidualCount = inner.residualCount;
    } else if (inner.residuals && typeof inner.residuals === 'object') {
      computedResidualCount = Number(inner.residuals.containers || 0) + Number(inner.residuals.networks || 0) + Number(inner.residuals.volumes || 0);
    }
  }
  if (runRecord && (runRecord.network || (Array.isArray(runRecord.containers) && runRecord.containers.length > 0))) {
    if (!effectiveCleanup) {
      errors.push('Missing cleanup-result.json for run that created Docker resources');
    } else {
      const cleanupOutcome = effectiveCleanup.outcome;
      if (cleanupOutcome !== 'PASS' || computedResidualCount !== 0) {
        errors.push(`Cleanup did not prove zero residuals (outcome=${cleanupOutcome}, residualCount=${computedResidualCount})`);
      }
    }
    if (inventorySummary) {
      if (!inventorySummary.countsEqual || !inventorySummary.fingerprintsEqual) {
        contradictions.push('EVIDENCE_CONTRADICTION: docker-inventory-sanitized-summary before/after counts or fingerprints do not match');
      }
    }
  }

  // Manifest check
  const manifest = readJsonIfPresent('sha256-manifest.json');
  let manifestVerification = { outcome: 'NOT_RUN', verifiedFileCount: 0, mismatches: [] };
  if (requireManifest) {
    if (!manifest) {
      errors.push('Missing required sha256-manifest.json');
    } else {
      manifestVerification = verifySha256Manifest(dirPath, manifest);
      if (manifestVerification.outcome !== 'PASS') {
        errors.push(...manifestVerification.mismatches.map(m => `SHA-256 manifest error: ${m}`));
      }
    }
  } else if (manifest) {
    manifestVerification = verifySha256Manifest(dirPath, manifest);
  }

  // Secret & path leak check
  const secretScan = scanEvidenceForSecretsAndLeaks(dirPath);
  if (secretScan.outcome !== 'PASS') {
    errors.push(...secretScan.findings);
  }

  const valid = errors.length === 0 && contradictions.length === 0;
  const runOutcome = diagnosticResult?.outcome || (parsedSurefire.outcome === 'PASS' && dbBefore?.matchingRows === 0 && dbAfter?.matchingRows === 1 ? 'PASS' : 'BLOCKED');

  return {
    valid,
    status: contradictions.length > 0 ? 'EVIDENCE_CONTRADICTION' : (errors.length > 0 ? 'INVALID_EVIDENCE' : 'VALID'),
    runId: folderRunId,
    runOutcome,
    seleniumE2eStatus: existsSync(surefireXmlPath) ? parsedSurefire.outcome : 'NOT_RUN',
    databaseStatus: dbAfter ? (dbAfter.matchingRows === 1 ? 'PASS' : 'FAIL') : (dbReadiness ? (dbReadiness.expectedDatabasePresent ? 'PASS' : 'FAIL') : 'NOT_RUN'),
    cleanupStatus: effectiveCleanup?.outcome || 'NOT_RUN',
    residualCount: computedResidualCount,
    manifestVerification,
    secretScan,
    contradictions,
    errors,
    warnings,
  };
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const evidenceId = validateEvidenceId(process.argv[2] || '');
  const targetDir = resolveEvidenceDirectoryById(evidenceId);
  const requireManifest = !process.argv.includes('--no-manifest');
  const result = validateEvidenceDirectory(targetDir, { requireManifest });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (!result.valid) process.exitCode = 1;
}
