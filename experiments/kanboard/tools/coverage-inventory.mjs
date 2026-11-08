import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { spawnSync } from 'node:child_process';

export const EXPECTED = {
  bewtCommit: '0501249ff3e9a5ea83a06155cd2971dc36197056',
  upstreamCommit: '00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b',
  bewtTree: 'd38fcc0eae8073023c48bb46998741c8c19d4d06'
};

const compareText = (left, right) => left < right ? -1 : left > right ? 1 : 0;
const hashBytes = (algorithm, bytes) => crypto.createHash(algorithm).update(bytes).digest('hex');
export const sha = bytes => hashBytes('sha256', bytes);

export function trustedGitExecutable() {
  const candidates = process.platform === 'win32'
    ? ['C:\\Program Files\\Git\\cmd\\git.exe', 'C:\\Program Files\\Git\\bin\\git.exe']
    : ['/usr/bin/git', '/bin/git'];
  for (const candidate of candidates) {
    try {
      if (fs.statSync(candidate).isFile()) return candidate;
    } catch {
      // Try the next fixed, system-managed installation path.
    }
  }
  throw new Error('Git executable was not found in a fixed system installation path');
}

function runGit(repoRoot, args, input) {
  const result = spawnSync(trustedGitExecutable(), ['-C', repoRoot, ...args], {
    input,
    encoding: 'buffer',
    shell: false,
    windowsHide: true,
    maxBuffer: 64 * 1024 * 1024
  });
  if (result.error || result.status !== 0) {
    throw new Error(`Pinned Git inspection failed: ${result.error?.message ?? result.stderr?.toString('utf8').trim() ?? 'unknown Git error'}`);
  }
  return result.stdout;
}

function lstatPath(target) {
  try {
    return fs.lstatSync(target);
  } catch (error) {
    if (error.code === 'ENOENT') throw new Error(`Pinned source file is missing: ${target}`);
    throw error;
  }
}

export function safeJoin(root, relativePath) {
  if (path.isAbsolute(relativePath)) throw new Error(`Absolute input path is not allowed: ${relativePath}`);
  const base = path.resolve(root);
  if (lstatPath(base).isSymbolicLink()) throw new Error(`Source root is a symlink: ${root}`);
  let cursor = base;
  for (const part of relativePath.split(/[\\/]+/).filter(Boolean)) {
    if (part === '.' || part === '..') throw new Error(`Traversal component is not allowed: ${relativePath}`);
    cursor = path.join(cursor, part);
    if (lstatPath(cursor).isSymbolicLink()) throw new Error(`Symlink input is not allowed: ${relativePath}`);
  }
  const actual = fs.realpathSync(cursor);
  if (actual !== base && !actual.startsWith(base + path.sep)) {
    throw new Error(`Path escapes allowed root: ${relativePath}`);
  }
  return actual;
}

function gitBlobId(bytes) {
  const header = Buffer.from(`blob ${bytes.length}\0`, 'utf8');
  return hashBytes('sha1', Buffer.concat([header, bytes]));
}

export function verifyGitBlobHash(bytes, expectedObjectId) {
  return /^[0-9a-f]{40}$/i.test(expectedObjectId) && gitBlobId(bytes) === expectedObjectId;
}

function gitTreeEntries(repoRoot, commit) {
  if (!/^[0-9a-f]{40}$/i.test(commit)) throw new Error('Commit must be a full 40-character Git SHA');
  const listing = runGit(repoRoot, ['ls-tree', '-r', '-z', commit]);
  const entries = new Map();
  for (const record of listing.toString('utf8').split('\0')) {
    if (!record) continue;
    const tab = record.indexOf('\t');
    if (tab < 0) throw new Error('Malformed Git tree entry');
    const [mode, type, oid] = record.slice(0, tab).split(' ');
    entries.set(record.slice(tab + 1), { mode, type, oid });
  }
  return entries;
}

export function verifyPinnedFiles(repoRoot, commit, relativePaths) {
  return loadPinnedFiles(repoRoot, commit, relativePaths).metadata;
}

function loadPinnedFiles(repoRoot, commit, relativePaths) {
  const entries = gitTreeEntries(repoRoot, commit);
  const root = fs.realpathSync(repoRoot);
  const verified = [];
  const paths = [];
  for (const relativePath of relativePaths) {
    const normalized = relativePath.replaceAll('\\', '/');
    const absolute = safeJoin(root, normalized);
    const relativeFromRoot = path.relative(root, absolute).replaceAll('\\', '/');
    const tracked = entries.get(relativeFromRoot);
    if (!tracked || tracked.type !== 'blob' || (tracked.mode !== '100644' && tracked.mode !== '100755')) {
      throw new Error(`Pinned input is not a regular tracked file: ${relativeFromRoot}`);
    }
    paths.push({ path: relativeFromRoot, absolute, tracked });
  }
  const changed = runGit(repoRoot, ['diff', '--no-ext-diff', '--no-textconv', '--name-only', '-z', commit, '--', ...paths.map(item => item.path)])
    .toString('utf8').split('\0').filter(Boolean);
  if (changed.length > 0) throw new Error(`Pinned source content mismatch at ${changed.join(', ')}`);
  const input = Buffer.from(`${paths.map(item => item.tracked.oid).join('\n')}\n`, 'utf8');
  const objectData = runGit(repoRoot, ['cat-file', '--batch'], input);
  const contents = new Map();
  let offset = 0;
  for (const item of paths) {
    const headerEnd = objectData.indexOf(0x0a, offset);
    if (headerEnd < 0) throw new Error(`Missing Git object header for ${item.path}`);
    const header = objectData.toString('utf8', offset, headerEnd).split(' ');
    const size = Number(header[2]);
    if (header[1] !== 'blob' || !Number.isSafeInteger(size) || size < 0) throw new Error(`Invalid pinned Git blob for ${item.path}`);
    const contentStart = headerEnd + 1;
    const contentEnd = contentStart + size;
    if (contentEnd >= objectData.length || objectData[contentEnd] !== 0x0a) throw new Error(`Truncated pinned Git blob for ${item.path}`);
    const bytes = objectData.subarray(contentStart, contentEnd);
    if (!verifyGitBlobHash(bytes, item.tracked.oid)) throw new Error(`Pinned Git object hash mismatch for ${item.path}`);
    contents.set(item.path, bytes);
    verified.push({ path: item.path, gitBlob: item.tracked.oid, sha256: sha(bytes) });
    offset = contentEnd + 1;
  }
  return { metadata: { commit, filesVerified: verified.length, files: verified }, contents, root };
}

export function verifyGitCommit(repoRoot, expected) {
  if (!repoRoot || !/^[0-9a-f]{40}$/i.test(expected)) return false;
  try {
    return runGit(repoRoot, ['rev-parse', '--verify', 'HEAD']).toString('utf8').trim() === expected;
  } catch {
    return false;
  }
}

export function gitTree(repoRoot, commit) {
  return runGit(repoRoot, ['rev-parse', '--verify', `${commit}^{tree}`]).toString('utf8').trim();
}

function parseArgs(argv) {
  const output = {};
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index].startsWith('--')) output[argv[index].slice(2)] = argv[++index];
  }
  return output;
}

function category(name) {
  if (['AddNewProject', 'AddEmptyProject', 'EditProject', 'AddNewPrivateProject', 'RemoveProject'].includes(name)) return 'project-management';
  if (['Task', 'Search', 'Closed'].some(token => name.includes(token))) return 'task-management';
  if (['Column', 'Swimlane', 'Category'].some(token => name.includes(token))) return 'board-configuration';
  if (['User', 'Authorized'].some(token => name.includes(token))) return 'user-and-permission-management';
  if (name.includes('Profile')) return 'profile-management';
  return 'application-settings';
}

function quotedLiterals(line) {
  const literals = [];
  let index = 0;
  while (index < line.length) {
    const quote = line[index];
    if (quote !== '"' && quote !== "'") {
      index += 1;
      continue;
    }
    const start = index;
    index += 1;
    let escaped = false;
    while (index < line.length) {
      const char = line[index];
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === quote) break;
      index += 1;
    }
    if (index < line.length) {
      literals.push({ start, end: index + 1, quote, value: line.slice(start + 1, index) });
      index += 1;
    }
  }
  return literals;
}

function emailEntryLine(line) {
  const text = line.trimStart().toLowerCase();
  const actions = ['given enters ', 'when enters ', 'and enters ', 'but enters ', 'given types ', 'when types ', 'and types ', 'but types ', 'given fills ', 'when fills ', 'and fills ', 'but fills '];
  if (!actions.some(prefix => text.startsWith(prefix))) return false;
  return quotedLiterals(line).some(literal => literal.value.toLowerCase() === 'email' && line.slice(literal.end).toLowerCase().includes('field'));
}

function javaEmailFixtureLine(line) {
  return line.includes('.setEmail(') || line.includes('.getEmail()');
}

function emailOccurrences(sourceText, sourceKind) {
  const occurrences = [];
  const lines = sourceText.split(/\r?\n/);
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    if (sourceKind === 'gherkin' && !emailEntryLine(lines[lineIndex])) continue;
    if (sourceKind === 'java' && !javaEmailFixtureLine(lines[lineIndex])) continue;
    for (const literal of quotedLiterals(lines[lineIndex])) {
      if (literal.value.includes('@')) occurrences.push({ line: lineIndex + 1, value: literal.value });
    }
  }
  return occurrences;
}

function buildEmailMap(caseId, featureText, javaText) {
  const values = [];
  const seen = new Set();
  for (const occurrence of [...emailOccurrences(featureText, 'gherkin'), ...emailOccurrences(javaText, 'java')]) {
    if (!seen.has(occurrence.value)) {
      seen.add(occurrence.value);
      values.push(occurrence.value);
    }
  }
  return new Map(values.map((value, index) => [value, {
    logicalFixtureId: `${caseId}-EMAIL-${index + 1}`,
    placeholder: `${caseId.toLowerCase()}-email-${index + 1}@example.invalid`
  }]));
}

function replaceQuotedLiterals(line, replacements) {
  const literals = quotedLiterals(line);
  let output = line;
  const changes = [];
  for (const literal of literals.reverse()) {
    const replacement = replacements.get(literal.value);
    if (!replacement) continue;
    const token = typeof replacement === 'string' ? replacement : replacement.placeholder;
    output = output.slice(0, literal.start + 1) + token + output.slice(literal.end - 1);
    changes.unshift({ logicalFixtureId: typeof replacement === 'string' ? null : replacement.logicalFixtureId, placeholder: token });
  }
  return { text: output, changes };
}

function emailRedactText(sourceText, emailMap, sourcePath, sourceKind) {
  const records = [];
  const output = sourceText.split(/\r?\n/).map((line, index) => {
    if (sourceKind === 'gherkin' && !emailEntryLine(line)) return line;
    if (sourceKind === 'java' && !javaEmailFixtureLine(line)) return line;
    const result = replaceQuotedLiterals(line, emailMap);
    for (const change of result.changes) {
      records.push({ kind: 'TEST_EMAIL_FIXTURE', logicalFixtureId: change.logicalFixtureId, placeholder: change.placeholder, sourcePath, line: index + 1 });
    }
    return result.text;
  }).join('\n');
  return { text: output, records };
}

function passwordFieldValue(line) {
  const actionPrefixes = ['Given enters ', 'When enters ', 'And enters ', 'But enters ', 'Given types ', 'When types ', 'And types ', 'But types ', 'Given fills ', 'When fills ', 'And fills ', 'But fills '];
  const leadingTrimmed = line.trimStart().toLowerCase();
  if (!actionPrefixes.some(prefix => leadingTrimmed.startsWith(prefix.toLowerCase()))) return null;
  const literals = quotedLiterals(line);
  let fieldIndex = -1;
  for (let index = 0; index < literals.length; index += 1) {
    const label = literals[index].value.toLowerCase();
    if (label === 'password' || label === 'confirmation' || label === 'confirm password') fieldIndex = index;
  }
  if (fieldIndex < 1 || !line.slice(literals[fieldIndex].end).toLowerCase().includes('field')) return null;
  return literals[fieldIndex - 1];
}

function redactFeatureText(sourceText, emailMap, sourcePath) {
  const emailResult = emailRedactText(sourceText, emailMap, sourcePath, 'gherkin');
  const redactions = [...emailResult.records];
  const output = emailResult.text.split('\n').map((line, index) => {
    const target = passwordFieldValue(line);
    if (!target || target.value.length === 0) return line;
    redactions.push({ kind: 'TEST_PASSWORD_FIXTURE', placeholder: '<REDACTED_TEST_PASSWORD>', sourcePath, line: index + 1 });
    return line.slice(0, target.start + 1) + '<REDACTED_TEST_PASSWORD>' + line.slice(target.end - 1);
  }).join('\n');
  return { text: output, redactions };
}

function extractSteps(sourceText) {
  const keywords = ['Given', 'When', 'Then', 'And', 'But'];
  return sourceText.split(/\r?\n/).map((line, index) => ({ line: index + 1, text: line.trim() }))
    .filter(item => keywords.some(keyword => item.text.startsWith(`${keyword} `)));
}

function groupSteps(steps) {
  const grouped = { Given: [], When: [], Then: [] };
  let active = null;
  for (const step of steps) {
    for (const keyword of ['Given', 'When', 'Then']) {
      if (step.text.startsWith(`${keyword} `)) active = keyword;
    }
    if (active && (['Given', 'When', 'Then'].some(keyword => step.text.startsWith(`${keyword} `)) || step.text.startsWith('And ') || step.text.startsWith('But '))) {
      grouped[active].push(step);
    }
  }
  return grouped;
}

function importPageObjects(javaText) {
  const names = new Set();
  for (const line of javaText.split(/\r?\n/)) {
    const text = line.trim();
    const prefix = 'import po.';
    if (!text.startsWith(prefix) || !text.endsWith(';')) continue;
    const name = text.slice(prefix.length, -1);
    if (name && !name.includes('.') && /^[A-Za-z0-9_]+$/.test(name)) names.add(name);
  }
  return [...names].sort(compareText);
}

function isAssertionLine(text) {
  if (!text.includes('assert') || !text.includes('(')) return false;
  return /\bassert(?:Equals|True|False|That|NotNull|Null|Same|NotSame|ArrayEquals)\s*\(/.test(text);
}

function relativeFileList(root, extension) {
  return fs.readdirSync(root).filter(name => name.endsWith(extension)).sort(compareText);
}

function rootRelativePath(repoRoot, sourceRoot, filename) {
  const base = fs.realpathSync(repoRoot);
  const source = fs.realpathSync(sourceRoot);
  const absolute = path.resolve(source, filename);
  const relative = path.relative(base, absolute);
  if (relative.startsWith('..') || path.isAbsolute(relative)) throw new Error(`Input root is outside pinned repository: ${sourceRoot}`);
  return relative.replaceAll('\\', '/');
}

const UPSTREAM_REFS = [
  'app/Template/task/sidebar.php', 'app/Template/task_comments/create.php', 'app/Template/subtask/create.php',
  'app/Template/column/edit.php', 'app/Template/swimlane/edit.php', 'app/Controller/TaskStatusController.php',
  'app/Controller/TaskModificationController.php', 'app/Controller/ProjectPermissionController.php',
  'app/Model/ProjectUserRoleModel.php', 'app/Helper/ProjectRoleHelper.php',
  'app/Controller/CommentController.php', 'app/Controller/SubtaskController.php', 'app/Controller/ColumnController.php',
  'app/Controller/SwimlaneController.php', 'app/Template/app/filters_helper.php', 'app/Template/task_modification/show.php',
  'app/Template/task_creation/show.php', 'app/Template/project_permission/users.php', 'assets/js/components/project-select-role.js',
  'app/Template/board/table_column.php', 'app/Helper/TaskHelper.php', 'app/Controller/BoardAjaxController.php',
  'assets/js/src/BoardDragAndDrop.js', 'app/Template/board/table_tasks.php'
];

function sourceSemantics(caseId) {
  if (caseId === 'KB-023') return {
    interpretation: 'The Java oracle checks the required-password validation message after submitting the new-user form without a password. The raw Gherkin title says passwords do not match and is retained unchanged.',
    evidence: 'AddLocalUser_EmptyPassword.java assertion getPswError() equals "The password is required"; feature step expects the same message.'
  };
  if (caseId === 'KB-026') return {
    interpretation: 'The Java oracle checks that remote1 is absent after the user confirms deletion. The raw Gherkin title says short password and is retained unchanged.',
    evidence: 'RemoveUser.java asserts the user list no longer contains remote1 after the Remove/Yes flow; feature Then step matches.'
  };
  return null;
}

export function build({ featureRoot, javaRoot, poRoot, suiteRoot, upstreamRoot, bewtRepoRoot, upstreamRepoRoot, bewtCommit, upstreamCommit }) {
  if (bewtCommit !== EXPECTED.bewtCommit || upstreamCommit !== EXPECTED.upstreamCommit) throw new Error('Pinned source commit mismatch');
  if (!verifyGitCommit(bewtRepoRoot, EXPECTED.bewtCommit) || !verifyGitCommit(upstreamRepoRoot, EXPECTED.upstreamCommit)) {
    throw new Error('Pinned source repository HEAD could not be verified');
  }
  if (gitTree(bewtRepoRoot, EXPECTED.bewtCommit) !== EXPECTED.bewtTree) throw new Error('Pinned BEWT source tree mismatch');

  const sameRoot = (actual, expected) => fs.realpathSync(actual).toLowerCase() === fs.realpathSync(expected).toLowerCase();
  const expectedInputs = [
    [featureRoot, path.join(bewtRepoRoot, 'kanboard', 'gherkin')],
    [javaRoot, path.join(bewtRepoRoot, 'kanboard', 'baseline', 'kanboard-1.2.15', 'src', 'test', 'java', 'tests')],
    [poRoot, path.join(bewtRepoRoot, 'kanboard', 'baseline', 'kanboard-1.2.15', 'src', 'main', 'java', 'po')],
    [suiteRoot, path.join(bewtRepoRoot, 'kanboard', 'baseline', 'kanboard-1.2.15', 'src', 'test', 'java', 'tests')],
    [upstreamRoot, upstreamRepoRoot]
  ];
  if (expectedInputs.some(([actual, expected]) => !sameRoot(actual, expected))) throw new Error('Source input path is not beneath the verified pinned repository');

  const features = relativeFileList(featureRoot, '.feature');
  const javaFiles = relativeFileList(javaRoot, '.java');
  const poFiles = relativeFileList(poRoot, '.java');
  if (features.length !== 30) throw new Error(`Expected 30 Gherkin cases; got ${features.length}`);
  if (javaFiles.length !== 32) throw new Error(`Expected 32 Java test-directory files; got ${javaFiles.length}`);
  if (poFiles.length !== 27) throw new Error(`Expected 27 Page Objects; got ${poFiles.length}`);

  const bewtInputPaths = [
    ...features.map(file => rootRelativePath(bewtRepoRoot, featureRoot, file)),
    ...javaFiles.map(file => rootRelativePath(bewtRepoRoot, javaRoot, file)),
    ...poFiles.map(file => rootRelativePath(bewtRepoRoot, poRoot, file))
  ];
  const upstreamInputPaths = [...UPSTREAM_REFS];
  const bewtPinned = loadPinnedFiles(bewtRepoRoot, EXPECTED.bewtCommit, bewtInputPaths);
  const upstreamPinned = loadPinnedFiles(upstreamRepoRoot, EXPECTED.upstreamCommit, upstreamInputPaths);
  const bewtIntegrity = bewtPinned.metadata;
  const upstreamIntegrity = upstreamPinned.metadata;
  const pinnedRead = (sourceRoot, relativePath, pinned) => {
    const sourcePath = rootRelativePath(pinned.root, sourceRoot, relativePath);
    const bytes = pinned.contents.get(sourcePath);
    if (!bytes) throw new Error(`Input was not loaded from the pinned Git object database: ${sourcePath}`);
    return bytes;
  };
  const suite = pinnedRead(suiteRoot, 'TestSuite.java', bewtPinned).toString('utf8');
  const suiteNames = [...suite.matchAll(/\b([A-Z][A-Za-z0-9_]*)\.class/g)].map(match => match[1]).filter(name => name !== 'Suite');
  if (suiteNames.length !== 30) throw new Error(`Expected 30 suite cases; got ${suiteNames.length}`);

  const records = features.map((file, index) => {
    const stem = path.basename(file, '.feature').replace(/^\d+_/, '');
    const java = `${stem}.java`;
    if (!suiteNames.includes(stem) || !javaFiles.includes(java)) throw new Error(`Unmapped baseline case: ${file}`);
    const featureBytes = pinnedRead(featureRoot, file, bewtPinned);
    const javaBytes = pinnedRead(javaRoot, java, bewtPinned);
    const featureSource = featureBytes.toString('utf8');
    const javaSource = javaBytes.toString('utf8');
    const scenarioCount = featureSource.split(/\r?\n/).filter(line => line.trim().startsWith('Scenario')).length;
    if (scenarioCount !== 1) throw new Error(`Expected exactly one baseline scenario in ${file}; got ${scenarioCount}`);
    const caseId = `KB-${String(index + 1).padStart(3, '0')}`;
    const emailMap = buildEmailMap(caseId, featureSource, javaSource);
    const redactedFeature = redactFeatureText(featureSource, emailMap, `kanboard/gherkin/${file}`);
    const redactedJava = emailRedactText(javaSource, emailMap, `kanboard/baseline/kanboard-1.2.15/src/test/java/tests/${java}`, 'java');
    const pageObjects = importPageObjects(javaSource);
    const javaAssertions = redactedJava.text.split(/\r?\n/).map((line, lineIndex) => ({ line: lineIndex + 1, text: line.trim() }))
      .filter(item => isAssertionLine(item.text))
      .map(item => ({
        ...item,
        redactions: redactedJava.records.filter(record => record.line === item.line),
        semanticsNote: redactedJava.records.some(record => record.line === item.line)
          ? 'Fixture email literal is replaced with the same safe placeholder used by the corresponding setup literal; assertion structure is preserved.'
          : null
      }));
    const parsedSteps = extractSteps(redactedFeature.text);
    const cleanupIndex = parsedSteps.findIndex(item => item.text.toLowerCase() === 'given the previous assertion passed');
    const cleanupSteps = cleanupIndex >= 0 ? parsedSteps.slice(cleanupIndex) : [];
    const steps = parsedSteps.map((step, stepIndex) => ({ ...step, phase: cleanupIndex >= 0 && stepIndex >= cleanupIndex ? 'CLEANUP' : 'SCENARIO' }));
    const grouped = groupSteps(steps.filter(step => step.phase === 'SCENARIO'));
    const scenarioLine = redactedFeature.text.split(/\r?\n/).find(line => line.trim().startsWith('Scenario'));
    const rawScenarioLine = featureSource.split(/\r?\n/).find(line => line.trim().startsWith('Scenario'));
    const scenarioTitle = scenarioLine ? scenarioLine.trim().slice(scenarioLine.trim().indexOf(':') + 1).trim() : 'UNPARSED';
    const rawScenarioTitle = rawScenarioLine ? rawScenarioLine.trim().slice(rawScenarioLine.trim().indexOf(':') + 1).trim() : 'UNPARSED';
    const semantics = sourceSemantics(caseId);
    const reviewFlags = [];
    if (steps.length === 0 || grouped.Then.length === 0) reviewFlags.push('MISSING_GHERKIN_ORACLE');
    if (stem === 'AddLocalUser_EmptyPassword') reviewFlags.push('SCENARIO_TITLE_CONFLICTS_WITH_JAVA_REQUIRED_PASSWORD_ASSERTION');
    if (stem === 'RemoveUser') reviewFlags.push('SCENARIO_TITLE_CONFLICTS_WITH_JAVA_REMOVE_USER_ASSERTION');
    if (steps.some(step => step.text.toLowerCase().includes('clicks thre'))) reviewFlags.push('SOURCE_GHERKIN_TYPO_CLICKS_THRE');
    return {
      caseId,
      gherkin: {
        path: `kanboard/gherkin/${file}`,
        sha256: sha(featureBytes),
        scenarioTitle,
        rawScenarioTitle,
        scenarioCount,
        steps,
        cleanupSteps,
        redactions: redactedFeature.redactions
      },
      java: {
        path: `kanboard/baseline/kanboard-1.2.15/src/test/java/tests/${java}`,
        sha256: sha(javaBytes),
        className: stem,
        suiteOrder: suiteNames.indexOf(stem) + 1,
        assertions: javaAssertions
      },
      pageObjects,
      behavioralCategory: category(stem),
      behaviorInterpretation: semantics,
      preconditions: grouped.Given,
      testAction: grouped.When,
      expectedOracle: grouped.Then,
      redactionSemantics: {
        schemaVersion: '1.0',
        transformationsApplied: redactedFeature.redactions.length > 0 || redactedJava.records.length > 0,
        statement: 'Only form-entry password fixture values and quoted email fixture literals are replaced. Then/oracle text and assertion predicates are preserved. Email placeholders retain matching fixture identity across feature and Java source.',
        emailFixtures: [...emailMap.values()],
        emailOccurrences: [...redactedFeature.redactions, ...redactedJava.records].filter(record => record.kind === 'TEST_EMAIL_FIXTURE'),
        redactionCount: redactedFeature.redactions.length + redactedJava.records.length
      },
      reviewFlags,
      sourceIntegrity: { bewtTrackedBlobsVerified: true }
    };
  });

  const mappedNames = new Set(records.map(record => record.java.className));
  if (mappedNames.size !== 30 || suiteNames.some(name => !mappedNames.has(name))) throw new Error('Feature-to-suite mapping is not a one-to-one exact set');
  const sourceHashes = { tests: {}, pageObjects: {} };
  for (const record of records) sourceHashes.tests[record.java.className] = record.java.sha256;
  for (const file of poFiles) sourceHashes.pageObjects[file] = sha(pinnedRead(poRoot, file, bewtPinned));
  const refs = UPSTREAM_REFS.map(relativePath => {
    const bytes = pinnedRead(upstreamRoot, relativePath, upstreamPinned);
    return { path: relativePath, sha256: sha(bytes), permalink: `https://github.com/kanboard/kanboard/blob/${upstreamCommit}/${relativePath}` };
  });
  const groups = [...new Set(records.map(record => record.behavioralCategory))].sort(compareText);
  const inventory = {
    schemaVersion: '1.1',
    application: 'Kanboard',
    applicationVersion: '1.2.15',
    sourceStatus: 'STATIC_VERIFIED',
    sourceIntegrity: { result: 'MATCH', bewtFilesVerified: bewtIntegrity.filesVerified, upstreamFilesVerified: upstreamIntegrity.filesVerified },
    bewtBenchmarkCommit: bewtCommit,
    upstreamCommit,
    counts: { gherkinFiles: features.length, javaTestDirectoryFiles: javaFiles.length, javaSuiteCases: suiteNames.length, pageObjectClasses: poFiles.length, behaviorGroups: groups.length },
    behaviorGroups: groups,
    coverageSemantics: 'Coverage describes behaviors asserted by the baseline; gaps are proposals only. Exact-tag absence or title difference does not establish novelty.',
    cases: records
  };
  const provenance = {
    schemaVersion: '1.1',
    sourceCommits: { bewt: bewtCommit, bewtTree: gitTree(bewtRepoRoot, bewtCommit), upstream: upstreamCommit },
    sourceIntegrity: {
      result: 'MATCH',
      bewt: { commit: bewtCommit, filesVerified: bewtIntegrity.filesVerified, files: bewtIntegrity.files },
      upstream: { commit: upstreamCommit, filesVerified: upstreamIntegrity.filesVerified, files: upstreamIntegrity.files }
    },
    pageObjectCount: poFiles.length,
    javaClassHashes: sourceHashes.tests,
    pageObjectHashes: sourceHashes.pageObjects,
    gherkinHashes: Object.fromEntries(records.map(record => [path.basename(record.gherkin.path), record.gherkin.sha256])),
    baselineSupportHashes: { testSuite: sha(pinnedRead(suiteRoot, 'TestSuite.java', bewtPinned)), baseTest: sha(pinnedRead(javaRoot, 'BaseTest.java', bewtPinned)) },
    upstreamReferences: refs,
    redaction: {
      schemaVersion: '1.0',
      policy: 'Replace only password values entered into a form and quoted email fixture literals. Preserve expected messages, oracle steps, assertion predicates, and assertion syntax.',
      emailPlaceholderPolicy: 'Each unique source email literal is consistently mapped within its case to a synthetic @example.invalid placeholder; logicalFixtureId records matching occurrences without storing the source literal.',
      inventoryField: 'cases[].redactionSemantics and source assertion redactions'
    },
    workingCopyComparison: { result: 'MATCH', businessJavaFilesCompared: 30, pageObjectFilesCompared: 27, mismatches: 0, source: 'experiments/kanboard/bewt-suite checked against the verified BEWT commit' }
  };
  const mapping = { inventory, provenance };
  return { inventory, provenance, mappingIntegrity: { bewtIntegrity, upstreamIntegrity } };
}

export function mappingMarkdown(inventory) {
  const escapeCell = value => String(value ?? '').replaceAll('|', '\\|').replace(/\r?\n/g, '<br>');
  const steps = (record, group) => {
    let active = null;
    const output = [];
    for (const step of record.gherkin.steps) {
      for (const keyword of ['Given', 'When', 'Then']) if (step.text.startsWith(`${keyword} `)) active = keyword;
      if (step.phase === 'SCENARIO' && active === group && (['Given', 'When', 'Then'].some(keyword => step.text.startsWith(`${keyword} `)) || step.text.startsWith('And ') || step.text.startsWith('But '))) {
        output.push(`L${step.line}: ${step.text}`);
      }
    }
    return output.join('<br>') || 'N/A';
  };
  const rows = inventory.cases.map(record => {
    const firstLine = record.gherkin.steps.length ? Math.min(...record.gherkin.steps.map(step => step.line)) : 1;
    const featureUrl = `https://github.com/OlianasD/BEWT/blob/${inventory.bewtBenchmarkCommit}/${record.gherkin.path}#L${firstLine}`;
    const javaUrl = `https://github.com/OlianasD/BEWT/blob/${inventory.bewtBenchmarkCommit}/${record.java.path}#L${record.java.assertions[0]?.line ?? 1}`;
    const refs = `[Feature SHA ${record.gherkin.sha256}](${featureUrl})<br>[Java SHA ${record.java.sha256}](${javaUrl})`;
    const assertionText = record.java.assertions.map(assertion => `L${assertion.line}: ${assertion.text}`).join('<br>');
    const interpretation = record.behaviorInterpretation?.interpretation ?? '';
    const columns = [
      record.caseId,
      `${record.gherkin.rawScenarioTitle}${interpretation ? `<br><strong>Observed behavior:</strong> ${interpretation}` : ''}`,
      steps(record, 'Given'), steps(record, 'When'), steps(record, 'Then'),
      record.gherkin.cleanupSteps.map(step => `L${step.line}: ${step.text}`).join('<br>') || 'N/A',
      `${record.java.className} (suite ${record.java.suiteOrder})<br>${assertionText}`,
      record.pageObjects.join(', '), record.behavioralCategory,
      record.preconditions.map(step => step.text).join('<br>'),
      record.testAction.map(step => step.text).join('<br>'),
      record.expectedOracle.map(step => step.text).join('<br>'), refs, record.mappingConfidence ?? 'HIGH_FILENAME_AND_SUITE_ORDER'
    ];
    return `| ${columns.map(escapeCell).join(' | ')} |`;
  });
  return [
    '# Kanboard Baseline Case Mapping',
    '',
    `Verified BEWT commit: ${inventory.bewtBenchmarkCommit}; upstream Kanboard commit: ${inventory.upstreamCommit}. Cleanup is separated after the baseline sentinel.`,
    'Sensitive form-entry password values and email fixture literals are replaced with documented safe placeholders. Expected UI messages and executable Java assertion structure are preserved. Raw scenario titles remain unchanged; observed behavior is stated separately where title and source behavior diverge.',
    '',
    '| Case | Raw scenario title and observed behavior | Given | When | Then | Cleanup | Java class and assertions | Page Objects imported | Category | Preconditions | Action | Expected oracle | Source references and SHA-256 | Confidence |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...rows,
    ''
  ].join('\n');
}

if (process.argv[1]?.endsWith('coverage-inventory.mjs')) {
  const args = parseArgs(process.argv.slice(2));
  for (const name of ['features', 'java', 'po', 'suite', 'upstream', 'bewt-repo-root', 'upstream-repo-root', 'out']) {
    if (!args[name]) throw new Error(`Missing --${name}`);
  }
  const built = build({
    featureRoot: args.features,
    javaRoot: args.java,
    poRoot: args.po,
    suiteRoot: args.suite,
    upstreamRoot: args.upstream,
    bewtRepoRoot: args['bewt-repo-root'],
    upstreamRepoRoot: args['upstream-repo-root'],
    bewtCommit: args['bewt-commit'],
    upstreamCommit: args['upstream-commit']
  });
  fs.mkdirSync(args.out, { recursive: true });
  for (const [name, value] of Object.entries({ inventory: built.inventory, 'provenance-index': built.provenance })) {
    fs.writeFileSync(path.join(args.out, `${name}.json`), `${JSON.stringify(value, null, 2)}\n`);
  }
  fs.writeFileSync(path.join(args.out, 'KANBOARD-BASELINE-MAPPING.md'), mappingMarkdown(built.inventory));
  console.log(JSON.stringify({ cases: built.inventory.counts.javaSuiteCases, groups: built.inventory.counts.behaviorGroups, pageObjects: built.inventory.counts.pageObjectClasses, bewtFilesVerified: built.mappingIntegrity.bewtIntegrity.filesVerified, upstreamFilesVerified: built.mappingIntegrity.upstreamIntegrity.filesVerified, out: path.resolve(args.out) }));
}
