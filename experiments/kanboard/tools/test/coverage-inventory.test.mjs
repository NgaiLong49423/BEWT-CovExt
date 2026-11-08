import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  EXPECTED,
  safeJoin,
  build,
  verifyGitCommit,
  verifyGitBlobHash,
  verifyPinnedFiles,
  trustedGitExecutable
} from '../coverage-inventory.mjs';

const datasetRoot = path.resolve('data/coverage/kanboard');
const sourceRoot = process.env.BEWT_T04A_SOURCE_ROOT;

function createPinnedTestRepo(t) {
  const repo = fs.mkdtempSync(path.join(os.tmpdir(), 't04a-integrity-'));
  t.after(() => fs.rmSync(repo, { recursive: true, force: true }));
  const git = args => {
    const result = spawnSync(trustedGitExecutable(), args, { cwd: repo, encoding: 'utf8', shell: false, windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout.trim();
  };
  git(['init', '--quiet']);
  git(['config', 'user.name', 'T04-A integrity test']);
  git(['config', 'user.email', 't04a-integrity@example.invalid']);
  fs.writeFileSync(path.join(repo, 'source.txt'), 'pinned content\n');
  git(['add', 'source.txt']);
  git(['commit', '--quiet', '-m', 'test fixture']);
  return { repo, commit: git(['rev-parse', 'HEAD']) };
}

test('verified source pins remain fixed to the reviewed inputs', () => {
  assert.equal(EXPECTED.bewtCommit, '0501249ff3e9a5ea83a06155cd2971dc36197056');
  assert.equal(EXPECTED.bewtTree, 'd38fcc0eae8073023c48bb46998741c8c19d4d06');
  assert.equal(EXPECTED.upstreamCommit, '00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b');
});

test('safeJoin rejects traversal and symlinked path components', t => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 't04a-safe-root-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 't04a-safe-outside-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.writeFileSync(path.join(outside, 'secret.txt'), 'private');
  assert.throws(() => safeJoin(root, '../t04a-safe-outside-missing/secret.txt'), /Traversal|escapes/);
  const link = path.join(root, 'link');
  try {
    fs.symlinkSync(outside, link, 'junction');
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') {
      assert.fail(`Symlink test setup is unavailable: ${error.code}`);
    }
    throw error;
  }
  assert.throws(() => safeJoin(root, 'link/secret.txt'), /Symlink/);
});

test('generator rejects a caller-supplied source pin that differs from the contract', () => {
  assert.throws(() => build({
    featureRoot: '.', javaRoot: '.', poRoot: '.', suiteRoot: '.', upstreamRoot: '.',
    bewtRepoRoot: '.', upstreamRepoRoot: '.', bewtCommit: 'wrong', upstreamCommit: EXPECTED.upstreamCommit
  }), /Pinned source commit mismatch/);
});

test('the current repository HEAD is not mistaken for the pinned benchmark HEAD', () => {
  assert.equal(verifyGitCommit(process.cwd(), EXPECTED.bewtCommit), false);
});

test('pinned file integrity accepts unchanged committed bytes', t => {
  const { repo, commit } = createPinnedTestRepo(t);
  const result = verifyPinnedFiles(repo, commit, ['source.txt']);
  assert.equal(result.filesVerified, 1);
  assert.equal(result.files[0].sha256.length, 64);
});

test('pinned file integrity rejects dirty tracked source without changing the checkout', t => {
  const { repo, commit } = createPinnedTestRepo(t);
  fs.writeFileSync(path.join(repo, 'source.txt'), 'modified working tree\n');
  assert.throws(() => verifyPinnedFiles(repo, commit, ['source.txt']), /content mismatch/);
  assert.equal(fs.readFileSync(path.join(repo, 'source.txt'), 'utf8'), 'modified working tree\n');
});

test('pinned file integrity rejects a wrong or missing commit hash', t => {
  const { repo } = createPinnedTestRepo(t);
  assert.throws(() => verifyPinnedFiles(repo, 'f'.repeat(40), ['source.txt']));
});

test('pinned file integrity rejects an incorrect expected Git blob hash', t => {
  const { repo, commit } = createPinnedTestRepo(t);
  const result = verifyPinnedFiles(repo, commit, ['source.txt']);
  const bytes = fs.readFileSync(path.join(repo, 'source.txt'));
  assert.equal(verifyGitBlobHash(bytes, result.files[0].gitBlob), true);
  assert.equal(verifyGitBlobHash(bytes, '0'.repeat(40)), false);
});

test('pinned file integrity rejects symlink inputs', t => {
  const { repo, commit } = createPinnedTestRepo(t);
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 't04a-linked-source-'));
  t.after(() => fs.rmSync(outside, { recursive: true, force: true }));
  fs.writeFileSync(path.join(outside, 'actual.txt'), 'external');
  const link = path.join(repo, 'link');
  try {
    fs.symlinkSync(outside, link, 'junction');
  } catch (error) {
    if (error.code === 'EPERM' || error.code === 'EACCES') assert.fail(`Symlink test setup is unavailable: ${error.code}`);
    else throw error;
  }
  assert.throws(() => verifyPinnedFiles(repo, commit, ['link/actual.txt']), /Symlink|tracked file/);
});

test('inventory maps all baseline cases, assertions, Page Objects and tracked input integrity', () => {
  const inventory = JSON.parse(fs.readFileSync(path.join(datasetRoot, 'inventory.json'), 'utf8'));
  const provenance = JSON.parse(fs.readFileSync(path.join(datasetRoot, 'provenance-index.json'), 'utf8'));
  assert.equal(inventory.sourceStatus, 'STATIC_VERIFIED');
  assert.equal(inventory.sourceIntegrity.result, 'MATCH');
  assert.deepEqual(inventory.counts, { gherkinFiles: 30, javaTestDirectoryFiles: 32, javaSuiteCases: 30, pageObjectClasses: 27, behaviorGroups: 6 });
  assert.equal(inventory.cases.length, 30);
  assert.equal(new Set(inventory.cases.map(record => record.caseId)).size, 30);
  assert.ok(inventory.cases.every(record => record.java.assertions.length > 0 && record.pageObjects.length > 0 && record.expectedOracle.length > 0));
  assert.equal(Object.keys(provenance.javaClassHashes).length, 30);
  assert.equal(Object.keys(provenance.pageObjectHashes).length, 27);
  assert.equal(provenance.sourceIntegrity.bewt.filesVerified, 89);
  assert.equal(provenance.sourceIntegrity.upstream.filesVerified, 24);
  assert.equal(provenance.baselineSupportHashes.testSuite.length, 64);
  assert.equal(provenance.baselineSupportHashes.baseTest.length, 64);
  assert.equal(provenance.sourceCommits.bewtTree, EXPECTED.bewtTree);
  assert.ok(inventory.cases.every(record => record.gherkin.scenarioTitle && record.gherkin.scenarioTitle !== 'UNPARSED'));
  assert.ok(inventory.cases.every(record => record.gherkin.cleanupSteps.length > 0 && record.gherkin.cleanupSteps.some(step => step.text.includes('Logout'))));
  assert.ok(inventory.cases.every(record => !record.expectedOracle.some(step => step.text.includes('Logout'))));
  assert.match(fs.readFileSync(path.resolve('docs/tasks/T04-A/KANBOARD-BASELINE-MAPPING.md'), 'utf8'), /Raw scenario title and observed behavior/);
});

test('candidate proposals remain pending and shortlist/source references stay consistent', () => {
  const taxonomy = JSON.parse(fs.readFileSync(path.join(datasetRoot, 'behavior-taxonomy.json'), 'utf8'));
  const taxonomyCases = taxonomy.groups.flatMap(group => group.caseIds);
  assert.equal(taxonomy.groups.length, 6);
  assert.equal(taxonomyCases.length, 30);
  assert.equal(new Set(taxonomyCases).size, 30);
  const gaps = JSON.parse(fs.readFileSync(path.join(datasetRoot, 'gap-candidates.json'), 'utf8'));
  const shortlist = JSON.parse(fs.readFileSync(path.join(datasetRoot, 'shortlist.json'), 'utf8'));
  assert.equal(gaps.items.length, 10);
  assert.equal(new Set(gaps.items.map(item => item.id)).size, 10);
  assert.ok(gaps.items.every(item => item.status === 'PROPOSED' && item.reviewDecision === 'PENDING' && item.preconditions.length && item.expectedObservableResult && item.sourceEvidence.length));
  const knownSources = new Set(JSON.parse(fs.readFileSync(path.join(datasetRoot, 'provenance-index.json'), 'utf8')).upstreamReferences.map(item => item.path));
  assert.ok(gaps.items.flatMap(item => item.sourceEvidence).every(item => item.commit === EXPECTED.upstreamCommit && item.url.includes(EXPECTED.upstreamCommit) && knownSources.has(item.path)));
  assert.equal(shortlist.items.length, 5);
  assert.ok(shortlist.items.every(item => gaps.items.some(candidate => candidate.id === item.candidateId)));
  assert.ok(!JSON.stringify(gaps).includes('ACCEPTED_FOR_IMPLEMENTATION'));
  const assignee = gaps.items.find(item => item.id === 'KB-GAP-004');
  assert.ok(assignee.preconditions.some(condition => condition.includes('role')));
  assert.ok(assignee.preconditions.some(condition => condition.includes('membership')));
  assert.ok(assignee.preconditions.some(condition => condition.includes('stable fixture')));
  assert.ok(assignee.preconditions.some(condition => condition.includes('permission boundary')));
  assert.ok(assignee.technicalRecommendation && assignee.reviewDecision === 'PENDING');
});

test('public oracle text for KB-021, 022, 023 and 025 remains identical to pinned Gherkin and Java assertions', {
  skip: sourceRoot ? false : 'Set BEWT_T04A_SOURCE_ROOT to the fresh pinned source clone for source-to-output comparisons'
}, () => {
  const inventory = JSON.parse(fs.readFileSync(path.join(datasetRoot, 'inventory.json'), 'utf8'));
  const expected = new Map([
    ['KB-021', ['21_AddLocalUser_DifferentPasswords.feature', "Then \"Passwords don't match\" is shown below the \"Password\" field", "assertEquals(\"Passwords don't match\", user.getPswError());"]],
    ['KB-022', ['22_AddLocalUser_EmptyConfirmPassword.feature', 'Then "The confirmation is required" is shown below the "Confirmation" field', 'assertEquals("The confirmation is required", user.getPswConfirmError());']],
    ['KB-023', ['23_AddLocalUser_EmptyPassword.feature', 'Then "The password is required" is shown below the "Password" field', 'assertEquals("The password is required", user.getPswError());']],
    ['KB-025', ['25_AddLocalUser_ShortPassword.feature', 'Then "The minimum length is 6 characters" is shown below the "Password" field', 'assertEquals("The minimum length is 6 characters", user.getPswError());']]
  ]);
  const show = relative => {
    const result = spawnSync(trustedGitExecutable(), ['-C', sourceRoot, 'show', `${EXPECTED.bewtCommit}:${relative}`], { encoding: 'utf8', shell: false, windowsHide: true });
    assert.equal(result.status, 0, result.stderr);
    return result.stdout;
  };
  for (const [caseId, [featurePath, oracleText, assertionText]] of expected) {
    const record = inventory.cases.find(item => item.caseId === caseId);
    const sourceFeature = show(`kanboard/gherkin/${featurePath}`);
    const sourceJava = show(`kanboard/baseline/kanboard-1.2.15/src/test/java/tests/${record.java.className}.java`);
    const sourceOracle = sourceFeature.split(/\r?\n/).find(line => line.trim() === oracleText);
    const sourceAssertion = sourceJava.split(/\r?\n/).find(line => line.trim() === assertionText);
    assert.ok(sourceOracle, `${caseId} oracle exists in pinned Gherkin`);
    assert.ok(sourceAssertion, `${caseId} assertion exists in pinned Java`);
    assert.ok(record.expectedOracle.some(step => step.text === sourceOracle.trim()), `${caseId} exported oracle matches pinned Gherkin`);
    assert.ok(record.java.assertions.some(assertion => assertion.text === sourceAssertion.trim()), `${caseId} exported assertion matches pinned Java`);
  }
});

test('password redaction applies only to form input and leaves error oracles untouched', () => {
  const inventory = JSON.parse(fs.readFileSync(path.join(datasetRoot, 'inventory.json'), 'utf8'));
  const record = inventory.cases.find(item => item.caseId === 'KB-021');
  assert.ok(record.gherkin.steps.some(step => step.text.includes('<REDACTED_TEST_PASSWORD>')));
  assert.ok(record.expectedOracle.some(step => step.text.includes("Passwords don't match")));
  assert.ok(record.expectedOracle.every(step => !step.text.includes('REDACTED')));
  assert.ok(record.gherkin.redactions.some(redaction => redaction.kind === 'TEST_PASSWORD_FIXTURE'));
  for (const item of inventory.cases) {
    for (const step of item.gherkin.steps) {
      if (!step.text.includes('in the "Password" field') && !step.text.includes('in the "Confirmation" field')) continue;
      const enteredValue = step.text.slice(step.text.indexOf('"') + 1).split('"')[0];
      assert.equal(enteredValue, '<REDACTED_TEST_PASSWORD>', `${item.caseId} form password fixture must be redacted`);
    }
  }
});

test('email placeholders preserve one logical fixture across feature setup and Java equality assertion', () => {
  const inventory = JSON.parse(fs.readFileSync(path.join(datasetRoot, 'inventory.json'), 'utf8'));
  const record = inventory.cases.find(item => item.java.className === 'AddLocalUser');
  const occurrences = record.redactionSemantics.emailOccurrences;
  const sharedId = occurrences.find(item => item.sourcePath.startsWith('kanboard/gherkin/'))?.logicalFixtureId;
  assert.ok(sharedId);
  assert.ok(occurrences.some(item => item.logicalFixtureId === sharedId && item.sourcePath.startsWith('kanboard/baseline/')));
  assert.ok(record.java.assertions.some(assertion => assertion.text.includes('@example.invalid') && assertion.redactions.some(item => item.logicalFixtureId === sharedId)));
  assert.match(record.java.assertions.find(assertion => assertion.redactions.some(item => item.logicalFixtureId === sharedId)).semanticsNote, /same safe placeholder/);
  for (const item of inventory.cases) {
    for (const step of item.gherkin.steps) {
      if (!step.text.includes('in the "Email" field')) continue;
      assert.ok(step.text.includes('@example.invalid'), `${item.caseId} email fixture must use the safe placeholder`);
    }
  }
});

test('KB-023 and KB-026 retain raw titles while documenting observed behavior separately', () => {
  const inventory = JSON.parse(fs.readFileSync(path.join(datasetRoot, 'inventory.json'), 'utf8'));
  const emptyPassword = inventory.cases.find(item => item.caseId === 'KB-023');
  const removeUser = inventory.cases.find(item => item.caseId === 'KB-026');
  assert.match(emptyPassword.gherkin.rawScenarioTitle, /non matching passwords/);
  assert.match(emptyPassword.behaviorInterpretation.interpretation, /required-password validation/);
  assert.match(removeUser.gherkin.rawScenarioTitle, /password below 6 characters/);
  assert.match(removeUser.behaviorInterpretation.interpretation, /remote1 is absent after the user confirms deletion/);
  assert.equal(emptyPassword.behavioralCategory, 'user-and-permission-management');
  assert.equal(removeUser.behavioralCategory, 'user-and-permission-management');
  assert.equal(new Set(inventory.cases.map(item => item.behavioralCategory)).size, inventory.counts.behaviorGroups);
});

test('published dataset uses safe placeholders and preserves Java assertion syntax', () => {
  const inventory = JSON.parse(fs.readFileSync(path.join(datasetRoot, 'inventory.json'), 'utf8'));
  assert.equal(inventory.cases.length, 30);
  assert.ok(inventory.cases.every(record => record.gherkin.redactions && record.redactionSemantics.schemaVersion === '1.0'));
  assert.ok(inventory.cases.flatMap(record => record.redactionSemantics.emailFixtures).every(fixture => fixture.placeholder.endsWith('@example.invalid')));
  for (const assertion of inventory.cases.flatMap(record => record.java.assertions).filter(item => item.redactions.length > 0)) {
    assert.ok(assertion.text.startsWith('assert') && assertion.text.includes('(') && assertion.text.endsWith(');'));
    for (const redaction of assertion.redactions) assert.ok(assertion.text.includes(`"${redaction.placeholder}"`));
  }
  const mapping = fs.readFileSync(path.join(datasetRoot, 'KANBOARD-BASELINE-MAPPING.md'), 'utf8');
  assert.match(mapping, /Expected UI messages and executable Java assertion structure are preserved/);
  assert.match(mapping, /Observed behavior/);
  assert.ok(inventory.cases.some(record => record.expectedOracle.some(step => step.text === 'And "Email: user@gmail.com" is shown in the summary')));
});
