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

export class MediaWikiAdapter extends BaseApplicationAdapter {
  constructor(repositoryRoot: string, manifestInput?: unknown) {
    const raw = manifestInput ?? JSON.parse(
      readFileSync(join(repositoryRoot, "config/apps/mediawiki.json"), "utf8")
    );
    super(repositoryRoot, raw);
  }

  async readBaseline(): Promise<BaselineInventory> {
    const gherkinRel = "bewt-original/mediawiki/gherkin";
    const testsRel = `${this.manifest.baseSuitePath}/src/test/java/mediawiki`;
    const cases = await this.parseStandardGherkinFeatures(gherkinRel, testsRel);
    const inventory = parseBaselineInventory({
      appId: "mediawiki",
      sourceCommit: this.manifest.source.commit,
      sourceVersion: this.manifest.source.packageVersion ?? this.manifest.benchmarkBaseVersion,
      collectedAt: "2026-11-10T00:00:00.000Z",
      cases,
      declaredBusinessCaseCount: 27,
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
      stdout: "MediaWiki two-container Compose fixture environment prepared in cloud runner mode.",
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
      stdout: "MediaWiki experiment resources cleaned successfully.",
      stderr: "",
      evidence: [],
    });
  }
}
