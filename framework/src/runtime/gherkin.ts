import { GherkinClassicTokenMatcher, Parser, AstBuilder } from "@cucumber/gherkin";
import { IdGenerator } from "@cucumber/messages";

/** Parse Gherkin using the same pinned Cucumber grammar used by the framework contract. */
export function parseGherkin(source: string) {
  const parser = new Parser(new AstBuilder(IdGenerator.incrementing()), new GherkinClassicTokenMatcher());
  const document = parser.parse(source);
  if (!document.feature || !document.feature.children.some((child) => "scenario" in child)) throw new Error("Gherkin document has no scenarios");
  return document;
}

/** Compare scenario source while ignoring comment-only review metadata. */
export function canonicalGherkin(source: string): string {
  parseGherkin(source);
  return source.replace(/\r\n/g, "\n").split("\n").filter((line) => !line.trimStart().startsWith("#")).join("\n").trim();
}
