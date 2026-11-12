import test from 'node:test';
import assert from 'node:assert/strict';

import * as joomla from '../../joomla/tools/joomla-g0.mjs';
import * as mantisbt from '../../mantisbt/tools/mantisbt-g0.mjs';
import * as mediawiki from '../../mediawiki/tools/mediawiki-g0.mjs';
import * as prestashop from '../../prestashop/tools/prestashop-g0.mjs';
import { APPS, requiredEnvironmentValue } from '../../tools/unified-g0-runner.mjs';

test('Joomla G0 harness contract adheres to safety and isolation rules', () => {
  assert.equal(joomla.APP_ID, 'joomla');
  assert.equal(joomla.APP_VERSION, '3.10.11');
  assert.equal(joomla.TEST_CLASS, 'base.AdminLoginTest');
  const runId = 't03c-j-20261110-r1';
  const labels = joomla.labelsForRun(runId);
  assert.equal(labels.app, 'joomla');
  assert.equal(labels.runId, runId);
  assert.equal(labels.project, 'bewt-covext');
  const names = joomla.namesForRun(runId);
  assert.equal(names.app, `bewt-covext-joomla-${runId}`);
  assert.equal(names.network, `bewt-covext-joomla-${runId}-net`);
  const args = joomla.seleniumTestArguments(50001);
  assert.deepEqual(args, ['-Dtest=base.AdminLoginTest', '-Dapp.url=http://127.0.0.1:50001/', 'test']);
});

test('MantisBT G0 harness contract adheres to safety and isolation rules', () => {
  assert.equal(mantisbt.APP_ID, 'mantisbt');
  assert.equal(mantisbt.APP_VERSION, '1.2.0');
  assert.equal(mantisbt.TEST_CLASS, 'base.AddUser');
  const runId = 't03c-m-20261110-r1';
  const labels = mantisbt.labelsForRun(runId);
  assert.equal(labels.app, 'mantisbt');
  assert.equal(labels.runId, runId);
  assert.equal(labels.project, 'bewt-covext');
  const names = mantisbt.namesForRun(runId);
  assert.equal(names.app, `bewt-covext-mantisbt-${runId}`);
  assert.equal(names.network, `bewt-covext-mantisbt-${runId}-net`);
  const args = mantisbt.seleniumTestArguments(50002);
  assert.deepEqual(args, ['-Dtest=base.AddUser', '-Dapp.url=http://127.0.0.1:50002/mantisbt/', 'test']);
});

test('MantisBT runner reads admin credentials from runtime environment only', () => {
  const env = {
    BEWT_ADMIN_USERNAME: 'runtime-test-user',
    BEWT_ADMIN_PASSWORD: 'p'.repeat(24),
  };
  assert.deepEqual(APPS.mantisbt.testEnv(env), env);
  assert.throws(
    () => APPS.mantisbt.testEnv({ BEWT_ADMIN_USERNAME: env.BEWT_ADMIN_USERNAME }),
    /Missing required environment variable: BEWT_ADMIN_PASSWORD/,
  );
  assert.throws(
    () => requiredEnvironmentValue('BEWT_ADMIN_USERNAME', {}),
    /Missing required environment variable: BEWT_ADMIN_USERNAME/,
  );
});

test('MediaWiki G0 harness contract adheres to safety and isolation rules', () => {
  assert.equal(mediawiki.APP_ID, 'mediawiki');
  assert.equal(mediawiki.APP_VERSION, '1.40.0');
  assert.equal(mediawiki.TEST_CLASS, 'mediawiki.CreatePageTest');
  const runId = 't03c-w-20261110-r1';
  const labels = mediawiki.labelsForRun(runId);
  assert.equal(labels.app, 'mediawiki');
  assert.equal(labels.runId, runId);
  assert.equal(labels.project, 'bewt-covext');
  const names = mediawiki.namesForRun(runId);
  assert.equal(names.app, `bewt-covext-mediawiki-${runId}`);
  assert.equal(names.network, `bewt-covext-mediawiki-${runId}-net`);
  const args = mediawiki.seleniumTestArguments(50003);
  assert.deepEqual(args, ['-Dtest=mediawiki.CreatePageTest', '-Dapp.url=http://127.0.0.1:50003/', 'test']);
});

test('PrestaShop G0 harness contract adheres to safety and isolation rules', () => {
  assert.equal(prestashop.APP_ID, 'prestashop');
  assert.equal(prestashop.APP_VERSION, '1.6.1.23');
  assert.equal(prestashop.TEST_CLASS, 'tests.AddNewCategory');
  const runId = 't03c-p-20261110-r1';
  const labels = prestashop.labelsForRun(runId);
  assert.equal(labels.app, 'prestashop');
  assert.equal(labels.runId, runId);
  assert.equal(labels.project, 'bewt-covext');
  const names = prestashop.namesForRun(runId);
  assert.equal(names.app, `bewt-covext-prestashop-${runId}`);
  assert.equal(names.network, `bewt-covext-prestashop-${runId}-net`);
  const args = prestashop.seleniumTestArguments(50004);
  assert.deepEqual(args, ['-Dtest=tests.AddNewCategory', '-Dapp.url=http://127.0.0.1:50004/administrator/', 'test']);
});
