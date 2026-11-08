# T04-A Source Recovery Verification

## Verified repository and pin

- Repository: https://github.com/OlianasD/BEWT
- Commit: 0501249ff3e9a5ea83a06155cd2971dc36197056
- Tree: d38fcc0eae8073023c48bb46998741c8c19d4d06
- Branch ref checked: refs/heads/main resolves to the pinned commit.
- Fresh clone: C:\Users\Lenovo\AppData\Local\Temp\bewt-t04a-source-recovery-20261108-0501249
- Clone exit: 0; clone worktree clean.
- Git object type: commit; checked-out HEAD equals pin.
- Pinned Kanboard upstream commit: 00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b.

## Root cause of the earlier false blocker

The outer checkout D:\Github-Projects\BEWT-CovExt is a different repository: remote NgaiLong49423/BEWT-CovExt, branch feature/t01a-framework-contract, HEAD 1ee7cf35b38d00392c1b634d94bc0c1ae68ea536. bewt-original is itself a nested Git repository with remote OlianasD/BEWT, branch main, and HEAD 0501249ff3e9a5ea83a06155cd2971dc36197056.

Earlier git cat-file and GitHub commit lookup were scoped to the outer repository. The API lookup used repository NgaiLong49423/BEWT-CovExt for a commit belonging to OlianasD/BEWT, so HTTP 422 No commit found for SHA was a repository mismatch, not source absence, authentication, rate limit, or network failure.

The nested checkout has pre-existing dirty Gradle/build/cache files across multiple applications. It was inspected only and not modified. A fresh clone was used for T04-A source reads and hashing.

## Input inventory

- 30 Gherkin features.
- 32 Java files in the test directory: 30 business test classes, BaseTest, and TestSuite.
- 30 classes in TestSuite; all 30 business tests map one-to-one to feature basename and suite entry.
- 27 Page Object source files.
- Working copy parity: 30/30 business Java test hashes and 27/27 Page Object hashes match T03-A experiments/kanboard/bewt-suite. BaseTest is the intentional environment adaptation.
- Source recovery file list: 89 BEWT files plus 22 upstream files cited by candidates. SHA-256 index includes all 111 files; prefixes identify BEWT/ versus UPSTREAM/.

The inventory is static source analysis only. No Docker, Selenium, browser, Gemini, or application runtime was run. No gate is accepted.
