# Linux Agent Support - Deployment Configuration

## Summary

The deployment package has been updated to support **Linux agents** for Azure Container Apps deployment, enabling seamless CI/CD integration with Azure DevOps and GitHub Actions.

## What's New

### Linux Deployment Script (`deploy-dev-aca.sh`)
- **Format**: Bash 4.0+ compatible
- **Features**: 
  - Color-coded output with progress indicators
  - Error handling with immediate exit on failure
  - Environment variable validation
  - Step-by-step resource creation and deployment
  - Support for `--skip-build`, `--skip-resources`, and `--verbose` flags
  - Works on Azure DevOps Linux agents, GitHub Actions runners, and local Linux/WSL2

### Azure Pipelines Configuration (`azure-pipelines.yml`)
- **Agent Pool**: `ubuntu-latest` (Linux)
- **Stages**:
  1. **Build** - Python/Node.js linting and testing
  2. **BuildAndPush** - Docker image creation and ACR push
  3. **DeployDev** - Automatic deployment on `develop` branch
  4. **DeployStaging** - Automatic deployment on `main` branch
  5. **DeployProduction** - Manual approval required for `main` branch
- **Integration**: Executes `deploy-dev-aca.sh` using Azure CLI task

### Linux Deployment Guide (`LINUX_DEPLOYMENT_GUIDE.md`)
Complete documentation including:
- Prerequisites for local and Azure DevOps environments
- Quick start instructions (3 steps)
- Environment variable configuration
- Azure DevOps pipeline integration guide
- GitHub Actions workflow examples
- Script features and error handling
- Verification procedures and troubleshooting

## Platform Comparison

| Feature | Windows (PowerShell) | Linux (Bash) | CI/CD Support |
|---------|-------|------|------|
| **Deployment Script** | `deploy-dev-aca.ps1` | `deploy-dev-aca.sh` | ✓ Bash |
| **Guide** | `ACA_DEV_DEPLOYMENT.md` | `LINUX_DEPLOYMENT_GUIDE.md` | Both |
| **CI/CD Pipeline** | Manual setup | `azure-pipelines.yml` | Azure DevOps / GitHub Actions |
| **Requirements** | PowerShell 5.1+ | Bash 4.0+ | Native on Linux agents |
| **Secrets Handling** | PowerShell script | Bash/OpenSSL | DevOps Variable Groups |

## Quick Deployment

### Windows (PowerShell)
```powershell
.\deploy-dev-aca.ps1 -EnvFile .env.dev.aca.local -Verbose
```

### Linux (Bash)
```bash
chmod +x deploy-dev-aca.sh
./deploy-dev-aca.sh --env-file .env.dev.aca.local --verbose
```

### Azure DevOps Pipeline
```bash
# Push code to develop branch
git push origin develop
# Pipeline automatically triggers deployment
```

## Environment Files

All platforms use the same environment template:

**`.env.dev.aca`** - Template (do not modify)
**`.env.dev.aca.local`** - Your deployment config (create from template)

Example command:
```bash
# Linux
cp .env.dev.aca .env.dev.aca.local

# Windows (PowerShell)
Copy-Item ".env.dev.aca" ".env.dev.aca.local"
```

## Configuration Variables

Required variables that you must specify:

```bash
# Azure Authentication
AZURE_SUBSCRIPTION_ID="12345678-1234-1234-1234-123456789012"
AZURE_TENANT_ID="87654321-4321-4321-4321-210987654321"

# Resource Names (must be globally unique)
REGISTRY_NAME="santeecooperacr"
STORAGE_ACCOUNT_NAME="santeecoopstorage"
RESOURCE_GROUP="santee-cooper-dev"

# Security
JWT_SECRET="<generate-with-openssl-or-powershell>"

# Application Settings
FLASK_ENV="production"
PORT="5000"
CORS_ORIGINS="https://<your-frontend-domain>"
```

See `ACA_VARIABLES_REFERENCE.md` for all 100+ variables.

## Deployment Execution Order

1. **Copy and customize** `.env.dev.aca` → `.env.dev.aca.local`
2. **Generate secrets** (JWT_SECRET)
3. **Run deployment script** (Windows or Linux version)
4. **Verify deployment** using provided checklist
5. **Test application** at provided URLs

## Files Modified/Created

```
✓ deploy-dev-aca.sh                    # NEW - Bash deployment script
✓ LINUX_DEPLOYMENT_GUIDE.md            # NEW - Linux deployment documentation
✓ azure-pipelines.yml                  # UPDATED - Linux agent configuration
✓ ACA_DEPLOYMENT_PACKAGE.md            # UPDATED - Added Linux references
```

## Testing Deployment Scripts

### Windows (Local)
```powershell
# Test environment loading
.\deploy-dev-aca.ps1 -EnvFile .env.dev.aca.local -DryRun
```

### Linux (Local/WSL2)
```bash
# Test environment loading
./deploy-dev-aca.sh --env-file .env.dev.aca.local --skip-build --skip-resources
```

## CI/CD Integration

### Azure DevOps
1. Commit `azure-pipelines.yml` to repository
2. Create pipeline from YAML in Azure DevOps project
3. Configure service connection to Azure subscription
4. Create variable group with secrets (JWT_SECRET, etc.)
5. Push code to trigger pipeline

### GitHub Actions
Create `.github/workflows/deploy-dev.yml` with provided workflow example from `LINUX_DEPLOYMENT_GUIDE.md`

## Support Matrix

| Deployment Method | OS/Environment | Status | Reference |
|------|--------|--------|-----------|
| PowerShell script | Windows 10/11, Server | ✓ Supported | `ACA_DEV_DEPLOYMENT.md` |
| Bash script | Linux, macOS, WSL2 | ✓ Supported | `LINUX_DEPLOYMENT_GUIDE.md` |
| Azure DevOps (Linux) | Ubuntu 18.04+ agents | ✓ Supported | `azure-pipelines.yml` |
| GitHub Actions (Linux) | ubuntu-latest | ✓ Supported | `LINUX_DEPLOYMENT_GUIDE.md` |

## Next Steps

1. **Choose your deployment platform** (Windows/Linux)
2. **Review the platform-specific guide** (ACA_DEV_DEPLOYMENT.md or LINUX_DEPLOYMENT_GUIDE.md)
3. **Prepare environment file** (.env.dev.aca.local)
4. **Run deployment script** (deploy-dev-aca.ps1 or deploy-dev-aca.sh)
5. **Verify deployment** using ACA_DEPLOYMENT_CHECKLIST.md

## Documentation Structure

```
Use Case Scoring App/
├── .env.dev.aca                           # Environment template
├── deploy-dev-aca.ps1                     # Windows deployment script
├── deploy-dev-aca.sh                      # Linux deployment script (NEW)
├── azure-pipelines.yml                    # CI/CD pipeline (UPDATED)
├── ACA_DEV_DEPLOYMENT.md                  # Windows guide
├── LINUX_DEPLOYMENT_GUIDE.md              # Linux guide (NEW)
├── ACA_VARIABLES_REFERENCE.md             # Variable documentation
├── ACA_DEPLOYMENT_CHECKLIST.md            # Verification checklist
├── ACA_DEPLOYMENT_PACKAGE.md              # Package overview (UPDATED)
└── LINUX_SUPPORT.md                       # This file
```

## Security Best Practices

- ✓ Store secrets in Azure Key Vault (production)
- ✓ Use DevOps variable groups (CI/CD)
- ✓ Never commit `.env.*.local` files
- ✓ Rotate JWT_SECRET regularly
- ✓ Enable Azure Policy enforcement
- ✓ Use managed identities when possible
- ✓ Enable Application Insights monitoring

## Troubleshooting

### Script Permissions (Linux)
```bash
# Make script executable
chmod +x deploy-dev-aca.sh

# Or run with explicit bash
bash deploy-dev-aca.sh --env-file .env.dev.aca.local
```

### Environment Variable Issues
```bash
# Verify variables loaded correctly
source .env.dev.aca.local
echo $AZURE_SUBSCRIPTION_ID
```

### Docker Image Build Failures
```bash
# Skip build, use existing images
./deploy-dev-aca.sh --env-file .env.dev.aca.local --skip-build
```

### See detailed troubleshooting in:
- Windows: `ACA_DEV_DEPLOYMENT.md` → Troubleshooting section
- Linux: `LINUX_DEPLOYMENT_GUIDE.md` → Common Issues section

