#!/usr/bin/env bash
set -euo pipefail

repo_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

python3 "$repo_root/pipeline/test_data_contracts.py"
python3 "$repo_root/pipeline/test_getty_contracts.py"
python3 "$repo_root/pipeline/test_institutions.py"
python3 "$repo_root/pipeline/test_relationship_temporal.py"
python3 "$repo_root/pipeline/test_temporal.py"

cd "$repo_root/web"
npm run test:unit
npm run lint
npm run typecheck
npm run build
node perf/lineage-bench.mjs --ci
