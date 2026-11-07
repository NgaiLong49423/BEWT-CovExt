# EC-C03 review for Team Lead

**Human decision remains REVISE.** This file is a proposed completion of the setup/cleanup contract only; it does not change the Team Lead decision to ACCEPT.

## Proposed revised scenario

See [EC-C03-publication-state-review.feature](revised/EC-C03-publication-state-review.feature). Setup creates a dedicated run-specific product through the admin UI, ensures it starts published, and records its exact title. The action under test toggles the publication checkbox off and reloads the product list. The oracle checks the same product's checkbox remains unchecked. Teardown restores the product to published and deletes only that unique fixture through the admin UI.

## Source evidence and limits

- `views/products.hbs` renders product publication controls; `public/javascripts/admin.js` handles `.publishedState` changes.
- `routes/product.js` persists the publication toggle.
- Search route `routes/index.js` does not filter by publication state, so the earlier “unpublished disappears from search” expectation remains a source-level `CONFLICT` and is retained unchanged in Sprint 02 as research evidence.
- This revised scenario has not been run. The experiment Docker daemon/app is unavailable, fixture creation and cleanup are NOT_VERIFIED, and the original candidate remains untouched.

## Required final review

Team Lead should approve or request another revision of this exact setup/action/oracle/teardown contract before adding it to the accepted execution set. Do not infer acceptance from Sprint 02 technical review or Sprint 03 implementation.
