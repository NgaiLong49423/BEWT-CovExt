import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = new URL('../../', import.meta.url);
const apps = ['bludit', 'claroline', 'joomla', 'kanboard', 'mantisbt', 'mediawiki', 'prestashop'];

export function callArguments(source, openParen) {
  const args = [];
  let start = openParen + 1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < source.length; i += 1) {
    const c = source[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === '(') depth += 1;
    else if (c === ')') {
      if (depth === 0) {
        args.push(source.slice(start, i).trim());
        return args;
      }
      depth -= 1;
    } else if (c === ',' && depth === 0) {
      args.push(source.slice(start, i).trim());
      start = i + 1;
    }
  }
  return null;
}

export function scanJavaSource(source, file = '<memory>') {
  const violations = [];
  const pattern = /\.(login\w*|setUsername|setPassword)\s*\(/g;
  for (const match of source.matchAll(pattern)) {
    const openParen = match.index + match[0].lastIndexOf('(');
    const args = callArguments(source, openParen);
    const line = source.slice(0, match.index).split(/\r?\n/).length;
    if (!args || args.length === 0) {
      violations.push({ file, line, reason: 'unparseable credential call' });
      continue;
    }
    const checked = match[1].startsWith('login') ? args : args.slice(0, 1);
    if (checked.some((arg) => /^"(?:\\.|[^"\\])*"$/.test(arg))) {
      violations.push({ file, line, reason: 'inline credential literal' });
    }
  }
  return violations;
}

function javaFiles(directory) {
  const found = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) found.push(...javaFiles(path));
    else if (entry.isFile() && /^T01C_.*_R[23]\.java$/.test(entry.name)) found.push(path);
  }
  return found;
}

export function scanRepository(rootPath = fileURLToPath(repoRoot)) {
  const allFiles = apps.flatMap((app) => {
    const path = join(rootPath, 'experiments', app, 'bewt-suite', 'src', 'test', 'java');
    try { return javaFiles(path); } catch { return []; }
  });
  const latestByCandidate = new Map();
  for (const path of allFiles) {
    const match = path.match(/(T01C_.*)_R([23])\.java$/);
    if (!match) continue;
    const revision = Number(match[2]);
    const previous = latestByCandidate.get(match[1]);
    if (!previous || revision > previous.revision) latestByCandidate.set(match[1], { path, revision });
  }
  const files = [...latestByCandidate.values()].map(({ path }) => path);
  const violations = files.flatMap((path) => scanJavaSource(readFileSync(path, 'utf8'), relative(rootPath, path)));
  return { files: files.length, violations };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const result = scanRepository();
  if (result.violations.length) {
    for (const item of result.violations) process.stderr.write(`${item.file}:${item.line}: ${item.reason}\n`);
    process.exitCode = 1;
  } else {
    process.stdout.write(`PASS: checked ${result.files} latest active non-ExpressCart candidate revisions; no inline login username/password literals.\n`);
  }
}