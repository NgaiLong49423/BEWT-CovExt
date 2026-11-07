import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

config({ path: path.resolve(import.meta.dirname, "../../.env"), override: true });
const repoRoot = path.resolve(import.meta.dirname, "../../../..");
const artifactDir = path.join(repoRoot, "docs/research-results/sprint-03");
const genDir = path.join(artifactDir, "generation");
const suiteDir = path.join(repoRoot, "experiments/expresscart/bewt-suite/src/test/java/tests");
const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const classes = ["EmptyCartTest", "ForgottenPasswordTest", "RemoveDiscountCodeTest", "CreateStaticPageTest"];
const RepairSchema = z.object({ className: z.string(), source: z.string().min(300), repairSummary: z.array(z.string()) });
const State = Annotation.Root({ classes: Annotation<string[]>(), repaired: Annotation<string[]>(), status: Annotation<string>() });

async function main() {
  const compileLog = fs.readFileSync(path.join(artifactDir, "compilation-first-attempt.log"), "utf8");
  const model = new ChatGoogleGenerativeAI({ model: modelName, temperature: 0, maxRetries: 1 });
  const structured = model.withStructuredOutput(RepairSchema, { name: "repair_java_compile_errors", includeRaw: true });
  const repaired: string[] = [];
  for (const className of classes) {
    const sourcePath = path.join(genDir, `${className}.java`);
    const originalSource = fs.readFileSync(sourcePath, "utf8");
    const relevantErrors = compileLog.split(/\r?\n/).filter((line) => line.includes(`${className}.java`) || /package pages does not exist/.test(line));
    if (relevantErrors.length === 0) continue;
    const system = [
      "Repair the AI-generated Java Selenium test only for the compile errors supplied.",
      "Return the full repaired Java class. Keep package tests, the same class and test purpose, assertions, and UI steps unchanged except where compilation requires a correction.",
      "The project Page Objects are in package po, not pages. BaseTest is in package tests and needs no import. Existing methods must be used with their actual signatures.",
      "Do not weaken or remove assertions, change expected behavior, add database/HTTP shortcuts, or introduce credentials. Do not invent new Page Object APIs. Use inline Selenium code if no existing Page Object method supports the Gherkin action.",
      "Only fix compile issues demonstrated in the error log; return complete Java source.",
    ].join(" ");
    const human = JSON.stringify({ className, compiler: "Maven test-compile, Java 21, Selenium 4.35.0, JUnit 4.12", compileErrors: relevantErrors, originalSource }, null, 2);
    fs.writeFileSync(path.join(genDir, `${className}.repair-1.prompt.json`), `${JSON.stringify({ model: modelName, temperature: 0, system, human }, null, 2)}\n`, "utf8");
    const response = await structured.invoke([["system", system], ["human", human]]);
    if (!response.parsed) throw new Error(`${className}: repair response was not parsed`);
    const parsed = RepairSchema.parse(response.parsed);
    if (parsed.className !== className || !parsed.source.includes(`class ${className}`) || !parsed.source.startsWith("package tests;")) throw new Error(`${className}: repaired class/package mismatch`);
    const usage = (response.raw as unknown as { usage_metadata?: Record<string, unknown> })?.usage_metadata ?? {};
    fs.writeFileSync(path.join(genDir, `${className}.repair-1.response.json`), `${JSON.stringify({ ...parsed, model: modelName, usageMetadata: usage, apiKeyRecorded: false }, null, 2)}\n`, "utf8");
    fs.writeFileSync(sourcePath, `${parsed.source.trim()}\n`, "utf8");
    fs.writeFileSync(path.join(suiteDir, `${className}.java`), `${parsed.source.trim()}\n`, "utf8");
    repaired.push(className);
  }
  const graph = new StateGraph(State)
    .addNode("record", (state) => {
      fs.writeFileSync(path.join(artifactDir, "repair-history.json"), `${JSON.stringify({ repairIteration: 1, reason: "First Maven test-compile attempt reported unresolved Page Object package imports and types.", classesRepaired: state.repaired, classesNotRepaired: classes.filter((name) => !state.repaired.includes(name)), model: modelName, secretsRecorded: false }, null, 2)}\n`, "utf8");
      return { ...state, status: "REPAIRED" };
    })
    .addEdge(START, "record")
    .addEdge("record", END)
    .compile();
  const result = await graph.invoke({ classes, repaired, status: "REPAIRED" });
  console.log(JSON.stringify({ status: result.status, classesRepaired: repaired, model: modelName }, null, 2));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : "unknown repair error";
  fs.writeFileSync(path.join(artifactDir, "repair-failure.json"), `${JSON.stringify({ iteration: 1, category: "MODEL_REPAIR_FAILED", message, secretsRecorded: false }, null, 2)}\n`, "utf8");
  console.error(`Sprint 03 repair failed: ${message}`);
  process.exitCode = 1;
});
