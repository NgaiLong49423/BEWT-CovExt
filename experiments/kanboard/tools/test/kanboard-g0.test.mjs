import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  APP_ID,
  IMAGE,
  LABEL_BASE,
  TEST_CLASS,
  assertCleanupComplete,
  assertIndependentCleanRuns,
  assertOwnedContainer,
  assertOwnedNetwork,
  assertOwnedVolume,
  assertSelectedTest,
  assertUnrelatedResourcesPreserved,
  buildCleanupPlan,
  classifyJUnitExecution,
  dynamicPublishArguments,
  getLoopbackHostPort,
  labelsForRun,
  parseSurefireSummary,
  promoteKanboardDraft,
  seleniumTestArguments,
} from '../kanboard-g0.mjs';

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(thisDir, '../../../..');
const draft = JSON.parse(fs.readFileSync(path.join(repoRoot, 'docs/tasks/T02/manifests/kanboard.draft.json'), 'utf8'));

function dockerResources(runId = 't03a-a-001') {
  const labels = labelsForRun(runId);
  const name = `bewt-covext-kanboard-${runId}`;
  const imageDigest = `sha256:${'a'.repeat(64)}`;
  const imageRef = `${IMAGE}@${imageDigest}`;
  const volumeName = `${name}-data`;
  const networkName = `${name}-net`;
  const container = {
    Id: `${'b'.repeat(64)}`,
    Name: `/${name}`,
    Config: { Image: imageRef, Labels: labels },
    State: { Running: true },
    Mounts: [{ Type: 'volume', Name: volumeName, Destination: '/var/www/app/data' }],
    NetworkSettings: { Ports: { '80/tcp': [{ HostIp: '127.0.0.1', HostPort: '49153' }] } },
  };
  const volume = { Name: volumeName, Labels: labels };
  const network = { Id: `${'c'.repeat(64)}`, Name: networkName, Labels: labels };
  const recorded = {
    containerId: container.Id,
    name,
    imageRef,
    labels,
    requireRunning: true,
    volumeNames: [volumeName],
    volumes: [{ name: volumeName }],
    networkId: network.Id,
    networkName,
  };
  return { labels, container, volume, network, recorded, volumeName, imageDigest };
}

test('draft-to-runtime promotion validates the Docker image digest and removes only draft-only fields', () => {
  const runtime = promoteKanboardDraft(draft, `sha256:${'a'.repeat(64)}`);
  assert.equal(runtime.appId, APP_ID);
  assert.equal(runtime.runtime.kind, 'docker');
  assert.equal(runtime.baseSuitePath, 'experiments/kanboard/bewt-suite');
  assert.equal(runtime.runtime.imageDigest, `sha256:${'a'.repeat(64)}`);
  assert.throws(() => promoteKanboardDraft(draft, 'NOT_PULLED_STATIC_AUDIT'), /verified sha256 image digest/);
  const invalidApp = structuredClone(draft);
  invalidApp.appId = 'not-kanboard';
  assert.throws(() => promoteKanboardDraft(invalidApp, `sha256:${'a'.repeat(64)}`), /appId/);
});

test('Docker container, volume, and network identity require the recorded IDs and ownership labels', () => {
  const resource = dockerResources();
  assert.equal(assertOwnedContainer(resource.container, resource.recorded), true);
  assert.equal(assertOwnedVolume(resource.volume, { name: resource.volumeName, labels: resource.labels }), true);
  assert.equal(assertOwnedNetwork(resource.network, { id: resource.network.Id, name: resource.network.Name, labels: resource.labels }), true);
  const foreign = structuredClone(resource.container);
  foreign.Config.Labels.runId = 'someone-elses-run';
  assert.throws(() => assertOwnedContainer(foreign, resource.recorded), /ownership labels/);
  assert.throws(() => assertOwnedContainer({ ...resource.container, Id: 'wrong-id' }, resource.recorded), /Container ID/);
});

test('cleanup refuses bind mounts and resources outside the run-owned volume inventory', () => {
  const resource = dockerResources();
  const bindMounted = structuredClone(resource.container);
  bindMounted.Mounts[0].Type = 'bind';
  assert.throws(() => assertOwnedContainer(bindMounted, resource.recorded), /bind/);
  assert.throws(() => buildCleanupPlan({ container: resource.container, volumes: [{ Name: 'foreign-volume', Labels: resource.labels }], network: resource.network, recorded: resource.recorded }), /unrecorded Docker volume/);
  const foreignNetwork = { ...resource.network, Labels: { ...resource.labels, app: 'expresscart' } };
  assert.throws(() => assertOwnedNetwork(foreignNetwork, { id: resource.network.Id, name: resource.network.Name, labels: resource.labels }), /ownership labels/);
});

test('Docker port publication requests a dynamic loopback binding and accepts only a valid assigned port', () => {
  assert.deepEqual(dynamicPublishArguments(), ['--publish', '127.0.0.1::80']);
  const resource = dockerResources();
  assert.equal(getLoopbackHostPort(resource.container), 49153);
  assert.throws(() => getLoopbackHostPort({ NetworkSettings: { Ports: { '80/tcp': [{ HostIp: '0.0.0.0', HostPort: '49153' }] } } }), /loopback-only/);
  assert.throws(() => getLoopbackHostPort({ NetworkSettings: { Ports: { '80/tcp': [{ HostIp: '127.0.0.1', HostPort: '0' }] } } }), /loopback-only/);
});

test('baseline URL is property-driven and preserves the original default URL', () => {
  const baseTest = fs.readFileSync(path.join(repoRoot, 'experiments/kanboard/bewt-suite/src/test/java/tests/BaseTest.java'), 'utf8');
  assert.match(baseTest, /System\.getProperty\("app\.url",\s*"http:\/\/localhost:8080"\)/);
  assert.match(baseTest, /System\.getenv\("KANBOARD_TEST_PASSWORD"\)/);
  assert.doesNotMatch(baseTest, /password\s*=\s*"admin"/);
  assert.match(baseTest, /KANBOARD_TEST_PASSWORD must be provided/);
  assert.doesNotMatch(baseTest, /options\.setBrowserVersion\("127"\)/);
  assert.match(baseTest, /driver\s*=\s*new ChromeDriver\(options\)/);
});

test('Maven selection targets only the original AddNewProject Base class and receives the allocated URL', () => {
  const args = seleniumTestArguments(49153);
  assertSelectedTest(args);
  assert(args.includes(`-Dtest=${TEST_CLASS}`));
  assert(args.includes('-Dapp.url=http://127.0.0.1:49153'));
  assert(args.includes('test'));
  assert.throws(() => assertSelectedTest(['-Dtest=TestSuite', 'test']), /must select only/);
});

test('JUnit parsing detects empty selection, PASS, skipped, assertion failure, browser setup, and application connection failure', () => {
  const passXml = '<testsuite name="tests.AddNewProject" tests="1" failures="0" errors="0" skipped="0"></testsuite>';
  const failXml = '<testsuite name="tests.AddNewProject" tests="1" failures="1" errors="0" skipped="0"></testsuite>';
  const skipXml = '<testsuite name="tests.AddNewProject" tests="1" failures="0" errors="0" skipped="1"></testsuite>';
  const zeroXml = '<testsuite name="tests.AddNewProject" tests="0" failures="0" errors="0" skipped="0"></testsuite>';
  assert.deepEqual(parseSurefireSummary(passXml), { tests: 1, failures: 0, errors: 0, skipped: 0, suites: 1 });
  assert.equal(classifyJUnitExecution({ xml: passXml, exitCode: 0 }).outcome, 'PASS');
  assert.equal(classifyJUnitExecution({ xml: failXml, exitCode: 1 }).category, 'TEST_OR_BUILD_FAILURE');
  assert.equal(classifyJUnitExecution({ xml: skipXml, exitCode: 0 }).category, 'TEST_SKIPPED');
  assert.equal(classifyJUnitExecution({ xml: zeroXml, exitCode: 0 }).category, 'NO_TESTS_DETECTED');
  assert.equal(classifyJUnitExecution({ xml: null, exitCode: 0 }).outcome, 'BLOCKED');
  assert.equal(classifyJUnitExecution({ xml: failXml, exitCode: 1, output: 'SessionNotCreatedException: Chrome failed to start' }).category, 'BROWSER_SETUP_FAILURE');
  assert.equal(classifyJUnitExecution({ xml: failXml, exitCode: 1, output: 'ERR_CONNECTION_REFUSED' }).category, 'APPLICATION_OR_NETWORK_FAILURE');
});

test('Run B must start with distinct resources and no Run A data, after Run A cleanup PASS', () => {
  const runA = { runId: 't03a-a-001', containerId: 'container-a', volumeNames: ['volume-a'], networkId: 'network-a', cleanupOutcome: 'PASS' };
  const runB = { runId: 't03a-b-002', containerId: 'container-b', volumeNames: ['volume-b'], networkId: 'network-b', preTestSentinelPresent: false };
  const beforeB = { containerIds: [], volumeNames: [], networkIds: [] };
  assert.equal(assertIndependentCleanRuns(runA, runB, beforeB), true);
  assert.throws(() => assertIndependentCleanRuns(runA, { ...runB, preTestSentinelPresent: true }, beforeB), /sentinel project/);
  assert.throws(() => assertIndependentCleanRuns(runA, runB, { ...beforeB, volumeNames: ['volume-a'] }), /Run A volume/);
});

test('cleanup plan is scoped to recorded resources, succeeds idempotently, and checks post-cleanup absence', () => {
  const resource = dockerResources();
  const plan = buildCleanupPlan({ container: resource.container, volumes: [resource.volume], network: resource.network, recorded: resource.recorded });
  assert.deepEqual(plan.map((item) => item.kind), ['container', 'volume', 'network']);
  assert.deepEqual(buildCleanupPlan({ container: null, volumes: [], network: null, recorded: resource.recorded }), []);
  assert.equal(assertCleanupComplete({ containerIds: [], volumeNames: [], networkIds: [] }, resource.recorded), true);
  assert.throws(() => assertCleanupComplete({ containerIds: [resource.recorded.containerId], volumeNames: [], networkIds: [] }, resource.recorded), /container remains/);
});

test('resource comparison protects all pre-existing Docker resources', () => {
  const baseline = { resourceIds: ['foreign-container', 'foreign-network', 'foreign-volume'] };
  assert.equal(assertUnrelatedResourcesPreserved(baseline, baseline, ['run-container', 'run-network']), true);
  assert.throws(() => assertUnrelatedResourcesPreserved(baseline, { resourceIds: ['foreign-container', 'foreign-volume'] }, ['run-container']), /foreign-network/);
});
