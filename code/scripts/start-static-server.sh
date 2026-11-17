#!/usr/bin/env bash
set -euo pipefail

project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${project_root}"
exec python3 scripts/static_server.py --port 7861 --bind 0.0.0.0 --directory dist/client
