import { readFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { createRequire } from 'node:module';

if (process.argv.length !== 3) throw new Error('Usage: node validate_gherkin.mjs <framework-directory>');
const requireFromFramework = createRequire(join(resolve(process.argv[2]), 'package.json'));
const { Parser, AstBuilder, GherkinClassicTokenMatcher } = requireFromFramework('@cucumber/gherkin');
const { IdGenerator } = requireFromFramework('@cucumber/messages');
const manifest=JSON.parse(readFileSync('docs/tasks/T04-L/REVISIONS.json','utf8'));
for(const revision of manifest.records) {
  const parser=new Parser(new AstBuilder(IdGenerator.incrementing()),new GherkinClassicTokenMatcher());
  const doc=parser.parse(readFileSync(revision.featurePath,'utf8'));
  if(!doc.feature || doc.feature.children.length!==1 || !doc.feature.children[0].scenario) throw new Error(`Expected one scenario: ${revision.candidateId}`);
  console.log(`${revision.candidateId} v${revision.version}: one scenario parsed`);
}
