import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  TOOL_NAMES,
  parseApplicationManifest,
  parseToolRequest,
  parseToolResult,
  type AgentWorkflowState,
  type ApplicationManifest,
  type CandidateScenario,
  type ToolName,
  type ToolRequest,
  type ToolResult,
} from "../contracts.js";
import { authorizeToolRequest, type ToolPolicyContext } from "../policy.js";
import { resolveContainedExistingPath, resolveContainedOutputPath } from "./safe-path.js";

export type ResolvedToolPaths = Partial<Record<"inventoryPath" | "artifactPath" | "manifestPath" | "outputPath" | "projectPath" | "generatedArtifactPath", string>>;

export interface FixedToolContext {
  repositoryRoot: string;
  manifest: ApplicationManifest;
  workflow: AgentWorkflowState;
  candidate?: CandidateScenario;
  allowedRoots: string[];
}

export type FixedToolImplementation = (request: ToolRequest, paths: ResolvedToolPaths) => Promise<ToolResult>;
export type FixedToolImplementations = Record<ToolName, FixedToolImplementation>;

/** Validates every caller request before invoking one statically bound implementation. */
export class FixedToolDispatcher {
  private readonly context: FixedToolContext;
  private readonly manifest: ApplicationManifest;

  constructor(context: FixedToolContext, private readonly implementations: FixedToolImplementations) {
    this.context = context;
    this.manifest = parseApplicationManifest(context.manifest);
    if (TOOL_NAMES.some((name) => typeof implementations[name] !== "function")) throw new Error("every allowlisted tool must have a fixed implementation");
  }

  async dispatch(input: unknown): Promise<ToolResult> {
    const request = parseToolRequest(input);
    const policyContext: ToolPolicyContext = {
      manifest: this.manifest,
      state: this.context.workflow,
      ...(this.context.candidate ? { candidate: this.context.candidate } : {}),
      allowedRoots: this.context.allowedRoots,
    };
    const authorized = authorizeToolRequest(request, policyContext);
    const paths = await this.resolvePaths(authorized);
    if (authorized.tool === "run-selenium-test") await this.assertArtifactHash(authorized, paths.generatedArtifactPath!);
    const result = parseToolResult(await this.implementations[authorized.tool](authorized, paths));
    if (result.tool !== authorized.tool) throw new Error("tool implementation returned a result for a different tool");
    return result;
  }

  private async resolvePaths(request: ToolRequest): Promise<ResolvedToolPaths> {
    const fields = ["inventoryPath", "artifactPath", "manifestPath", "outputPath", "projectPath", "generatedArtifactPath"] as const;
    const resolved: ResolvedToolPaths = {};
    const requestValues = request as unknown as Record<string, unknown>;
    for (const field of fields) {
      const value = requestValues[field];
      if (typeof value !== "string") continue;
      const absolute = field === "outputPath"
        ? await resolveContainedOutputPath(this.context.repositoryRoot, value)
        : await resolveContainedExistingPath(this.context.repositoryRoot, value);
      const relativeToRepository = resolve(this.context.repositoryRoot, value);
      const observedPath = resolve(absolute);
      const expectedPath = resolve(relativeToRepository);
      if ((process.platform === "win32" ? observedPath.toLowerCase() : observedPath) !== (process.platform === "win32" ? expectedPath.toLowerCase() : expectedPath)) throw new Error(`resolved ${field} path does not match the approved repository path`);
      resolved[field] = absolute;
    }
    return resolved;
  }

  private async assertArtifactHash(request: Extract<ToolRequest, { tool: "run-selenium-test" }>, absoluteArtifactPath: string): Promise<void> {
    const registered = this.context.workflow.artifacts.find((item) => item.kind === "generated_java"
      && item.path === request.generatedArtifactPath
      && item.candidateId === request.candidateId
      && item.revision === request.revision
      && item.testClass === request.testClass);
    if (!registered?.sha256) throw new Error("registered Selenium artifact must include its content SHA-256");
    const observed = createHash("sha256").update(await readFile(absoluteArtifactPath)).digest("hex");
    if (observed !== registered.sha256) throw new Error("Selenium artifact content no longer matches its registered SHA-256");
  }
}
