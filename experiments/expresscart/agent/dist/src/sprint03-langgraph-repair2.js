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
const sourceRoot = path.join(repoRoot, "experiments/expresscart/source");
const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const cases = [
    { id: "EC-C02", name: "EmptyCartTest", need: "Add an explicit assertion that a fresh browser cart count is zero before adding the product; preserve the exact notification and hidden-button assertions.", evidence: ["BaseTest.goToHome() uses appUrl.", "TopNavBar has getCartCount().", "Cart count element is #cart-count.", "Cart button is #empty-cart; empty state #cart-empty; notification #notify_message exact text Cart successfully emptied.", "Use cart template empty-cart branch and confirm via Bootbox UI."] },
    { id: "EC-C01", name: "RemoveDiscountCodeTest", need: "Remove reflection and guessed base URL fallback. Use inherited BaseTest.appUrl exactly, navigating with driver.get(appUrl + '/checkout/payment'); preserve the fail-fast missing test.discount.code fixture precondition and all discount-removal assertions.", evidence: ["BaseTest declares public String appUrl = System.getProperty('expresscart.baseUrl', 'http://127.0.0.1:3111').", "Payment template: #discountCode, #addDiscountCode, #removeDiscountCode, #discount-amount, #total-cart-amount.", "Removal is a browser UI click and server route clears session discount/recalculates.", "Initial cart/payment/discount are Gherkin preconditions; if absent, fail before acting."] },
    { id: "EC-C05", name: "CreateStaticPageTest", need: "Repair cleanup identity: the admin pages template displays pageName in each li.list-group-item, not pageSlug. Locate the exact row using the unique pageName, click its #btnPageDelete UI button, confirm Bootbox, then assert that unique pageName is absent. Cleanup must run after save submission even if the success-notification wait fails.", evidence: ["views/settings-pages.hbs renders <li class='list-group-item'> and {{pageName}}; delete control is button id btnPageDelete with data-id.", "admin.js handles #btnPageDelete via bootbox.confirm and AJAX; use the visible UI controls, no HTTP call.", "settings-page.hbs form fields #pageName #pageSlug #pageEnabled, content #pageContent enhanced by Summernote, save #btnPageUpdate.", "Public route is /{pageSlug}; enabled query uses pageEnabled string 'true' and response title is pageName.", "Use unique pageName and pageSlug and never log credential values."] },
];
const RepairSchema = z.object({ className: z.string(), source: z.string().min(300), repairSummary: z.array(z.string()), assumptions: z.array(z.string()) });
const State = Annotation.Root({ ids: Annotation(), done: Annotation(), status: Annotation() });
function readSource(relative) { return fs.readFileSync(path.join(sourceRoot, relative), "utf8"); }
async function main() {
    const model = new ChatGoogleGenerativeAI({ model: modelName, temperature: 0, maxRetries: 1 });
    const structured = model.withStructuredOutput(RepairSchema, { name: "repair_langgraph_generated_selenium_behavior", includeRaw: true });
    const graph = new StateGraph(State)
        .addNode("repair_source_and_test_contract", async (state) => {
        const done = [];
        for (const testCase of cases) {
            const generatedPath = path.join(artifacts, `${testCase.name}.java`);
            const currentSource = fs.readFileSync(generatedPath, "utf8");
            const gherkinFile = { "EC-C02": "EC-C02-empty-cart.feature", "EC-C01": "EC-C01-discount-removal.feature", "EC-C05": "EC-C05-static-page.feature" }[testCase.id];
            const featurePath = `docs/research-results/sprint-02/revised/${gherkinFile}`;
            const gherkin = fs.readFileSync(path.join(repoRoot, featurePath), "utf8");
            const system = [
                "This is the final allowed repair iteration (iteration 2 of maximum 2) for a Gemini Java Selenium test generated inside LangGraph.",
                "Return the complete corrected class; do not change the Gherkin expected behavior or remove/weaken assertions. Apply only the source-verified contract corrections requested.",
                "Package tests, class name unchanged, extend BaseTest. Its URL field is appUrl. The Page Object package is po.",
                "Every tested When behavior must remain browser UI. No HTTP or database shortcuts. Do not add secrets or invented selectors.",
                "For created data, teardown must use the application UI and target only unique test data; a cleanup failure must fail the test.",
            ].join(" ");
            let evidence = {};
            if (testCase.id === "EC-C02")
                evidence = {
                    baseTest: fs.readFileSync(path.join(repoRoot, "experiments/expresscart/bewt-suite/src/test/java/tests/BaseTest.java"), "utf8"),
                    nav: fs.readFileSync(path.join(repoRoot, "experiments/expresscart/bewt-suite/src/main/java/po/TopNavBar.java"), "utf8"),
                    cart: readSource("views/themes/Cloth/checkout-cart.hbs"),
                    layout: readSource("views/layouts/layout.hbs").split("\n").slice(228, 260).join("\n"),
                };
            if (testCase.id === "EC-C01")
                evidence = {
                    baseTest: fs.readFileSync(path.join(repoRoot, "experiments/expresscart/bewt-suite/src/test/java/tests/BaseTest.java"), "utf8"),
                    paymentTemplate: readSource("views/themes/Cloth/checkout-payment.hbs"),
                    route: readSource("routes/index.js").split("\n").slice(385, 410).join("\n"),
                };
            if (testCase.id === "EC-C05")
                evidence = {
                    listTemplate: readSource("views/settings-pages.hbs"),
                    editorTemplate: readSource("views/settings-page.hbs"),
                    adminScript: readSource("public/javascripts/admin.js").split("\n").slice(606, 630).join("\n"),
                    publicRoute: readSource("routes/index.js").split("\n").slice(1158, 1178).join("\n"),
                };
            const human = JSON.stringify({ candidateId: testCase.id, gherkinPath: featurePath, gherkin, requiredCorrections: testCase.need, pinnedSourceFacts: testCase.evidence, exactSourceSnippets: evidence, currentGeneratedJava: currentSource }, null, 2);
            fs.writeFileSync(path.join(artifacts, `${testCase.id}.repair-2.prompt.json`), `${JSON.stringify({ model: modelName, temperature: 0, system, human }, null, 2)}\n`, "utf8");
            const response = await structured.invoke([["system", system], ["human", human]]);
            if (!response.parsed)
                throw new Error(`${testCase.id}: structured repair response missing`);
            const parsed = RepairSchema.parse(response.parsed);
            if (parsed.className !== testCase.name || !parsed.source.startsWith("package tests;") || !parsed.source.includes(`class ${testCase.name}`))
                throw new Error(`${testCase.id}: repaired class mismatch`);
            const usage = response.raw?.usage_metadata ?? {};
            fs.writeFileSync(path.join(artifacts, `${testCase.id}.repair-2.response.json`), `${JSON.stringify({ ...parsed, candidateId: testCase.id, model: modelName, usageMetadata: usage, apiKeyRecorded: false }, null, 2)}\n`, "utf8");
            fs.writeFileSync(generatedPath, `${parsed.source.trim()}\n`, "utf8");
            fs.writeFileSync(path.join(suite, `${testCase.name}.java`), `${parsed.source.trim()}\n`, "utf8");
            done.push(testCase.id);
        }
        return { ...state, done, status: "REPAIRED" };
    })
        .addNode("record_repair", (state) => {
        fs.writeFileSync(path.join(root, "langgraph-repair-history.json"), `${JSON.stringify({ executedInsideLangGraph: true, maxIterationsPerCandidate: 2, iteration1: { candidates: ["EC-C04", "EC-C05"], reason: "Actual Maven compile errors: BaseTest/admin login API mismatch", result: "Maven test-compile passed." }, iteration2: { candidates: state.done, reason: "Source/Gherkin fidelity review", result: "Final compile and E2E recorded separately; no pass implied." }, model: modelName, secretsRecorded: false }, null, 2)}\n`, "utf8");
        return { ...state, status: "REPAIRED" };
    })
        .addEdge(START, "repair_source_and_test_contract")
        .addEdge("repair_source_and_test_contract", "record_repair")
        .addEdge("record_repair", END)
        .compile();
    const result = await graph.invoke({ ids: cases.map((entry) => entry.id), done: [], status: "STARTED" });
    console.log(JSON.stringify({ status: result.status, repairedCandidates: result.done, model: modelName, LLMCallsInsideLangGraphNode: true }, null, 2));
}
main().catch((error) => { const message = error instanceof Error ? error.message : "unknown"; fs.writeFileSync(path.join(root, "langgraph-repair2-failure.json"), `${JSON.stringify({ category: "MODEL_REPAIR_FAILED", message, secretsRecorded: false }, null, 2)}\n`, "utf8"); console.error(`LangGraph repair 2 failed: ${message}`); process.exitCode = 1; });
