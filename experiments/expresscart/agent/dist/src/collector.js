import fs from "node:fs";
import path from "node:path";
const experimentRoot = path.resolve(import.meta.dirname, "../..");
const suiteRoot = path.join(experimentRoot, "bewt-suite/src/test/java");
const gherkinRoot = path.resolve(experimentRoot, "../../bewt-original/expresscart/gherkin");
const sourceRoot = path.join(experimentRoot, "source");
export function sanitizeLabel(value) {
    return value
        .replace(/"[^\"]*"|'[^']*'/g, "<literal>")
        .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, "<email>")
        .replace(/\b(password|passwd|token|secret)\b[^,.;]*/gi, "$1 <redacted>")
        .replace(/\b\d{4,}\b/g, "<number>")
        .slice(0, 180);
}
function walk(dir, extension) {
    if (!fs.existsSync(dir))
        return [];
    return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
        const full = path.join(dir, entry.name);
        return entry.isDirectory() ? walk(full, extension) : entry.name.endsWith(extension) ? [full] : [];
    });
}
function safeTestSummary(file) {
    const text = fs.readFileSync(file, "utf8");
    const methods = [...text.matchAll(/public\s+void\s+(\w+)\s*\(/g)].map((m) => m[1]).filter((v) => Boolean(v));
    const locators = [...text.matchAll(/By\.(?:id|name|className|cssSelector|xpath|linkText)\(\s*"([^"]+)"/g)].map((m) => m[1]).filter((v) => Boolean(v));
    const actions = [...text.matchAll(/\.([a-zA-Z]\w*)\s*\(/g)].map((m) => m[1]).filter((v) => Boolean(v))
        .filter((n) => /^(?:click|submit|sendKeys|assertEquals|assertTrue|assertFalse|newUser|addUser|users|login|logout|search|checkout|delete|edit|set\w+)$/.test(n));
    return {
        file: path.relative(suiteRoot, file).replaceAll("\\", "/"),
        methods: [...new Set(methods)],
        locatorHints: [...new Set(locators.map(sanitizeLabel))].slice(0, 20),
        actionHints: [...new Set(actions)].slice(0, 30),
        hasAssertions: /assert(?:Equals|True|False|That)|\.should\(/.test(text),
    };
}
function safeFeatureSummary(file) {
    const text = fs.readFileSync(file, "utf8");
    const featureText = text.match(/^\s*Feature:\s*(.{1,100})/m)?.[1]?.trim() ?? "Unlabelled feature";
    const feature = sanitizeLabel(featureText);
    const scenarios = [...text.matchAll(/^\s*Scenario(?: Outline)?:\s*(.{1,120})/gm)]
        .map((m) => m[1] ? sanitizeLabel(m[1].trim()) : "").filter(Boolean);
    const stepKeywords = [...text.matchAll(/^\s*(Given|When|Then|And|But)\s+(.{1,180})/gm)]
        .map((m) => `${m[1]} ${sanitizeLabel(m[2] ?? "")}`);
    return { file: path.basename(file), feature, scenarios, stepKeywords };
}
function safeRouteSummary() {
    const routes = new Set();
    for (const file of walk(path.join(sourceRoot, "routes"), ".js")) {
        const text = fs.readFileSync(file, "utf8");
        for (const match of text.matchAll(/(?:router|app)\.(?:get|post|put|delete|patch)\(\s*['"`]([^'"`]+)['"`]/g)) {
            const route = match[1]?.replace(/:[^/]+/g, ":param");
            if (route?.startsWith("/") && route.length <= 100)
                routes.add(route);
        }
    }
    return [...routes].sort();
}
export function collectBaseline() {
    const tests = walk(path.join(suiteRoot, "tests"), ".java")
        .filter((file) => !["BaseTest.java", "TestSuite.java", "ChromeDriverCompatibilityTest.java"].includes(path.basename(file)))
        .map(safeTestSummary);
    const features = walk(gherkinRoot, ".feature").map(safeFeatureSummary);
    return {
        source: "Pinned ExpressCart checkout and copied BEWT suite",
        tests,
        features,
        routeHints: safeRouteSummary(),
        excluded: ["configuration files", "environment files", "input literals", "credentials", "database contents", "logs"],
    };
}
