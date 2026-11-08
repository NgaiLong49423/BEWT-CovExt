# Kanboard Source and Image Provenance

## Source

- BEWT repository: `bewt-original/` (read-only input)
- Pinned BEWT commit: `0501249ff3e9a5ea83a06155cd2971dc36197056`
- Upstream Kanboard commit: `00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b`
- Upstream reference: [Kanboard commit 00a8b2d](https://github.com/kanboard/kanboard/commit/00a8b2d7ea55ee43e92e0e9eb193ce1e915d146b)
- Working copy: `experiments/kanboard/bewt-suite`, extracted from a Git archive of the pinned commit.
- Source changes are limited to the G0 adapter in `src/test/java/tests/BaseTest.java`: configurable base URL and removal of a fixed browser version. The original test logic and target `tests.AddNewProject` remain unchanged.

## Image

Registry manifest lookup and `docker pull` for `kanboard/kanboard:v1.2.15` succeeded. The Linux/amd64 registry digest is `sha256:e2fd04bcb9dd2c5ddaa58a260a8b53ba28a0ab8ac5d15eaebd1a9d699b13a52e`. The local image ID and repo digest were recorded separately and both observed as that value. The image reports Linux/amd64 and declares mounts at `/etc/nginx/ssl`, `/var/www/app/data` and `/var/www/app/plugins`; each run received separate explicitly named volumes.

The running image's built-in `php /var/www/app/cli version` command reported `v1.2.15` in both runs. Image identity and source commit are reported as independent provenance facts; the tag alone is not treated as proof of source commit. The validated runtime manifest is `evidence/kanboard-runtime-manifest.json`; each run records its SHA-256 in `provenance.json`.
