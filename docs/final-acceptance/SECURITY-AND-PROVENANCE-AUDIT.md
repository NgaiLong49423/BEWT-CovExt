# Security and Provenance Audit

## Provenance

- Current outer repository baseline: `da6399536ff75a1edf4417819eb4d166cc1d781c`.
- Nested BEWT source baseline: `0501249ff3e9a5ea83a06155cd2971dc36197056`; pre-existing generated build/Gradle files are dirty. No reset, cleanup, or edits were performed there.
- G0/G3 run records do not record the source commit, test source hash, image digest, runtime manifest, Java version, or Docker version. G3 records also use `g0-<app>` task labels.
- Dataset Java source SHA-256 mismatches the actual class for JO-GAP-004; its `registration.json` hash matches the observed file instead.
- `extension/expresscart` manifest lacks `imageDigest`.

## Credential scan

A secret-safe scan found literal credential arguments in ten Revision 2 login calls: five Claroline and five Kanboard classes. Values are intentionally omitted from this report. The scan does not establish whether these test credentials are also used outside the fixture. Preserve Revision 2 and assess rotation privately if any value is confirmed to be real.

Security-only Revision 3 copies were created for those ten candidates. Login values now come from required Java system properties or environment variables (`CLAROLINE_TEST_USERNAME`, `CLAROLINE_TEST_PASSWORD`, `KANBOARD_TEST_USERNAME`, `KANBOARD_TEST_PASSWORD`); missing values fail closed. Each copy has a registration record with the observed source hash. These revisions were not compiled or executed, and their semantic defects remain unchanged. No equivalent credential literals were found in PrestaShop test login calls; its generated classes pass shared `adminMail`/`adminPsw` variables.

No credential values were printed in audit output. No secrets or local environment files were staged or committed.
