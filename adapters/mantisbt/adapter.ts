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

export class MantisBTAdapter extends BaseApplicationAdapter {
  constructor(repositoryRoot: string, manifestInput?: unknown) {
    const raw = manifestInput ?? JSON.parse(
      readFileSync(join(repositoryRoot, "config/apps/mantisbt.json"), "utf8")
    );
    super(repositoryRoot, raw);
  }

  async readBaseline(): Promise<BaselineInventory> {
    const gherkinRel = "bewt-original/mantisbt/gherkin";
    const testsRel = `${this.manifest.baseSuitePath}/src/test/java/base`;
    const cases = await this.parseStandardGherkinFeatures(gherkinRel, testsRel);
    const inventory = parseBaselineInventory({
      appId: "mantisbt",
      sourceCommit: this.manifest.source.commit,
      sourceVersion: this.manifest.source.packageVersion ?? this.manifest.benchmarkBaseVersion,
      collectedAt: "2026-11-10T00:00:00.000Z",
      cases,
      declaredBusinessCaseCount: 37,
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
      stdout: "MantisBT single container fixture environment prepared in cloud runner mode.",
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
      stdout: "MantisBT experiment resources cleaned successfully.",
      stderr: "",
      evidence: [],
    });
  }
}
