import { AstBuilder, GherkinClassicTokenMatcher, Parser } from "@cucumber/gherkin";
import { IdGenerator } from "@cucumber/messages";
import { CandidateSetSchema } from "./schema.js";
export function toGherkin(c) {
    return [
        `Feature: ${c.feature}`,
        `  # ${c.rationale}`,
        `  Scenario: ${c.scenario}`,
        ...c.steps.map((step, index) => {
            const existing = step.match(/^(Given|When|Then|And|But)\s+(.+)$/i);
            const keyword = existing?.[1] ?? (index === 0 ? "Given" : index === c.steps.length - 1 ? "Then" : "When");
            const body = existing?.[2] ?? step;
            return `    ${keyword[0]?.toUpperCase()}${keyword.slice(1).toLowerCase()} ${body}`;
        }),
        `    # Expected behavior: ${c.expectedBehavior}`,
    ].join("\n");
}
export function checkCandidates(raw, baseline) {
    const parsed = CandidateSetSchema.parse(raw);
    const ids = new Set();
    const features = baseline.features ?? [];
    const baselineScenarios = features.flatMap((feature) => feature.scenarios ?? []).map((s) => s.toLowerCase());
    const knownReferences = [
        ...(baseline.routeHints ?? []),
        ...((baseline.tests ?? []).map((t) => t.file.replace(/\.java$/, ""))),
        ...features.map((f) => f.file ?? ""),
    ].map((s) => s.toLowerCase()).filter(Boolean);
    const results = parsed.candidates.map((candidate) => {
        if (ids.has(candidate.id))
            throw new Error(`Duplicate candidate id: ${candidate.id}`);
        ids.add(candidate.id);
        const source = toGherkin(candidate);
        let syntaxValid = false;
        let syntaxError = "";
        try {
            const builder = new AstBuilder(IdGenerator.uuid());
            const parser = new Parser(builder, new GherkinClassicTokenMatcher());
            parser.parse(source);
            syntaxValid = true;
        }
        catch {
            syntaxError = "Gherkin parser rejected generated syntax";
        }
        const terms = new Set(candidate.scenario.toLowerCase().split(/[^a-z0-9]+/).filter((t) => t.length > 3));
        const duplicateHint = [...terms].some((termSet) => baselineScenarios.some((s) => {
            const baselineTerms = new Set(s.split(/[^a-z0-9]+/).filter((t) => t.length > 3));
            const union = new Set([...terms, ...baselineTerms]);
            return union.size > 0 && [...terms].filter((term) => baselineTerms.has(term)).length / union.size >= 0.65;
        }));
        const sourceEvidenceVerified = candidate.sourceEvidence.every((evidence) => knownReferences.some((ref) => evidence.toLowerCase().includes(ref) || ref.includes(evidence.toLowerCase())));
        return { candidate, gherkin: source, syntaxValid, syntaxError, duplicateHint, sourceEvidenceVerified };
    });
    return results;
}
