import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { AstBuilder, GherkinClassicTokenMatcher, Parser } from '../../../../experiments/expresscart/agent/node_modules/@cucumber/gherkin/dist/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const featurePath = path.join(here, '../revised/EC-C03-publication-state-review.feature');
const source = fs.readFileSync(featurePath, 'utf8');
const parser = new Parser(new AstBuilder(() => 'ec-c03'), new GherkinClassicTokenMatcher());
try {
  const document = parser.parse(source);
  const scenarioCount = document.feature?.children.filter((child) => child.scenario).length ?? 0;
  if (scenarioCount !== 1) throw new Error(`Expected one scenario, found ${scenarioCount}`);
  const output = { candidateId: 'EC-C03', status: 'PASS', syntax: 'VALID', scenarioCount, humanDecision: 'REVISE' };
  fs.writeFileSync(path.join(here, '../ec-c03-validation.json'), `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output, null, 2));
} catch (error) {
  const output = { candidateId: 'EC-C03', status: 'FAIL', syntax: 'INVALID', error: error instanceof Error ? error.message : 'parse failure', humanDecision: 'REVISE' };
  fs.writeFileSync(path.join(here, '../ec-c03-validation.json'), `${JSON.stringify(output, null, 2)}\n`);
  console.log(JSON.stringify(output, null, 2));
  process.exitCode = 1;
}
