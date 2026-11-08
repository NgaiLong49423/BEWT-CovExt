# Bludit Source and Image Provenance

## Pins

- BEWT repository commit: `0501249ff3e9a5ea83a06155cd2971dc36197056`.
- Original suite: `bludit/baseline/bludit-2.3.4`; committed tree `b9feb56ef7db714571d91ba7e17f35ac4ccb4614`.
- Bludit source release commit supplied by the task: `44de235a5eedda9b80d9f0babd9fd5cb8c6943bd` (`2.3.4`). The container reports `BLUDIT_VERSION` as `2.3.4` at [observed-container-version.txt](evidence/t03b1-a-20261108-r4/observed-container-version.txt).
- Application image: `bludit/docker:2.3.4`, registry digest and local image ID `sha256:fa1bfd57ced7638676cef221907cc43d14ec37aa2393e57f2ddd925df3f4fae9`, Linux/amd64. It exposes `80/tcp` and declares no volumes. See [image inspection](evidence/environment/image-inspection.json) and each run's [manifest](evidence/t03b1-a-20261108-r4/runtime-manifest.json) plus [SHA-256](evidence/t03b1-a-20261108-r4/runtime-manifest.sha256).
- Browser image: `selenium/standalone-chrome:4.34.0`, digest `sha256:bcb1d054f3c88ef618cd92a8124d894038fb5f670bf7d427f5e5bbb60882b6f6`; Selenium Grid reported ready, Chrome 138.0 and Selenium 4.34.0. The same image digest was used in both final runs.

## Verification boundary

The BEWT source checkout resolved to the pinned commit, and the selected original Bludit suite had no local modifications. A direct `git ls-remote` against GitHub could not resolve `github.com` in this environment. The release commit above is retained from the task's verified pin; this report does not claim that the Docker image was built from that source commit. The image digest was independently obtained from Docker Registry, and the running container's Bludit version was observed as 2.3.4.

Evidence: [source tree comparison](evidence/source-tree-comparison.json), [container events and ownership labels, Run A](evidence/t03b1-a-20261108-r4/docker-events.jsonl), [Run B](evidence/t03b1-b-20261108-r1/docker-events.jsonl), and [browser/image preflight](evidence/environment/selenium-runtime-preflight.json).

