# Source Recovery and Mapping Checks

- Fresh clone of OlianasD/BEWT: exit 0; clean.
- ls-remote refs/heads/main: exit 0; resolved to 0501249ff3e9a5ea83a06155cd2971dc36197056.
- Commit object type: commit; checked-out HEAD and required pin match.
- Commit tree: d38fcc0eae8073023c48bb46998741c8c19d4d06.
- Inputs: 30 features, 32 Java test-directory files, 30 suite business cases, 27 Page Objects.
- Mapping consistency: 30 mapped; zero missing, extra or duplicate business classes/case IDs.
- T03-A parity: 30/30 business Java and 27/27 Page Object SHA-256 matches.
- Candidate proposals: 10 unique; shortlist: 5 unique and included in candidate set.
- Utility tests: 7/7 PASS; deterministic output: byte-identical for all generated artifacts.
- Runtime: NOT_RUN (Docker/Selenium/browser/Gemini excluded from T04-A).
