# ExpressCart Agent MVP

This isolated TypeScript project implements the first BEWT-CovExt workflow slice for the pinned ExpressCart source. It summarizes baseline tests without sending source literals or credentials to a model, asks Gemini to propose behavioral gaps and Gherkin candidates, validates syntax and lexical duplication, and pauses for a human reviewer before generating Selenium code.

## Run

From this directory:

```powershell
npm ci
npm run inspect
npm run build
npm test
npm run agent
```

`npm run agent` reads `../.env`. Set `GEMINI_API_KEY` there before running it. The model defaults to the pinned name `gemini-3.8-flash`; `GEMINI_MODEL` can override it. The API key is never copied to run artifacts or logs.

The agent writes artifacts under `../../../docs/research-results/sprint-01/runs/<run-id>/`. Candidates remain pending until a human records reviewer identity, rationale, and accepted IDs in `human-review.json`. No Java is generated or executed by this initial vertical slice; the next step is to build the code-generation and approved-execution gate after a reviewer selects a candidate. Maven invocations must remain fixed by the tool; the model cannot provide shell commands.

## Current limits

- The model call is blocked until a key is configured.
- A candidate is not considered novel or valid until a human reviewer approves its behavior, oracle, and distinctness from BEWT.
- Selenium execution depends on the live ExpressCart experiment and the project-local ChromeDriver path recorded in the run manifest.
- A compile or smoke-test result is evidence for that test only; it is not a claim about all 31 baseline cases.

## Sprint 03 Java Selenium generation

The approved Sprint 03 extension invokes the existing LangGraph and Gemini dependencies to generate Java classes for the four Team Lead accepted candidates. It checks the decision record before generation, saves each prompt, structured model response, usage metadata and Java source under `docs/research-results/sprint-03/generation/`, and copies candidate classes to the isolated `bewt-suite` Maven test source tree.

Run from this directory after the approved key is configured in `../.env`:

```powershell
npm exec -- tsx src/sprint03-generator.ts
npm exec -- tsx src/sprint03-langgraph-repair.ts
npm exec -- tsx src/sprint03-langgraph-repair2.ts
```

Generation and both repair scripts invoke Gemini inside LangGraph nodes. They are evidence-driven and limited to the two repair iterations used in this sprint. Review generated source and prompts before running Maven; Java test execution never runs shell commands supplied by the model. Do not store keys, passwords, or tokens in artifacts.
