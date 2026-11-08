# Environment Preflight

- Base branch was fetched and verified at `708724fee47e5136d628c479a5a0f90ab0ea15d7`; work was isolated on `feature/t03b1-bludit-g0`.
- Docker Desktop engine: Linux, 16 CPUs, 7,157,481,472 bytes Docker memory limit. Host preflight reported 3,953,720 KiB free physical memory.
- The pinned Bludit image was not initially local. `docker pull bludit/docker:2.3.4` succeeded and returned the pinned registry digest. A separate Selenium 4.34.0 browser image was pulled because the host has no Chrome installation.
- Existing Docker resources, including the running ExpressCart experiment, were inventoried before both final runs. Each run used a new labeled bridge network, app container, and browser container. App port 80 and Selenium port 4444 were dynamically published on `127.0.0.1` only.
- Neither image declares Docker volumes. Each app container therefore used its own fresh writable layer. No fixed host port, LAN bind, global prune, volume prune, or resource belonging to another task was used.
- Post-run inventory comparisons show no pre-existing container, network, volume, or image was removed, no unrecorded container was added, and both run networks/containers are absent. See [Run A](evidence/t03b1-a-20261108-r4/docker-before.json), [Run A comparison](evidence/t03b1-a-20261108-r4/docker-reset-comparison.json), [Run B](evidence/t03b1-b-20261108-r1/docker-before.json), and [Run B comparison](evidence/t03b1-b-20261108-r1/docker-reset-comparison.json).
