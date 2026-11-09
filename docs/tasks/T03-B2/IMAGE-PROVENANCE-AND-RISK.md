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

Historical runs used an internal bridge. The current offline-only route-isolation candidate uses a non-internal bridge with IP masquerading disabled, exact labels/run ID, collision-checked IPAM, no bind mounts or volumes, a dormant container bootstrap with `HostConfig.Privileged=false` and no persistent `CapAdd`, loopback-only dynamic HTTP/Selenium ports, no published MySQL port, and the existing per-container memory/CPU/PID caps (1,280 MiB / 1.5 CPU for the app; 2,304 MiB / 2 CPU and 1 GiB shared memory for Selenium). After exact recorded-ID ownership inspection, one `docker exec --privileged --user 0 ... ip route del default` process is intended to remove each container network namespace default route. Docker defines `docker exec --privileged` as giving extended privileges to that process ([Docker exec reference](https://docs.docker.com/reference/cli/docker/container/exec/)); this is a bounded but material security exception. IPv4/IPv6 route absence and external egress blocking are required before service startup. This candidate remains unverified in Docker runtime because the latest memory gate was below 6 GiB. Native Docker and Maven commands use explicit executable paths; the Docker executable signature is checked, Maven/Java are resolved only under Program Files, and child PATH is restricted to system/Program Files directories without inheriting credential variables. Cleanup validates IDs, names, exact image references, complete labels, mount state, port bindings, and network endpoints before deleting only recorded resources. It blocks on any unknown inspect/daemon/permission failure or same-run residue. It never runs a global prune.

Image digest pinning establishes image identity. The later read-only layer comparison verified that the image base layer matches the complete official release archive byte-for-byte, while a later image layer modifies one application-code guard with unattributed origin. The image is therefore a customized derivative with partial provenance, not a pristine upstream release; see `CLAROLINE-SOURCE-PROVENANCE.md`.

## External lifecycle references

- PHP supported-branch lifecycle: [PHP supported versions](https://www.php.net/supported-versions.php).
- Ubuntu release support lifecycle: [Ubuntu release cycle](https://ubuntu.com/about/release-cycle).
- MySQL lifecycle reference used for risk context: [Oracle MySQL lifetime support chart](https://www.oracle.com/assets/lsp-tech-chart-069290.pdf).

## Registry-layer source comparison — 2026-11-09

A read-only Registry API inspection fetched the pinned manifest and verified all 15 compressed layer hashes against their descriptors. Image layer 8 contains all 1,630 files from the official Claroline 1.11.10 archive, with zero raw-byte mismatches. Later image layers add runtime configuration/cache and remove the installer directory. One later source file differs: `claroline/inc/lib/add_course.lib.inc.php`; the image comments out the 128-attempt guard for repeated course-identifier allocation. The image layer file hash is recorded in r14. The patch is pinned by the image digest but has no identified source commit or author. Treat the image as a customized derivative of the verified 1.11.10 source, not a pristine upstream build. No configuration contents or credentials were copied into evidence.

Evidence: `evidence/offline-verification-20261109-r14/registry-image-manifest.json`, `image-source-layer-comparison.json`, and `runtime-preflight.json`. The layer inspection did not create or alter Docker resources.

**Pending Team Lead decision:** whether this precisely pinned customized derivative is acceptable as the G0 runtime despite the unattributed application-code patch. No runtime manifest is promoted pending that decision and runtime verification.

The post-Sonar candidate stores service startup output in a fresh directory under each container user's home, created with `mktemp -d` and `umask 077` after checking that `$HOME` is a non-symlink directory. It validates the generated path before interpolating it into a shell command. The final offline checks are in `evidence/offline-verification-20261109-r57/`; there is no runtime proof yet.

## Team Lead Decisions A1 & P1 — 2026-11-10 (`offline-verification-20261110-r76`, `r77`, `t03b2-d-20261110-r6`)

1. **Decision 1 (`A1 — Host Firewall Isolation`: `linux-docker-user-bridge-reject-v1`)**:
   - Replaces `container-netns-default-route-drop-v1` (`docker exec --privileged --user 0 <id> /bin/sh -c 'ip route del default'`) with host-level bridge firewall isolation on the Google Cloud Ubuntu 24.04 VM (`bewt-covext-runner`), eliminating `docker exec --privileged` completely.
   - Active network policy: `published-bridge-host-firewall-reject-v1`; egress isolation method: `linux-docker-user-bridge-reject-v1`.
   - Verified host firewall environment on `bewt-covext-runner` (`c4d-highmem-8`, `IPV4_ONLY`):
     - Default IPv4 uplink interface (`ip -4 route show default`): `ens3` (`default via 10.148.0.1 dev ens3 proto dhcp src 10.148.0.3 metric 100`).
     - Default IPv6 routes (`ip -6 route show default`): `[]` (none; GCE `IPV4_ONLY` stack).
     - Firewall backend (`/usr/sbin/iptables --version`): `iptables v1.8.10 (nf_tables)` (`/usr/sbin/xtables-nft-multi`).
     - Run-owned kernel bridge interface: `br-<first12(networkId)>` (verified under `/sys/class/net/br-<id12>/bridge`; e.g., `br-19ec2e85b685` in `t03b2-d-20261110-r6`).
   - Unified `DOCKER-USER` rule specification:
     - Insert: `/usr/bin/sudo -n /usr/sbin/iptables -w 5 -I DOCKER-USER 1 -i br-<id12> ! -o br-<id12> -m conntrack ! --ctstate RELATED,ESTABLISHED -m comment --comment bewt-t03b2-<runId> -j REJECT --reject-with icmp-net-unreachable`
     - Check: `/usr/bin/sudo -n /usr/sbin/iptables -w 5 -C DOCKER-USER -i br-<id12> ! -o br-<id12> -m conntrack ! --ctstate RELATED,ESTABLISHED -m comment --comment bewt-t03b2-<runId> -j REJECT --reject-with icmp-net-unreachable`
     - Delete (rollback): `/usr/bin/sudo -n /usr/sbin/iptables -w 5 -D DOCKER-USER -i br-<id12> ! -o br-<id12> -m conntrack ! --ctstate RELATED,ESTABLISHED -m comment --comment bewt-t03b2-<runId> -j REJECT --reject-with icmp-net-unreachable`
   - Independent cryptographic authorization verifier (`verifyHostFirewallDecision` / `requestHostFirewallApproval`):
     - Requires a trusted Team Lead Ed25519 public key (`BEGIN PUBLIC KEY`), verified `approverId` and `approverRole: "Team Lead"`, exact match on `decisionId: "A1"`, `method`, `runId`, `networkId`, `bridgeInterface`, `uplinkInterface` (`ens3`), `commentTag`, `insertCommand`, `deleteCommand`, `maxExecutions: 1`, `scope`, and `rollback`, bounded validity window (`issuedAtUtc`/`expiresAtUtc` $\le 15$ minutes), and a 128-bit+ hex `nonce` tracked in a consumed-nonce replay ledger.
     - Fails closed (`BLOCKED_APPROVAL_REQUIRED`) before executing `sudo /usr/sbin/iptables` or `docker start` when no independent Team Lead Ed25519 public key and signed decision token are provisioned for the run.

2. **Decision 2 (`P1 — Accept Pinned BEWT Benchmark Image`)**:
   - Officially accepts `olianasd/claroline-strongpsw@sha256:a49cb592d9bb11fab615c01534d26f50389f7290682dd99e0d6d410cf7bb40af` with classification `BEWT_BENCHMARK_DERIVATIVE_PINNED`.
   - Explicitly records the 1-file patch in `var/www/html/claroline11110/claroline/inc/lib/add_course.lib.inc.php` between Layer 8 (`23,010` bytes, SHA-256 `fee57c4d67cecfda037948332b08d241f53b8ec530f9f8419aa375db31a846f1`) and Layer 13 (`23,040` bytes, SHA-256 `c3428b9e25fb76c85fc6976999f1fb3c0d5619a148bbf54805e1d2c96615a7b8`), which comments out 10 lines in `create_course_tables` (lines 382–389) and `fill_Db_course` (lines 557–562).
   - Promoted `config/apps/claroline.json` and recorded `applicationSourceCommit = "22d852f93081bc36b1d08b93f5e0c14b49a573f6"` and `applicationSourceVersion = "1.11.10-bewt-derivative"` in `run-record.json` (`t03b2-d-20261110-r6`).
