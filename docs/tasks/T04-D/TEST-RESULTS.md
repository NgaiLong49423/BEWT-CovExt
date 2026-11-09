# T04-D test results

Offline consistency command: node docs/tasks/T04-D/tools/verify-inventory.mjs. Raw output: docs/tasks/T04-D/evidence/verification/verify-inventory.txt. This checks generated-data schema, commit pins, counts, hashes, Gherkin-to-TestSuite class/method/assertion references, anomalies and non-promotion of human decisions. No runtime, Docker, Selenium or Gemini test was run.

Credential token-prefix and changed-path scope scan: PASS; 0 known token-prefix matches; only T04-D and the seven assigned coverage paths are in scope. Evidence: docs/tasks/T04-D/evidence/verification/secret-and-scope-scan.txt.

Verifier also checks that behavior tags are marked heuristic and excluded from the RQ2 denominator, cross-audit counts remain distinct, and the Bludit M2 version-label mismatch is preserved. T02 reports 257 business classes overall (258 with Installer); T04-D independently measures 228 seven-app TestSuite entries. No G1 status is promoted.
