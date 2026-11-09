import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.cwd();
const docRoot = path.join(root, 'docs/tasks/T04-C');
const readJson = (relative) => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8').replace(/^\uFEFF/, ''));
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const normalizedFileHash = (relative) => sha256(fs.readFileSync(path.join(root, relative), 'utf8').replace(/\r\n/g, '\n'));
const index = readJson('docs/tasks/T04-C/evidence/g0-evidence-index.json');

 test('evidence index binds the two requested runs to pinned source and image', () => {
  assert.deepEqual(index.runs.map((run) => run.runId), ['t03a-a-20261108-r2', 't03a-b-20261108-r2']);
  for (const run of index.runs) {
    assert.equal(run.source.bewtCommit, '0501249ff3e9a5ea83a06155cd2971dc36197056');
    assert.equal(run.source.kanboardCommit, '00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b');
    assert.equal(run.image.digest, 'sha256:e2fd04bcb9dd2c5ddaa58a260a8b53ba28a0ab8ac5d15eaebd1a9d699b13a52e');
    assert.equal(run.runtime.httpStatus, 200);
    assert.equal(run.runtime.memoryBytes, 805306368);
    assert.equal(run.runtime.pidsLimit, 256);
    assert.equal(run.runtime.cpuLimit, '1.5');
    assert.equal(run.runtime.ownershipLabelsMatchRun, true);
    assert.ok(fs.existsSync(path.join(root, run.evidenceRoot, 'runtime.json')));
  }
  assert.notEqual(index.runs[0].runtime.containerId, index.runs[1].runtime.containerId);
  assert.notEqual(index.runs[0].runtime.networkId, index.runs[1].runtime.networkId);
});

test('Surefire XML is bound to the exact reported class and the hash mismatch stays blocked', () => {
  for (const run of index.runs) {
    const directory = run.evidenceRoot;
    const xml = fs.readFileSync(path.join(root, directory, run.test.xmlPath), 'utf8');
    const summary = fs.readFileSync(path.join(root, directory, 'surefire-summary.txt'), 'utf8');
    const log = fs.readFileSync(path.join(root, directory, 'maven.log'), 'utf8');
    assert.match(xml, /name="tests\.AddNewProject"/);
    assert.match(xml, /tests="1" errors="0" skipped="0" failures="0"/);
    assert.match(summary, /Tests run: 1, Failures: 0, Errors: 0, Skipped: 0/);
    assert.match(log, /BUILD SUCCESS/);
    assert.equal(normalizedFileHash(path.join(directory, run.test.xmlPath)), run.test.lfNormalizedXmlSha256);
    assert.notEqual(run.test.recordedOriginalSha256, run.test.lfNormalizedXmlSha256);
    assert.equal(run.test.integrity, 'BLOCKED_EVIDENCE');
    assert.equal(run.test.mavenCommandExact, false);
  }
});

test('Run A and B have independent reset and sentinel evidence', () => {
  const reset = readJson('docs/tasks/T03-A/evidence/reset-comparison.json');
  assert.equal(reset.independentRunsVerified, true);
  assert.equal(reset.runACleanupBeforeRunB, 'PASS');
  assert.equal(reset.runBBeforeTest.runASentinelAbsent, true);
  for (const run of index.runs) {
    const directory = run.evidenceRoot;
    const before = readJson(`${directory}/sentinel-state-before-test.json`);
    const after = readJson(`${directory}/sentinel-state.json`);
    assert.equal(before.runId, run.runId);
    assert.equal(before.countBeforeTest, 0);
    assert.equal(after.countAfterTest, 1);
    assert.equal(before.readOnly, true);
    assert.equal(after.readOnly, true);
  }
  const a = readJson(`${index.runs[0].evidenceRoot}/owned-resources.json`);
  const b = readJson(`${index.runs[1].evidenceRoot}/owned-resources.json`);
  assert.notEqual(a.containerId, b.containerId);
  assert.notEqual(a.networkId, b.networkId);
  assert.equal(a.volumeNames.length, 3);
  assert.equal(b.volumeNames.length, 3);
  assert.equal(new Set([...a.volumeNames, ...b.volumeNames]).size, 6);
});

test('cleanup result is distinguished by run, including missing Run A idempotent repeat', () => {
  const aDir = index.runs[0].evidenceRoot;
  const bDir = index.runs[1].evidenceRoot;
  assert.equal(readJson(`${aDir}/cleanup-result.json`).outcome, 'PASS');
  assert.equal(index.runs[0].cleanup.repeatPass, 'NOT_EVIDENCED');
  assert.equal(readJson(`${bDir}/cleanup-result-first-pass.json`).outcome, 'PASS');
  const repeat = readJson(`${bDir}/cleanup-result.json`);
  assert.equal(repeat.cleanupWasAlreadyComplete, true);
  assert.deepEqual(repeat.actionsPerformed, []);
  for (const run of index.runs) {
    const beforeInventory = readJson(`${run.evidenceRoot}/docker-before.json`);
    const afterInventory = readJson(`${run.evidenceRoot}/docker-after.json`);
    assert.deepEqual(beforeInventory.counts, { containers: 32, runningContainers: 2, networks: 11, volumes: 24, images: 19 });
    assert.deepEqual(afterInventory.counts, beforeInventory.counts);
    for (const kind of ['containers', 'networks', 'volumes', 'images']) {
      const beforeSignatures = beforeInventory[kind].map((resource) => resource.signature).sort();
      const afterSignatures = afterInventory[kind].map((resource) => resource.signature).sort();
      assert.deepEqual(afterSignatures, beforeSignatures, `${run.runId} ${kind} inventory changed`);
    }
    assert.equal(readJson(`${run.evidenceRoot}/cleanup-result${run.runId.includes('-b-') ? '-first-pass' : ''}.json`).protectedResourceSetsUnchanged.length, 4);
  }
});

test('CDP warning is reported without overriding the recorded assertion result', () => {
  for (const run of index.runs) {
    const xml = fs.readFileSync(path.join(root, run.evidenceRoot, run.test.xmlPath), 'utf8');
    assert.match(xml, /Unable to find CDP implementation matching 156/);
    assert.equal(run.test.failures, 0);
    assert.equal(run.test.tests, 1);
  }
});

test('T04-B candidates remain proposed and the official human decision ledger remains empty', () => {
  const dataset = readJson('data/reviews/kanboard/t04b-review-dataset.json');
  const integrity = readJson('docs/tasks/T04-C/evidence/human-review-input-integrity.json');
  const ids = ['KB-GAP-001', 'KB-GAP-002', 'KB-GAP-003', 'KB-GAP-004', 'KB-GAP-008'];
  assert.deepEqual(dataset.candidates.map((candidate) => candidate.id), ids);
  assert.deepEqual(integrity.candidateIds, ids);
  for (const candidate of dataset.candidates) {
    assert.equal(candidate.status, 'PROPOSED');
    assert.equal(candidate.reviewDecision, 'PENDING');
    assert.ok(Object.values(candidate.humanDecision).every((value) => value === null));
    assert.ok(!/ACCEPTED_FOR_IMPLEMENTATION|VALIDATED/.test(JSON.stringify(candidate)));
  }
  const ledger = fs.readFileSync(path.join(root, integrity.ledger.path));
  assert.equal(ledger.length, 0);
  assert.equal(sha256(ledger), integrity.ledger.sha256);
  assert.equal(normalizedFileHash(integrity.staticReviewDataset.path), integrity.staticReviewDataset.sha256LfNormalized);
});

test('G0 proposal does not imply G1 acceptance or mutate shared program status', () => {
  const proposal = readJson('docs/tasks/T04-C/PROPOSED-STATUS-UPDATE.json');
  const mainStatus = fs.readFileSync(path.join(root, 'docs/program/STATUS.json'), 'utf8');
  assert.equal(proposal.authority, 'PROPOSAL_ONLY_NOT_APPLIED');
  assert.equal(proposal.g0.recommendation, 'DEFER_G0_ACCEPTANCE_BLOCKED_EVIDENCE');
  assert.equal(proposal.g1.status, 'NOT_VERIFIED');
  assert.doesNotMatch(JSON.stringify(proposal), /"(G0|G1)"\s*:\s*"(PASS|ACCEPTED)"/);
  assert.ok(mainStatus.length > 0);
});

test('audit artifacts parse as JSON, contain no common token patterns, and preserve source scope', () => {
  const files = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const absolute = path.join(dir, entry.name);
      if (entry.isDirectory()) visit(absolute); else files.push(absolute);
    }
  };
  visit(docRoot);
  const allText = files.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
  assert.doesNotMatch(allText, /(?:AIza[0-9A-Za-z_-]{30,}|gh[pousr]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16})/);
  assert.ok(files.every((file) => file.startsWith(docRoot + path.sep)));
  assert.ok(files.every((file) => file.startsWith(docRoot + path.sep)));
});
