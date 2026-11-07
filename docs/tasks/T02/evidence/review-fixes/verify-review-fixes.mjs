import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { parseApplicationManifest } from '../../../../../framework/src/contracts.ts';

const cwd = process.cwd();

export function runVerification(options = {}) {
  const isDirectRun = options.silent !== true;
  if (isDirectRun) {
    console.log('Running T02 Review Fixes Verification from:', cwd);
  }

  const results = [];
  let failCount = 0;
  let blockedCount = 0;

  function recordTest(id, name, status, details = '', expectedBlocked = false) {
    results.push({ id, name, status, details, expectedBlocked });
    if (status === 'FAIL') {
      failCount++;
    } else if (status === 'BLOCKED' && !expectedBlocked) {
      blockedCount++;
    }
    if (isDirectRun) {
      console.log(`[${status}] ${id}: ${name}${details ? ' — ' + details : ''}`);
    }
  }

  // 1. Verify base SHA across repository
  if (isDirectRun) console.log('\n--- 1. Base Commit SHA Verification ---');
  const correctSha = options.overrideBaseSha || '7e27950b44473cf4d6a5d7d5222bc8dac9b3a266';

  try {
    const commitCheck = execSync(`git cat-file -t ${correctSha}`, { encoding: 'utf8' }).trim();
    if (commitCheck === 'commit') {
      recordTest('BASE_SHA_EXISTS', 'Verify correct base commit exists in git history', 'PASS', `Type: ${commitCheck}`);
    } else {
      recordTest('BASE_SHA_EXISTS', 'Verify correct base commit exists in git history', 'FAIL', `Unexpected git object type: ${commitCheck}`);
    }
  } catch (e) {
    recordTest('BASE_SHA_EXISTS', 'Verify correct base commit exists in git history', 'FAIL', `Git object query failed: ${e.message}`);
  }

  // 2. Upstream Git Tag and Dereferenced Commit Verification
  if (isDirectRun) console.log('\n--- 2. Upstream Provenance Verification ---');
  const upstreamPins = options.overrideUpstreamPins || [
    { app: 'bludit', repo: 'https://github.com/bludit/bludit', tag: 'refs/tags/2.3.4', expectedCommit: '44de235a5eedda9b80d9f0babd9fd5cb8c6943bd', isPeeled: false },
    { app: 'joomla', repo: 'https://github.com/joomla/joomla-cms', tag: 'refs/tags/3.10.11', expectedCommit: '01deee0a7b8cf91fc503b2cc13359c6e43aac47f', isPeeled: true },
    { app: 'kanboard', repo: 'https://github.com/kanboard/kanboard', tag: 'refs/tags/v1.2.15', expectedCommit: '00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b', isPeeled: true },
    { app: 'mantisbt', repo: 'https://github.com/mantisbt/mantisbt', tag: 'refs/tags/release-1.2.0', expectedCommit: 'd06bf60f5ed9f96029bb830a005d4819a4f87b45', isPeeled: true },
    { app: 'mediawiki', repo: 'https://github.com/wikimedia/mediawiki', tag: 'refs/tags/1.40.0', expectedCommit: '468dd69d6ee8e84b9ab26d0ee3d52f215faaf0d4', isPeeled: true },
    { app: 'prestashop', repo: 'https://github.com/PrestaShop/PrestaShop', tag: 'refs/tags/1.6.1.23', expectedCommit: '475d65fbda93403cd1afde0db09764c5295e952c', isPeeled: false },
    { app: 'claroline', repo: 'https://github.com/claroline/Claroline', tag: 'refs/tags/1.11.10', expectedCommit: 'NOT_VERIFIED', isPeeled: false },
  ];

  for (const p of upstreamPins) {
    if (p.expectedCommit === 'NOT_VERIFIED') {
      try {
        const out = execSync(`git ls-remote ${p.repo} ${p.tag}*`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
        if (!out) {
          recordTest(`PROVENANCE_${p.app.toUpperCase()}`, `Verify ${p.app} tag has no Git tag upstream`, 'NOT_VERIFIED', 'Remote query succeeded (exit 0) and returned empty output — confirmed no Git tag on GitHub upstream');
        } else {
          recordTest(`PROVENANCE_${p.app.toUpperCase()}`, `Verify ${p.app} tag`, 'FAIL', `Found unexpected tag output on GitHub: ${out}`);
        }
      } catch (e) {
        // Network/DNS/auth error must NOT be interpreted as tag absence
        recordTest(`PROVENANCE_${p.app.toUpperCase()}`, `Verify ${p.app} tag`, 'BLOCKED', `Remote query failed: ${e.message}. Network/DNS/permission error cannot prove tag absence.`);
      }
    } else {
      try {
        const queryRef = p.isPeeled ? `${p.tag}*` : p.tag;
        const out = execSync(`git ls-remote ${p.repo} ${queryRef}`, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
        const targetLine = p.isPeeled ? `${p.tag}^{}` : p.tag;
        const match = out.split('\n').find(line => line.includes(targetLine));
        if (match && match.startsWith(p.expectedCommit)) {
          recordTest(`PROVENANCE_${p.app.toUpperCase()}`, `Verify upstream commit for ${p.app}`, 'PASS', `Matched dereferenced commit ${p.expectedCommit}`);
        } else {
          recordTest(`PROVENANCE_${p.app.toUpperCase()}`, `Verify upstream commit for ${p.app}`, 'FAIL', `Mismatch in ls-remote output. Expected commit ${p.expectedCommit}, got: ${out}`);
        }
      } catch (e) {
        recordTest(`PROVENANCE_${p.app.toUpperCase()}`, `Verify upstream commit for ${p.app}`, 'BLOCKED', `Remote query command failed: ${e.message}`);
      }
    }
  }

  // 3. Runtime Manifest vs Draft Manifest Verification
  if (isDirectRun) console.log('\n--- 3. Manifest Runtime Validation & Draft Separation ---');

  // 3A. Production Runtime Manifest (ExpressCart)
  const runtimeManifestPath = options.overrideRuntimeManifestPath || 'config/apps/expresscart.json';
  try {
    const ecRaw = JSON.parse(fs.readFileSync(runtimeManifestPath, 'utf8'));
    const ecParsed = parseApplicationManifest(ecRaw);
    recordTest('RUNTIME_MANIFEST_EXPRESSCART', `parseApplicationManifest on ${runtimeManifestPath}`, 'PASS', `appId: ${ecParsed.appId}, kind: ${ecParsed.runtime.kind}`);
  } catch (e) {
    recordTest('RUNTIME_MANIFEST_EXPRESSCART', `parseApplicationManifest on ${runtimeManifestPath}`, 'FAIL', e.message);
  }

  // 3B. Draft Manifests in docs/tasks/T02/manifests/
  const draftFiles = options.overrideDraftFiles || [
    'bludit.draft.json',
    'claroline.draft.json',
    'joomla.draft.json',
    'kanboard.draft.json',
    'mantisbt.draft.json',
    'mediawiki.draft.json',
    'prestashop.draft.json',
  ];

  for (const df of draftFiles) {
    const fullPath = path.join('docs/tasks/T02/manifests', df);
    let rawJson = null;
    try {
      rawJson = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
      recordTest(`DRAFT_SYNTAX_${df}`, `JSON Syntax valid for ${df}`, 'PASS', 'Valid JSON format');
    } catch (e) {
      recordTest(`DRAFT_SYNTAX_${df}`, `JSON Syntax valid for ${df}`, 'FAIL', `JSON parse error: ${e.message}`);
      continue;
    }

    const hasRequiredFields = rawJson.schemaVersion === '1.0.0' &&
      rawJson.manifestType === 'DRAFT_STATIC_AUDIT_NOT_PRODUCTION' &&
      rawJson.appId &&
      rawJson.benchmarkBaseVersion &&
      rawJson.source &&
      rawJson.runtime &&
      rawJson.fixtureReset &&
      Array.isArray(rawJson.allowedTools);

    if (hasRequiredFields) {
      recordTest(`DRAFT_STRUCT_${df}`, `Draft structure valid for ${df}`, 'PASS', 'All required draft metadata fields present');
    } else {
      recordTest(`DRAFT_STRUCT_${df}`, `Draft structure valid for ${df}`, 'FAIL', 'Missing required draft fields');
    }

    try {
      parseApplicationManifest(rawJson);
      recordTest(`DRAFT_BLOCK_${df}`, `Runtime validation should block unpulled draft ${df}`, 'FAIL', 'Unexpectedly passed runtime schema validation');
    } catch (e) {
      recordTest(`DRAFT_BLOCK_${df}`, `Runtime validation correctly blocks draft ${df}`, 'BLOCKED', `parseApplicationManifest correctly rejected: ${e.message}`, true);
    }
  }

  // 4. Clean config/apps directory check
  if (isDirectRun) console.log('\n--- 4. Verify config/apps/ directory isolation ---');
  try {
    const configAppsFiles = fs.readdirSync('config/apps');
    if (configAppsFiles.length === 1 && configAppsFiles[0] === 'expresscart.json') {
      recordTest('CONFIG_APPS_ISOLATION', 'config/apps contains ONLY expresscart.json', 'PASS', 'Zero unverified draft manifests in config/apps');
    } else {
      recordTest('CONFIG_APPS_ISOLATION', 'config/apps contains ONLY expresscart.json', 'FAIL', `Found unisolated files in config/apps: ${configAppsFiles.join(', ')}`);
    }
  } catch (e) {
    recordTest('CONFIG_APPS_ISOLATION', 'config/apps directory check', 'FAIL', e.message);
  }

  const hasErrors = failCount > 0 || blockedCount > 0;

  // 5. Write TAP and JSON Evidence Logs if requested (default true on direct run)
  if (options.writeEvidence !== false) {
    if (isDirectRun) console.log('\n--- 5. Generating Evidence Logs ---');
    const tapLines = ['TAP version 13', `1..${results.length}`];
    results.forEach((r, idx) => {
      const isOk = (r.status === 'PASS' || r.status === 'NOT_VERIFIED' || (r.status === 'BLOCKED' && r.expectedBlocked));
      const tapStatus = isOk ? 'ok' : 'not ok';
      const directive = (r.status === 'BLOCKED' && r.expectedBlocked) ? ' # SKIP (Expected Runtime Schema Block)' : (r.status === 'NOT_VERIFIED' ? ' # NOTE (Confirmed Unverified Upstream)' : '');
      tapLines.push(`${tapStatus} ${idx + 1} - ${r.id}: ${r.name} [${r.status}]${directive}${r.details ? ' — ' + r.details : ''}`);
    });

    fs.writeFileSync('docs/tasks/T02/evidence/review-fixes/review-fixes-tests.tap', tapLines.join('\n') + '\n', 'utf8');
    fs.writeFileSync('docs/tasks/T02/evidence/review-fixes/review-fixes-validation.json', JSON.stringify({
      timestamp: new Date().toISOString(),
      summary: {
        total: results.length,
        passed: results.filter(r => r.status === 'PASS').length,
        notVerified: results.filter(r => r.status === 'NOT_VERIFIED').length,
        expectedBlocked: results.filter(r => r.status === 'BLOCKED' && r.expectedBlocked).length,
        unexpectedBlocked: blockedCount,
        failed: failCount,
      },
      results,
    }, null, 2), 'utf8');

    if (isDirectRun) {
      console.log(`Generated: docs/tasks/T02/evidence/review-fixes/review-fixes-tests.tap (${results.length} tests)`);
      console.log(`Generated: docs/tasks/T02/evidence/review-fixes/review-fixes-validation.json`);
    }
  }

  // 6. Enforce non-zero exit code on failure and suppress success message
  if (hasErrors) {
    process.exitCode = 1;
    if (isDirectRun) {
      console.error(`\n[ERROR] Verification FAILED: ${failCount} test(s) failed, ${blockedCount} unexpected block(s). Exit code set to 1.`);
    }
  } else {
    if (isDirectRun) {
      console.log('\nAll required verification checks completed successfully!');
    }
  }

  return { results, failCount, blockedCount, hasErrors };
}

// Auto-run if executed directly
const isMain = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isMain) {
  runVerification();
}
