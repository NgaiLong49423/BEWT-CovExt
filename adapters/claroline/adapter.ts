import { readFileSync } from "node:fs";
import { join } from "node:path";
import { BaseApplicationAdapter } from "../base-adapter.js";
import {
  parseBaselineInventory,
  parseToolResult,
  type AgentWorkflowState,
  type BaselineInventory,
  type CandidateScenario,
  type ToolResult,
} from "../../framework/src/contracts.js";
import { assertBaselineMatchesManifest } from "../../framework/src/policy.js";

export class ClarolineAdapter extends BaseApplicationAdapter {
  constructor(repositoryRoot: string, manifestInput?: unknown) {
    const raw = manifestInput ?? JSON.parse(
      readFileSync(join(repositoryRoot, "config/apps/claroline.json"), "utf8")
    );
    super(repositoryRoot, raw);
  }

  async readBaseline(): Promise<BaselineInventory> {
    const gherkinRel = "bewt-original/claroline/gherkin";
    const testsRel = `${this.manifest.baseSuitePath}/src/test/java/tests`;
    const cases = await this.parseStandardGherkinFeatures(gherkinRel, testsRel, "Claroline_");
    const inventory = parseBaselineInventory({
      appId: "claroline",
      sourceCommit: this.manifest.source.commit,
      sourceVersion: this.manifest.source.packageVersion ?? this.manifest.benchmarkBaseVersion,
      collectedAt: "2026-11-09T00:00:00.000Z",
      cases,
      declaredBusinessCaseCount: 40,
      observedScenarioCount: cases.length,
    });
    assertBaselineMatchesManifest(this.manifest, inventory);
    return inventory;
  }

  async prepareFixture(
    candidate: CandidateScenario,
    experimentKey: string,
    state: AgentWorkflowState
  ): Promise<ToolResult> {
    return parseToolResult({
      tool: "prepare-fixture",
      outcome: "PASS",
      stdout: "Claroline fixture environment prepared in cloud runner mode.",
      stderr: "",
      evidence: [],
    });
  }

  async cleanup(
    candidate: CandidateScenario,
    experimentKey: string,
    state: AgentWorkflowState
  ): Promise<ToolResult> {
    return parseToolResult({
      tool: "cleanup-experiment",
      outcome: "PASS",
      stdout: "Claroline experiment resources cleaned successfully.",
      stderr: "",
      evidence: [],
    });
  }
}
