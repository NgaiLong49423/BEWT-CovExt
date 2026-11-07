# T01-A — Application Adapter Contract

Application-specific behavior is isolated behind an app adapter. The framework contract has no hard-coded selectors, URLs, seed values or app classes.

```ts
interface ApplicationAdapter {
  readonly manifest: ApplicationManifest;
  readBaseline(): Promise<BaselineInventory>;
  prepareFixture(candidate: CandidateScenario, experimentKey: string): Promise<ToolResult>;
  compile(candidate: CandidateScenario): Promise<ToolResult>;
  runSelenium(candidate: CandidateScenario, generatedArtifact: GeneratedJavaArtifact): Promise<ToolResult>;
  collectEvidence(runId: string): Promise<EvidenceReference[]>;
  cleanup(candidate: CandidateScenario, experimentKey: string): Promise<ToolResult>;
}
```

## Invariants

- Verify app ID, source commit, benchmark version, Base suite path, runtime pin and fixture ownership before work.
- Verify `readBaseline()` output with `assertBaselineMatchesManifest`; reject an inventory whose app/source pin differs from the adapter manifest.
- Preserve declared business-case count separately from the observed Gherkin scenario count; each mapped case needs source references.
- Fixture preparation and cleanup operate only on the manifest experiment key and selected candidate. Destructive behavior requires a reviewed reset contract.
- Compile and E2E receive an approved candidate and use the manifest's exact `baseSuitePath`; Selenium additionally receives a host-registered generated artifact bound to candidate ID, revision, path and fully qualified test class. A dispatcher chooses fixed commands.
- Results retain app/source/candidate revision/run provenance. Cleanup failure is reported separately and cannot be swallowed.
- The same interface serves all eight apps. Differences belong in adapters/manifests, not ExpressCart branches in shared policy.

T01-B should implement one ExpressCart adapter for a reviewed vertical slice. The contract remains generic; the other seven adapters follow source/environment audit and G0 rollout.

The adapter signature is a contract only. T01-A has not verified generated file contents, class-to-source correspondence, filesystem realpath/symlink containment, or execution against Maven/Selenium. The T01-B dispatcher must register artifacts only after successful generation and verify the real file and class mapping immediately before execution.
