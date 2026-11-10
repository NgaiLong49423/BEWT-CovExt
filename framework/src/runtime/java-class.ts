import { createHash } from "node:crypto";
import type { CandidateScenario } from "../contracts.js";

export function candidateDirectoryId(candidateId: string): string { return createHash("sha256").update(candidateId).digest("hex").slice(0, 32); }
export function expectedGeneratedTestClass(candidate: CandidateScenario): string { return `T01C_${candidateDirectoryId(candidate.candidateId)}_R${candidate.revision}`; }

export function getAppTestPackage(appId: string): string {
  switch (appId) {
    case "claroline": return "test";
    case "joomla":
    case "mantisbt": return "base";
    case "mediawiki": return "mediawiki";
    default: return "tests";
  }
}

