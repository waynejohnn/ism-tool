#!/bin/bash
# Wrapper script for Test/Staging deployment via shared ACA script
# Usage: ./deploy/tst/deploy-tst-aca.sh [--env-file .env.tst.aca.local] [other args...]

set -e

DEFAULT_ENV_FILE=".env.tst.aca.local"
ENV_FILE="$DEFAULT_ENV_FILE"
ARGS=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    *)
      ARGS+=("$1")
      shift
      ;;
  esac
done

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

bash "$REPO_ROOT/deploy/dev/deploy-dev-aca.sh" --env-file "$ENV_FILE" "${ARGS[@]}"
