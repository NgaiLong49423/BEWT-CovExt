import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
import type { BaselineInventory, CandidateScenario } from "../contracts.js";
import { parseCandidateScenario } from "../contracts.js";

const CandidateOutput = z.object({
  gherkin: z.string().min(1).max(8_000),
  preconditions: z.array(z.string().min(1)).min(1).max(20),
  oracle: z.array(z.string().min(1)).min(1).max(20),
  noveltyRationale: z.string().min(20).max(2_000),
}).strict();

/** Gemini is opt-in: constructing this provider never sends a request. */
export class GeminiCandidateProvider {
  private readonly model: { invoke(input: string): Promise<z.infer<typeof CandidateOutput>> };

  constructor(modelName: string, apiKey = process.env.GEMINI_API_KEY) {
    if (!apiKey) throw new Error("GEMINI_API_KEY is required only when the Gemini provider is explicitly selected");
    this.model = new ChatGoogleGenerativeAI({ model: modelName, apiKey, temperature: 0 })
      .withStructuredOutput(CandidateOutput) as unknown as { invoke(input: string): Promise<z.infer<typeof CandidateOutput>> };
  }

  async propose(baseline: BaselineInventory, candidateId: string, revision: number): Promise<CandidateScenario> {
    const generated = await this.model.invoke([
      "Create one browser-test candidate grounded only in the supplied baseline inventory.",
      "Return valid Gherkin text, concrete preconditions, observable oracle assertions, and a cautious novelty rationale.",
      "Do not claim novelty as verified; do not invent source facts or evidence references.",
      JSON.stringify({ appId: baseline.appId, sourceCommit: baseline.sourceCommit, sourceVersion: baseline.sourceVersion, baseline }),
    ].join("\n\n"));
    return parseCandidateScenario({
      ...generated,
      candidateId, revision,
      appId: baseline.appId, sourceCommit: baseline.sourceCommit, sourceVersion: baseline.sourceVersion,
      sourceReferences: baseline.cases.flatMap((item) => item.sourceReferences).slice(0, 20),
      reviewStatus: "PROPOSED",
    });
  }
}
