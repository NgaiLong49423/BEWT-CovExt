import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { getAppTestPackage, candidateDirectoryId } from "./java-class.js";
import { assertAntiTrivialJavaContract, validateGeneratedJavaContract } from "./model-provider.js";

function findRepoRoot(): string {
  const cur = process.cwd();
  if (existsSync(join(cur, "data", "coverage"))) return cur;
  if (existsSync(join(cur, "..", "data", "coverage"))) return join(cur, "..");
  return cur;
}
const REPO_ROOT = findRepoRoot();
const APPS = ["bludit", "claroline", "expresscart", "joomla", "kanboard", "mantisbt", "mediawiki", "prestashop"];

interface ScanResult {
  candidateId: string;
  appId: string;
  dirId: string;
  testClass: string;
  artifactPath: string;
  hasTrivialUrl: boolean;
  hasTautology: boolean;
  hasSwallowedCatch: boolean;
  hasGenericBody: boolean;
  gatePassed: boolean;
  gateError?: string | undefined;
  hasRegistration: boolean;
  hasProvenance: boolean;
}

export function verifyAllRevision2(): { totalScanned: number; results: ScanResult[]; trivialCount: number } {
  const results: ScanResult[] = [];
  let trivialCount = 0;

  for (const appId of APPS) {
    const proposalsPath = join(REPO_ROOT, "data", "coverage", appId, "source-backed-gap-proposals.json");
    const data = JSON.parse(readFileSync(proposalsPath, "utf8"));

    for (const c of data.candidates) {
      const dirId = candidateDirectoryId(c.candidateId);
      const testClass = `T01C_${dirId}_R2`;
      const relPath = `extension/${appId}/selenium/${dirId}/revision-2/${testClass}.java`;
      const fullPath = join(REPO_ROOT, relPath);
      const regPath = join(REPO_ROOT, `extension/${appId}/selenium/${dirId}/revision-2/registration.json`);
      const provPath = join(REPO_ROOT, `extension/${appId}/selenium/${dirId}/revision-2/provenance.json`);

      if (!existsSync(fullPath)) {
        results.push({
          candidateId: c.candidateId,
          appId,
          dirId,
          testClass,
          artifactPath: relPath,
          hasTrivialUrl: false,
          hasTautology: false,
          hasSwallowedCatch: false,
          hasGenericBody: false,
          gatePassed: false,
          gateError: "FILE_NOT_FOUND",
          hasRegistration: existsSync(regPath),
          hasProvenance: existsSync(provPath),
        });
        continue;
      }

      const source = readFileSync(fullPath, "utf8");
      const hasTrivialUrl = /currentUrl\.length\(\)\s*>=?\s*0/.test(source);
      const hasTautology = /Assert\.assertTrue\s*\(\s*(?:"[^"]*"\s*,\s*)?true\s*\)|Assert\.assertFalse\s*\(\s*(?:"[^"]*"\s*,\s*)?false\s*\)/.test(source);
      const hasSwallowedCatch = /catch\s*\(\s*(?:Throwable|AssertionError)\s+[a-zA-Z0-9_]+\s*\)\s*\{(?![^}]*throw)/.test(source);
      const hasGenericBody = /By\.tagName\(\s*["']body["']\s*\)|By\.cssSelector\(\s*["']body["']\s*\)|(?:body|claroBody)\.isDisplayed\(\)/.test(source);

      if (hasTrivialUrl || hasTautology || hasSwallowedCatch || hasGenericBody) {
        trivialCount++;
      }

      let gatePassed = true;
      let gateError: string | undefined;

      try {
        assertAntiTrivialJavaContract(source);
        validateGeneratedJavaContract({ testClass, javaSource: source }, testClass, undefined, true);
      } catch (err: any) {
        gatePassed = false;
        gateError = err.message;
      }

      results.push({
        candidateId: c.candidateId,
        appId,
        dirId,
        testClass,
        artifactPath: relPath,
        hasTrivialUrl,
        hasTautology,
        hasSwallowedCatch,
        hasGenericBody,
        gatePassed,
        gateError,
        hasRegistration: existsSync(regPath),
        hasProvenance: existsSync(provPath),
      });
    }
  }

  return { totalScanned: results.length, results, trivialCount };
}

if (process.argv[1]?.endsWith("verify-revision2.ts") || process.argv[1]?.endsWith("verify-revision2.js")) {
  const { totalScanned, results, trivialCount } = verifyAllRevision2();
  console.log(`Scan completed: ${totalScanned} test files evaluated.`);
  console.log(`Trivial assertions detected: ${trivialCount} / ${totalScanned}`);
  const failedGate = results.filter(r => !r.gatePassed);
  console.log(`Quality gate passed: ${results.length - failedGate.length} / ${totalScanned}`);
  if (failedGate.length > 0) {
    console.error("Failed gate:", failedGate);
    process.exit(1);
  }
}
