import test from "node:test";
import assert from "node:assert/strict";
import { checkCandidates, toGherkin } from "../src/validate.js";
import { sanitizeLabel } from "../src/collector.js";
const candidate = {
    id: "EC-C01",
    title: "Reject invalid customer email",
    rationale: "The baseline covers user creation but not customer email format validation.",
    feature: "Customer registration validation",
    scenario: "Reject a malformed email address",
    steps: ["a visitor opens customer registration", "the visitor submits an invalid email address", "the application displays a validation error"],
    expectedBehavior: "The customer is not created and a validation message is visible.",
    sourceEvidence: ["route /customer/create"],
};
test("candidate schema and Gherkin parser accept a valid scenario", () => {
    const result = checkCandidates({ candidates: [candidate, ...[2, 3, 4, 5].map((n) => ({ ...candidate, id: `EC-C0${n}`, scenario: `${candidate.scenario} ${n}` }))] }, {});
    assert.equal(result.length, 5);
    assert.ok(result.every((item) => item.syntaxValid));
    assert.match(toGherkin(candidate), /Scenario: Reject a malformed email address/);
    assert.doesNotMatch(toGherkin({ ...candidate, steps: ["Given a user is registered", "When they log in", "Then a dashboard is shown"] }), /Given Given|When When|Then Then/);
});
test("candidate set rejects a non-five output", () => {
    assert.throws(() => checkCandidates({ candidates: [candidate] }, {}));
});
test("duplicate IDs are rejected", () => {
    assert.throws(() => checkCandidates({ candidates: Array.from({ length: 5 }, () => candidate) }, {}), /Duplicate candidate id/);
});
test("multi-line content is rejected to prevent feature-file injection", () => {
    const unsafe = { ...candidate, rationale: `${candidate.rationale}\nScenario: injected` };
    assert.throws(() => checkCandidates({ candidates: [unsafe, ...[2, 3, 4, 5].map((n) => ({ ...candidate, id: `EC-C0${n}` }))] }, {}));
});
test("baseline collector redacts emails, quoted literals, and password phrases", () => {
    const safe = sanitizeLabel('Create user a@example.test with password hunter2 and name "Alice"');
    assert.doesNotMatch(safe, /a@example\.test|hunter2|Alice/);
    assert.match(safe, /<email>/);
    assert.match(safe, /password <redacted>/);
});
