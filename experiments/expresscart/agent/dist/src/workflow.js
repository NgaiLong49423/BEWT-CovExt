import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { collectBaseline } from "./collector.js";
import { CandidateSetSchema } from "./schema.js";
import { checkCandidates } from "./validate.js";
const State = Annotation.Root({
    runId: Annotation(),
    baseline: Annotation(),
    candidates: Annotation(),
    status: Annotation(),
    model: Annotation(),
    usage: Annotation(),
    error: Annotation(),
});
const resultRoot = path.resolve(import.meta.dirname, "../../../../docs/research-results/sprint-01");
const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const systemPrompt = [
    "You are proposing testable behavioral coverage gaps for the pinned ExpressCart application.",
    "Produce exactly five candidate scenarios as JSON matching the schema.",
    "Only use feature behavior grounded in the supplied route hints and BEWT baseline summaries.",
    "Do not repeat a baseline scenario. Prefer distinct boundary, validation, state-transition, authorization, or persistence behaviors.",
    "Use concrete browser-observable outcomes. Do not invent routes or selectors.",
    "Do not provide code, shell commands, secrets, or user data.",
    "Every candidate needs sourceEvidence that includes an exact route path, test class, or feature filename from the supplied summary.",
].join(" ");
function writeRequestArtifact(dir) {
    fs.writeFileSync(path.join(dir, "agent-request.json"), `${JSON.stringify({
        model: modelName,
        temperature: 0,
        outputSchema: "CandidateSetSchema: exactly five candidates",
        systemPrompt,
        humanInputArtifact: "baseline-sanitized.json",
        apiKeyIncluded: false,
    }, null, 2)}\n`, "utf8");
}
function persist(state, extra = {}) {
    const dir = path.join(resultRoot, "runs", state.runId);
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, "manifest.json"), `${JSON.stringify({
        runId: state.runId,
        status: state.status,
        sourceCommit: "b31302f4e99c3293bd742c6d076a721e168118b0",
        applicationVersion: "1.1.19",
        model: state.model,
        modelUsage: state.usage,
        apiRequestAttempted: Boolean(process.env.GEMINI_API_KEY?.trim()),
        failureCategory: state.error || null,
        startedAt: state.runId,
        apiKeyRecorded: false,
        ...extra,
    }, null, 2)}\n`, "utf8");
    return dir;
}
const graph = new StateGraph(State)
    .addNode("collect", async (state) => {
    const baseline = collectBaseline();
    const next = { ...state, baseline, status: "INPUT_COLLECTED" };
    const dir = persist(next);
    fs.writeFileSync(path.join(dir, "baseline-sanitized.json"), `${JSON.stringify(baseline, null, 2)}\n`, "utf8");
    writeRequestArtifact(dir);
    return next;
})
    .addNode("propose", async (state) => {
    if (!process.env.GEMINI_API_KEY?.trim()) {
        return { ...state, status: "BLOCKED", error: "GEMINI_API_KEY is not configured" };
    }
    try {
        const model = new ChatGoogleGenerativeAI({ model: modelName, temperature: 0, maxRetries: 1 });
        const structured = model.withStructuredOutput(CandidateSetSchema, { name: "expresscart_coverage_candidates", includeRaw: true });
        const modelResult = await structured.invoke([
            ["system", systemPrompt],
            ["human", JSON.stringify(state.baseline)],
        ]);
        const response = modelResult.parsed;
        if (!response)
            throw new Error("Structured output parser returned no parsed result");
        const candidates = checkCandidates(response, state.baseline);
        const usage = modelResult.raw?.usage_metadata ?? {};
        return { ...state, candidates, status: "AWAITING_HUMAN_REVIEW", usage, error: "" };
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown model/validation error";
        if (/API_KEY_INVALID|API key not valid/i.test(message)) {
            return { ...state, status: "BLOCKED", error: "GEMINI_API_KEY_REJECTED" };
        }
        const httpStatus = message.match(/\[(\d{3})\s/)?.[1];
        const category = httpStatus ? `GEMINI_HTTP_${httpStatus}` : /schema|structured|zod/i.test(message)
            ? "MODEL_OUTPUT_SCHEMA_REJECTED"
            : "MODEL_REQUEST_OR_OUTPUT_VALIDATION_ERROR";
        return { ...state, status: "FAIL", error: category };
    }
})
    .addNode("record", async (state) => {
    const dir = persist(state, {
        candidateCount: state.candidates.length,
        syntaxValidCount: state.candidates.filter((c) => c.syntaxValid).length,
        duplicateHintCount: state.candidates.filter((c) => c.duplicateHint).length,
        sourceEvidenceVerifiedCount: state.candidates.filter((c) => c.sourceEvidenceVerified).length,
        humanAcceptedCount: null,
        javaCompileCount: null,
        execution: "NOT_RUN",
    });
    fs.writeFileSync(path.join(dir, "candidates.json"), `${JSON.stringify(state.candidates, null, 2)}\n`, "utf8");
    writeRequestArtifact(dir);
    fs.writeFileSync(path.join(dir, "human-review.json"), `${JSON.stringify({
        status: state.candidates.length > 0 ? "PENDING" : "NOT_AVAILABLE",
        instruction: "A human reviewer must inspect candidates, baseline distinctness, evidence, and expected behavior. Record reviewer identity and rationale before generating Selenium code.",
        acceptedIds: [],
        reviewer: null,
        rationale: null,
    }, null, 2)}\n`, "utf8");
    return state;
})
    .addEdge(START, "collect")
    .addEdge("collect", "propose")
    .addEdge("propose", "record")
    .addEdge("record", END)
    .compile();
export async function runAgent() {
    const initial = {
        runId: new Date().toISOString().replaceAll(/[:.]/g, "-") + "-" + randomUUID().slice(0, 8),
        baseline: {}, candidates: [], status: "STARTED", model: modelName, usage: {}, error: "",
    };
    const state = await graph.invoke(initial);
    const dir = path.join(resultRoot, "runs", state.runId);
    console.log(JSON.stringify({
        runId: state.runId,
        status: state.status,
        candidateCount: state.candidates.length,
        syntaxValidCount: state.candidates.filter((c) => c.syntaxValid).length,
        duplicateHintCount: state.candidates.filter((c) => c.duplicateHint).length,
        sourceEvidenceVerifiedCount: state.candidates.filter((c) => c.sourceEvidenceVerified).length,
        model: state.model,
        usage: state.usage,
        error: state.error || undefined,
        artifactDir: dir,
        humanAcceptedCount: null,
        execution: "NOT_RUN",
    }, null, 2));
    return state;
}
export function inspectBaseline() {
    const baseline = collectBaseline();
    console.log(JSON.stringify({
        baselineTests: baseline.tests.length,
        baselineFeatures: baseline.features.length,
        routeHints: baseline.routeHints.length,
        rawSourceIncluded: false,
        credentialsIncluded: false,
    }, null, 2));
}
export function revalidateRun(runId) {
    if (!/^[\dTZ:-]+-[a-f0-9]{8}$/.test(runId))
        throw new Error("Invalid run identifier");
    const dir = path.join(resultRoot, "runs", runId);
    const old = JSON.parse(fs.readFileSync(path.join(dir, "candidates.json"), "utf8"));
    const candidates = checkCandidates({ candidates: old.map((entry) => entry.candidate) }, collectBaseline());
    writeRequestArtifact(dir);
    fs.writeFileSync(path.join(dir, "candidates.json"), `${JSON.stringify(candidates, null, 2)}\n`, "utf8");
    const manifestFile = path.join(dir, "manifest.json");
    const manifest = JSON.parse(fs.readFileSync(manifestFile, "utf8"));
    Object.assign(manifest, {
        candidateCount: candidates.length,
        syntaxValidCount: candidates.filter((c) => c.syntaxValid).length,
        duplicateHintCount: candidates.filter((c) => c.duplicateHint).length,
        sourceEvidenceVerifiedCount: candidates.filter((c) => c.sourceEvidenceVerified).length,
    });
    fs.writeFileSync(manifestFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.log(JSON.stringify({
        runId, candidateCount: candidates.length,
        syntaxValidCount: candidates.filter((c) => c.syntaxValid).length,
        doubleKeywordCount: candidates.filter((c) => /(?:Given|When|Then|And|But)\s+(?:Given|When|Then|And|But)\s/.test(c.gherkin)).length,
        sourceEvidenceVerifiedCount: candidates.filter((c) => c.sourceEvidenceVerified).length,
    }, null, 2));
}
