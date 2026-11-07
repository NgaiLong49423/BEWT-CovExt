import type { BaselineInventory, CoverageGap, EvidenceReference } from "../contracts.js";

export interface SourceBehaviorClaim {
  behaviorId: string;
  behavior: string;
  behavioralCategory: string;
  sourceReferences: EvidenceReference[];
  evidenceSummary: string;
}
export interface CoverageAnalysisInput {
  baseline: BaselineInventory;
  sourceClaims: SourceBehaviorClaim[];
  /** Explicit behavior IDs from historic proposals; overlap is surfaced, never inferred away. */
  historicalProposalBehaviorIds: string[];
}
export interface CoverageAnalysisResult {
  behaviorId: string;
  behavioralCategory: string;
  disposition: "COVERED" | "CANDIDATE_GAP" | "HISTORICAL_OVERLAP" | "INSUFFICIENT_EVIDENCE";
  baselineComparison: "EXACT_BEHAVIOR_TAG_MATCH" | "NO_EXACT_BEHAVIOR_TAG_MATCH" | "NOT_ASSESSED";
  candidateConfidence: "LOW" | "UNASSESSED";
  uncertainties: string[];
  sourceReferences: EvidenceReference[];
  rationale: string;
  gap?: CoverageGap;
}

/**
 * Compares explicit, source-backed behavior IDs with baseline tags and historical proposal IDs.
 * It intentionally does not use title similarity as novelty or coverage evidence.
 */
export function analyzeSourceBackedCoverage(input: CoverageAnalysisInput): CoverageAnalysisResult[] {
  const { baseline } = input;
  const sourcePinMatches = (ref: EvidenceReference) => ref.repositoryCommit === baseline.sourceCommit && ref.sourceVersion === baseline.sourceVersion;
  const baselineIds = new Set(baseline.cases.flatMap((item) => item.behaviorTags));
  const historicIds = new Set(input.historicalProposalBehaviorIds);
  const seen = new Set<string>();
  return input.sourceClaims.map((claim) => {
    const references = [...new Map(claim.sourceReferences.map((ref) => [`${ref.runId}:${ref.artifactPath}`, ref])).values()];
    const duplicate = seen.has(claim.behaviorId);
    seen.add(claim.behaviorId);
    const base = { behaviorId: claim.behaviorId, behavioralCategory: claim.behavioralCategory || "UNCLASSIFIED" };
    if (!claim.behaviorId.trim() || !claim.behavior.trim() || !claim.behavioralCategory.trim() || !claim.evidenceSummary.trim() || references.length === 0 || references.some((ref) => !sourcePinMatches(ref)) || duplicate) {
      return { ...base, disposition: "INSUFFICIENT_EVIDENCE", baselineComparison: "NOT_ASSESSED", candidateConfidence: "UNASSESSED", uncertainties: ["Source evidence is incomplete or duplicated; no coverage conclusion is drawn."], sourceReferences: references, rationale: duplicate ? "Duplicate behavior ID requires adjudication." : "Source claim lacks complete, source-pinned evidence; no gap inferred." };
    }
    if (baselineIds.has(claim.behaviorId)) return { ...base, disposition: "COVERED", baselineComparison: "EXACT_BEHAVIOR_TAG_MATCH", candidateConfidence: "UNASSESSED", uncertainties: [], sourceReferences: references, rationale: "Explicit behavior ID is mapped to an existing baseline case." };
    if (historicIds.has(claim.behaviorId)) return { ...base, disposition: "HISTORICAL_OVERLAP", baselineComparison: "NO_EXACT_BEHAVIOR_TAG_MATCH", candidateConfidence: "LOW", uncertainties: ["Historical proposal overlap requires semantic review; tag absence does not establish novelty."], sourceReferences: references, rationale: "Explicit behavior ID overlaps a historical proposal; novelty requires review." };
    const rationale = `Pinned source evidence supports this behavior (${claim.evidenceSummary}); no exact behavior-ID mapping exists in the supplied baseline inventory. This is only a candidate gap, not a novelty decision.`;
    const gap: CoverageGap = { gapId: `gap-${claim.behaviorId}`, appId: baseline.appId, sourceCommit: baseline.sourceCommit, sourceVersion: baseline.sourceVersion, behavior: claim.behavior, rationale, sourceReferences: references };
    return { ...base, disposition: "CANDIDATE_GAP", baselineComparison: "NO_EXACT_BEHAVIOR_TAG_MATCH", candidateConfidence: "LOW", uncertainties: ["Baseline comparison is exact-tag only; semantically equivalent behavior may exist under another tag or no tag.", "Novelty and oracle are not independently reviewed."], sourceReferences: references, rationale, gap };
  });
}
