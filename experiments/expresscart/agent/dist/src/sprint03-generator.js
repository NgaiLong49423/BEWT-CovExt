import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";
config({ path: path.resolve(import.meta.dirname, "../../.env"), override: true });
const repoRoot = path.resolve(import.meta.dirname, "../../../..");
const experimentRoot = path.join(repoRoot, "docs/research-results/sprint-03");
const suiteRoot = path.join(repoRoot, "experiments/expresscart/bewt-suite/src/test/java/tests");
const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const outputDir = path.join(experimentRoot, "generation/langgraph-run");
const classNames = {
    "EC-C02": "EmptyCartTest",
    "EC-C04": "ForgottenPasswordTest",
    "EC-C01": "RemoveDiscountCodeTest",
    "EC-C05": "CreateStaticPageTest",
};
const gherkinFiles = {
    "EC-C02": "EC-C02-empty-cart.feature",
    "EC-C04": "EC-C04-forgotten-password.feature",
    "EC-C01": "EC-C01-discount-removal.feature",
    "EC-C05": "EC-C05-static-page.feature",
};
const baselineComparison = {
    "EC-C02": "All 31 baseline cases reviewed; AddNewProdToCartTest adds a product but no baseline checks empty-cart behavior.",
    "EC-C04": "All 31 baseline cases reviewed; login cases exist but no forgotten-password flow is covered.",
    "EC-C01": "All 31 baseline cases reviewed; apply and delete discount cases exist but no checkout discount-removal flow is covered.",
    "EC-C05": "All 31 baseline cases reviewed; AddMenuTest is distinct and no static-page create/render case is covered.",
};
const constraints = {
    "EC-C02": [
        "Use BaseTest.goToHome() to navigate; do not call Home.goHome() before loading a page.",
        "Home.addToCart(int) is 1-based; use Home.addToCart(1) after verifying the first product link at //*[@id='container']/div/div[1]/div/div[1]/div/p/a.",
        "TopNavBar.openCart() opens /checkout/cart. Exact UI selectors: #empty-cart, .bootbox-accept, #cart-empty, #cart-count, #notify_message.",
        "Require exact visible notification text 'Cart successfully emptied'; do not make this assertion optional. Require #empty-cart hidden after clearing.",
    ],
    "EC-C04": [
        "Open exact route /customer/forgotten. Form is #customerForgotten, email field #email, submit button is within that form.",
        "Submit by clicking the form button. Do not send a direct HTTP request.",
        "Use the exact response text 'If your account exists, a password reset has been sent to your email' and assert visible #notify_message content.",
        "Use a unique absent email generated per run; this branch does not update the customer collection or send email.",
    ],
    "EC-C01": [
        "Initial cart/payment state and active discount are preconditions. Navigate in the browser to /checkout/payment and fail clearly if the Gherkin fixture is absent.",
        "Do not invent a coupon code. Read System.getProperty('test.discount.code') and fail the precondition if missing.",
        "Exact UI selectors: #discountCode, #addDiscountCode, #removeDiscountCode, #discount-amount, #total-cart-amount.",
        "Record #total-cart-amount before applying; click add and remove controls. Assert exact restoration within 0.01, empty field, and absence of #discount-amount.",
        "Existing Page Object package is po.*. PaymentPage.setDiscountCode(String) exists; no HTTP/database call for application behavior.",
    ],
    "EC-C05": [
        "Read admin fixture credentials only from process environment ADMIN_EMAIL and ADMIN_PASSWORD; never hardcode/log values.",
        "Use AdminLoginPage from package po, opened through BaseTest.goToAdminHome(). Static pages list is /admin/settings/pages; new form is /admin/settings/pages/new.",
        "Exact form selectors: #pageName, #pageSlug, #pageEnabled, visible Summernote editor .note-editable, save #btnPageUpdate, notification #notify_message.",
        "Use unique page name, slug, and body; interact with .note-editable using Selenium. Public static page route is /{pageSlug}; its document title is pageName.",
        "Save and delete through UI only. Teardown must run after save submission, delete only the unique page, and assert its unique slug is absent. Surface cleanup failure.",
    ],
};
const GeneratedSourceSchema = z.object({
    className: z.string().regex(/^[A-Z][A-Za-z0-9]*Test$/),
    packageName: z.string(),
    source: z.string().min(300),
    generationNotes: z.array(z.string()),
    assumptions: z.array(z.string()),
});
const State = Annotation.Root({
    candidateIds: Annotation(),
    completed: Annotation(),
    status: Annotation(),
    failure: Annotation(),
});
function readRepo(relative) {
    return fs.readFileSync(path.join(repoRoot, relative), "utf8");
}
const decisions = JSON.parse(readRepo("docs/research-results/sprint-02/human-review-decisions.json"));
const orderedCandidates = ["EC-C02", "EC-C04", "EC-C01", "EC-C05"];
if (decisions.reviewer !== "Team Lead" || orderedCandidates.some((id) => !decisions.acceptedIds.includes(id))) {
    throw new Error("Human decision gate does not accept the requested generation set");
}
fs.mkdirSync(outputDir, { recursive: true });
const model = new ChatGoogleGenerativeAI({ model: modelName, temperature: 0, maxRetries: 1 });
const structuredModel = model.withStructuredOutput(GeneratedSourceSchema, { name: "java_selenium_test_source", includeRaw: true });
const graph = new StateGraph(State)
    .addNode("generate_java", async (state) => {
    const completed = [];
    for (const candidateId of state.candidateIds) {
        const featurePath = `docs/research-results/sprint-02/revised/${gherkinFiles[candidateId]}`;
        const gherkin = readRepo(featurePath);
        const system = [
            "Generate one complete Java Selenium JUnit 4 class from the accepted Gherkin. The source returned here must be generated by this Gemini call.",
            "Package tests; extend the existing BaseTest. Use existing Page Objects/helpers in package po when suitable; inline Selenium actions only where helpers do not implement the accepted UI steps.",
            "Use browser UI for each Gherkin When action. Never use HTTP or DB to replace tested behavior. Do not alter expected outcomes or weaken assertions.",
            "Use the exact pinned routes, selectors, helpers, and constraints supplied. Do not invent test data, routes, or selectors. Fail preconditions clearly when required fixtures are missing.",
            "Use JUnit 4, Selenium 4.35.0, and Java 21-compatible syntax. Do not include credentials, secrets, shell commands, or unrelated cases.",
            "Implement robust UI cleanup where the Gherkin/test creates data. Report assumptions in the structured output.",
        ].join(" ");
        const human = JSON.stringify({
            candidateId,
            humanReviewer: decisions.reviewer,
            decision: "ACCEPT revised Gherkin for implementation; not E2E/novelty approval",
            gherkinPath: featurePath,
            gherkin,
            baselineComparison: baselineComparison[candidateId],
            existingPageObjectPackage: "po",
            acceptedSourceConstraints: constraints[candidateId],
            className: classNames[candidateId],
        }, null, 2);
        fs.writeFileSync(path.join(outputDir, `${candidateId}.prompt.json`), `${JSON.stringify({ model: modelName, temperature: 0, system, human }, null, 2)}\n`, "utf8");
        const result = await structuredModel.invoke([["system", system], ["human", human]]);
        if (!result.parsed)
            throw new Error(`${candidateId}: structured model output was empty`);
        const generated = GeneratedSourceSchema.parse(result.parsed);
        if (generated.packageName !== "tests" || generated.className !== classNames[candidateId] || !generated.source.includes(`class ${classNames[candidateId]}`)) {
            throw new Error(`${candidateId}: generated package/class failed traceability check`);
        }
        const usage = result.raw?.usage_metadata ?? {};
        const responsePath = path.join(outputDir, `${candidateId}.response.json`);
        fs.writeFileSync(responsePath, `${JSON.stringify({ ...generated, model: modelName, usageMetadata: usage, apiKeyRecorded: false }, null, 2)}\n`, "utf8");
        const sourcePath = path.join(outputDir, `${generated.className}.java`);
        fs.writeFileSync(sourcePath, `${generated.source.trim()}\n`, "utf8");
        fs.writeFileSync(path.join(suiteRoot, `${generated.className}.java`), `${generated.source.trim()}\n`, "utf8");
        completed.push(candidateId);
        fs.writeFileSync(path.join(outputDir, "generation-status.json"), `${JSON.stringify({ status: "IN_PROGRESS", execution: "LangGraph.generate_java -> Gemini structured output", completed, remaining: state.candidateIds.filter((id) => !completed.includes(id)), model: modelName, secretsRecorded: false }, null, 2)}\n`, "utf8");
    }
    return { ...state, completed, status: "GENERATED", failure: "" };
})
    .addNode("record_manifest", (state) => {
    fs.writeFileSync(path.join(outputDir, "generation-manifest.json"), `${JSON.stringify({ status: "GENERATED", execution: "LangGraph.generate_java -> Gemini structured output", candidateIds: state.completed, sourceDirectory: "../../../../experiments/expresscart/bewt-suite/src/test/java/tests", generatedAt: new Date().toISOString(), model: modelName, apiKeyRecorded: false }, null, 2)}\n`, "utf8");
    fs.writeFileSync(path.join(outputDir, "generation-status.json"), `${JSON.stringify({ status: "GENERATED", execution: "LangGraph.generate_java -> Gemini structured output", model: modelName, completed: state.completed, remaining: [], secretsRecorded: false }, null, 2)}\n`, "utf8");
    return { ...state, status: "GENERATED" };
})
    .addEdge(START, "generate_java")
    .addEdge("generate_java", "record_manifest")
    .addEdge("record_manifest", END)
    .compile();
graph.invoke({ candidateIds: orderedCandidates, completed: [], status: "STARTED", failure: "" }).then((result) => {
    console.log(JSON.stringify({ status: result.status, generatedCandidateIds: result.completed, model: modelName, artifactDirectory: outputDir, LLMCallsInsideLangGraphNode: true }, null, 2));
}).catch((error) => {
    const message = error instanceof Error ? error.message : "unknown model generation error";
    fs.writeFileSync(path.join(outputDir, "generation-failure.json"), `${JSON.stringify({ status: "FAILED_OR_BLOCKED", category: /API_KEY_INVALID|API key not valid/i.test(message) ? "GEMINI_API_KEY_REJECTED" : /fetch failed|ECONN|ENOTFOUND|EAI_AGAIN/i.test(message) ? "MODEL_NETWORK_UNAVAILABLE" : "MODEL_OUTPUT_OR_VALIDATION_FAILURE", message: message.replace(/key=[^&\\s]+/gi, "key=[REDACTED]"), completed: fs.existsSync(path.join(outputDir, "generation-status.json")) ? JSON.parse(fs.readFileSync(path.join(outputDir, "generation-status.json"), "utf8")).completed : [], secretsRecorded: false }, null, 2)}\n`, "utf8");
    console.error(`LangGraph Java generation failed: ${message.replace(/key=[^&\\s]+/gi, "key=[REDACTED]")}`);
    process.exitCode = 1;
});
