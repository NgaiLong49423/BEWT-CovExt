# Claroline image provenance and risk

## Pinned image

- Registry reference: `olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af`
- Registry metadata: Linux amd64; root index/platform digest was inspected before pinning.
- Local image ID: recorded in `evidence/preflight-image-20261109/container-inspect.json` and registry metadata in `docker-before.json`.
- Entrypoint: `./run-services-docker.sh`; command `bash`; working directory `/home/claroline`.
- Image declares TCP 80 and 3306, no volumes and no labels. Runtime plan never publishes 3306.
- Image creation time: 2025-04-08T14:56:55Z; expanded image size 876,914,820 bytes; no Dockerfile/source provenance was available in image metadata.

## Observed legacy packages

Read-only inspection of the stopped image found Apache `2.4.7-1ubuntu4.20`, PHP `5.5.9+dfsg-1ubuntu4.26`, MySQL `5.5.61-0ubuntu0.14.04.1`, and Ubuntu 14.04-era package metadata. This is an author-published BEWT image, not an image built or signed by this project. It runs as the image default user (root when no user is configured). Its legacy components and unknown build provenance make it suitable only for tightly isolated local feasibility evaluation, not production use.

The image was pulled by immutable digest and inspected. A preflight-only stopped container was created and then removed; its cleanup was verified with an exact Docker NOT_FOUND response. No app service or Selenium run was started during this preflight.

The preflight package evidence records the observed versions. The `os-release` parsing in the first metadata capture was incomplete; “Ubuntu 14.04-era” is an inference from the package version suffix, not a separately verified release string. The follow-up did not alter the original capture.

## Selenium pin

Proposed browser pin: `selenium/standalone-chrome@sha256:07392595426553888046f795b66ea942ff7d2e185e9aecb1dd61bbbd5bfead8f` (Linux amd64 manifest corresponding to the Selenium Java 4.35.0 generation). It is not considered runtime-verified until the runtime harness inspects and starts it.

## Runtime containment

The runner is constrained to an internal bridge network, unique full ownership labels and run ID, no bind mounts or volumes, no privileged mode or Docker socket, loopback-only dynamic HTTP/Selenium ports, no published MySQL port, and per-container memory/CPU/PID caps (1,280 MiB / 1.5 CPU for the app; 2,304 MiB / 2 CPU and 1 GiB shared memory for Selenium). Native Docker and Maven commands use explicit executable paths; the Docker executable signature is checked, Maven/Java are resolved only under Program Files, and child PATH is restricted to system/Program Files directories without inheriting credential variables. Cleanup validates IDs, names, exact image references, complete labels, mount state, port bindings, and network endpoints before deleting only recorded resources. It blocks on any unknown inspect/daemon/permission failure or same-run residue. It never runs a global prune.

Image digest pinning establishes image identity, not source release equivalence. Source provenance remains blocked; see `CLAROLINE-SOURCE-PROVENANCE.md`.

## External lifecycle references

- PHP supported-branch lifecycle: [PHP supported versions](https://www.php.net/supported-versions.php).
- Ubuntu release support lifecycle: [Ubuntu release cycle](https://ubuntu.com/about/release-cycle).
- MySQL lifecycle reference used for risk context: [Oracle MySQL lifetime support chart](https://www.oracle.com/assets/lsp-tech-chart-069290.pdf).
