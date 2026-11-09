# joomla — G1 candidate review packet

**Review state:** PROPOSED ONLY — no novelty/oracle decision and no implementation approval.

- App/source version: 3.10.11
- Source pin: [joomla/joomla-cms@01deee0a7b8cf91fc503b2cc13359c6e43aac47f](https://github.com/joomla/joomla-cms/tree/01deee0a7b8cf91fc503b2cc13359c6e43aac47f) (tree `3ca858200ae101d31fa2505c3e756f7bd6cb0449`; provenance PINNED_RELEASE_SOURCE_AVAILABLE)
- Baseline pin: BEWT @ `0501249ff3e9a5ea83a06155cd2971dc36197056` (tree `d38fcc0eae8073023c48bb46998741c8c19d4d06`)
- Dataset: [proposal bundle](../../../../data/coverage/joomla/source-backed-gap-proposals.json), [shortlist](../../../../data/coverage/joomla/source-backed-gap-shortlist.json), [baseline mapping](../../../../data/coverage/joomla/baseline-mapping.json), [source index](../../T04-E/source-reference-index.json)
- Candidate count: 4; technical review order: 3. Order is not acceptance.
- G1: NOT_VERIFIED; behavioral denominator/RQ2: NOT_ESTABLISHED/NOT_EVALUATED.

## JO-GAP-001 — Featured article flag appears and is removed from the featured list

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Administrator / Content administrator.
- Proposed preconditions: Unfeatured published article with unique title; featured-list baseline empty for that title.
- Proposed fixture/action: Toggle featured on, reload list, then toggle off.
- Expected observable (oracle proposal, not approved): Article appears exactly once in featured list while enabled and disappears when disabled; article record remains published.
- Negative control: Use a published but unfeatured article and verify it remains outside the featured list.
- Baseline overlap screen: NO_DIRECT_OVERLAP_SCREEN_NOT_SEMANTICALLY_REVIEWED. Baseline creates/edits/archives articles and categories, but does not assert featured-list membership.

Baseline references:
`joomla-08-addnewarticle` — `joomla/gherkin/08_AddNewArticle.feature` (Adds a new article); Java `joomla/baseline/joomla-3.10.11/src/test/java/base/AddNewArticle.java`, assertion refs 22:assertEquals, 23:assertEquals.
`joomla-10-editarticle` — `joomla/gherkin/10_EditArticle.feature` (Edits an article); Java `joomla/baseline/joomla-3.10.11/src/test/java/base/EditArticle.java`, assertion refs 21:assertEquals.
`joomla-21-archivearticle` — `joomla/gherkin/21_ArchiveArticle.feature` (Archives an article); Java `joomla/baseline/joomla-3.10.11/src/test/java/base/ArchiveArticle.java`, assertion refs 21:assertEquals.

Source references:
- [JO-S01](https://github.com/joomla/joomla-cms/blob/01deee0a7b8cf91fc503b2cc13359c6e43aac47f/administrator/components/com_content/models/article.php) — `administrator/components/com_content/models/article.php` lines 61-67,233-250,262-281,701-706,722-800; blob `8717315555a82d96ea00239269328fabbb7e620f`. Article model checks edit-state rights, prepares publication/version fields, saves article data, and persists featured state into the content/frontpage tables.
- [JO-S02](https://github.com/joomla/joomla-cms/blob/01deee0a7b8cf91fc503b2cc13359c6e43aac47f/administrator/components/com_content/models/featured.php) — `administrator/components/com_content/models/featured.php` lines 40-84; blob `debab364c64920da46b83507af8345e2e8f5803a`. Featured-article query includes featured flag, publication state and access level.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Featured article flag appears and is removed from the featured list
  Given Unfeatured published article with unique title; featured-list baseline empty for that title.
  When Toggle featured on, reload list, then toggle off.
  Then Article appears exactly once in featured list while enabled and disappears when disabled; article record remains published.
  And Use a published but unfeatured article and verify it remains outside the featured list.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Pin front-end menu/list configuration. If configuration cannot guarantee the featured list, prefer a narrower source-supported model/query oracle and state that change explicitly.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:

## JO-GAP-002 — Publish-up and publish-down define the article visibility window

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Administrator and guest / Admin configures; guest observes.
- Proposed preconditions: Published article with start/end timestamps in a controlled timezone; unique alias.
- Proposed fixture/action: Set future publish-up and future publish-down, then inspect before, within and after the window.
- Expected observable (oracle proposal, not approved): Article is hidden before start, visible during the window, and hidden after end.
- Negative control: Keep a normal published article as a control at each observation time.
- Baseline overlap screen: POTENTIAL_PARTIAL_OVERLAP_NOT_SEMANTICALLY_REVIEWED. Baseline Add/Edit Article and Archive Article cases do not assert timed visibility boundaries.

Baseline references:
`joomla-08-addnewarticle` — `joomla/gherkin/08_AddNewArticle.feature` (Adds a new article); Java `joomla/baseline/joomla-3.10.11/src/test/java/base/AddNewArticle.java`, assertion refs 22:assertEquals, 23:assertEquals.
`joomla-10-editarticle` — `joomla/gherkin/10_EditArticle.feature` (Edits an article); Java `joomla/baseline/joomla-3.10.11/src/test/java/base/EditArticle.java`, assertion refs 21:assertEquals.
`joomla-21-archivearticle` — `joomla/gherkin/21_ArchiveArticle.feature` (Archives an article); Java `joomla/baseline/joomla-3.10.11/src/test/java/base/ArchiveArticle.java`, assertion refs 21:assertEquals.

Source references:
- [JO-S03](https://github.com/joomla/joomla-cms/blob/01deee0a7b8cf91fc503b2cc13359c6e43aac47f/administrator/components/com_content/models/articles.php) — `administrator/components/com_content/models/articles.php` lines 40-52,178-191; blob `d2cfe7b344f328f8e9cec21152de8c82a712acaa`. Article listing filters/state includes publication window, access, and featured data.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Publish-up and publish-down define the article visibility window
  Given Published article with start/end timestamps in a controlled timezone; unique alias.
  When Set future publish-up and future publish-down, then inspect before, within and after the window.
  Then Article is hidden before start, visible during the window, and hidden after end.
  And Keep a normal published article as a control at each observation time.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Split before-start, in-window, and after-end observations with explicit timezone, cache clearing and clock protocol. Source fields alone do not prove rendered visibility.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:

## JO-GAP-003 — Editor without edit-state permission cannot change publication state

- Scenario status: PROPOSED; novelty: NOT_VERIFIED; human decision: NOT_REVIEWED.
- Actor/role: Editor and administrator / Editor lacks core.edit.state; admin has it.
- Proposed preconditions: Two accounts with same article access but different ACL; article is checked in.
- Proposed fixture/action: Attempt to unpublish as editor, then as administrator.
- Expected observable (oracle proposal, not approved): Editor cannot persist state change and receives an authorization outcome; administrator can perform the change.
- Negative control: Admin control confirms the test target is otherwise editable.
- Baseline overlap screen: NO_DIRECT_OVERLAP_SCREEN_NOT_SEMANTICALLY_REVIEWED. Baseline user/group and article CRUD cases do not verify an authorization denial on state changes.

Baseline references:
`joomla-23-addgroup` — `joomla/gherkin/23_AddGroup.feature` (Adds a group); Java `joomla/baseline/joomla-3.10.11/src/test/java/base/AddGroup.java`, assertion refs 24:assertEquals.
`joomla-25-assignusertogroup` — `joomla/gherkin/25_AssignUserToGroup.feature` (Assigns a user to a group); Java `joomla/baseline/joomla-3.10.11/src/test/java/base/AssignUserToGroup.java`, assertion refs 26:assertTrue.
`joomla-10-editarticle` — `joomla/gherkin/10_EditArticle.feature` (Edits an article); Java `joomla/baseline/joomla-3.10.11/src/test/java/base/EditArticle.java`, assertion refs 21:assertEquals.

Source references:
- [JO-S01](https://github.com/joomla/joomla-cms/blob/01deee0a7b8cf91fc503b2cc13359c6e43aac47f/administrator/components/com_content/models/article.php) — `administrator/components/com_content/models/article.php` lines 61-67,233-250,262-281,701-706,722-800; blob `8717315555a82d96ea00239269328fabbb7e620f`. Article model checks edit-state rights, prepares publication/version fields, saves article data, and persists featured state into the content/frontpage tables.

### Gherkin sketch — draft for review only

```gherkin
# PROPOSED; not human-reviewed, not accepted for implementation
Scenario: Editor without edit-state permission cannot change publication state
  Given Two accounts with same article access but different ACL; article is checked in.
  When Attempt to unpublish as editor, then as administrator.
  Then Editor cannot persist state change and receives an authorization outcome; administrator can perform the change.
  And Admin control confirms the test target is otherwise editable.
```

### Reviewer questions

- Does the pinned source support the exact actor, setup, observable and negative control?
- Does the baseline scenario/assertion cited above already cover this behavior semantically, or is the difference meaningful?
- Is the oracle deterministic and externally observable without implementation-detail assertions?
- Is the fixture/reset safe and reproducible for the pinned application version?
- Pin ACL assignments and clear/recreate sessions. Confirm the denied outcome is an authorization denial and that the admin control proves the same record is otherwise editable.

### Human decision (leave blank until reviewer acts)

- Decision: **[ ] ACCEPT_FOR_IMPLEMENTATION  [ ] REVISE  [ ] REJECT**
- Reviewer / date:
- Novelty rationale:
- Oracle changes:
- Fixture/reset conditions:
- Evidence/decision record:
