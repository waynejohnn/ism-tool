#!/bin/bash
set -euo pipefail

ENV_FILE=""
TAG=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env-file)
      ENV_FILE="$2"
      shift 2
      ;;
    --tag)
      TAG="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

if [[ -z "$ENV_FILE" || ! -f "$ENV_FILE" ]]; then
  echo "Missing --env-file or file not found: $ENV_FILE"
  exit 1
fi

set -a
source "$ENV_FILE"
set +a

required=(
  GCP_PROJECT_ID
  GCP_REGION
  GCP_ARTIFACT_REPOSITORY
  BACKEND_SERVICE_NAME
  FRONTEND_SERVICE_NAME
)

for key in "${required[@]}"; do
  if [[ -z "${!key:-}" ]]; then
    echo "Missing required env var: $key"
    exit 1
  fi
done

TAG="${TAG:-${GITHUB_SHA:-$(date +%Y%m%d%H%M%S)}}"
REGISTRY_HOST="${GCP_REGION}-docker.pkg.dev"
BACKEND_IMAGE="${REGISTRY_HOST}/${GCP_PROJECT_ID}/${GCP_ARTIFACT_REPOSITORY}/backend:${TAG}"
FRONTEND_IMAGE="${REGISTRY_HOST}/${GCP_PROJECT_ID}/${GCP_ARTIFACT_REPOSITORY}/frontend:${TAG}"

if ! gcloud artifacts repositories describe "$GCP_ARTIFACT_REPOSITORY" --location "$GCP_REGION" --project "$GCP_PROJECT_ID" >/dev/null 2>&1; then
  gcloud artifacts repositories create "$GCP_ARTIFACT_REPOSITORY" \
    --repository-format=docker \
    --location="$GCP_REGION" \
    --description="Use case scoring images" \
    --project="$GCP_PROJECT_ID"
fi

gcloud auth configure-docker "$REGISTRY_HOST" --quiet

docker build -t "$BACKEND_IMAGE" ./backend
docker push "$BACKEND_IMAGE"

backend_deploy_args=(
  run deploy "$BACKEND_SERVICE_NAME"
  --image "$BACKEND_IMAGE"
  --project "$GCP_PROJECT_ID"
  --region "$GCP_REGION"
  --platform managed
  --allow-unauthenticated
)

if [[ -n "${BACKEND_SERVICE_ACCOUNT:-}" ]]; then
  backend_deploy_args+=(--service-account "$BACKEND_SERVICE_ACCOUNT")
fi

if [[ -n "${BACKEND_ENV_VARS:-}" ]]; then
  backend_deploy_args+=(--set-env-vars "$BACKEND_ENV_VARS")
fi

gcloud "${backend_deploy_args[@]}"

BACKEND_URL="$(gcloud run services describe "$BACKEND_SERVICE_NAME" --region "$GCP_REGION" --project "$GCP_PROJECT_ID" --format='value(status.url)')"

docker build -t "$FRONTEND_IMAGE" --build-arg "VITE_API_URL=${VITE_API_URL:-$BACKEND_URL}" ./frontend
docker push "$FRONTEND_IMAGE"

frontend_deploy_args=(
  run deploy "$FRONTEND_SERVICE_NAME"
  --image "$FRONTEND_IMAGE"
  --project "$GCP_PROJECT_ID"
  --region "$GCP_REGION"
  --platform managed
  --allow-unauthenticated
)

if [[ -n "${FRONTEND_SERVICE_ACCOUNT:-}" ]]; then
  frontend_deploy_args+=(--service-account "$FRONTEND_SERVICE_ACCOUNT")
fi

if [[ -n "${FRONTEND_ENV_VARS:-}" ]]; then
  frontend_deploy_args+=(--set-env-vars "$FRONTEND_ENV_VARS")
fi

gcloud "${frontend_deploy_args[@]}"

FRONTEND_URL="$(gcloud run services describe "$FRONTEND_SERVICE_NAME" --region "$GCP_REGION" --project "$GCP_PROJECT_ID" --format='value(status.url)')"

echo "Deployment completed"
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
