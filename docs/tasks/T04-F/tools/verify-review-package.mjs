import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const taskDir = path.join(root, 'docs/tasks/T04-F');
const apps = ['bludit', 'claroline', 'expresscart', 'joomla', 'mantisbt', 'mediawiki', 'prestashop'];
const index = JSON.parse(fs.readFileSync(path.join(root, 'docs/tasks/T04-E/source-reference-index.json'), 'utf8'));
let candidateTotal = 0;
for (const app of apps) {
  const proposalPath = path.join(root, `data/coverage/${app}/source-backed-gap-proposals.json`);
  const shortlistPath = path.join(root, `data/coverage/${app}/source-backed-gap-shortlist.json`);
  const baselinePath = path.join(root, `data/coverage/${app}/baseline-mapping.json`);
  const packetPath = path.join(taskDir, `review-packets/${app}.md`);
  const proposal = JSON.parse(fs.readFileSync(proposalPath, 'utf8'));
  const shortlist = JSON.parse(fs.readFileSync(shortlistPath, 'utf8'));
  const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
  const packet = fs.readFileSync(packetPath, 'utf8');
  if (!packet.includes('PROPOSED ONLY') || !packet.includes('G1: NOT_VERIFIED')) throw new Error(`${app}: missing non-acceptance status`);
  if (/Decision: \*\*\[x\]/i.test(packet)) throw new Error(`${app}: a human decision is preselected`);
  for (const item of shortlist.topCandidates) {
    const candidate = proposal.candidates.find(value => value.candidateId === item.candidateId);
    if (!candidate || candidate.humanDecision !== null || candidate.novelty?.humanDecision !== null) throw new Error(`${item.candidateId}: source decision missing or non-null`);
    if (!packet.includes(`## ${item.candidateId} — ${candidate.title}`)) throw new Error(`${item.candidateId}: missing from packet`);
    if (!packet.includes(`Scenario: ${candidate.title}`) || !packet.includes(candidate.oracle.observable)) throw new Error(`${item.candidateId}: missing draft Gherkin/oracle`);
    for (const refId of candidate.sourceRefs) {
      const ref = index.apps[app]?.sourceReferences?.[refId];
      if (!ref || !packet.includes(ref.permalink)) throw new Error(`${item.candidateId}: missing exact pinned source link ${refId}`);
    }
    for (const caseId of candidate.baselineOverlap.baselineCases || []) {
      const mapped = baseline.entries.find(entry => entry.caseId === caseId);
      if (!mapped || !packet.includes(mapped.featurePath) || !packet.includes(mapped.javaPath)) throw new Error(`${item.candidateId}: missing baseline mapping ${caseId}`);
    }
    candidateTotal += 1;
  }
  for (const relative of [`../../../../data/coverage/${app}/source-backed-gap-proposals.json`, `../../../../data/coverage/${app}/source-backed-gap-shortlist.json`, `../../../../data/coverage/${app}/baseline-mapping.json`, '../../T04-E/source-reference-index.json']) {
    if (!fs.existsSync(path.resolve(path.dirname(packetPath), relative))) throw new Error(`${app}: broken relative link ${relative}`);
  }
}
if (apps.length !== 7 || candidateTotal !== 20) throw new Error(`unexpected packet counts: apps=${apps.length}, candidates=${candidateTotal}`);
console.log(`PASS: ${apps.length} app packets, ${candidateTotal} shortlist candidates, pinned source and baseline links, draft Gherkin/oracles, no preselected human decisions.`);
