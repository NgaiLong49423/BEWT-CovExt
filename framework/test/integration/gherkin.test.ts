import test from "node:test";
import assert from "node:assert/strict";
import { canonicalGherkin } from "../../src/runtime/gherkin.js";

test("comment-only revision metadata preserves approved scenario semantics", () => {
  const approved = "Feature: Forgot password\n  Scenario: Generic response\n    Given an unregistered email\n    When I submit the form\n    Then I see the generic response\n";
  const revision = `${approved}\n# Human review revision 2: clarify setup\n`;
  assert.equal(canonicalGherkin(revision), canonicalGherkin(approved));
  assert.notEqual(canonicalGherkin(revision.replace("generic response", "different response")), canonicalGherkin(approved));
  assert.throws(() => canonicalGherkin("# metadata only"), /no scenarios/);
});
