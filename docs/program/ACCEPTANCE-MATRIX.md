# BEWT-CovExt — Acceptance Matrix / Ma trận nghiệm thu

**Áp dụng cho:** cả 8 ứng dụng, bốn vai trò AI Agent và D1–D8 theo đề cương v2.0. **Mặc định:** `NOT_STARTED`/`NOT_VERIFIED` cho phần không có evidence, KHÔNG giả lập PASS.

## A. G0–G4: Điều kiện theo từng app

| Gate | Mục đích | Điều kiện PASS (tối thiểu) | Bằng chứng bắt buộc |
|---|---|---|---|
| **G0 Environment** | Runtime và baseline tái lập được | Pin app source commit hoặc immutable image digest cùng runtime versions; verify app/DB readiness, isolated ownership, fixtures, one meaningful Base test, clean reset and cleanup. Maven compile alone is insufficient. | app config, source/image identity, runtime manifest, ownership checks, Base XML/log, fixture/reset/cleanup evidence bound to same run |
| **G1 Dataset/Coverage** | Phát hiện gap có nghĩa | Reproducible per-app behavioral inventory and deduplication; compare each candidate with pinned baseline; classify lexical novelty separately from behavioral non-overlap; require reviewer-signed oracle and novelty decisions before implementation acceptance. Missing signatures remain pending, not approved. | source-hashed baseline inventory, extraction/dedup procedure, candidate-to-behavior mapping, source evidence, review packet and signed decisions (or explicit pending/reject/revise) |
| **G2 Framework** | Orchestrator chạy được thực chất | LangGraph has state/checkpoint, four explicit roles, fixed tool allowlist, human pause/resume, bounded repair, recoverability and idempotency; test offline contracts and an authentic provenance-bound model vertical slice. Synthetic/fake-provider output is labeled and cannot prove live model generation. | code/graph config, node/tool and negative tests, live provider request/response record with returned telemetry or explicit UNKNOWN, artifact provenance, trace and gate logs |
| **G3 Validation** | Case chạy đúng và có thể tái lập | For each candidate, map every essential Given/When/Then action and oracle to the exact immutable Java revision; verify scenario support against pinned app behavior; compile, execute in clean state, and observe the business postcondition. If initial run passes, perform three additional clean-state reruns. Bind every run to app commit/image digest, Gherkin and Java SHA-256, runtime manifest, fixture/reset, JUnit/logs, and cleanup. Generic JUnit PASS or source compilation alone is insufficient. | candidate traceability with line-level action/assertion mapping; source/version manifest; immutable artifact hashes; fixture/reset records; JUnit XML and logs; initial + rerun outcomes; cleanup verification; classified failures and reviewer oracle decision |
| **G4 Research Release** | Dataset/evaluation có thể kiểm toán | Compute RQ1–RQ4 from validated, evidence-bound source records with explicit denominators and negative controls. Separate measured, derived, estimated, and unknown model telemetry/cost. No PASS/coverage gain/productivity claim from status strings, defaults, or historical unbound runs. Final release requires reconciled report, reproduction package, and actual required human sign-offs. | reproducible metrics scripts/tests, JSON+CSV outputs, evidence index, candidate ledger, source/runtime-bound result records, manuscript/PDF matching data, review and acceptance record |

**Lưu ý:** G2 là gate kiến trúc cấp framework; kiểm tra full functionality qua một app trước, rồi kiểm tra lại bằng adapter trên các app khác. Không tính một app PASS G2 là đủ để kết luận tích hợp 8 app PASS.

## B. Deliverables theo đề cương

| ID | Sản phẩm | Nghiệm thu |
|---|---|---|
| **D1** | AI Agent Framework source | 4 role nodes + orchestration/checkpoints + tool calling + HITL + bounded repairs + automated tests; không dùng scripts ExpressCart-only làm bằng chứng tái sử dụng 8 app |
| **D2** | Baseline manifests cho 8 app | 8/8 pin/version/runtime/seed/reset/Base smoke; giữ nguyên các mismatch của BEWT nếu có |
| **D3** | Coverage matrix cho 8 app | Pre/post behavioral inventory, mapping original Gherkin/Base, gap evidence, reviewer decisions |
| **D4** | 40 Gherkin mới (mục tiêu) | 5/app được lựa chọn/review, verified oracle & novelty, không trùng; ghi số chưa đạt và lý do |
| **D5** | 40 Java/Selenium tests (mục tiêu) | 1+ implementation/case, first source, compile/run/3 reruns, validated status có chứng cứ |
| **D6** | Research dataset | machine-readable JSON/CSV/JSONL: candidates, approvals, outcomes, provenance, rejected/revisions |
| **D7** | Evaluation & replication | rubric, scripts, runbooks, reset, reproducer versions, threat analysis, secret-free evidence |
| **D8** | Báo cáo khoa học | RQ1–RQ4 trả lời bằng dữ liệu, coverage gain đo theo inventory chứ không chỉ cộng 258+40 |

## C. Chính sách trạng thái và review

- **Engineering outcome:** `PASS`, `FAIL`, `BLOCKED`, `NOT_RUN`, `INCONCLUSIVE`, `NOT_EVALUATED`; tách runtime, fixture, compile, behavior, cleanup.
- **Task review:** `IN_PROGRESS`, `READY_FOR_REVIEW`, `CHANGES_REQUESTED`, `ACCEPTED`, `BLOCKED`; chỉ Team Lead có quyền ghi quyết định cuối cùng; Agent ghi đề xuất và evidence.
- **Candidate decision:** `PROPOSED`, `REVISE`, `REJECTED`, `ACCEPTED_FOR_IMPLEMENTATION`, `VALIDATED`; trạng thái VALIDATED phải đủ 4 thành phần: novelty/oracle approved + Java/E2E PASS + reruns theo protocol + provenance.
- **Measurement:** số candidate khác số invocation; rerun không tăng sample độc lập; compile toàn Maven module không được diễn giải thành per-class compile PASS; NOT_EVALUATED khác 0%; BLOCKED khác behavioral FAIL.

## D. Thẩm định remote (bắt buộc sau mỗi task)

1. Đọc PR diff thực tế trên GitHub, đối chiếu mô tả với changed files và phạm vi task.
2. Đọc trực tiếp source, tests, fixtures, run logs và metrics JSON qua đường dẫn `blob/<branch>/<path>` hoặc full SHA; không chỉ đọc report tổng kết.
3. Xác nhận các kiểm thử có evidence tương ứng với **cùng commit/phiên bản/runtime**; thiếu evidence → `NOT_VERIFIED`, không tự PASS.
4. Kiểm tra data consistency, source pin, `bewt-original/` không bị sửa, không có secrets hoặc tài nguyên ngoài experiment bị ảnh hưởng.
5. Ghi review decision với yêu cầu sửa cụ thể; Agent sửa trên **cùng PR** bằng commit mới (trừ khi phạm vi thay đổi, tạo task mới).
6. Không merge `main` trước khi Team Lead phê duyệt. Nếu CI không có, local evidence bắt buộc và được gắn trạng thái `LOCAL_VERIFIED`, không biến thành `CI_PASS`.

## E. Trạng thái theo bằng chứng hiện có (12-11-2026)

At the time PR #27 was fetched, it was open as a draft at head `e32b25e027573a63de3da8dbb3d89ee135517cc2`, based on `main` at `da6399536ff75a1edf4417819eb4d166cc1d781c`. The audit package records 40 candidates, 0/40 semantically aligned R2 mappings, 0/40 evidenced signed oracle/novelty decisions, and 0/40 eligible for `VALIDATED`. Historical raw execution files do not satisfy the current source-bound G3 evidence contract. One approved live Gemini request failed with a provider schema error and produced no review packet or Java artifact; it does not validate the previously registered artifacts as live-generated. A draft PDF has since been rebuilt with Tectonic 0.17.0 and temporary Springer template dependencies, and selected pages were visually inspected; author/affiliation placeholders and nonfatal build warnings remain. These are evidence-based blockers, not Team Lead acceptance decisions. See `docs/final-acceptance/BASELINE-AUDIT.md`, `40-CASE-TRACEABILITY.json`, and `RQ1-RQ4-results.json` for detailed evidence and limitations.
