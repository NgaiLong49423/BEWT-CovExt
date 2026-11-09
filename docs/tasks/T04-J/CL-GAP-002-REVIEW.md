# CL-GAP-002: group privacy and self-registration review

**Status: PROPOSED / oracle INSUFFICIENT_EVIDENCE / novelty NOT_VERIFIED / runtime NOT_RUN.** This packet supplements T04-F/G and requests human decisions; it does not revise the candidate or establish the desired security policy.

## Pinned inputs

Candidate ID `CL-GAP-002`, version 1, appears in `data/coverage/claroline/source-backed-gap-proposals.json` at outer commit `99811537e81d01f25f9210939a78800251662981`. Committed file SHA-256 `d11c368d88e99c9b011f434e963f0ff4c8dd9c36eb5667562b2b1c403e05bcaf`; candidate-only SHA-256 `0cf749b43a953bc35fe0eb0d5a63a65b5b8b2f0eb428b27fe6f982b24f43db08` (UTF-8, sorted keys, compact separators, unescaped Unicode). Verify the exact revision before recording a decision.

Source repository commit `22d852f93081bc36b1d08b93f5e0c14b49a573f6`, tree `f10d5b9747f13e0256b3f52f7663a1475340bfe4`. `evidence/source-anchors.json` records the exact tree/path/blob binding and SHA-256 for three relevant upstream blobs. These are static source observations, not observations of the pinned runtime image or proof of intended authorization policy.

| Source | What is actually established | Question for review |
|---|---|---|
| [group-space guard](https://github.com/zefredz/claroline/blob/22d852f93081bc36b1d08b93f5e0c14b49a573f6/claroline/group/group_space.php#L29) | Course checks precede a non-editor group-context check; the subsequent group-allowed check includes explicit `selfReg`/`doReg` request-parameter exceptions. The definitions and full downstream authorization of `claro_is_group_allowed()` were not traced here. | Which exact group-space URL and parameters are in scope? A denial on an ordinary direct request cannot automatically establish behavior for registration paths or direct tool URLs. |
| [self-registration conditions](https://github.com/zefredz/claroline/blob/22d852f93081bc36b1d08b93f5e0c14b49a573f6/claroline/group/group_space.php#L69) and [registration action](https://github.com/zefredz/claroline/blob/22d852f93081bc36b1d08b93f5e0c14b49a573f6/claroline/group/group_space.php#L112) | Registration checks the registration flag, group capacity, per-user quota, course membership and existing group membership, among other role conditions. The action rechecks before inserting membership and redirects after a successful query. | An A-only member may already exhaust a one-group-per-user quota. What are the authorized settings and expected result both below and at quota? Define them explicitly. |
| [group list](https://github.com/zefredz/claroline/blob/22d852f93081bc36b1d08b93f5e0c14b49a573f6/claroline/group/group.php#L678) and [group settings](https://github.com/zefredz/claroline/blob/22d852f93081bc36b1d08b93f5e0c14b49a573f6/claroline/group/group_properties.php#L34) | Group-list linking considers manager, tutor, membership and a `private` group-properties flag. The settings page reads main group properties for the current course, including privacy and registration flags; group capacity is read for the current group separately. | The candidate's phrase “configured open group” does not identify whether privacy/registration settings are per course or per group in the intended fixture. Verify the complete setting and persistence model before asserting two groups have different policy. |
| [document-access variable](https://github.com/zefredz/claroline/blob/22d852f93081bc36b1d08b93f5e0c14b49a573f6/claroline/group/group_space.php#L96) | This file assigns `$is_allowedToDocAccess` from manager/member/tutor predicates, but the variable appears only at this assignment in this blob. This does not establish whether a separate document endpoint independently enforces it. | Which protected content or observable should be used as the oracle, and what authoritative source or approved policy proves its expected visibility? |

`docs/tasks/T03-B2/CLAROLINE-SOURCE-PROVENANCE.md` later records a Team Lead P1 decision accepting the pinned benchmark image **as a derivative**, while documenting a separate unattributed one-file patch. The earlier T04-F/G uncertainty and historical provenance statements should be read in that chronological context. This packet did not independently review that decision, compare the group files against the image or validate G0; image acceptance is not policy, novelty, oracle or runtime acceptance.

## Reviewer decisions

Two independent reviewers should examine the source/version and existing baseline overlap in T04-F. Select and record `ACCEPTED_FOR_IMPLEMENTATION`, `REVISE`, `REJECTED` or `BLOCKED` with exact candidate hash, identity, rationale and supporting evidence. Resolve at least:

1. The authorized privacy and registration policy, correct config scope, target endpoint and expected behavior for a student in A accessing B; distinguish denial, registration page visibility and actual private content.
2. Fixture settings for group capacity, membership count and per-user quota, including a member-A positive control and a separate below-quota or exhausted-quota condition where appropriate.
3. Whether to retain self-registration in the same candidate or propose a separately reviewed revision, and how fixtures/reset/session boundaries are proven without treating source code as a complete oracle.
4. The derivative image/source applicability, runtime isolation, content fixture and independent novelty comparison. Do not approve execution until the relevant G0 prerequisites and actual human decisions exist.

Source assertions cannot answer the policy question by themselves. Any change to actor, expected behavior or oracle requires a reviewed revision; no behavioral denominator or RQ2 gain is established here.
