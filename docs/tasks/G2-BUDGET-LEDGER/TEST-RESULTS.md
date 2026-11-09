# Test results

Focused ledger: 3 passed. Framework unit: 45 passed. Offline workflow integration: 3 passed. TypeScript build: exit 0. See `evidence/exit-codes.json` and logs. The first integration attempt failed 3/3 before workflow execution because `npm ci --ignore-scripts` omitted native SQLite; see TASK-REPORT for remediation and limits. No live model, Docker, or G0–G4 acceptance test ran.

The integration suite created three untracked synthetic run directories under docs/tasks/T01-C/evidence/ in this worktree. They were not staged or removed; their generated contents are not research evidence.
