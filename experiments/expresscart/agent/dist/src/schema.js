import { z } from "zod";
const singleLine = (min, max) => z.string().trim().min(min).max(max).refine((value) => !/[\r\n]/.test(value));
export const CandidateSchema = z.object({
    id: z.string().regex(/^EC-C\d{2}$/),
    title: singleLine(8, 120),
    rationale: singleLine(20, 600),
    feature: singleLine(1, 80),
    scenario: singleLine(10, 160),
    steps: z.array(singleLine(3, 240)).min(3).max(12),
    expectedBehavior: singleLine(10, 300),
    sourceEvidence: z.array(singleLine(1, 120)).min(1).max(5),
});
export const CandidateSetSchema = z.object({
    candidates: z.array(CandidateSchema).length(5),
});
export const ReviewSchema = z.object({
    acceptedIds: z.array(z.string().regex(/^EC-C\d{2}$/)),
    reviewer: z.string().min(2).max(80),
    rationale: z.string().min(5).max(500),
});
