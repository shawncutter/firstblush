#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="${ROOT_DIR}/.env"

if [[ ! -f "${ENV_FILE}" ]]; then
  cp "${ROOT_DIR}/.env.example" "${ENV_FILE}"
  echo "Created ${ENV_FILE} from .env.example"
fi

# shellcheck disable=SC1090
source "${ENV_FILE}"

required_ports=(
  "${WEB_HOST_PORT:?WEB_HOST_PORT missing}"
  "${API_HOST_PORT:?API_HOST_PORT missing}"
  "${POSTGRES_HOST_PORT:?POSTGRES_HOST_PORT missing}"
  "${REDIS_HOST_PORT:?REDIS_HOST_PORT missing}"
  "${MINIO_API_HOST_PORT:?MINIO_API_HOST_PORT missing}"
  "${MINIO_CONSOLE_HOST_PORT:?MINIO_CONSOLE_HOST_PORT missing}"
)

has_conflict=0

for port in "${required_ports[@]}"; do
  if lsof -nP -iTCP:"${port}" -sTCP:LISTEN >/dev/null 2>&1; then
    echo "Port conflict: ${port} is already in use on this host."
    has_conflict=1
  fi
done

if [[ "${has_conflict}" -eq 1 ]]; then
  cat <<'EOF'
Update the conflicting values in .env, then run scripts/dev-up.sh again.
EOF
  exit 1
fi

cd "${ROOT_DIR}"
docker-compose up -d --build
