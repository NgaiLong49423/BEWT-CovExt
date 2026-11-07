import { createHash } from "node:crypto";
import type { CandidateScenario } from "../contracts.js";

export function candidateDirectoryId(candidateId: string): string { return createHash("sha256").update(candidateId).digest("hex").slice(0, 32); }
export function expectedGeneratedTestClass(candidate: CandidateScenario): string { return `T01C_${candidateDirectoryId(candidate.candidateId)}_R${candidate.revision}`; }
