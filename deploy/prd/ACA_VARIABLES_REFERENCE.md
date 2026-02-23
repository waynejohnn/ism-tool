# ACA Dev Deployment - Variables Reference
# Use Case Scoring Application

## Quick Start
To deploy to Azure Container Apps dev environment:

```powershell
# 1. Copy and customize the environment file
Copy-Item ".env.dev.aca" ".env.dev.aca.local"
# Edit .env.dev.aca.local with your values

# 2. Run the deployment script
./../dev/deploy-dev-aca.ps1 -EnvFile .env.dev.aca.local -Verbose
```

---

## Environment Variables Reference

### Azure Subscription & Resources

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `AZURE_SUBSCRIPTION_ID` | Azure subscription ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | ✓ |
| `AZURE_TENANT_ID` | Azure tenant ID | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | ✓ |
| `RESOURCE_GROUP` | Azure resource group name | `santee-cooper-apps-dev` | ✓ |
| `AZURE_LOCATION` | Azure region | `eastus` | ✓ |

### Container Registry

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `REGISTRY_NAME` | ACR name (must be globally unique) | `usecaseregistry` | ✓ |
| `REGISTRY_URL` | ACR login URL | `usecaseregistry.azurecr.io` | ✓ |
| `REGISTRY_SKU` | ACR tier | `Basic` (dev), `Standard` (prod) | ✓ |
| `BACKEND_IMAGE_NAME` | Backend image name | `usecaseapp-backend` | ✓ |
| `BACKEND_IMAGE_TAG` | Backend image tag | `latest`, `v1.0.0`, `dev-build-123` | ✓ |
| `FRONTEND_IMAGE_NAME` | Frontend image name | `usecaseapp-frontend` | ✓ |
| `FRONTEND_IMAGE_TAG` | Frontend image tag | `latest`, `v1.0.0`, `dev-build-123` | ✓ |

### Container Apps Environment

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `CONTAINER_APP_ENVIRONMENT` | CA environment name | `usecaseapp-env-dev` | ✓ |
| `BACKEND_APP_NAME` | Backend app name | `usecaseapp-backend-dev` | ✓ |
| `FRONTEND_APP_NAME` | Frontend app name | `usecaseapp-frontend-dev` | ✓ |

### Backend Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `FLASK_ENV` | Flask environment | `production` | ✓ |
| `JWT_SECRET` | JWT signing secret (64+ chars) | `<random-hex-64>` | ✓ |
| `DATABASE_URL` | Database connection path | `sqlite:///./data/app.db` | ✓ |
| `PORT` | Backend port | `5000` | ✓ |
| `CORS_ORIGINS` | Allowed CORS origins | `https://frontend-domain.com` | ✓ |
| `CORS_ALLOW_CREDENTIALS` | Allow credentials in CORS | `true` | ✗ |
| `GUNICORN_WORKERS` | Number of Gunicorn workers | `2` (dev), `4` (prod) | ✗ |
| `GUNICORN_TIMEOUT` | Worker timeout (seconds) | `60` | ✗ |

### Frontend Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_URL` | Backend API URL | `https://backend-domain.azurecontainerapps.io` | ✓ |
| `VITE_APP_TITLE` | Application title | `Use Case Assessment (Dev)` | ✗ |
| `VITE_ENVIRONMENT` | Build environment | `development`, `production` | ✗ |

### Storage Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `STORAGE_ACCOUNT_NAME` | Azure Storage Account name | `usecasestoragedev` | ✓ |
| `STORAGE_ACCOUNT_SKU` | Storage SKU | `Standard_LRS` | ✓ |
| `FILE_SHARE_NAME` | File share name | `appdata` | ✓ |
| `STORAGE_MOUNT_PATH` | Container mount path | `/app/data` | ✓ |

### Resource Sizing

| Variable | Description | Dev Value | Prod Value |
|----------|-------------|-----------|-----------|
| `BACKEND_CPU` | Backend CPU cores | `0.5` | `1.0` - `2.0` |
| `BACKEND_MEMORY` | Backend memory | `1Gi` | `2Gi` - `4Gi` |
| `FRONTEND_CPU` | Frontend CPU cores | `0.25` | `0.5` - `1.0` |
| `FRONTEND_MEMORY` | Frontend memory | `0.5Gi` | `1Gi` - `2Gi` |

### Scaling Configuration

| Variable | Description | Dev Value | Prod Value |
|----------|-------------|-----------|-----------|
| `BACKEND_MIN_REPLICAS` | Min backend replicas | `1` | `2` - `3` |
| `BACKEND_MAX_REPLICAS` | Max backend replicas | `3` | `10` - `20` |
| `FRONTEND_MIN_REPLICAS` | Min frontend replicas | `1` | `2` |
| `FRONTEND_MAX_REPLICAS` | Max frontend replicas | `2` | `5` - `10` |

### Network Configuration

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `ENABLE_INGRESS` | Enable external ingress | `true` | ✓ |
| `BACKEND_PORT` | Backend container port | `5000` | ✓ |
| `FRONTEND_PORT` | Frontend container port | `3000` | ✓ |
| `BACKEND_INGRESS_TARGET_PORT` | Backend ingress port | `5000` | ✓ |
| `FRONTEND_INGRESS_TARGET_PORT` | Frontend ingress port | `3000` | ✓ |
| `ALLOW_EXTERNAL_INGRESS` | Allow external access | `true` | ✓ |

### Health Checks

| Variable | Description | Default |
|----------|-------------|---------|
| `BACKEND_HEALTH_CHECK_PATH` | Backend health endpoint | `/health` |
| `BACKEND_HEALTH_CHECK_INTERVAL` | Check interval (seconds) | `10` |
| `BACKEND_HEALTH_CHECK_TIMEOUT` | Check timeout (seconds) | `5` |
| `BACKEND_HEALTH_CHECK_THRESHOLD` | Failure threshold | `3` |
| `FRONTEND_HEALTH_CHECK_PATH` | Frontend health path | `/` |
| `FRONTEND_HEALTH_CHECK_INTERVAL` | Check interval (seconds) | `30` |
| `FRONTEND_HEALTH_CHECK_TIMEOUT` | Check timeout (seconds) | `10` |
| `FRONTEND_HEALTH_CHECK_THRESHOLD` | Failure threshold | `3` |

### Logging & Monitoring

| Variable | Description | Required |
|----------|-------------|----------|
| `LOG_LEVEL` | Log level | ✗ |
| `ENABLE_LOG_ANALYTICS` | Enable Log Analytics | ✗ |
| `LOG_ANALYTICS_WORKSPACE_ID` | LA workspace ID | ✗ |
| `LOG_ANALYTICS_WORKSPACE_KEY` | LA workspace key | ✗ |
| `ENABLE_APPLICATION_INSIGHTS` | Enable App Insights | ✗ |
| `APPLICATION_INSIGHTS_CONNECTION_STRING` | App Insights connection | ✗ |

### Deployment Configuration

| Variable | Description | Options |
|----------|-------------|---------|
| `ENVIRONMENT` | Deployment environment | `dev`, `staging`, `production` |
| `DEPLOYMENT_TYPE` | Deployment type | `container` |
| `IMAGE_PULL_POLICY` | Image pull behavior | `IfNotPresent`, `Always` |
| `RESTART_POLICY` | Container restart policy | `Always`, `Never`, `OnFailure` |
| `TERMINATION_GRACE_PERIOD` | Grace period (seconds) | `30` |

### Metadata & Tagging

| Variable | Description | Example |
|----------|-------------|---------|
| `ENVIRONMENT_TAG` | Environment tag | `dev` |
| `COST_CENTER` | Cost center code | `IT-Operations` |
| `TEAM` | Owning team | `Platform-Engineering` |
| `APPLICATION` | Application name | `UseCase-Scoring-System` |
| `PROJECT` | Project name | `Santee-Cooper-Portfolio-Management` |

---

## Generating Required Secrets

### Generate JWT_SECRET
```powershell
# PowerShell
$secret = [Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
Write-Host "JWT_SECRET=$secret"

# Bash
openssl rand -hex 32
```

### Find Your Azure IDs
```powershell
# Get subscription ID
az account list --output table

# Get tenant ID
az account show --query tenantId -o tsv

# Get subscription ID (currently set)
az account show --query id -o tsv
```

---

## Validation Checklist

Before deployment, verify:

- [ ] All `REQUIRED` variables are set and not null/empty
- [ ] `JWT_SECRET` is a strong random value (64+ characters)
- [ ] `REGISTRY_NAME` is globally unique (alphanumeric only, 5-50 chars)
- [ ] `STORAGE_ACCOUNT_NAME` is globally unique (alphanumeric only, 3-24 chars)
- [ ] `RESOURCE_GROUP` name is valid
- [ ] `AZURE_LOCATION` is a valid Azure region
- [ ] Docker images build successfully locally
- [ ] Azure CLI is installed and authenticated
- [ ] Sufficient Azure quota in target region/subscription

---

## Example Configuration File (.env.dev.aca.local)

```bash
# Azure
AZURE_SUBSCRIPTION_ID=12345678-1234-1234-1234-123456789012
AZURE_TENANT_ID=87654321-4321-4321-4321-210987654321
RESOURCE_GROUP=santee-cooper-apps-dev
AZURE_LOCATION=eastus

# Registry
REGISTRY_NAME=usecaseregistrydev
REGISTRY_URL=usecaseregistrydev.azurecr.io
REGISTRY_SKU=Basic
BACKEND_IMAGE_NAME=usecaseapp-backend
BACKEND_IMAGE_TAG=latest
FRONTEND_IMAGE_NAME=usecaseapp-frontend
FRONTEND_IMAGE_TAG=latest

# Container Apps
CONTAINER_APP_ENVIRONMENT=usecaseapp-env-dev
BACKEND_APP_NAME=usecaseapp-backend-dev
FRONTEND_APP_NAME=usecaseapp-frontend-dev

# Backend
FLASK_ENV=production
JWT_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6a7b8c9d0e1f
DATABASE_URL=sqlite:///./data/app.db
PORT=5000
CORS_ORIGINS=https://usecaseapp-frontend-dev.azurecontainerapps.io

# Frontend
VITE_API_URL=https://usecaseapp-backend-dev.azurecontainerapps.io
VITE_APP_TITLE=Use Case Assessment (Dev)
VITE_ENVIRONMENT=development

# Storage
STORAGE_ACCOUNT_NAME=usecasestoragedev
FILE_SHARE_NAME=appdata
STORAGE_MOUNT_PATH=/app/data

# Sizing
BACKEND_CPU=0.5
BACKEND_MEMORY=1Gi
FRONTEND_CPU=0.25
FRONTEND_MEMORY=0.5Gi
```

---

## Support

For questions or issues, refer to:
- [ACA Dev Deployment Guide](ACA_DEV_DEPLOYMENT.md)
- [Production Ready Documentation](PRODUCTION_READY.md)
- Azure Container Apps documentation: https://learn.microsoft.com/en-us/azure/container-apps/
