#!/bin/bash

# Simple Azure Container Apps Deployment Script (Bash)
# Usage: ./deploy-aca-simple.sh --env-file ../../.env.dev.aca.local

set -euo pipefail

ENV_FILE="../../.env.dev.aca.local"

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

require_cmd() {
    if ! command -v "$1" >/dev/null 2>&1; then
        echo "Error: required command '$1' not found."
        exit 1
    fi
}

sanitize_container_app_name() {
    echo "$1" | tr '_' '-'
}

sanitize_file_share_name() {
    echo "$1" | tr '_' '-'
}

require_cmd az
require_cmd docker

# Load environment file
echo "Loading environment from $ENV_FILE..."
set -a
source <(grep -v '^#' "$ENV_FILE" | grep -v '^$')
set +a

BACKEND_APP_NAME_SAFE="$(sanitize_container_app_name "$BACKEND_APP_NAME")"
FRONTEND_APP_NAME_SAFE="$(sanitize_container_app_name "$FRONTEND_APP_NAME")"
FILE_SHARE_NAME_SAFE="$(sanitize_file_share_name "$FILE_SHARE_NAME")"

echo "Loaded config. Deploying to Azure..."
echo ""

# Step 1: Login
echo "Step 1: Logging into Azure..."
az login --tenant $AZURE_TENANT_ID
az account set --subscription $AZURE_SUBSCRIPTION_ID
echo "Login successful"
echo ""

# Step 2: Create Resource Group
echo "Step 2: Creating Resource Group..."
az group create --name $RESOURCE_GROUP --location $AZURE_LOCATION
echo ""

# Step 3: Create Container Registry
echo "Step 3: Creating Container Registry..."
if az acr show --resource-group "$RESOURCE_GROUP" --name "$REGISTRY_NAME" >/dev/null 2>&1; then
    echo "Container Registry already exists: $REGISTRY_NAME"
else
    az acr create --resource-group "$RESOURCE_GROUP" --name "$REGISTRY_NAME" --sku Basic
fi
echo ""

# Step 4: Login to ACR
echo "Step 4: Logging into Container Registry..."
az acr login --name $REGISTRY_NAME
echo ""

# Step 5: Build and Push Images
echo "Step 5: Building and Pushing Images..."
BACKEND_IMAGE="$REGISTRY_NAME.azurecr.io/$BACKEND_IMAGE_NAME:$BACKEND_IMAGE_TAG"
FRONTEND_IMAGE="$REGISTRY_NAME.azurecr.io/$FRONTEND_IMAGE_NAME:$FRONTEND_IMAGE_TAG"

echo "Building backend image..."
docker build -t "$BACKEND_IMAGE" ../../backend

echo "Pushing backend image..."
docker push "$BACKEND_IMAGE"

BACKEND_URL="$(az containerapp show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$BACKEND_APP_NAME_SAFE" \
    --query 'properties.configuration.ingress.fqdn' -o tsv 2>/dev/null || true)"

if [[ -n "$BACKEND_URL" ]]; then
    FRONTEND_API_URL="https://$BACKEND_URL"
else
    FRONTEND_API_URL="$VITE_API_URL"
fi

echo "Building frontend image..."
docker build \
    --build-arg VITE_API_URL="$FRONTEND_API_URL" \
    -t "$FRONTEND_IMAGE" ../../frontend

echo "Pushing frontend image..."
docker push "$FRONTEND_IMAGE"
echo ""

# Step 6: Create Storage Account
echo "Step 6: Creating Storage Account..."
if az storage account show --resource-group "$RESOURCE_GROUP" --name "$STORAGE_ACCOUNT_NAME" >/dev/null 2>&1; then
    echo "Storage Account already exists: $STORAGE_ACCOUNT_NAME"
else
    az storage account create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$STORAGE_ACCOUNT_NAME" \
        --location "$AZURE_LOCATION" \
        --sku "$STORAGE_ACCOUNT_SKU"
fi
echo ""

# Step 7: Create File Share
echo "Step 7: Creating File Share..."
STORAGE_KEY=$(az storage account keys list \
    --resource-group "$RESOURCE_GROUP" \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --query '[0].value' -o tsv)

if az storage share exists \
    --account-name "$STORAGE_ACCOUNT_NAME" \
    --account-key "$STORAGE_KEY" \
    --name "$FILE_SHARE_NAME_SAFE" \
    --query exists -o tsv | grep -qi true; then
    echo "File Share already exists: $FILE_SHARE_NAME_SAFE"
else
    az storage share create \
        --account-name "$STORAGE_ACCOUNT_NAME" \
        --account-key "$STORAGE_KEY" \
        --name "$FILE_SHARE_NAME_SAFE"
fi
echo ""

# Step 8: Create Container Apps Environment
echo "Step 8: Creating Container Apps Environment..."
if az containerapp env show --name "$CONTAINER_APP_ENVIRONMENT" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
    echo "Container Apps Environment already exists: $CONTAINER_APP_ENVIRONMENT"
else
    az containerapp env create \
        --name "$CONTAINER_APP_ENVIRONMENT" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$AZURE_LOCATION"
fi
echo ""

# Step 9: Deploy Backend
echo "Step 9: Deploying Backend..."
if az containerapp show --name "$BACKEND_APP_NAME_SAFE" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
    az containerapp update \
        --name "$BACKEND_APP_NAME_SAFE" \
        --resource-group "$RESOURCE_GROUP" \
        --image "$BACKEND_IMAGE" \
        --set-env-vars \
            FLASK_ENV="$FLASK_ENV" \
            JWT_SECRET="$JWT_SECRET" \
            DATABASE_URL="$DATABASE_URL" \
            CORS_ORIGINS="$CORS_ORIGINS" \
            GUNICORN_WORKERS="$GUNICORN_WORKERS"
else
    az containerapp create \
        --name "$BACKEND_APP_NAME_SAFE" \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$CONTAINER_APP_ENVIRONMENT" \
        --image "$BACKEND_IMAGE" \
        --target-port "$PORT" \
        --ingress external \
        --cpu "$BACKEND_CPU" \
        --memory "$BACKEND_MEMORY" \
        --min-replicas "$BACKEND_MIN_REPLICAS" \
        --max-replicas "$BACKEND_MAX_REPLICAS" \
        --env-vars \
            FLASK_ENV="$FLASK_ENV" \
            JWT_SECRET="$JWT_SECRET" \
            DATABASE_URL="$DATABASE_URL" \
            CORS_ORIGINS="$CORS_ORIGINS" \
            GUNICORN_WORKERS="$GUNICORN_WORKERS"
fi
echo ""

# Step 10: Deploy Frontend
echo "Step 10: Deploying Frontend..."
BACKEND_URL=$(az containerapp show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$BACKEND_APP_NAME_SAFE" \
    --query 'properties.configuration.ingress.fqdn' -o tsv)

if az containerapp show --name "$FRONTEND_APP_NAME_SAFE" --resource-group "$RESOURCE_GROUP" >/dev/null 2>&1; then
    az containerapp update \
        --name "$FRONTEND_APP_NAME_SAFE" \
        --resource-group "$RESOURCE_GROUP" \
        --image "$FRONTEND_IMAGE" \
        --set-env-vars VITE_API_URL="https://$BACKEND_URL"
else
    az containerapp create \
        --name "$FRONTEND_APP_NAME_SAFE" \
        --resource-group "$RESOURCE_GROUP" \
        --environment "$CONTAINER_APP_ENVIRONMENT" \
        --image "$FRONTEND_IMAGE" \
        --target-port 3000 \
        --ingress external \
        --cpu "$FRONTEND_CPU" \
        --memory "$FRONTEND_MEMORY" \
        --min-replicas "$FRONTEND_MIN_REPLICAS" \
        --max-replicas "$FRONTEND_MAX_REPLICAS" \
        --env-vars VITE_API_URL="https://$BACKEND_URL"
fi
echo ""

# Step 11: Get URLs
echo "========================================"
echo "DEPLOYMENT COMPLETE!"
echo "========================================"
echo ""

FRONTEND_URL=$(az containerapp show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$FRONTEND_APP_NAME_SAFE" \
    --query 'properties.configuration.ingress.fqdn' -o tsv)

echo "Application URLs:"
echo "  Backend:  https://$BACKEND_URL"
echo "  Frontend: https://$FRONTEND_URL"
echo ""
if [[ "$BACKEND_APP_NAME_SAFE" != "$BACKEND_APP_NAME" || "$FRONTEND_APP_NAME_SAFE" != "$FRONTEND_APP_NAME" || "$FILE_SHARE_NAME_SAFE" != "$FILE_SHARE_NAME" ]]; then
    echo "Name normalization applied:"
    echo "  BACKEND_APP_NAME: $BACKEND_APP_NAME -> $BACKEND_APP_NAME_SAFE"
    echo "  FRONTEND_APP_NAME: $FRONTEND_APP_NAME -> $FRONTEND_APP_NAME_SAFE"
    echo "  FILE_SHARE_NAME: $FILE_SHARE_NAME -> $FILE_SHARE_NAME_SAFE"
    echo ""
fi
echo "Next Steps:"
echo "  1. Update VITE_API_URL in .env.dev.aca.local with: https://$BACKEND_URL"
echo "  2. Redeploy frontend with updated API URL"
echo "  3. Open frontend URL in browser to test"
echo ""
