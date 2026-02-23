#!/bin/bash
#
# Use Case Scoring App - ACA Dev Deployment Script (Linux/Bash)
# 
# This script automates deployment to Azure Container Apps in dev environment
# Compatible with Linux agents (Azure DevOps, GitHub Actions, etc.)
#
# Usage: ./deploy-dev-aca.sh [--env-file .env.dev.aca.local] [--skip-build] [--skip-resources] [--verbose]
#

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# ============================================
# FUNCTIONS
# ============================================

print_header() {
    echo ""
    echo -e "${CYAN}========================================"
    echo "  $1"
    echo "========================================${NC}"
    echo ""
}

print_step() {
    echo -e "${YELLOW}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
    exit 1
}

# Load environment file
load_env_file() {
    local env_file="$1"
    local sanitized_env
    
    if [ ! -f "$env_file" ]; then
        print_error "Environment file not found: $env_file"
    fi
    
    print_step "Loading environment from $env_file"

    # Normalize CRLF line endings and source env entries, handling comments and quotes
    sanitized_env="$(mktemp)"
    grep -v '^#' "$env_file" | grep -v '^$' | sed "s/'//g" | sed 's/"//g' | sed 's/\r$//' > "$sanitized_env"

    set -a
    source "$sanitized_env"
    set +a

    rm -f "$sanitized_env"
    
    print_success "Environment loaded"
}

# Validate required variables
validate_variables() {
    local required_vars=(
        "AZURE_SUBSCRIPTION_ID"
        "RESOURCE_GROUP"
        "AZURE_LOCATION"
        "REGISTRY_NAME"
        "REGISTRY_URL"
        "BACKEND_APP_NAME"
        "FRONTEND_APP_NAME"
        "JWT_SECRET"
        "CONTAINER_APP_ENVIRONMENT"
    )
    
    print_step "Validating required environment variables"
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            print_error "Missing required environment variable: $var"
        fi
    done
    
    print_success "All required variables present"
}

# ============================================
# MAIN SCRIPT
# ============================================

# Parse arguments
ENV_FILE="../../.env.dev.aca.local"
SKIP_BUILD=false
SKIP_RESOURCES=false
VERBOSE=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --env-file)
            ENV_FILE="$2"
            shift 2
            ;;
        --skip-build)
            SKIP_BUILD=true
            shift
            ;;
        --skip-resources)
            SKIP_RESOURCES=true
            shift
            ;;
        --verbose)
            VERBOSE=true
            shift
            ;;
        *)
            print_error "Unknown option: $1"
            ;;
    esac
done

# Load environment
load_env_file "$ENV_FILE"
validate_variables

# ============================================
# STEP 1: Azure Authentication
# ============================================

print_header "Step 1: Azure Authentication"

print_step "Logging into Azure..."
if az account show --query "user.name" &> /dev/null; then
    current_account=$(az account show --query "user.name" -o tsv)
    print_success "Already logged in as: $current_account"
else
    az login --subscription "$AZURE_SUBSCRIPTION_ID"
    print_success "Logged in successfully"
fi

az account set --subscription "$AZURE_SUBSCRIPTION_ID"
print_success "Subscription set to: $AZURE_SUBSCRIPTION_ID"

# ============================================
# STEP 2: Create Azure Resources
# ============================================

if [ "$SKIP_RESOURCES" != "true" ]; then
    print_header "Step 2: Creating Azure Resources"
    
    # Create resource group
    print_step "Creating resource group: $RESOURCE_GROUP"
    az group create \
        --name "$RESOURCE_GROUP" \
        --location "$AZURE_LOCATION" \
        --output none
    print_success "Resource group created"
    
    # Create container registry
    print_step "Creating container registry: $REGISTRY_NAME"
    az acr create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$REGISTRY_NAME" \
        --sku "$REGISTRY_SKU" \
        --output none 2>/dev/null || true
    print_success "Container registry created or already exists"
    
    # Create storage account
    print_step "Creating storage account: $STORAGE_ACCOUNT_NAME"
    az storage account create \
        --resource-group "$RESOURCE_GROUP" \
        --name "$STORAGE_ACCOUNT_NAME" \
        --location "$AZURE_LOCATION" \
        --sku "$STORAGE_ACCOUNT_SKU" \
        --output none 2>/dev/null || true
    print_success "Storage account created or already exists"
    
    # Create file share
    print_step "Creating file share: $FILE_SHARE_NAME"
    az storage share create \
        --account-name "$STORAGE_ACCOUNT_NAME" \
        --name "$FILE_SHARE_NAME" \
        --output none 2>/dev/null || true
    print_success "File share created or already exists"
    
    # Create container app environment
    print_step "Creating container app environment: $CONTAINER_APP_ENVIRONMENT"
    az containerapp env create \
        --name "$CONTAINER_APP_ENVIRONMENT" \
        --resource-group "$RESOURCE_GROUP" \
        --location "$AZURE_LOCATION" \
        --output none 2>/dev/null || true
    print_success "Container app environment created or already exists"
fi

# ============================================
# STEP 3: Build and Push Images
# ============================================

if [ "$SKIP_BUILD" != "true" ]; then
    print_header "Step 3: Building and Pushing Container Images"
    
    # Login to ACR
    print_step "Logging into Azure Container Registry..."
    az acr login --name "$REGISTRY_NAME"
    print_success "ACR login successful"
    
    # Build and push backend
    print_step "Building backend image: $BACKEND_IMAGE_FULL"
    docker build -t "$BACKEND_IMAGE_FULL" ../../backend
    print_success "Backend image built"
    
    print_step "Pushing backend image to registry..."
    docker push "$BACKEND_IMAGE_FULL"
    print_success "Backend image pushed"
    
    # Build and push frontend
    print_step "Building frontend image: $FRONTEND_IMAGE_FULL"
    docker build -t "$FRONTEND_IMAGE_FULL" ../../frontend
    print_success "Frontend image built"
    
    print_step "Pushing frontend image to registry..."
    docker push "$FRONTEND_IMAGE_FULL"
    print_success "Frontend image pushed"
fi

# ============================================
# STEP 4: Get Registry Credentials
# ============================================

print_header "Step 4: Retrieving Registry Credentials"

print_step "Getting registry username and password..."
registry_username=$(az acr credential show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$REGISTRY_NAME" \
    --query username -o tsv)

registry_password=$(az acr credential show \
    --resource-group "$RESOURCE_GROUP" \
    --name "$REGISTRY_NAME" \
    --query "passwords[0].value" -o tsv)

print_success "Registry credentials retrieved"

# ============================================
# STEP 5: Deploy Backend
# ============================================

print_header "Step 5: Deploying Backend Container App"

print_step "Creating/updating backend app: $BACKEND_APP_NAME"

az containerapp create \
    --name "$BACKEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$CONTAINER_APP_ENVIRONMENT" \
    --image "$BACKEND_IMAGE_FULL" \
    --registry-login-server "$REGISTRY_URL" \
    --registry-username "$registry_username" \
    --registry-password "$registry_password" \
    --ingress external \
    --target-port "$BACKEND_INGRESS_TARGET_PORT" \
    --cpu "$BACKEND_CPU" \
    --memory "$BACKEND_MEMORY" \
    --min-replicas "$BACKEND_MIN_REPLICAS" \
    --max-replicas "$BACKEND_MAX_REPLICAS" \
    --env-vars \
        FLASK_ENV="$FLASK_ENV" \
        JWT_SECRET="$JWT_SECRET" \
        DATABASE_URL="$DATABASE_URL" \
        PORT="$PORT" \
        CORS_ORIGINS="$CORS_ORIGINS" \
        GUNICORN_WORKERS="$GUNICORN_WORKERS" \
    --output none 2>/dev/null || \
az containerapp update \
    --name "$BACKEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$BACKEND_IMAGE_FULL" \
    --set-env-vars \
        FLASK_ENV="$FLASK_ENV" \
        JWT_SECRET="$JWT_SECRET" \
        DATABASE_URL="$DATABASE_URL" \
        PORT="$PORT" \
        CORS_ORIGINS="$CORS_ORIGINS" \
        GUNICORN_WORKERS="$GUNICORN_WORKERS" \
    --output none

print_success "Backend deployed successfully"

# ============================================
# STEP 6: Get Backend URL
# ============================================

print_step "Retrieving backend URL..."
backend_fqdn=$(az containerapp show \
    --name "$BACKEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.configuration.ingress.fqdn" -o tsv)

backend_url="https://$backend_fqdn"
print_success "Backend URL: $backend_url"

# ============================================
# STEP 7: Deploy Frontend
# ============================================

print_header "Step 7: Deploying Frontend Container App"

print_step "Creating/updating frontend app: $FRONTEND_APP_NAME"

az containerapp create \
    --name "$FRONTEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --environment "$CONTAINER_APP_ENVIRONMENT" \
    --image "$FRONTEND_IMAGE_FULL" \
    --registry-login-server "$REGISTRY_URL" \
    --registry-username "$registry_username" \
    --registry-password "$registry_password" \
    --ingress external \
    --target-port "$FRONTEND_INGRESS_TARGET_PORT" \
    --cpu "$FRONTEND_CPU" \
    --memory "$FRONTEND_MEMORY" \
    --min-replicas "$FRONTEND_MIN_REPLICAS" \
    --max-replicas "$FRONTEND_MAX_REPLICAS" \
    --env-vars \
        VITE_API_URL="$backend_url" \
        VITE_APP_TITLE="$VITE_APP_TITLE" \
        VITE_ENVIRONMENT="$VITE_ENVIRONMENT" \
    --output none 2>/dev/null || \
az containerapp update \
    --name "$FRONTEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --image "$FRONTEND_IMAGE_FULL" \
    --set-env-vars \
        VITE_API_URL="$backend_url" \
        VITE_APP_TITLE="$VITE_APP_TITLE" \
        VITE_ENVIRONMENT="$VITE_ENVIRONMENT" \
    --output none

print_success "Frontend deployed successfully"

# ============================================
# STEP 8: Get Frontend URL
# ============================================

print_step "Retrieving frontend URL..."
frontend_fqdn=$(az containerapp show \
    --name "$FRONTEND_APP_NAME" \
    --resource-group "$RESOURCE_GROUP" \
    --query "properties.configuration.ingress.fqdn" -o tsv)

frontend_url="https://$frontend_fqdn"
print_success "Frontend URL: $frontend_url"

# ============================================
# DEPLOYMENT COMPLETE
# ============================================

print_header "Deployment Complete!"

echo -e "${CYAN}📋 Deployment Summary:${NC}"
echo "  Resource Group: $RESOURCE_GROUP"
echo "  Region: $AZURE_LOCATION"
echo ""
echo -e "${CYAN}🌐 Application URLs:${NC}"
echo -e "  ${GREEN}Frontend: $frontend_url${NC}"
echo -e "  ${GREEN}Backend:  $backend_url${NC}"
echo ""
echo -e "${CYAN}📦 Container Images:${NC}"
echo "  Backend:  $BACKEND_IMAGE_FULL"
echo "  Frontend: $FRONTEND_IMAGE_FULL"
echo ""
echo -e "${CYAN}💡 Next Steps:${NC}"
echo "  1. Update backend CORS_ORIGINS with frontend URL"
echo "  2. Update frontend VITE_API_URL with backend URL (already set)"
echo "  3. Test application: $frontend_url"
echo "  4. Monitor logs: az containerapp logs show --name $BACKEND_APP_NAME --resource-group $RESOURCE_GROUP --follow"
echo ""
