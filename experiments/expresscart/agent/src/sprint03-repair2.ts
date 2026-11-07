import fs from "node:fs";
import path from "node:path";
import { config } from "dotenv";
import { Annotation, END, START, StateGraph } from "@langchain/langgraph";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { z } from "zod";

config({ path: path.resolve(import.meta.dirname, "../../.env"), override: true });
const repoRoot = path.resolve(import.meta.dirname, "../../../..");
const root = path.join(repoRoot, "docs/research-results/sprint-03");
const gen = path.join(root, "generation");
const suite = path.join(repoRoot, "experiments/expresscart/bewt-suite/src/test/java/tests");
const app = path.join(repoRoot, "experiments/expresscart/source");
const modelName = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const ClassResult = z.object({ className: z.string(), source: z.string().min(300), repairSummary: z.array(z.string()), assumptions: z.array(z.string()) });
const State = Annotation.Root({ ids: Annotation<string[]>(), done: Annotation<string[]>(), status: Annotation<string>() });
const entries = [
  { id: "EC-C02", name: "EmptyCartTest", facts: [
    "BaseTest.goToHome() calls driver.get(appUrl). Home.goHome() clicks the navbar menu link and requires an already loaded storefront. The current generated test incorrectly calls Home.goHome() first.",
    "Home.addToCart(int) uses a 1-based product index in its XPath; call addToCart(1) only after validating a published product exists.",
    "TopNavBar.openCart() clicks navigation; source layout links to /checkout/cart. The empty cart button selector is #empty-cart. The empty state selector is #cart-empty and text is exactly Cart empty. The button is inside an application bootbox.confirm flow; the confirm control uses .bootbox-accept. On the empty cart branch, the empty action button is not rendered.",
    "Use UI actions only. Add an item via existing Home.addToCart(1), open cart via TopNavBar.openCart(), click #empty-cart, accept .bootbox-accept, assert #cart-empty and cart-count 0. Do not assert a guessed toast selector/message if source does not expose it in DOM.",
  ] },
  { id: "EC-C04", name: "ForgottenPasswordTest", facts: [
    "GET route is /customer/forgotten. The form id is #customerForgotten, email input id #email, submit is its button.",
    "Form JavaScript sends the entered email by UI form handling to POST /customer/forgotten_action; test must click the button, not call endpoint directly.",
    "For an unregistered email, route response message is exactly: If your account exists, a password reset has been sent to your email. Assert the visible notification text without assuming unverified CSS class names; inspect source showNotification helper and use its real DOM selector if known.",
    "Use a fresh UUID email. No DB mutation and no email is sent for the absent-customer branch according to route behavior.",
  ] },
  { id: "EC-C01", name: "RemoveDiscountCodeTest", facts: [
    "Existing packages are po.*; Home extends MainNavBar extends TopNavBar. BaseTest.goToHome() loads the storefront. Do not call Home.goHome() on a blank WebDriver.",
    "Payment template controls: input#discountCode, button#addDiscountCode, button#removeDiscountCode. Total selector is #total-cart-amount. Discount amount selector is #discount-amount when amount > 0.",
    "Remove action is browser click #removeDiscountCode. The server then clears the session discount and recalculates totals. Use explicit wait for the discount row to disappear and total to return exactly to the recorded amount.",
    "Do not invent a discount code. Read system property test.discount.code and fail clearly if absent; environment fixture availability remains a precondition. Do not assert guessed alternative selectors or run a purchase/payment action.",
    "The candidate's Given says product/cart/payment state and active discount exist as test fixture. It is acceptable to fail precondition if this fixture is not available; don't bypass the candidate's tested click actions via HTTP/DB.",
  ] },
  { id: "EC-C05", name: "CreateStaticPageTest", facts: [
    "Use AdminLoginPage in package po. Existing admin email/password are environment variables ADMIN_EMAIL and ADMIN_PASSWORD; never print or hardcode their values.",
    "Admin page form route is /admin/settings/pages/new. Name #pageName, slug #pageSlug, checkbox #pageEnabled, content textarea #pageContent enhanced by Summernote with visible .note-editable, save button #btnPageUpdate.",
    "Admin list route is /admin/settings/pages. It renders each page as li.list-group-item with delete button #btnPageDelete and data-id; JS asks for bootbox confirmation then deletes via UI control. Cleanup must be attempted in finally and failures recorded, not silently swallowed.",
    "Public static pages resolve at /{pageSlug}, not /page/{pageSlug}; catch-all route queries pageEnabled string 'true' and sets browser title to pageName. Use UI navigation and assert title/body content.",
    "Use unique slug/name/content, interact with .note-editable (contenteditable) rather than hidden textarea, enable checkbox, and use actual #btnPageUpdate. If cleanup cannot complete, surface it as a test failure with context.",
  ] },
];

function read(rel: string) { return fs.readFileSync(path.join(repoRoot, rel), "utf8"); }
function source(rel: string) { return fs.readFileSync(path.join(app, rel), "utf8"); }

async function main() {
  const selenium = new ChatGoogleGenerativeAI({ model: modelName, temperature: 0, maxRetries: 1 });
  const llm = selenium.withStructuredOutput(ClassResult, { name: "repair_source_verified_selenium_test", includeRaw: true });
  const done: string[] = [];
  for (const item of entries) {
    const gherkinFile = `docs/research-results/sprint-02/revised/${({ "EC-C02": "EC-C02-empty-cart.feature", "EC-C04": "EC-C04-forgotten-password.feature", "EC-C01": "EC-C01-discount-removal.feature", "EC-C05": "EC-C05-static-page.feature" } as Record<string,string>)[item.id]}`;
    const evidence = item.id === "EC-C02"
      ? { baseTest: read("experiments/expresscart/bewt-suite/src/test/java/tests/BaseTest.java").split("\n").slice(88, 98).join("\n"), home: read("experiments/expresscart/bewt-suite/src/main/java/po/Home.java").split("\n").slice(20, 39).join("\n"), topNav: read("experiments/expresscart/bewt-suite/src/main/java/po/TopNavBar.java").split("\n").slice(26, 52).join("\n"), layout: source("views/layouts/layout.hbs").split("\n").slice(224, 258).join("\n"), cartTemplate: source("views/themes/Cloth/checkout-cart.hbs"), cartJs: source("public/javascripts/expressCart.js").split("\n").slice(490, 535).join("\n") }
      : item.id === "EC-C04"
        ? { form: source("views/forgotten.hbs"), route: source("routes/customer.js").split("\n").slice(489, 540).join("\n"), browserScript: source("public/javascripts/expressCart.js").split("\n").slice(127, 153).join("\n"), notificationHelper: source("public/javascripts/expressCart.js").split("\n").filter((line) => line.includes("function showNotification") || line.includes("showNotification =")).join("\n") }
        : item.id === "EC-C01"
          ? { paymentTemplate: source("views/themes/Cloth/checkout-payment.hbs"), removeScript: source("public/javascripts/expressCart.js").split("\n").slice(205, 227).join("\n"), removeRoute: source("routes/index.js").split("\n").slice(384, 412).join("\n"), pageObject: read("experiments/expresscart/bewt-suite/src/main/java/po/PaymentPage.java") }
          : { editorTemplate: source("views/settings-page.hbs"), listTemplate: source("views/settings-pages.hbs"), adminScript: source("public/javascripts/admin.js").split("\n").slice(584, 632).join("\n"), publicRoute: source("routes/index.js").split("\n").slice(1120, 1185).join("\n"), pageView: source("views/themes/Cloth/page.hbs") };
    const classPath = path.join(gen, `${item.name}.java`);
    const currentSource = fs.readFileSync(classPath, "utf8");
    const gherkin = read(gherkinFile);
    const system = [
      "This is repair iteration 2 of an AI-generated Java Selenium test (the allowed maximum is 2).",
      "Repair the generated test using only the candidate Gherkin and pinned ExpressCart source / Page Object evidence below.",
      "Return the complete Java class, package tests, same class name. Preserve Gherkin actions and expected assertions. Fix the documented source/selector/setup defects; do not remove or weaken assertions to force PASS.",
      "Use browser UI for Gherkin When actions; no HTTP/database shortcut for tested behavior. Only fixture setup may be prepared outside UI if the Gherkin permits it; document assumptions.",
      "Do not invent routes, selectors, default data, or discount codes. Do not include secrets. Use JUnit 4 and existing po.* Page Objects if applicable.",
      "For C05 cleanup, do not silently swallow cleanup failure; assert cleanup result or report the failure.",
    ].join(" ");
    const human = JSON.stringify({ candidateId: item.id, sourceCommit: "b31302f4e99c3293bd742c6d076a721e168118b0", gherkinFile, gherkin, sourceVerifiedFacts: item.facts, sourceEvidence: evidence, currentGeneratedJava: currentSource, knownRunFailure: item.id === "EC-C02" ? "First outside-sandbox browser attempt failed before app assertion: generated code called Home.goHome() on an empty page; correct setup navigation is BaseTest.goToHome()." : "First-run attempts in the sandbox failed before browser session creation because ChromeDriver execution was sandbox-blocked." }, null, 2);
    fs.writeFileSync(path.join(gen, `${item.id}.repair-2.prompt.json`), `${JSON.stringify({ model: modelName, temperature: 0, system, human }, null, 2)}\n`, "utf8");
    const response = await llm.invoke([["system", system], ["human", human]]);
    if (!response.parsed) throw new Error(`${item.id}: no structured repair response`);
    const parsed = ClassResult.parse(response.parsed);
    if (parsed.className !== item.name || !parsed.source.startsWith("package tests;") || !parsed.source.includes(`class ${item.name}`)) throw new Error(`${item.id}: class mismatch`);
    const usage = (response.raw as unknown as { usage_metadata?: Record<string, unknown> })?.usage_metadata ?? {};
    fs.writeFileSync(path.join(gen, `${item.id}.repair-2.response.json`), `${JSON.stringify({ ...parsed, model: modelName, usageMetadata: usage, apiKeyRecorded: false }, null, 2)}\n`, "utf8");
    fs.writeFileSync(classPath, `${parsed.source.trim()}\n`, "utf8");
    fs.writeFileSync(path.join(suite, `${item.name}.java`), `${parsed.source.trim()}\n`, "utf8");
    done.push(item.id);
  }
  const graph = new StateGraph(State).addNode("record", (state) => {
    fs.writeFileSync(path.join(root, "repair-history.json"), `${JSON.stringify({ maxIterations: 2, repairIterations: [
      { iteration: 1, trigger: "Maven test-compile missing Page Object imports/types", repairedClasses: ["EC-C02", "EC-C04", "EC-C01", "EC-C05"], result: "Compilation passed after this repair." },
      { iteration: 2, trigger: "Source/selector/setup mismatch and first EC-C02 browser error", repairedCandidates: state.done, result: "Awaiting final compile and application E2E; no assertion outcome claimed." },
    ], model: modelName, secretsRecorded: false }, null, 2)}\n`, "utf8");
    return { ...state, status: "REPAIRED" };
  }).addEdge(START, "record").addEdge("record", END).compile();
  const result = await graph.invoke({ ids: entries.map((entry) => entry.id), done, status: "REPAIRED" });
  console.log(JSON.stringify({ status: result.status, repairedCandidates: done, model: modelName }, null, 2));
}
main().catch((error: unknown) => { const message = error instanceof Error ? error.message : "unknown"; fs.writeFileSync(path.join(root, "repair-2-failure.json"), `${JSON.stringify({ category: "MODEL_REPAIR_FAILED", message, secretsRecorded: false }, null, 2)}\n`, "utf8"); console.error(`Repair iteration 2 failed: ${message}`); process.exitCode = 1; });
