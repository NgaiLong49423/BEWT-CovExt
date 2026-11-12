import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runG0Workflow } from '../../tools/unified-g0-runner.mjs';
import { createJoomlaRuntimeCredentials, safeCredentialMetadata } from './jo-gap004-runtime-credentials.mjs';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, '../../..');
const runId = process.argv[2] || '';
const taskCommit = process.env.BEWT_G3_TASK_COMMIT || '';
if (!/^[a-z0-9][a-z0-9-]{2,62}$/.test(runId)) {
  throw new Error('Usage: node experiments/joomla/tools/run-jo-gap-004-g3.mjs <unique-run-id>');
}
if (!/^[a-f0-9]{40}$/.test(taskCommit)) {
  throw new Error('BEWT_G3_TASK_COMMIT must be the full tested PR #33 commit SHA');
}

const runtimeCredentials = createJoomlaRuntimeCredentials(runId);
Object.assign(process.env, runtimeCredentials);

const hashFile = (relativePath) => createHash('sha256')
  .update(readFileSync(resolve(repoRoot, relativePath)).toString('utf8').replace(/\r\n/g, '\n'))
  .digest('hex');
const reportedVersion = (command, args, pattern) => {
  const result = spawnSync(command, args, { cwd: repoRoot, encoding: 'utf8', windowsHide: true });
  if (result.error || result.status !== 0) return 'VERSION_UNAVAILABLE';
  const output = `${result.stdout || ''}\n${result.stderr || ''}`;
  return pattern.exec(output)?.[1] || 'VERSION_NOT_REPORTED';
};
const javaVersion = reportedVersion('java', ['-version'], /version "([^"]+)"/);
const mavenVersion = reportedVersion('mvn', ['-version'], /Apache Maven ([^\s]+)/);
const evidenceDirRelative = `docs/tasks/g3-evidence/joomla/JO-GAP-004/${runId}`;
const evidenceDir = resolve(repoRoot, evidenceDirRelative);
mkdirSync(evidenceDir, { recursive: true });

const registrationPath = 'extension/joomla/selenium/ae6c8ee75a51838ce2ddfa2df16cb9ed/revision-3/registration.json';
const candidatePath = 'extension/joomla/selenium/ae6c8ee75a51838ce2ddfa2df16cb9ed/revision-3/T01C_ae6c8ee75a51838ce2ddfa2df16cb9ed_R3.java';
const suitePath = 'experiments/joomla/bewt-suite/src/test/java/base/JO_GAP_004_G3_Suite.java';
const featurePath = 'data/coverage/joomla/source-backed-gap-proposals.json';
const appManifestPath = 'config/apps/joomla.json';
const suitePlanPath = 'experiments/joomla/g0-plan.json';
const runnerPath = 'experiments/tools/unified-g0-runner.mjs';
const registration = JSON.parse(readFileSync(resolve(repoRoot, registrationPath), 'utf8'));
const featureDoc = JSON.parse(readFileSync(resolve(repoRoot, featurePath), 'utf8'));
const candidate = featureDoc.candidates.find((item) => item.candidateId === 'JO-GAP-004');
const appManifest = JSON.parse(readFileSync(resolve(repoRoot, appManifestPath), 'utf8'));
const suitePlan = JSON.parse(readFileSync(resolve(repoRoot, suitePlanPath), 'utf8'));
const gherkinSha256 = createHash('sha256').update(candidate.gherkinScenario).digest('hex');
if (gherkinSha256 !== registration.gherkinSha256) throw new Error('Gherkin hash does not match immutable R3 registration');
if (hashFile(candidatePath) !== registration.sourceSha256) throw new Error('Candidate Java source does not match immutable R3 registration');
if (hashFile('experiments/joomla/bewt-suite/src/test/java/base/T01C_ae6c8ee75a51838ce2ddfa2df16cb9ed_R3.java') !== registration.sourceSha256) {
  throw new Error('Maven suite Java copy does not match immutable R3 registration');
}

const checkoutSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
const checkoutDirty = execFileSync('git', ['status', '--porcelain=v1'], { cwd: repoRoot, encoding: 'utf8' }).trim().length > 0;
const provenance = {
  schemaVersion: '1.0.0',
  candidateId: 'JO-GAP-004',
  runId,
  taskCommit,
  runtimeCheckout: { head: checkoutSha, dirty: checkoutDirty },
  application: {
    sourceRepository: appManifest.source.repository,
    sourceCommit: appManifest.source.commit,
    sourceVersion: appManifest.source.packageVersion,
    image: appManifest.runtime.image,
    imageDigest: appManifest.runtime.imageDigest,
    benchmarkSuiteCommit: suitePlan.source.benchmarkSuiteCommit,
  },
  candidate: {
    gherkinSha256,
    gherkinSourcePath: featurePath,
    javaSourcePath: candidatePath,
    javaSourceSha256: registration.sourceSha256,
    mavenSuiteCopyPath: 'experiments/joomla/bewt-suite/src/test/java/base/T01C_ae6c8ee75a51838ce2ddfa2df16cb9ed_R3.java',
    fixtureSetupClass: 'base.JO_GAP_004_G3_Suite',
    fixtureSetupSourcePath: suitePath,
    fixtureSetupSourceSha256: hashFile(suitePath),
  },
  harness: {
    runnerSourcePath: runnerPath,
    runnerSourceSha256: hashFile(runnerPath),
    runRecordCapturesContainerIdsAndResolvedImageIds: true,
    pomPath: 'experiments/joomla/bewt-suite/pom.xml',
    pomSha256: hashFile('experiments/joomla/bewt-suite/pom.xml'),
  },
  runtime: { javaVersion, mavenVersion, seleniumAndBrowserDetails: 'CAPTURED_AFTER_RUN_IN_RUN_RECORD' },
  credentialHandling: safeCredentialMetadata(),
  command: `node experiments/joomla/tools/run-jo-gap-004-g3.mjs ${runId}`,
  candidateMavenCommand: 'mvn -B -f experiments/joomla/bewt-suite/pom.xml -Dtest=base.JO_GAP_004_G3_Suite clean test',
  g3Status: 'PRELIMINARY_ENGINEERING_EXECUTION',
  humanOracleNoveltyApproval: 'PENDING',
  validated: false,
};

writeFileSync(join(evidenceDir, 'g3-provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
process.env.BEWT_G3_RUN_ID = runId;
process.env.BEWT_CANDIDATE_JAVA_SHA256 = registration.sourceSha256;
process.env.BEWT_FIXTURE_SETUP_SHA256 = provenance.candidate.fixtureSetupSourceSha256;
process.env.BEWT_FIXTURE_EVIDENCE_PATH = join(evidenceDir, 'fixture-setup.json');

let result;
try {
  result = await runG0Workflow('joomla', runId, {
    testClass: 'base.JO_GAP_004_G3_Suite',
    evidenceDir: evidenceDirRelative,
  });
} catch (error) {
  result = { appId: 'joomla', runId, outcome: 'BLOCKED', exitCode: 1, errorName: error.name };
  writeFileSync(join(evidenceDir, 'run-exception.json'), `${JSON.stringify(result, null, 2)}\n`);
}

const runRecordPath = join(evidenceDir, 'run-record.json');
if (existsSync(runRecordPath)) {
  const runRecord = JSON.parse(readFileSync(runRecordPath, 'utf8'));
  provenance.runtime = {
    javaVersion,
    mavenVersion,
    seleniumRuntime: runRecord.seleniumRuntime || null,
    containers: runRecord.containers || [],
  };
  writeFileSync(join(evidenceDir, 'g3-provenance.json'), `${JSON.stringify(provenance, null, 2)}\n`);
}

writeFileSync(join(evidenceDir, 'g3-result.json'), `${JSON.stringify({
  ...result,
  preliminaryEngineeringExecution: true,
  humanOracleNoveltyApproval: 'PENDING',
  validated: false,
}, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
process.exitCode = result.exitCode;
