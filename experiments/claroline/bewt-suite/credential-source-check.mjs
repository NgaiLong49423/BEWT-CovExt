import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const suiteRoot = dirname(fileURLToPath(import.meta.url));
const sourceRoot = join(suiteRoot, 'src', 'test', 'java', 'test');
const javaFiles = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.isFile() && entry.name.endsWith('.java')) javaFiles.push(path);
  }
}
function callArguments(source, openParen) {
  const args = [];
  let start = openParen + 1;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < source.length; index += 1) {
    const char = source[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') inString = false;
      continue;
    }
    if (char === '"') inString = true;
    else if (char === '(') depth += 1;
    else if (char === ')') {
      if (depth === 0) {
        args.push(source.slice(start, index).trim());
        return args;
      }
      depth -= 1;
    } else if (char === ',' && depth === 0) {
      args.push(source.slice(start, index).trim());
      start = index + 1;
    }
  }
  return null;
}

walk(sourceRoot);
const violations = [];
let loginCalls = 0;
for (const path of javaFiles) {
  const source = readFileSync(path, 'utf8');
  const pattern = /\.login\s*\(/g;
  for (const match of source.matchAll(pattern)) {
    const openParen = match.index + match[0].lastIndexOf('(');
    const args = callArguments(source, openParen);
    loginCalls += 1;
    if (!args || args.length < 2) {
      violations.push({ path: relative(suiteRoot, path), line: source.slice(0, match.index).split(/\r?\n/).length, reason: 'unparseable login call' });
      continue;
    }
    if (/^"(?:\\.|[^"\\])*"$/.test(args[1])) {
      violations.push({ path: relative(suiteRoot, path), line: source.slice(0, match.index).split(/\r?\n/).length, reason: 'password argument is a string literal' });
    }
  }
}
if (violations.length > 0) {
  for (const violation of violations) process.stderr.write(`${violation.path}:${violation.line}: ${violation.reason}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(`PASS: ${loginCalls} Java login call sites checked; no inline password literals.\n`);
}