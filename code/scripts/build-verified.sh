#!/usr/bin/env bash
set -euo pipefail

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ "${SITES_ENV_READY:-}" != "1" ]]; then
  exec "${script_dir}/sites-env.sh" -- "$0" "$@"
fi

vinext="${SITES_PROJECT_ROOT}/node_modules/.bin/vinext"
if [[ ! -x "${vinext}" ]]; then
  echo "vinext is unavailable. Run npm run install:ci and wait for it to finish before building." >&2
  exit 69
fi

echo "Running bounded vinext build..."
if command -v timeout >/dev/null 2>&1; then
  timeout \
    --signal=TERM \
    --kill-after="${SITES_BUILD_KILL_AFTER:-10s}" \
    "${SITES_BUILD_TIMEOUT:-3m}" \
    "${vinext}" build
elif command -v gtimeout >/dev/null 2>&1; then
  gtimeout \
    --signal=TERM \
    --kill-after="${SITES_BUILD_KILL_AFTER:-10s}" \
    "${SITES_BUILD_TIMEOUT:-3m}" \
    "${vinext}" build
else
  echo "GNU timeout is unavailable; running the build without a watchdog."
  "${vinext}" build
fi

"${script_dir}/validate-artifact.sh"

# 生产环境以 `/zhuzi-world-v1` 这样的 basePath 对外，静态服务直接托管 dist/client。
# vinext 每次构建都会重建该目录，因此把前缀映射也作为构建产物的一部分恢复；否则主
# 页面能由应用进程返回，而 `/zhuzi-world-v1/siku/...` 等正文资源会全部 404。
if [[ -n "${NEXT_PUBLIC_BASE_PATH:-}" ]]; then
  base_path="${NEXT_PUBLIC_BASE_PATH#/}"
  base_path="${base_path%/}"
  if [[ -n "${base_path}" && "${base_path}" != *"/"* && "${base_path}" != "." && "${base_path}" != ".." ]]; then
    ln -sfn . "${SITES_PROJECT_ROOT}/dist/client/${base_path}"
    echo "Linked static base path: dist/client/${base_path} -> ."
  fi
fi
