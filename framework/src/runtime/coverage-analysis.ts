import type { BaselineInventory, CoverageGap, EvidenceReference } from "../contracts.js";

export interface SourceBehaviorClaim {
  behaviorId: string;
  behavior: string;
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
  disposition: "COVERED" | "CANDIDATE_GAP" | "HISTORICAL_OVERLAP" | "INSUFFICIENT_EVIDENCE";
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
    if (!claim.behaviorId.trim() || !claim.behavior.trim() || !claim.evidenceSummary.trim() || references.length === 0 || references.some((ref) => !sourcePinMatches(ref)) || duplicate) {
      return { behaviorId: claim.behaviorId, disposition: "INSUFFICIENT_EVIDENCE", sourceReferences: references, rationale: duplicate ? "Duplicate behavior ID requires adjudication." : "Source claim lacks complete, source-pinned evidence; no gap inferred." };
    }
    if (baselineIds.has(claim.behaviorId)) return { behaviorId: claim.behaviorId, disposition: "COVERED", sourceReferences: references, rationale: "Explicit behavior ID is mapped to an existing baseline case." };
    if (historicIds.has(claim.behaviorId)) return { behaviorId: claim.behaviorId, disposition: "HISTORICAL_OVERLAP", sourceReferences: references, rationale: "Explicit behavior ID overlaps a historical proposal; novelty requires review." };
    const rationale = `Pinned source evidence supports this behavior (${claim.evidenceSummary}); no exact behavior-ID mapping exists in the supplied baseline inventory. This is only a candidate gap, not a novelty decision.`;
    const gap: CoverageGap = { gapId: `gap-${claim.behaviorId}`, appId: baseline.appId, sourceCommit: baseline.sourceCommit, sourceVersion: baseline.sourceVersion, behavior: claim.behavior, rationale, sourceReferences: references };
    return { behaviorId: claim.behaviorId, disposition: "CANDIDATE_GAP", sourceReferences: references, rationale, gap };
  });
}
