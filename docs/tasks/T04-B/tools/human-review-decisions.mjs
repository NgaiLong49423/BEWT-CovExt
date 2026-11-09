import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { pathToFileURL } from 'node:url';

const DECISIONS = new Set(['ACCEPT', 'REVISE', 'REJECT']);
const CANDIDATES = new Set(['KB-GAP-001', 'KB-GAP-002', 'KB-GAP-003', 'KB-GAP-004', 'KB-GAP-008']);
const NOVELTY = new Set(['SUPPORTED', 'OVERLAP', 'INSUFFICIENT_EVIDENCE', 'INCONCLUSIVE']);
const ORACLE = new Set(['CONFIRMED', 'CONDITIONED', 'NOT_CONFIRMED']);
const sha256 = (value) => crypto.createHash('sha256').update(value).digest('hex');
const fail = (message) => { throw new Error(message); };
const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const required = (obj, keys, label) => {
  if (!isObject(obj)) fail(`${label} must be an object`);
  for (const key of keys) if (!(key in obj)) fail(`${label}.${key} is required`);
};
const exactKeys = (obj, keys, label) => {
  const allowed = new Set(keys);
  for (const key of Object.keys(obj)) if (!allowed.has(key)) fail(`${label}.${key} is not allowed by the schema`);
};

function loadContext(root) {
  const datasetPath = path.join(root, 'data/reviews/kanboard/t04b-review-dataset.json');
  const gapsPath = path.join(root, 'data/coverage/kanboard/gap-candidates.json');
  const datasetBytes = fs.readFileSync(datasetPath);
  const dataset = JSON.parse(datasetBytes.toString('utf8'));
  const gaps = JSON.parse(fs.readFileSync(gapsPath, 'utf8'));
  return { dataset, datasetBytes, datasetSha256: sha256(datasetBytes), gaps };
}

function validateEvidenceReference(ref, dataset, root, verifyBytes) {
  const keys=['path','sha256','description'];
  required(ref, keys, 'reviewerEvidence[]'); exactKeys(ref,keys,'reviewerEvidence[]');
  if (typeof ref.path !== 'string' || !ref.path.trim() || path.isAbsolute(ref.path) || ref.path.split(/[\\/]/).includes('..')) fail('reviewerEvidence.path must be a safe repository-relative path');
  if (!/^[a-f0-9]{64}$/.test(ref.sha256)) fail('reviewerEvidence.sha256 must be a lowercase SHA-256');
  if (typeof ref.description !== 'string' || ref.description.trim().length < 5) fail('reviewerEvidence.description must explain the evidence');
  const indexed = dataset.evidenceProvenanceIndex.find((entry) => entry.path === ref.path && entry.sha256 === ref.sha256);
  if (indexed) return;
  if (!verifyBytes) return;
  const rootReal = fs.realpathSync(root);
  const evidencePath = path.resolve(rootReal, ref.path);
  const real = fs.realpathSync(evidencePath);
  if (real !== rootReal && !real.startsWith(`${rootReal}${path.sep}`)) fail('reviewerEvidence path resolves outside the repository');
  if (!fs.statSync(real).isFile()) fail('reviewerEvidence path is not a regular file');
  if (sha256(fs.readFileSync(real)) !== ref.sha256) fail('reviewerEvidence file hash does not match the supplied evidence reference');
}

export function validateDecisionPayload(payload, { root = process.cwd() } = {}) {
  const payloadKeys=['candidateId','candidateVersionSha256','reviewedDatasetSha256','reviewedCommitSha','reviewerIdentity','decisionDate','decision','rationale','oracleConfirmation','noveltyAssessment','conditionsForImplementation','reviewerEvidence'];
  required(payload, payloadKeys, 'decision'); exactKeys(payload,payloadKeys,'decision');
  if (!CANDIDATES.has(payload.candidateId)) fail('decision.candidateId is not in the T04-B shortlist');
  if (!/^[a-f0-9]{64}$/.test(payload.candidateVersionSha256)) fail('candidateVersionSha256 must be a lowercase SHA-256');
  if (!/^[a-f0-9]{64}$/.test(payload.reviewedDatasetSha256)) fail('reviewedDatasetSha256 must be a lowercase SHA-256');
  if (!/^[a-f0-9]{40}$/.test(payload.reviewedCommitSha)) fail('reviewedCommitSha must be a full commit SHA');
  if (typeof payload.reviewerIdentity !== 'string' || payload.reviewerIdentity.trim().length < 2) fail('reviewerIdentity is required');
  if (typeof payload.decisionDate !== 'string' || Number.isNaN(Date.parse(payload.decisionDate)) || !/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(payload.decisionDate)) fail('decisionDate must be a reviewer-supplied ISO-8601 date-time');
  if (!DECISIONS.has(payload.decision)) fail('decision must be ACCEPT, REVISE, or REJECT');
  if (typeof payload.rationale !== 'string' || payload.rationale.trim().length < 10) fail('rationale must contain at least 10 characters');
  required(payload.oracleConfirmation, ['status', 'rationale'], 'oracleConfirmation');
  exactKeys(payload.oracleConfirmation,['status','rationale'],'oracleConfirmation');
  if (!ORACLE.has(payload.oracleConfirmation.status) || typeof payload.oracleConfirmation.rationale !== 'string' || payload.oracleConfirmation.rationale.trim().length < 5) fail('oracleConfirmation requires a valid status and rationale');
  required(payload.noveltyAssessment, ['status', 'rationale'], 'noveltyAssessment');
  exactKeys(payload.noveltyAssessment,['status','rationale'],'noveltyAssessment');
  if (!NOVELTY.has(payload.noveltyAssessment.status) || typeof payload.noveltyAssessment.rationale !== 'string' || payload.noveltyAssessment.rationale.trim().length < 5) fail('noveltyAssessment requires a valid status and rationale');
  if (!Array.isArray(payload.conditionsForImplementation) || payload.conditionsForImplementation.some((item) => typeof item !== 'string' || item.trim().length < 3)) fail('conditionsForImplementation must be an array of non-empty conditions');
  if (!Array.isArray(payload.reviewerEvidence) || payload.reviewerEvidence.length < 1) fail('at least one reviewerEvidence reference is required');

  const { dataset, datasetSha256, gaps } = loadContext(root);
  if (payload.reviewedDatasetSha256 !== datasetSha256) fail('reviewedDatasetSha256 mismatch: the reviewed static dataset has changed');
  const candidate = dataset.candidates.find((item) => item.id === payload.candidateId);
  const acceptedCandidate = gaps.items.find((item) => item.id === payload.candidateId);
  if (!candidate || !acceptedCandidate) fail('candidate record is missing from the static review input');
  const currentCandidateHash = sha256(JSON.stringify(acceptedCandidate));
  if (candidate.candidateVersionSha256 !== currentCandidateHash) fail('static dataset candidate hash is inconsistent with the accepted T04-A candidate input');
  if (payload.candidateVersionSha256 !== currentCandidateHash) fail('candidate hash mismatch: this decision must be reviewed again for the current candidate version');
  for (const evidence of payload.reviewerEvidence) validateEvidenceReference(evidence, dataset, root, true);
  return { candidateId: candidate.id, candidateVersionSha256: currentCandidateHash, reviewedDatasetSha256: datasetSha256 };
}

function validateStoredRecord(record) {
  const keys=['recordId','recordSequence','previousRecordHash','supersedesRecordId','candidateId','candidateVersionSha256','reviewedDatasetSha256','reviewedCommitSha','reviewerIdentity','decisionDate','decision','rationale','oracleConfirmation','noveltyAssessment','conditionsForImplementation','reviewerEvidence'];
  required(record, keys, 'stored decision record'); exactKeys(record,keys,'stored decision record');
  if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.recordId)) fail('recordId must be a UUID');
  if (!Number.isSafeInteger(record.recordSequence) || record.recordSequence < 1) fail('recordSequence must be a positive integer');
  if (record.previousRecordHash !== null && !/^[a-f0-9]{64}$/.test(record.previousRecordHash)) fail('previousRecordHash must be null or SHA-256');
  if (record.supersedesRecordId !== null && !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(record.supersedesRecordId)) fail('supersedesRecordId must be null or a UUID');
  if (!CANDIDATES.has(record.candidateId) || !DECISIONS.has(record.decision)) fail('stored decision has an unsupported candidate or decision');
  if (!/^[a-f0-9]{64}$/.test(record.candidateVersionSha256) || !/^[a-f0-9]{64}$/.test(record.reviewedDatasetSha256) || !/^[a-f0-9]{40}$/.test(record.reviewedCommitSha)) fail('stored decision contains an invalid commit or content hash');
  if (typeof record.reviewerIdentity !== 'string' || record.reviewerIdentity.trim().length < 2 || typeof record.rationale !== 'string' || record.rationale.trim().length < 10) fail('stored decision is missing reviewer identity or rationale');
  if (typeof record.decisionDate !== 'string' || Number.isNaN(Date.parse(record.decisionDate)) || !/^\d{4}-\d\d-\d\dT.*(?:Z|[+-]\d\d:\d\d)$/.test(record.decisionDate)) fail('stored decision has an invalid reviewer-supplied ISO date');
  required(record.oracleConfirmation, ['status', 'rationale'], 'stored oracleConfirmation');
  exactKeys(record.oracleConfirmation,['status','rationale'],'stored oracleConfirmation');
  required(record.noveltyAssessment, ['status', 'rationale'], 'stored noveltyAssessment');
  exactKeys(record.noveltyAssessment,['status','rationale'],'stored noveltyAssessment');
  if (!ORACLE.has(record.oracleConfirmation.status) || !NOVELTY.has(record.noveltyAssessment.status)) fail('stored decision has invalid oracle or novelty assessment');
  if (typeof record.oracleConfirmation.rationale!=='string'||record.oracleConfirmation.rationale.trim().length<5||typeof record.noveltyAssessment.rationale!=='string'||record.noveltyAssessment.rationale.trim().length<5) fail('stored oracle/novelty rationale is missing');
  if (!Array.isArray(record.conditionsForImplementation) || record.conditionsForImplementation.some((x)=>typeof x!=='string'||x.trim().length<3) || !Array.isArray(record.reviewerEvidence) || record.reviewerEvidence.length < 1) fail('stored decision is missing conditions or reviewer evidence');
  for(const ref of record.reviewerEvidence){required(ref,['path','sha256','description'],'stored reviewerEvidence[]');exactKeys(ref,['path','sha256','description'],'stored reviewerEvidence[]');if(typeof ref.path!=='string'||!ref.path.trim()||path.isAbsolute(ref.path)||ref.path.split(/[\\/]/).includes('..')||!/^[a-f0-9]{64}$/.test(ref.sha256)||typeof ref.description!=='string'||ref.description.trim().length<5)fail('stored reviewerEvidence[] does not match the schema');}
}

export function validateDecisionLedger(text) {
  if (text === '') return [];
  if (!text.endsWith('\n')) fail('decision ledger must end each append-only record with a newline');
  const lines = text.slice(0, -1).split('\n');
  const records = [];
  const ids = new Set();
  const latestByCandidate = new Map();
  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    let record;
    try { record = JSON.parse(line); } catch { fail(`decision ledger line ${index + 1} is invalid JSON`); }
    if (JSON.stringify(record) !== line) fail(`decision ledger line ${index + 1} is not canonical compact JSON`);
    validateStoredRecord(record);
    if (ids.has(record.recordId)) fail(`duplicate decision recordId ${record.recordId}`);
    ids.add(record.recordId);
    if (record.recordSequence !== index + 1) fail(`decision ledger sequence break at line ${index + 1}`);
    const previous = records[index - 1];
    const expectedPreviousHash = previous ? sha256(lines[index - 1]) : null;
    if (record.previousRecordHash !== expectedPreviousHash) fail(`decision ledger hash chain mismatch at line ${index + 1}`);
    const priorForCandidate = latestByCandidate.get(record.candidateId);
    if (record.supersedesRecordId !== (priorForCandidate?.recordId ?? null)) fail(`decision history link mismatch at line ${index + 1}`);
    records.push(record);
    latestByCandidate.set(record.candidateId, record);
  }
  return records;
}

export function getCandidateReviewState(candidateId, ledgerText, { root = process.cwd() } = {}) {
  if (!CANDIDATES.has(candidateId)) fail('unknown candidate ID');
  const records = validateDecisionLedger(ledgerText);
  const latest = [...records].reverse().find((record) => record.candidateId === candidateId);
  if (!latest) return { status: 'HUMAN_REVIEW_PENDING', latestRecord: null };
  const context=loadContext(root);
  const current = context.dataset.candidates.find((candidate) => candidate.id === candidateId);
  const currentDatasetSha256=context.datasetSha256;
  if (latest.candidateVersionSha256 !== current.candidateVersionSha256) return { status: 'REVIEW_REQUIRED_CANDIDATE_VERSION_CHANGED', latestRecord: latest };
  if (latest.reviewedDatasetSha256 !== currentDatasetSha256) return { status: 'REVIEW_REQUIRED_DATASET_VERSION_CHANGED', latestRecord: latest };
  return { status: latest.decision, latestRecord: latest };
}

export function appendHumanDecision(payload, { root = process.cwd(), ledgerPath = path.join(root, 'data/reviews/kanboard/human-review-decisions.jsonl'), allowExternalLedger = false } = {}) {
  validateDecisionPayload(payload, { root });
  const rootReal=fs.realpathSync(root);
  const ledgerResolved=path.resolve(ledgerPath);
  if(!allowExternalLedger&&(ledgerResolved!==rootReal&&!ledgerResolved.startsWith(`${rootReal}${path.sep}`))) fail('decision ledger path must remain inside this repository');
  if(fs.existsSync(ledgerResolved)&&fs.lstatSync(ledgerResolved).isSymbolicLink()) fail('decision ledger must not be a symbolic link');
  const before = fs.existsSync(ledgerResolved) ? fs.readFileSync(ledgerResolved, 'utf8') : '';
  const existing = validateDecisionLedger(before);
  const prior = [...existing].reverse().find((record) => record.candidateId === payload.candidateId);
  const record = {
    recordId: crypto.randomUUID(),
    recordSequence: existing.length + 1,
    previousRecordHash: existing.length ? sha256(before.slice(0, -1).split('\n').at(-1)) : null,
    supersedesRecordId: prior?.recordId ?? null,
    ...payload,
  };
  validateStoredRecord(record);
  const line = `${JSON.stringify(record)}\n`;
  validateDecisionLedger(`${before}${line}`);
  fs.mkdirSync(path.dirname(ledgerResolved), { recursive: true });
  const fd = fs.openSync(ledgerResolved, 'a');
  try {
    if (fs.fstatSync(fd).size !== Buffer.byteLength(before)|| (fs.existsSync(ledgerResolved)&&fs.readFileSync(ledgerResolved,'utf8')!==before)) fail('decision ledger changed concurrently; append was cancelled');
    fs.writeSync(fd, line, null, 'utf8');
    fs.fsyncSync(fd);
  } finally { fs.closeSync(fd); }
  const after = fs.readFileSync(ledgerResolved, 'utf8');
  if (!after.startsWith(before)) fail('append-only ledger prefix changed unexpectedly');
  validateDecisionLedger(after);
  return record;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const [action, inputPath] = process.argv.slice(2);
  if (!['validate', 'append'].includes(action) || !inputPath) {
    console.error('Usage: node human-review-decisions.mjs <validate|append> <reviewer-supplied-decision.json>');
    process.exitCode = 2;
  } else {
    try {
      const payload = JSON.parse(fs.readFileSync(path.resolve(inputPath), 'utf8'));
      if (action === 'validate') {
        console.log(JSON.stringify(validateDecisionPayload(payload), null, 2));
      } else {
        const record = appendHumanDecision(payload);
        console.log(JSON.stringify({ appended: true, recordId: record.recordId, candidateId: record.candidateId, decision: record.decision, recordSequence: record.recordSequence }, null, 2));
      }
    } catch (error) {
      console.error(`Human review decision ${action} failed: ${error.message}`);
      process.exitCode = 1;
    }
  }
}
