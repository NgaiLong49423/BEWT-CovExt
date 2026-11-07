import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '../../../../experiments/expresscart/agent/node_modules/@cucumber/gherkin/dist/index.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../revised');
const files = fs.readdirSync(root).filter((file) => file.endsWith('.feature')).sort();
const results = [];

for (const file of files) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  let id = 0;
  const parser = new Parser(new AstBuilder(() => `review-${id++}`), new GherkinClassicTokenMatcher());
  try {
    const document = parser.parse(source);
    const scenarios = document.feature?.children.filter((child) => child.scenario).length ?? 0;
    if (scenarios !== 1) throw new Error(`Expected one scenario, found ${scenarios}`);
    results.push({ file, status: 'PASS', scenarios });
  } catch (error) {
    results.push({ file, status: 'FAIL', error: error instanceof Error ? error.message : 'parse failure' });
  }
}

const summary = {
  files: files.length,
  valid: results.filter((result) => result.status === 'PASS').length,
  invalid: results.filter((result) => result.status === 'FAIL').length,
  results,
};
console.log(JSON.stringify(summary, null, 2));
if (summary.invalid > 0 || summary.files !== 5) process.exitCode = 1;
