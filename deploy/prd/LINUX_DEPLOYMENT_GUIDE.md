# Linux Deployment Guide - Azure Container Apps

This guide covers deployment to Azure Container Apps using Linux agents in Azure DevOps, GitHub Actions, or similar CI/CD systems.

## Prerequisites

### For Local Testing (Linux/WSL2)
- Bash 4.0+
- Azure CLI 2.54.0+
- Docker Desktop with Linux containers
- Git
- OpenSSL (for JWT_SECRET generation)

### For Azure DevOps Agents
- Ubuntu 18.04+ agent pool
- Azure CLI extension installed
- Docker daemon running
- Service connection to Azure subscription

## Quick Start (Bash)

### 1. Setup Environment File

```bash
# Copy template and customize
cp .env.dev.aca .env.dev.aca.local

# Edit with your Azure details
nano .env.dev.aca.local
```

### 2. Make Deployment Script Executable

```bash
chmod +x deploy-dev-aca.sh
```

### 3. Generate JWT Secret

```bash
# Generate a secure 64-character secret
openssl rand -hex 32
```

Update `JWT_SECRET` in `.env.dev.aca.local`.

### 4. Run Deployment

```bash
# Interactive deployment with all steps
./deploy-dev-aca.sh --env-file .env.dev.aca.local --verbose

# Skip resource creation (re-deployment)
./deploy-dev-aca.sh --env-file .env.dev.aca.local --skip-resources

# Skip image building (use existing images)
./deploy-dev-aca.sh --env-file .env.dev.aca.local --skip-build
```

## Environment Variables

### Required Variables (Must Set)

```bash
# Azure Authentication
AZURE_SUBSCRIPTION_ID="12345678-1234-1234-1234-123456789012"
AZURE_TENANT_ID="87654321-4321-4321-4321-210987654321"

# Azure Resources
RESOURCE_GROUP="santee-cooper-dev"
AZURE_LOCATION="eastus"
CONTAINER_APP_ENVIRONMENT="usecaseapp-env-dev"

# Container Registry
REGISTRY_NAME="santeecooperacr"        # Must be globally unique
REGISTRY_URL="santeecooperacr.azurecr.io"
REGISTRY_SKU="Basic"

# Storage Account
STORAGE_ACCOUNT_NAME="santeecoopstorage"  # Must be globally unique
STORAGE_ACCOUNT_SKU="Standard_LRS"
FILE_SHARE_NAME="appdata"

# Application Settings
BACKEND_APP_NAME="usecaseapp-backend-dev"
FRONTEND_APP_NAME="usecaseapp-frontend-dev"
BACKEND_IMAGE_FULL="$REGISTRY_URL/usecasescoringapp/backend:latest"
FRONTEND_IMAGE_FULL="$REGISTRY_URL/usecasescoringapp/frontend:latest"

# Security
JWT_SECRET="your-64-char-random-string-here"

# Application Configuration
FLASK_ENV="production"
VITE_ENVIRONMENT="dev"
VITE_APP_TITLE="Use Case Scoring - Dev"
DATABASE_URL="sqlite:////mnt/appdata/app.db"
PORT="5000"
GUNICORN_WORKERS="4"
CORS_ORIGINS="https://<frontend-domain>.com"
```

### Optional Variables

```bash
# Resource Sizing
BACKEND_CPU="0.5"
BACKEND_MEMORY="1Gi"
BACKEND_MIN_REPLICAS="1"
BACKEND_MAX_REPLICAS="3"

FRONTEND_CPU="0.5"
FRONTEND_MEMORY="1Gi"
FRONTEND_MIN_REPLICAS="1"
FRONTEND_MAX_REPLICAS="3"

# Ingress
BACKEND_INGRESS_TARGET_PORT="5000"
FRONTEND_INGRESS_TARGET_PORT="3000"
```

## Azure DevOps Pipeline Integration

### 1. Create Service Connection

In Azure DevOps Project → Project Settings → Service connections:

```
Type: Azure Resource Manager
Connection name: UseCase-ACA
Scope level: Subscription
Subscription: [Your subscription]
Resource Group: [Optional, leave empty]
```

### 2. Store Secrets in Variable Groups

Create a variable group named `ACA-Dev-Secrets`:

```
AZURE_SUBSCRIPTION_ID
AZURE_TENANT_ID
JWT_SECRET
REGISTRY_NAME
```

Mark sensitive variables as secret (lock icon).

### 3. Update Pipeline YAML

```yaml
variables:
  - group: 'ACA-Dev-Secrets'  # Link to variable group

stages:
- stage: DeployDev
  jobs:
  - deployment: DeployDev
    environment: 'Development'
    pool:
      vmImage: 'ubuntu-latest'
    strategy:
      runOnce:
        deploy:
          steps:
          - checkout: self
          
          - task: Bash@3
            displayName: 'Make deployment script executable'
            inputs:
              targetType: 'inline'
              script: chmod +x deploy-dev-aca.sh
          
          - task: AzureCLI@2
            displayName: 'Deploy to ACA'
            inputs:
              azureSubscription: 'UseCase-ACA'
              scriptType: bash
              scriptLocation: scriptPath
              scriptPath: '$(Pipeline.Workspace)/s/deploy-dev-aca.sh'
              arguments: '--env-file $(Pipeline.Workspace)/s/.env.dev.aca.local'
```

### 4. Commit Pipeline File

```bash
git add azure-pipelines.yml
git commit -m "Add ACA deployment pipeline for Linux agents"
git push
```

## GitHub Actions Integration

### 1. Create Secrets

In GitHub repo → Settings → Secrets and variables → Actions:

```
AZURE_SUBSCRIPTION_ID
AZURE_TENANT_ID
JWT_SECRET
REGISTRY_NAME
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
```

### 2. Create Workflow

`.github/workflows/deploy-dev.yml`:

```yaml
name: Deploy to ACA (Dev)

on:
  push:
    branches: [develop]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      id-token: write
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Make deployment script executable
      run: chmod +x deploy-dev-aca.sh
    
    - name: Azure Login
      uses: azure/login@v1
      with:
        client-id: ${{ secrets.AZURE_CLIENT_ID }}
        tenant-id: ${{ secrets.AZURE_TENANT_ID }}
        subscription-id: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
    
    - name: Deploy to ACA
      env:
        REGISTRY_NAME: ${{ secrets.REGISTRY_NAME }}
        JWT_SECRET: ${{ secrets.JWT_SECRET }}
      run: |
        ./deploy-dev-aca.sh \
          --env-file .env.dev.aca.local \
          --skip-resources
```

## Script Features

### Color-Coded Output

- 🟢 Green: Success messages
- 🔴 Red: Errors (exits with code 1)
- 🟡 Yellow: Action steps
- 🔵 Cyan: Headers and sections

### Error Handling

```bash
set -e  # Exit on first error
```

Any command failure stops execution immediately.

### Logging

```bash
# Run with verbose output
./deploy-dev-aca.sh --env-file .env.dev.aca.local --verbose

# Save to file
./deploy-dev-aca.sh --env-file .env.dev.aca.local > deploy.log 2>&1
```

## Verification

### Check Deployment Status

```bash
# List all container apps
az containerapp list \
  --resource-group santee-cooper-dev \
  --query "[].{Name:name, Status:properties.provisioningState}"

# View logs
az containerapp logs show \
  --name usecaseapp-backend-dev \
  --resource-group santee-cooper-dev \
  --follow

# Test backend health
curl https://<backend-url>/health

# Test frontend
curl https://<frontend-url>
```

### Common Issues

#### 1. "Service Connection not found"
- Check service connection name matches pipeline variable
- Verify user has Contributor role on subscription

#### 2. "Resource name already exists"
- Registry and storage account names must be globally unique
- Append timestamp: `REGISTRY_NAME="santeecooper$(date +%s)"`

#### 3. "Permission denied" on script
```bash
chmod +x deploy-dev-aca.sh
```

#### 4. "Container failed to start"
```bash
# Check container logs
az containerapp logs show \
  --name usecaseapp-backend-dev \
  --resource-group santee-cooper-dev
```

## Production Deployment Checklist

- [ ] Update `FLASK_ENV` to `production`
- [ ] Set strong `JWT_SECRET` (min 32 characters)
- [ ] Configure `CORS_ORIGINS` with exact frontend domain
- [ ] Enable managed identity for Azure services
- [ ] Configure Application Insights for monitoring
- [ ] Set up CI/CD pipeline gates
- [ ] Test database migration path
- [ ] Validate log aggregation (Application Insights)
- [ ] Test failover and recovery procedures
- [ ] Update DNS records after deployment

## Cleanup

To remove resources:

```bash
az group delete \
  --name santee-cooper-dev \
  --yes \
  --no-wait
```

This removes all resources in the resource group.

## Support

For issues:

1. Check logs: `az containerapp logs show --name <app> --resource-group <rg> --follow`
2. Review script output for error details
3. Verify environment variables in `.env.dev.aca.local`
4. Test locally with Docker Compose first: `docker-compose up --build`

