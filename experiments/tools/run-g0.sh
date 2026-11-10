#!/bin/bash
set -euo pipefail
cd /home/runner/BEWT-CovExt
exec node experiments/tools/run-all-g0-cloud.mjs "$@"
