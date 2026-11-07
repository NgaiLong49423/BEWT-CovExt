import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
config({ path: path.resolve(import.meta.dirname, "../../.env"), override: true });
const repoRoot = path.resolve(import.meta.dirname, "../../../..");
const root = path.join(repoRoot, "docs/research-results/sprint-03");
const artifacts = path.join(root, "generation/langgraph-run");
const suite = path.join(repoRoot, "experiments/expresscart/bewt-suite/src/test/java/tests");
const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const sourceFiles = {
    CreateStaticPageTest: "CreateStaticPageTest.java",
    ForgottenPasswordTest: "ForgottenPasswordTest.java",
};
const RepairSchema = z.object({ className: z.string(), source: z.string().min(300), repairSummary: z.array(z.string()) });
const State = Annotation.Root({ classNames: Annotation(), repaired: Annotation(), status: Annotation() });
function read(relative) { return fs.readFileSync(path.join(repoRoot, relative), "utf8"); }
async function main() {
    const compileLog = fs.readFileSync(path.join(root, "compilation-langgraph-first-attempt.log"), "utf8");
    const model = new ChatGoogleGenerativeAI({ model: modelName, temperature: 0, maxRetries: 1 });
    const structured = model.withStructuredOutput(RepairSchema, { name: "repair_langgraph_generated_selenium_compile", includeRaw: true });
    fs.mkdirSync(artifacts, { recursive: true });
    const graph = new StateGraph(State)
        .addNode("repair_compile", async (state) => {
        const repaired = [];
        for (const className of state.classNames) {
            const sourceName = sourceFiles[className];
            if (!sourceName)
                continue;
            const errors = compileLog.split(/\r?\n/).filter((line) => line.includes(`${className}.java`));
            if (errors.length === 0)
                continue;
            const javaPath = path.join(artifacts, sourceName);
            const currentSource = fs.readFileSync(javaPath, "utf8");
            const system = [
                "This is repair iteration 1 of at most 2 for a LangGraph/Gemini-generated Java Selenium test.",
                "Return the entire corrected class. Fix only the supplied Maven compiler errors; preserve the candidate's UI steps and expected assertions.",
                "The tests package contains BaseTest with driver, appUrl, goToHome(), goToAdminHome(). There is no baseUrl property or getBaseUrl() method.",
                "AdminLoginPage is package po.AdminLoginPage and authenticates through setEmail(String), setPassword(String), and doLogin() returning AdminDashboardPage. It has no login(String,String) method.",
                "Do not weaken/remove assertions, invent Page Object methods, add secrets, or use HTTP/DB shortcuts for behavior. Browser navigation through WebDriver is allowed.",
            ].join(" ");
            const human = JSON.stringify({ candidateId: className, compileErrors: errors, currentGeneratedSource: currentSource, existingBaseTest: read("experiments/expresscart/bewt-suite/src/test/java/tests/BaseTest.java"), existingAdminLoginPage: read("experiments/expresscart/bewt-suite/src/main/java/po/AdminLoginPage.java"), existingAdminSidebar: read("experiments/expresscart/bewt-suite/src/main/java/po/AdminSidebar.java") }, null, 2);
            fs.writeFileSync(path.join(artifacts, `${className}.repair-1.prompt.json`), `${JSON.stringify({ model: modelName, temperature: 0, system, human }, null, 2)}\n`, "utf8");
            const response = await structured.invoke([["system", system], ["human", human]]);
            if (!response.parsed)
                throw new Error(`${className}: structured repair response missing`);
            const result = RepairSchema.parse(response.parsed);
            if (result.className !== className || !result.source.startsWith("package tests;") || !result.source.includes(`class ${className}`))
                throw new Error(`${className}: repaired source identity mismatch`);
            const usage = response.raw?.usage_metadata ?? {};
            fs.writeFileSync(path.join(artifacts, `${className}.repair-1.response.json`), `${JSON.stringify({ ...result, model: modelName, usageMetadata: usage, apiKeyRecorded: false }, null, 2)}\n`, "utf8");
            fs.writeFileSync(javaPath, `${result.source.trim()}\n`, "utf8");
            fs.writeFileSync(path.join(suite, sourceName), `${result.source.trim()}\n`, "utf8");
            repaired.push(className);
        }
        return { ...state, repaired, status: "REPAIRED" };
    })
        .addNode("record", (state) => {
        fs.writeFileSync(path.join(root, "langgraph-repair-history.json"), `${JSON.stringify({ iteration: 1, executedInsideLangGraph: true, classesRepaired: state.repaired, trigger: "Maven compile diagnostics for unavailable BaseTest/AdminLoginPage APIs", result: "Pending post-repair Maven compile", model: modelName, secretsRecorded: false }, null, 2)}\n`, "utf8");
        return { ...state, status: "REPAIRED" };
    })
        .addEdge(START, "repair_compile")
        .addEdge("repair_compile", "record")
        .addEdge("record", END)
        .compile();
    const result = await graph.invoke({ classNames: Object.keys(sourceFiles), repaired: [], status: "STARTED" });
    console.log(JSON.stringify({ status: result.status, repaired: result.repaired, model: modelName, LLMCallsInsideLangGraphNode: true }, null, 2));
}
main().catch((error) => { const message = error instanceof Error ? error.message : "unknown"; fs.writeFileSync(path.join(root, "langgraph-repair-failure.json"), `${JSON.stringify({ category: "MODEL_REPAIR_FAILED", message, secretsRecorded: false }, null, 2)}\n`, "utf8"); console.error(`LangGraph repair failed: ${message}`); process.exitCode = 1; });
