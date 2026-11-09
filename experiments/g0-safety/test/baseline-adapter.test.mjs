import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repo = fileURLToPath(new URL('../../..', import.meta.url));
const apps = [
  { id: 'joomla', pkg: 'base', className: 'AdminLoginTest', testName: 'adminLoginTest' },
  { id: 'mantisbt', pkg: 'base', className: 'AddUser', testName: 'addUser' },
  { id: 'mediawiki', pkg: 'mediawiki', className: 'CreatePageTest', testName: 'createPage' },
  { id: 'prestashop', pkg: 'tests', className: 'AddNewCategory', testName: 'test_add_category' },
];

async function javaFiles(dir) {
  const result = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await javaFiles(path));
    else if (entry.name.endsWith('.java')) result.push(path);
  }
  return result;
}

test('four Base suites use remote WebDriver, required process settings, and asserted original Base tests', async () => {
  for (const app of apps) {
    const suite = join(repo, 'experiments', app.id, 'bewt-suite');
    const base = await readFile(join(suite, 'src', 'test', 'java', app.pkg, 'BaseTest.java'), 'utf8');
    const config = await readFile(join(suite, 'src', 'test', 'java', app.pkg, 'ExperimentConfig.java'), 'utf8');
    const testSource = await readFile(join(suite, 'src', 'test', 'java', app.pkg, `${app.className}.java`), 'utf8');
    assert.match(base, /RemoteWebDriver/);
    assert.match(base, /ExperimentConfig\.webdriverUrl\(\)/);
    assert.match(base, /ExperimentConfig\.appUrl\(\)/);
    assert.doesNotMatch(base, /ChromeDriver\s*\(/);
    assert.match(config, /System\.getenv\(name\)/);
    assert.match(config, /value == null \|\| value\.isBlank\(\)/);
    assert.match(config, /throw new IllegalStateException/);
    assert.match(testSource, new RegExp(`public\\s+void\\s+${app.testName}\\s*\\(`));
    assert.match(testSource, /assert(?:Equals|True|False|NotNull)\s*\(/);
  }
});

test('copied app test suites contain no benchmark admin password, private workstation path, or fixed LAN endpoint', async () => {
  const forbidden = [/e2eW3Bt3s71nGB3nchM4rK/, /192\.168\.1\.141/, /C:\\\\Users\\\\User/, /C:\/Users\/User/, /some-mysql/, /some-prestashop/];
  for (const app of apps) {
    const files = await javaFiles(join(repo, 'experiments', app.id, 'bewt-suite'));
    for (const file of files) {
      const source = await readFile(file, 'utf8');
      for (const pattern of forbidden) assert.doesNotMatch(source, pattern, relative(repo, file));
    }
  }
});

test('offline runtime plans pin upstream source and explicitly block unpinned image promotion', async () => {
  for (const app of apps) {
    const plan = JSON.parse(await readFile(join(repo, 'experiments', app.id, 'g0-plan.json'), 'utf8'));
    assert.equal(plan.planType, 'OFFLINE_IMPLEMENTATION_RUNTIME_PENDING');
    assert.match(plan.source.commit, /^[a-f0-9]{40}$/);
    assert.equal(plan.source.benchmarkSuiteCommit, '0501249ff3e9a5ea83a06155cd2971dc36197056');
    assert.equal(plan.runtime.imagePromotionAllowed, false);
    assert.equal(plan.runtime.runtimeStatus, 'RUNTIME_PENDING');
    assert.equal(plan.network.internal, true);
    assert.equal(plan.network.ipv6Enabled, false);
    assert.equal(plan.network.databasePortPublished, false);
    assert.equal(plan.status.runtimeOrchestration, 'NOT_IMPLEMENTED');
    for (const image of [plan.runtime.applicationImage, plan.runtime.databaseImage, plan.runtime.browserImage]) {
      if (image?.ref) assert.equal(image.digest, null, `${app.id} must not fabricate a digest`);
    }
  }
});