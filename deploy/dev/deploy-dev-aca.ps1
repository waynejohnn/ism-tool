#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Use Case Scoring Application to Azure Container Apps (Dev Environment)

.DESCRIPTION
    This script automates the deployment of the Use Case Scoring Application
    to Azure Container Apps in the dev environment with all necessary components.

.PARAMETER EnvFile
    Path to environment configuration file (default: .env.dev.aca.local)

.PARAMETER SkipImageBuild
    Skip building and pushing Docker images

.PARAMETER SkipResourceCreation
    Skip Azure resource creation (assumes resources exist)

.EXAMPLE
    .\deploy-dev-aca.ps1 -EnvFile .env.dev.aca.local
#>

param(
    [Parameter(Mandatory=$false)]
    [string]$EnvFile = "../../.env.dev.aca.local",
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipImageBuild = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$SkipResourceCreation = $false,
    
    [Parameter(Mandatory=$false)]
    [switch]$Verbose = $false
)

$ErrorActionPreference = "Stop"
$VerbosePreference = if ($Verbose) { "Continue" } else { "SilentlyContinue" }

# ============================================
# FUNCTIONS
# ============================================

function Write-Header {
    param([string]$Message)
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
}

function Write-Step {
    param([string]$Message)
    Write-Host "▶ $Message" -ForegroundColor Yellow
}

function Write-Success {
    param([string]$Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error-Custom {
    param([string]$Message)
    Write-Host "✗ $Message" -ForegroundColor Red
    exit 1
}

function Load-EnvFile {
    param([string]$FilePath)
    if (-not (Test-Path $FilePath)) {
        Write-Error-Custom "Environment file not found: $FilePath"
    }
    
    Write-Step "Loading environment from $FilePath"
    $envVars = @{}
    Get-Content $FilePath | ForEach-Object {
        if ($_ -match '^\s*([^#=]+)=(.*)$') {
            $key = $matches[1].Trim()
            $value = $matches[2].Trim()
            $value = $value -replace '^"(.*)"$', '$1'
            $value = $value -replace "^'(.*)'$", '$1'
            $envVars[$key] = $value
        }
    }
    Write-Success "Environment loaded ($($envVars.Count) variables)"
    return $envVars
}

# ============================================
# MAIN SCRIPT
# ============================================

Write-Header "Use Case Scoring App - ACA Dev Deployment"

# Load environment
$env = Load-EnvFile -FilePath $EnvFile

# Verify required environment variables
$requiredVars = @(
    "AZURE_SUBSCRIPTION_ID",
    "RESOURCE_GROUP",
    "AZURE_LOCATION",
    "REGISTRY_NAME",
    "REGISTRY_URL",
    "BACKEND_APP_NAME",
    "FRONTEND_APP_NAME",
    "JWT_SECRET",
    "CONTAINER_APP_ENVIRONMENT"
)

Write-Step "Validating required environment variables"
foreach ($var in $requiredVars) {
    if ([string]::IsNullOrEmpty($env[$var])) {
        Write-Error-Custom "Missing required environment variable: $var"
    }
}
Write-Success "All required variables present"

# ============================================
# STEP 1: Azure Authentication
# ============================================

Write-Header "Step 1: Azure Authentication"

Write-Step "Logging into Azure..."
try {
    $currentAccount = az account show --query "user.name" -o tsv 2>$null
    Write-Success "Already logged in as: $currentAccount"
} catch {
    az login --subscription $env.AZURE_SUBSCRIPTION_ID
    Write-Success "Logged in successfully"
}

az account set --subscription $env.AZURE_SUBSCRIPTION_ID
Write-Success "Subscription set to: $($env.AZURE_SUBSCRIPTION_ID)"

# ============================================
# STEP 2: Create Azure Resources
# ============================================

if (-not $SkipResourceCreation) {
    Write-Header "Step 2: Creating Azure Resources"
    
    # Create resource group
    Write-Step "Creating resource group: $($env.RESOURCE_GROUP)"
    az group create `
        --name $env.RESOURCE_GROUP `
        --location $env.AZURE_LOCATION | Out-Null
    Write-Success "Resource group created"
    
    # Create container registry
    Write-Step "Creating container registry: $($env.REGISTRY_NAME)"
    az acr create `
        --resource-group $env.RESOURCE_GROUP `
        --name $env.REGISTRY_NAME `
        --sku $env.REGISTRY_SKU | Out-Null
    Write-Success "Container registry created"
    
    # Create storage account
    Write-Step "Creating storage account: $($env.STORAGE_ACCOUNT_NAME)"
    az storage account create `
        --resource-group $env.RESOURCE_GROUP `
        --name $env.STORAGE_ACCOUNT_NAME `
        --location $env.AZURE_LOCATION `
        --sku $env.STORAGE_ACCOUNT_SKU | Out-Null
    Write-Success "Storage account created"
    
    # Create file share
    Write-Step "Creating file share: $($env.FILE_SHARE_NAME)"
    az storage share create `
        --account-name $env.STORAGE_ACCOUNT_NAME `
        --name $env.FILE_SHARE_NAME | Out-Null
    Write-Success "File share created"
    
    # Create container app environment
    Write-Step "Creating container app environment: $($env.CONTAINER_APP_ENVIRONMENT)"
    az containerapp env create `
        --name $env.CONTAINER_APP_ENVIRONMENT `
        --resource-group $env.RESOURCE_GROUP `
        --location $env.AZURE_LOCATION | Out-Null
    Write-Success "Container app environment created"
}

# ============================================
# STEP 3: Build and Push Images
# ============================================

if (-not $SkipImageBuild) {
    Write-Header "Step 3: Building and Pushing Container Images"
    
    # Login to ACR
    Write-Step "Logging into Azure Container Registry..."
    az acr login --name $env.REGISTRY_NAME
    Write-Success "ACR login successful"
    
    # Build and push backend
    Write-Step "Building backend image: $($env.BACKEND_IMAGE_FULL)"
    docker build -t $env.BACKEND_IMAGE_FULL ../../backend
    Write-Success "Backend image built"
    
    Write-Step "Pushing backend image to registry..."
    docker push $env.BACKEND_IMAGE_FULL
    Write-Success "Backend image pushed"
    
    # Build and push frontend
    Write-Step "Building frontend image: $($env.FRONTEND_IMAGE_FULL)"
    docker build -t $env.FRONTEND_IMAGE_FULL ../../frontend
    Write-Success "Frontend image built"
    
    Write-Step "Pushing frontend image to registry..."
    docker push $env.FRONTEND_IMAGE_FULL
    Write-Success "Frontend image pushed"
}

# ============================================
# STEP 4: Get Registry Credentials
# ============================================

Write-Header "Step 4: Retrieving Registry Credentials"

Write-Step "Getting registry username and password..."
$registryUsername = az acr credential show `
    --resource-group $env.RESOURCE_GROUP `
    --name $env.REGISTRY_NAME `
    --query username -o tsv

$registryPassword = az acr credential show `
    --resource-group $env.RESOURCE_GROUP `
    --name $env.REGISTRY_NAME `
    --query "passwords[0].value" -o tsv

Write-Success "Registry credentials retrieved"

# ============================================
# STEP 5: Deploy Backend
# ============================================

Write-Header "Step 5: Deploying Backend Container App"

Write-Step "Creating/updating backend app: $($env.BACKEND_APP_NAME)"
az containerapp create `
    --name $env.BACKEND_APP_NAME `
    --resource-group $env.RESOURCE_GROUP `
    --environment $env.CONTAINER_APP_ENVIRONMENT `
    --image $env.BACKEND_IMAGE_FULL `
    --registry-login-server $env.REGISTRY_URL `
    --registry-username $registryUsername `
    --registry-password $registryPassword `
    --ingress external `
    --target-port $env.BACKEND_INGRESS_TARGET_PORT `
    --cpu $env.BACKEND_CPU `
    --memory $env.BACKEND_MEMORY `
    --min-replicas $env.BACKEND_MIN_REPLICAS `
    --max-replicas $env.BACKEND_MAX_REPLICAS `
    --env-vars `
        FLASK_ENV="$($env.FLASK_ENV)" `
        JWT_SECRET="$($env.JWT_SECRET)" `
        DATABASE_URL="$($env.DATABASE_URL)" `
        PORT="$($env.PORT)" `
        CORS_ORIGINS="$($env.CORS_ORIGINS)" `
        GUNICORN_WORKERS="$($env.GUNICORN_WORKERS)" `
    --set-env-vars `
        FLASK_ENV="$($env.FLASK_ENV)" `
        JWT_SECRET="$($env.JWT_SECRET)" `
        DATABASE_URL="$($env.DATABASE_URL)" `
        PORT="$($env.PORT)" `
        CORS_ORIGINS="$($env.CORS_ORIGINS)" `
        GUNICORN_WORKERS="$($env.GUNICORN_WORKERS)" `
    2>$null || `
az containerapp update `
    --name $env.BACKEND_APP_NAME `
    --resource-group $env.RESOURCE_GROUP `
    --image $env.BACKEND_IMAGE_FULL `
    --set-env-vars `
        FLASK_ENV="$($env.FLASK_ENV)" `
        JWT_SECRET="$($env.JWT_SECRET)" `
        DATABASE_URL="$($env.DATABASE_URL)" `
        PORT="$($env.PORT)" `
        CORS_ORIGINS="$($env.CORS_ORIGINS)" `
        GUNICORN_WORKERS="$($env.GUNICORN_WORKERS)" | Out-Null

Write-Success "Backend deployed successfully"

# ============================================
# STEP 6: Get Backend URL
# ============================================

Write-Step "Retrieving backend URL..."
$backendFqdn = az containerapp show `
    --name $env.BACKEND_APP_NAME `
    --resource-group $env.RESOURCE_GROUP `
    --query "properties.configuration.ingress.fqdn" -o tsv

$backendUrl = "https://$backendFqdn"
Write-Success "Backend URL: $backendUrl"

# ============================================
# STEP 7: Deploy Frontend
# ============================================

Write-Header "Step 7: Deploying Frontend Container App"

Write-Step "Creating/updating frontend app: $($env.FRONTEND_APP_NAME)"
az containerapp create `
    --name $env.FRONTEND_APP_NAME `
    --resource-group $env.RESOURCE_GROUP `
    --environment $env.CONTAINER_APP_ENVIRONMENT `
    --image $env.FRONTEND_IMAGE_FULL `
    --registry-login-server $env.REGISTRY_URL `
    --registry-username $registryUsername `
    --registry-password $registryPassword `
    --ingress external `
    --target-port $env.FRONTEND_INGRESS_TARGET_PORT `
    --cpu $env.FRONTEND_CPU `
    --memory $env.FRONTEND_MEMORY `
    --min-replicas $env.FRONTEND_MIN_REPLICAS `
    --max-replicas $env.FRONTEND_MAX_REPLICAS `
    --env-vars `
        VITE_API_URL="$backendUrl" `
        VITE_APP_TITLE="$($env.VITE_APP_TITLE)" `
        VITE_ENVIRONMENT="$($env.VITE_ENVIRONMENT)" `
    --set-env-vars `
        VITE_API_URL="$backendUrl" `
        VITE_APP_TITLE="$($env.VITE_APP_TITLE)" `
        VITE_ENVIRONMENT="$($env.VITE_ENVIRONMENT)" `
    2>$null || `
az containerapp update `
    --name $env.FRONTEND_APP_NAME `
    --resource-group $env.RESOURCE_GROUP `
    --image $env.FRONTEND_IMAGE_FULL `
    --set-env-vars `
        VITE_API_URL="$backendUrl" `
        VITE_APP_TITLE="$($env.VITE_APP_TITLE)" `
        VITE_ENVIRONMENT="$($env.VITE_ENVIRONMENT)" | Out-Null

Write-Success "Frontend deployed successfully"

# ============================================
# STEP 8: Get Frontend URL
# ============================================

Write-Step "Retrieving frontend URL..."
$frontendFqdn = az containerapp show `
    --name $env.FRONTEND_APP_NAME `
    --resource-group $env.RESOURCE_GROUP `
    --query "properties.configuration.ingress.fqdn" -o tsv

$frontendUrl = "https://$frontendFqdn"
Write-Success "Frontend URL: $frontendUrl"

# ============================================
# DEPLOYMENT COMPLETE
# ============================================

Write-Header "Deployment Complete!"

Write-Host "📋 Deployment Summary:" -ForegroundColor Cyan
Write-Host "  Resource Group: $($env.RESOURCE_GROUP)" -ForegroundColor White
Write-Host "  Region: $($env.AZURE_LOCATION)" -ForegroundColor White
Write-Host ""
Write-Host "🌐 Application URLs:" -ForegroundColor Cyan
Write-Host "  Frontend: $frontendUrl" -ForegroundColor Green
Write-Host "  Backend:  $backendUrl" -ForegroundColor Green
Write-Host ""
Write-Host "📦 Container Images:" -ForegroundColor Cyan
Write-Host "  Backend:  $($env.BACKEND_IMAGE_FULL)" -ForegroundColor White
Write-Host "  Frontend: $($env.FRONTEND_IMAGE_FULL)" -ForegroundColor White
Write-Host ""
Write-Host "💡 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Update backend CORS_ORIGINS with frontend URL" -ForegroundColor White
Write-Host "  2. Update frontend VITE_API_URL with backend URL (already set)" -ForegroundColor White
Write-Host "  3. Test application: $frontendUrl" -ForegroundColor White
Write-Host "  4. Monitor logs: az containerapp logs show --name $($env.BACKEND_APP_NAME) --resource-group $($env.RESOURCE_GROUP) --follow" -ForegroundColor White
Write-Host ""
