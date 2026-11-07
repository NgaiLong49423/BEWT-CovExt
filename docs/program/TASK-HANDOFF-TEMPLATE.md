# Task Handoff Template — Coding Agent → Team Lead → GitHub Review

Mỗi task bắt buộc tạo `docs/tasks/<TASK-ID>/TASK-REPORT.md` và điền toàn bộ trường dưới đây. Báo cáo phục vụ điều hướng đến source/evidence, không phải bằng chứng thay thế source.

```markdown
# TASK-ID — Task title

- Task scope / acceptance gate: ...
- Base branch + base SHA: ...
- Working branch: ...
- Head commit (full 40-char SHA): ...
- PR: https://github.com/NgaiLong49423/BEWT-CovExt/pull/<number> (hoặc `PR_NOT_CREATED: reason`)
- Push status: PUSHED | PUSH_BLOCKED (with command output summary)
- Runtime/commit/version tested: ...
- Status proposed by Agent: READY_FOR_REVIEW | PARTIAL | BLOCKED

## 1. What changed
| File path (repo-relative) | Change | Why |
|---|---|---|
| ... | ... | ... |

## 2. Actual verification
| Exact command | Exit code | PASS/FAIL/BLOCKED/NOT_RUN | Evidence path |
|---|---:|---|---|
| ... | ... | ... | ... |

## 3. Research impact
- Apps affected, source/version pins:
- Candidate IDs and statuses before → after:
- RQ1/RQ2/RQ3/RQ4 measurable changes:
- Gate status before → proposed after:
- Dataset/metrics artifacts updated (paths):
- Denominator and sampling caveats:

## 4. Safety & integrity
- `bewt-original/` touched? [NO/YES with exact files]
- Docker/project resources touched? [NONE / verified exact list]
- Existing unrelated local dirty files preserved? [YES / details]
- Secret scan / git staged diff review result:
- Failed/blocked tasks and honest reasons:

## 5. Evidence and reproduction
- Source/test paths:
- Raw run/log/XML/screenshot paths:
- Input data fixture path and cleanup evidence:
- Exact reproducible commands (redacted):
- Known limitations/risks:

## 6. Review request
- What the Team Lead needs to decide:
- Suggested next task if accepted:
- GitHub PR diff URL and file paths to inspect:
```

## Mandatory Git publication checklist

1. Trước sửa: `git fetch origin`, lưu remote `main` SHA, `git status --porcelain=v1` (không xóa dirty files), kiểm tra nhánh và base.
2. Dùng branch `task/<ID>-<scope>` hoặc `docs/<scope>`; không làm trực tiếp `main`. Nếu workspace local dirty, dùng worktree riêng thay vì reset/stash/clean không được phép.
3. Chỉ `git add` **danh sách file được phép**; không `git add .` hoặc `git add -A` toàn repo khi có artifact không rõ nguồn. Kiểm tra `git diff --cached --name-only`, `git diff --cached --stat` và `git diff --cached`, cùng `.gitignore`.
4. Quét secrets, identifiers, unintended binaries, old `bewt-original/` và cỡ file; không commit credentials hoặc raw datasets chứa thông tin thật.
5. Commit trên task branch, push `git push -u origin <branch>`; nếu được quyền, mở PR → `main` với summary + links. Không force push/merge/đóng PR thay Team Lead.
6. Sau push, kiểm tra `git rev-parse HEAD`, `git ls-remote origin refs/heads/<branch>`, PR head SHA, cùng file tồn tại trên GitHub. **Chỉ báo PUSHED sau khi kiểm tra remote SHA đúng**.
7. Báo cho Team Lead **nguyên văn** PR URL, full SHA, danh sách file quan trọng và evidence; nếu GitHub xác thực/403, báo `PUSH_BLOCKED`, giữ local commit, cung cấp mã lỗi cụ thể.
8. Nếu reviewer yêu cầu sửa, thêm commit vào cùng branch/PR, cập nhật report và status; không ghi `ACCEPTED` khi chưa được duyệt.

## Synchronized documents (source of truth)

- Contract: `docs/program/PROGRAM-CONTRACT.md` (chỉ đổi khi Team Lead duyệt scope).
- Acceptance: `docs/program/ACCEPTANCE-MATRIX.md` (chỉ đổi khi Team Lead duyệt protocol).
- Roadmap: `docs/program/IMPLEMENTATION-ROADMAP.md` (thay đổi kế hoạch có lý do và diff).
- Status: `docs/program/STATUS.json` (update theo evidence, không tự đánh dấu ACCEPTED).
- Per task: `docs/tasks/<TASK-ID>/TASK-REPORT.md`.
- Per app/case: manifests, matrices, generated artifacts và logs, không overwrite raw run evidence.

Task report phải ghi URL remote và path relative, không gửi `D:/...` làm link duy nhất (ChatGPT không đọc được ổ Windows qua GitHub).
