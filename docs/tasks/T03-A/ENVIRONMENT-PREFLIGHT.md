# Environment Preflight

Preflight was captured on 2026-11-08. Sanitized machine evidence is stored in `evidence/preflight/`.

| Dependency | Observed | Status |
|---|---|---|
| Windows | Windows 11 Home, AMD64 | AVAILABLE |
| Java | 21.0.12 | AVAILABLE |
| Maven | 3.9.16 | AVAILABLE |
| Node.js | 24.19.0 | AVAILABLE |
| Chrome | 156.0.8078.80 | AVAILABLE |
| Docker CLI | 29.8.0, context `desktop-linux` | CLIENT_AVAILABLE |
| Docker Linux engine | Docker Engine 29.8.0, Linux x86_64, 16 CPUs, 6.67 GiB daemon memory | AVAILABLE |
| Free host RAM after user memory freeing | 3.48 GiB of 13.79 GiB | AVAILABLE WITH RESOURCE LIMITS |
| Registry manifest | `kanboard/kanboard:v1.2.15` query succeeded | AVAILABLE |

The engine became available after the user started Docker Desktop. The initial read-only inventory found other projects' resources, including two running ExpressCart containers. A later intermediate inventory captured T01-B run resources; Docker destroy events and fingerprint comparison showed two T01-B containers, one network and two volumes removed during the user's memory-freeing window. T03-A issued no destroy command for them. The settled prestart inventory was stable across two consecutive full fingerprint snapshots at 33 containers (2 running), 12 networks, 27 volumes and 19 images; this snapshot includes only T03-A's labeled, not-yet-started resources. See `evidence/preflight/docker-inventory-change-review.json` and the Run A evidence. No ExpressCart or other remaining project resource was modified.

The Kanboard image was pulled by immutable linux/amd64 digest and inspected locally. Runtime was limited to 768 MiB and 1.5 CPUs, with loopback-only dynamic publishing and run-scoped labeled storage. Both Selenium runs, reset verification and teardown completed successfully.



