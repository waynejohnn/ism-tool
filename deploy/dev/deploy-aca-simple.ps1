#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Simple Azure Container Apps Deployment Script
    
.DESCRIPTION
    Deploys Use Case Scoring App to Azure Container Apps
    
.PARAMETER EnvFile
    Path to environment file (default: .env.dev.aca.local)
    
.EXAMPLE
    ./deploy-aca-simple.ps1 -EnvFile .env.dev.aca.local
#>

param(
    [string]$EnvFile = "../../.env.dev.aca.local"
)

$ErrorActionPreference = 'Stop'

function Sanitize-ContainerAppName {
    param([string]$Name)
    return ($Name -replace '_', '-')
}

function Sanitize-FileShareName {
    param([string]$Name)
    return ($Name -replace '_', '-')
}

# Load environment variables
Write-Host "Loading environment from $EnvFile..." -ForegroundColor Cyan
$env_vars = @{}
Get-Content $EnvFile | ForEach-Object {
    if ($_ -match '^\s*([^#=]+)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim()
        $value = $value -replace '^"(.*)"$', '$1'
        $value = $value -replace "^'(.*)'$", '$1'
        $env_vars[$key] = $value
    }
}
Write-Host "Loaded $(($env_vars.Count)) variables" -ForegroundColor Green

# Extract variables
$subscription = $env_vars['AZURE_SUBSCRIPTION_ID']
$tenant = $env_vars['AZURE_TENANT_ID']
$location = $env_vars['AZURE_LOCATION']
$rg = $env_vars['RESOURCE_GROUP']
$registry = $env_vars['REGISTRY_NAME']
$storage = $env_vars['STORAGE_ACCOUNT_NAME']
$backend_app = Sanitize-ContainerAppName $env_vars['BACKEND_APP_NAME']
$frontend_app = Sanitize-ContainerAppName $env_vars['FRONTEND_APP_NAME']
$file_share = Sanitize-FileShareName $env_vars['FILE_SHARE_NAME']

Write-Host "`nDeployment Configuration:" -ForegroundColor Cyan
Write-Host "  Subscription: $subscription"
Write-Host "  Tenant: $tenant"
Write-Host "  Location: $location"
Write-Host "  Resource Group: $rg"
Write-Host "  Registry: $registry"
Write-Host "  Storage: $storage"
Write-Host ""

# Step 1: Login to Azure
Write-Host "Step 1: Logging into Azure..." -ForegroundColor Cyan
az login --tenant $tenant
az account set --subscription $subscription
Write-Host "Login successful" -ForegroundColor Green

# Step 2: Create Resource Group
Write-Host "`nStep 2: Creating Resource Group..." -ForegroundColor Cyan
az group create --name $rg --location $location
Write-Host "Resource Group created" -ForegroundColor Green

# Step 3: Create Container Registry
Write-Host "`nStep 3: Creating Container Registry..." -ForegroundColor Cyan
az acr show --resource-group $rg --name $registry --only-show-errors 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Container Registry already exists" -ForegroundColor Yellow
}
else {
    az acr create --resource-group $rg --name $registry --sku Basic
    Write-Host "Container Registry created" -ForegroundColor Green
}

# Step 4: Login to ACR
Write-Host "`nStep 4: Logging into Container Registry..." -ForegroundColor Cyan
az acr login --name $registry
Write-Host "ACR login successful" -ForegroundColor Green

# Step 5: Build and Push Images
Write-Host "`nStep 5: Building Docker Images..." -ForegroundColor Cyan
$backend_image = "$registry.azurecr.io/$($env_vars['BACKEND_IMAGE_NAME']):$($env_vars['BACKEND_IMAGE_TAG'])"
$frontend_image = "$registry.azurecr.io/$($env_vars['FRONTEND_IMAGE_NAME']):$($env_vars['FRONTEND_IMAGE_TAG'])"

Write-Host "Building backend image..." -ForegroundColor Yellow
docker build -t $backend_image ../../backend
Write-Host "Pushing backend image..." -ForegroundColor Yellow
docker push $backend_image
Write-Host "Backend image pushed" -ForegroundColor Green

$backend_api_fqdn = az containerapp show --resource-group $rg --name $backend_app --query 'properties.configuration.ingress.fqdn' -o tsv 2>$null
if ($LASTEXITCODE -eq 0 -and $backend_api_fqdn) {
    $frontend_api_url = "https://$backend_api_fqdn"
}
else {
    $frontend_api_url = $env_vars['VITE_API_URL']
}

Write-Host "`nBuilding frontend image..." -ForegroundColor Yellow
docker build --build-arg VITE_API_URL=$frontend_api_url -t $frontend_image ../../frontend
Write-Host "Pushing frontend image..." -ForegroundColor Yellow
docker push $frontend_image
Write-Host "Frontend image pushed" -ForegroundColor Green

# Step 6: Create Storage Account
Write-Host "`nStep 6: Creating Storage Account..." -ForegroundColor Cyan
az storage account show --resource-group $rg --name $storage --only-show-errors 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Storage Account already exists" -ForegroundColor Yellow
}
else {
    az storage account create `
        --resource-group $rg `
        --name $storage `
        --location $location `
        --sku $env_vars['STORAGE_ACCOUNT_SKU']
    Write-Host "Storage Account created" -ForegroundColor Green
}

# Step 7: Create File Share
Write-Host "`nStep 7: Creating File Share..." -ForegroundColor Cyan
$storage_key = az storage account keys list --resource-group $rg --account-name $storage --query '[0].value' -o tsv
$share_exists = az storage share exists --account-name $storage --account-key $storage_key --name $file_share --query exists -o tsv
if ($share_exists -eq 'true') {
    Write-Host "File Share already exists" -ForegroundColor Yellow
}
else {
    az storage share create `
        --account-name $storage `
        --account-key $storage_key `
        --name $file_share
    Write-Host "File Share created" -ForegroundColor Green
}

# Step 8: Create Container Apps Environment
Write-Host "`nStep 8: Creating Container Apps Environment..." -ForegroundColor Cyan
$aca_env = $env_vars['CONTAINER_APP_ENVIRONMENT']
az containerapp env show --name $aca_env --resource-group $rg --only-show-errors 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Container Apps Environment already exists" -ForegroundColor Yellow
}
else {
    az containerapp env create `
        --name $aca_env `
        --resource-group $rg `
        --location $location
    Write-Host "Container Apps Environment created" -ForegroundColor Green
}

# Step 9: Deploy Backend
Write-Host "`nStep 9: Deploying Backend..." -ForegroundColor Cyan
az containerapp show --name $backend_app --resource-group $rg --only-show-errors 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    az containerapp update `
        --name $backend_app `
        --resource-group $rg `
        --image $backend_image `
        --set-env-vars `
            FLASK_ENV=$env_vars['FLASK_ENV'] `
            JWT_SECRET=$env_vars['JWT_SECRET'] `
            DATABASE_URL=$env_vars['DATABASE_URL'] `
            CORS_ORIGINS=$env_vars['CORS_ORIGINS'] `
            GUNICORN_WORKERS=$env_vars['GUNICORN_WORKERS']
    Write-Host "Backend updated" -ForegroundColor Green
}
else {
    az containerapp create `
        --name $backend_app `
        --resource-group $rg `
        --environment $aca_env `
        --image $backend_image `
        --target-port $env_vars['PORT'] `
        --ingress external `
        --cpu $env_vars['BACKEND_CPU'] `
        --memory $env_vars['BACKEND_MEMORY'] `
        --min-replicas $env_vars['BACKEND_MIN_REPLICAS'] `
        --max-replicas $env_vars['BACKEND_MAX_REPLICAS'] `
        --env-vars `
            FLASK_ENV=$env_vars['FLASK_ENV'] `
            JWT_SECRET=$env_vars['JWT_SECRET'] `
            DATABASE_URL=$env_vars['DATABASE_URL'] `
            CORS_ORIGINS=$env_vars['CORS_ORIGINS'] `
            GUNICORN_WORKERS=$env_vars['GUNICORN_WORKERS']
    Write-Host "Backend deployed" -ForegroundColor Green
}

# Step 10: Deploy Frontend
Write-Host "`nStep 10: Deploying Frontend..." -ForegroundColor Cyan
$backend_url = az containerapp show --resource-group $rg --name $backend_app --query 'properties.configuration.ingress.fqdn' -o tsv

az containerapp show --name $frontend_app --resource-group $rg --only-show-errors 2>$null | Out-Null
if ($LASTEXITCODE -eq 0) {
    az containerapp update `
        --name $frontend_app `
        --resource-group $rg `
        --image $frontend_image `
        --set-env-vars VITE_API_URL="https://$backend_url"
    Write-Host "Frontend updated" -ForegroundColor Green
}
else {
    az containerapp create `
        --name $frontend_app `
        --resource-group $rg `
        --environment $aca_env `
        --image $frontend_image `
        --target-port 3000 `
        --ingress external `
        --cpu $env_vars['FRONTEND_CPU'] `
        --memory $env_vars['FRONTEND_MEMORY'] `
        --min-replicas $env_vars['FRONTEND_MIN_REPLICAS'] `
        --max-replicas $env_vars['FRONTEND_MAX_REPLICAS'] `
        --env-vars VITE_API_URL="https://$backend_url"
    Write-Host "Frontend deployed" -ForegroundColor Green
}

# Step 11: Get URLs
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$frontend_url = az containerapp show --resource-group $rg --name $frontend_app --query 'properties.configuration.ingress.fqdn' -o tsv

Write-Host "`nApplication URLs:" -ForegroundColor Cyan
Write-Host "  Backend:  https://$backend_url" -ForegroundColor Yellow
Write-Host "  Frontend: https://$frontend_url" -ForegroundColor Yellow

Write-Host "`nNext Steps:" -ForegroundColor Cyan
Write-Host "  1. Update VITE_API_URL in .env.dev.aca.local with: https://$backend_url"
Write-Host "  2. Redeploy frontend with updated API URL"
Write-Host "  3. Open frontend in browser to test"
Write-Host ""
