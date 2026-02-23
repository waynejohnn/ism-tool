# ACA Dev Deployment Guide
# Use Case Scoring Application

## Overview
This guide provides step-by-step instructions to deploy the Use Case Scoring Application to Azure Container Apps (ACA) in the dev environment.

## Prerequisites
- Azure CLI installed and configured
- Docker installed
- PowerShell 7.0+
- Azure subscription with appropriate permissions
- Existing or new Azure resource group

## Deployment Steps

### Step 1: Prepare Environment Variables
1. Copy `.env.dev.aca` template:
   ```powershell
   Copy-Item ".env.dev.aca" ".env.dev.aca.local"
   ```

2. Edit `.env.dev.aca.local` and specify all required values:
   - `AZURE_SUBSCRIPTION_ID` - Your Azure subscription ID
   - `AZURE_TENANT_ID` - Your Azure tenant ID
   - `JWT_SECRET` - Generate a secure random string (use: `openssl rand -hex 32`)
   - `VITE_API_URL` - Backend domain (will be assigned after deployment)
   - `CORS_ORIGINS` - Frontend domain (will be assigned after deployment)
   - `LOG_ANALYTICS_WORKSPACE_*` - If using Log Analytics
   - `APPLICATION_INSIGHTS_*` - If using Application Insights

### Step 2: Authenticate with Azure
```powershell
az login --subscription <your-subscription-id>
az account set --subscription <your-subscription-id>
```

### Step 3: Create Azure Resources
```powershell
# Source the environment file
. .\.env.dev.aca.local

# Create resource group
az group create `
  --name $RESOURCE_GROUP `
  --location $AZURE_LOCATION

# Create container registry
az acr create `
  --resource-group $RESOURCE_GROUP `
  --name $REGISTRY_NAME `
  --sku $REGISTRY_SKU

# Login to registry
az acr login --name $REGISTRY_NAME
```

### Step 4: Build and Push Container Images
```powershell
# Build backend image
docker build `
  -t "$($REGISTRY_URL)/$($BACKEND_IMAGE_NAME):$($BACKEND_IMAGE_TAG)" `
  ./backend

# Push backend image
docker push "$($REGISTRY_URL)/$($BACKEND_IMAGE_NAME):$($BACKEND_IMAGE_TAG)"

# Build frontend image
docker build `
  -t "$($REGISTRY_URL)/$($FRONTEND_IMAGE_NAME):$($FRONTEND_IMAGE_TAG)" `
  ./frontend

# Push frontend image
docker push "$($REGISTRY_URL)/$($FRONTEND_IMAGE_NAME):$($FRONTEND_IMAGE_TAG)"
```

### Step 5: Create Storage Account (for database persistence)
```powershell
# Create storage account
az storage account create `
  --resource-group $RESOURCE_GROUP `
  --name $STORAGE_ACCOUNT_NAME `
  --location $AZURE_LOCATION `
  --sku $STORAGE_ACCOUNT_SKU

# Create file share
az storage share create `
  --account-name $STORAGE_ACCOUNT_NAME `
  --name $FILE_SHARE_NAME

# Get storage account key
$STORAGE_KEY=$(az storage account keys list `
  --resource-group $RESOURCE_GROUP `
  --account-name $STORAGE_ACCOUNT_NAME `
  --query "[0].value" -o tsv)

Write-Host "Storage Account Key: $STORAGE_KEY"
```

### Step 6: Create Container Apps Environment
```powershell
# Create container app environment
az containerapp env create `
  --name $CONTAINER_APP_ENVIRONMENT `
  --resource-group $RESOURCE_GROUP `
  --location $AZURE_LOCATION
```

### Step 7: Deploy Backend Container App
```powershell
# Get registry credentials
$REGISTRY_USERNAME=$(az acr credential show `
  --resource-group $RESOURCE_GROUP `
  --name $REGISTRY_NAME `
  --query username -o tsv)

$REGISTRY_PASSWORD=$(az acr credential show `
  --resource-group $RESOURCE_GROUP `
  --name $REGISTRY_NAME `
  --query "passwords[0].value" -o tsv)

# Create backend container app
az containerapp create `
  --name $BACKEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --environment $CONTAINER_APP_ENVIRONMENT `
  --image "$($REGISTRY_URL)/$($BACKEND_IMAGE_NAME):$($BACKEND_IMAGE_TAG)" `
  --registry-login-server $REGISTRY_URL `
  --registry-username $REGISTRY_USERNAME `
  --registry-password $REGISTRY_PASSWORD `
  --ingress external `
  --target-port $BACKEND_INGRESS_TARGET_PORT `
  --cpu $BACKEND_CPU `
  --memory $BACKEND_MEMORY `
  --min-replicas $BACKEND_MIN_REPLICAS `
  --max-replicas $BACKEND_MAX_REPLICAS `
  --env-vars `
    FLASK_ENV=$FLASK_ENV `
    JWT_SECRET=$JWT_SECRET `
    DATABASE_URL=$DATABASE_URL `
    PORT=$PORT `
    CORS_ORIGINS=$CORS_ORIGINS `
    GUNICORN_WORKERS=$GUNICORN_WORKERS `
  --volumes data:$STORAGE_MOUNT_PATH `
  --storage $STORAGE_ACCOUNT_NAME
```

### Step 8: Deploy Frontend Container App
```powershell
# Get backend URL
$BACKEND_URL=$(az containerapp show `
  --name $BACKEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --query "properties.configuration.ingress.fqdn" -o tsv)

$BACKEND_FULL_URL="https://$BACKEND_URL"

# Create frontend container app
az containerapp create `
  --name $FRONTEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --environment $CONTAINER_APP_ENVIRONMENT `
  --image "$($REGISTRY_URL)/$($FRONTEND_IMAGE_NAME):$($FRONTEND_IMAGE_TAG)" `
  --registry-login-server $REGISTRY_URL `
  --registry-username $REGISTRY_USERNAME `
  --registry-password $REGISTRY_PASSWORD `
  --ingress external `
  --target-port $FRONTEND_INGRESS_TARGET_PORT `
  --cpu $FRONTEND_CPU `
  --memory $FRONTEND_MEMORY `
  --min-replicas $FRONTEND_MIN_REPLICAS `
  --max-replicas $FRONTEND_MAX_REPLICAS `
  --env-vars `
    VITE_API_URL=$BACKEND_FULL_URL `
    VITE_APP_TITLE="$VITE_APP_TITLE" `
    VITE_ENVIRONMENT=$VITE_ENVIRONMENT
```

### Step 9: Verify Deployment
```powershell
# Get backend URL and status
$BACKEND_FQDN=$(az containerapp show `
  --name $BACKEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --query "properties.configuration.ingress.fqdn" -o tsv)

$FRONTEND_FQDN=$(az containerapp show `
  --name $FRONTEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --query "properties.configuration.ingress.fqdn" -o tsv)

Write-Host "Backend URL: https://$BACKEND_FQDN"
Write-Host "Frontend URL: https://$FRONTEND_FQDN"

# Check container app status
az containerapp show `
  --name $BACKEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --query "properties.provisioningState"

az containerapp show `
  --name $FRONTEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --query "properties.provisioningState"
```

### Step 10: Test Deployment
```powershell
# Test backend health
$BACKEND_URL="https://$BACKEND_FQDN"
Invoke-WebRequest -Uri "$BACKEND_URL/health" -SkipHttpsValidation

# Test frontend
$FRONTEND_URL="https://$FRONTEND_FQDN"
Invoke-WebRequest -Uri $FRONTEND_URL -SkipHttpsValidation
```

## Important Configuration Values to Specify

### Security
- `JWT_SECRET`: Generate with `openssl rand -hex 32` or `[Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))`
- `CORS_ORIGINS`: Must match frontend domain
- `HTTPS_ONLY`: Set to true for production

### Database
- `DATABASE_URL`: Path for SQLite database (will be persisted in storage volume)
- `DB_AUTO_INIT`: Set to true to automatically initialize database on startup

### Performance
- `GUNICORN_WORKERS`: 2 for dev (2-4 x CPU cores for production)
- `BACKEND_CPU`: 0.5 for dev (increase for higher load)
- `BACKEND_MEMORY`: 1Gi for dev (2Gi+ for production)

### Scaling
- `BACKEND_MIN_REPLICAS`: 1 for dev, 2+ for production
- `BACKEND_MAX_REPLICAS`: 3 for dev, 10+ for production

## Monitoring & Logs

### View Container Logs
```powershell
az containerapp logs show `
  --name $BACKEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --follow

az containerapp logs show `
  --name $FRONTEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --follow
```

### Monitor Resource Usage
```powershell
az containerapp show `
  --name $BACKEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --query "properties.template.containers[0]"
```

## Troubleshooting

### Container won't start
- Check logs: `az containerapp logs show --name <app-name> --resource-group <resource-group> --follow`
- Verify environment variables are set correctly
- Check image exists in registry: `az acr repository list --name $REGISTRY_NAME`

### Database connection issues
- Verify storage account and file share exist
- Check database file permissions in container
- Ensure storage volume is properly mounted

### CORS errors
- Update `CORS_ORIGINS` environment variable
- Redeploy backend app

### Health check failures
- Verify backend service is responding on configured port
- Check health check endpoint exists: `GET /health`

## Rollback Procedure

If deployment has issues, rollback to previous image:
```powershell
# Update to previous image tag
az containerapp update `
  --name $BACKEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --image "$($REGISTRY_URL)/$($BACKEND_IMAGE_NAME):previous"
```

## Next Steps

1. Configure monitoring and alerting in Azure Portal
2. Set up automated deployments with Azure DevOps or GitHub Actions
3. Configure custom domain and SSL certificates
4. Set up backup and disaster recovery procedures
5. Document operational runbooks

## Support

For deployment issues, contact the Platform Engineering team.
