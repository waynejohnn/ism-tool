# Deployment Scripts and Guides

This folder contains all deployment-related scripts and documentation organized by environment.

## Folder Structure

```
deploy/
├── dev/          # Development/Dev Environment Deployment
│   ├── deploy-dev-aca.ps1              # PowerShell deployment script
│   ├── deploy-dev-aca.sh               # Bash deployment script
│   ├── docker-compose.yml              # Docker Compose for local dev
│   ├── azure-pipelines.yml             # Azure DevOps CI/CD pipeline
│   └── tmp_payload.json                # Sample API payload for testing
│
├── tst/          # Test/Staging Environment Deployment
│   └── (Reserved for test environment scripts)
│
├── prd/          # Production Environment Deployment
│   ├── deploy-aca.ps1                  # Production deployment script
│   ├── docker-compose.prod.yml         # Production Docker Compose
│   ├── ACA_DEV_DEPLOYMENT.md           # Dev deployment guide (Windows)
│   ├── LINUX_DEPLOYMENT_GUIDE.md       # Dev deployment guide (Linux)
│   ├── LINUX_DEPLOYMENT_SUMMARY.md     # Quick Linux reference
│   ├── LINUX_SUPPORT.md                # Linux troubleshooting
│   ├── ACA_DEPLOYMENT_CHECKLIST.md     # Pre/post deployment checks
│   ├── ACA_DEPLOYMENT_PACKAGE.md       # Deployment package overview
│   ├── ACA_VARIABLES_REFERENCE.md      # Complete variable reference
│   ├── AZURE_DEPLOYMENT.md             # Azure deployment overview
│   ├── PRODUCTION_DEPLOYMENT.md        # Production notes
│   └── PRODUCTION_READY.md             # Production readiness checklist
│
└── README.md     # This file
```

## Running Deployment Scripts

### From Project Root Directory

**Windows (PowerShell):**
```powershell
# Development deployment
./deploy/dev/deploy-dev-aca.ps1 -EnvFile .env.dev.aca.local -Verbose

# Production deployment  
./deploy/prd/deploy-aca.ps1 -EnvFile .env.production -Verbose
```

**Linux (Bash):**
```bash
# Development deployment
chmod +x ./deploy/dev/deploy-dev-aca.sh
./deploy/dev/deploy-dev-aca.sh --env-file .env.dev.aca.local --verbose

# Production deployment
chmod +x ./deploy/dev/deploy-aca.sh
./deploy/dev/deploy-aca.sh --env-file .env.production --verbose
```

### From deploy/dev/ or deploy/prd/ Directory

**Windows (PowerShell):**
```powershell
# Navigate to deployment folder
cd deploy/dev

# Run deployment script
./deploy-dev-aca.ps1 -EnvFile ../../.env.dev.aca.local -Verbose
```

**Linux (Bash):**
```bash
# Navigate to deployment folder
cd deploy/dev

# Run deployment script
chmod +x deploy-dev-aca.sh
./deploy-dev-aca.sh --env-file ../../.env.dev.aca.local --verbose
```

## Environment Files

Environment files are stored in the project root:

- `.env.dev.aca` - Development environment template
- `.env.production` - Production environment template
- `.env.dev.aca.local` - Development environment configuration (local, not in version control)
- Other custom `.env` files - As needed for your deployments

## Docker Compose Files

- `deploy/dev/docker-compose.yml` - Local development with Docker
- `deploy/prd/docker-compose.prod.yml` - Production-ready compose config

To use Docker Compose from the project root:

```bash
# Development
docker-compose -f ./deploy/dev/docker-compose.yml up --build

# Production  
docker-compose -f ./deploy/prd/docker-compose.prod.yml up --build
```

## Documentation Guide

### For Development Deployment (Windows)
See: `deploy/prd/ACA_DEV_DEPLOYMENT.md`

### For Development Deployment (Linux/Bash)
See: `deploy/prd/LINUX_DEPLOYMENT_GUIDE.md`

### For Azure Container Apps Variables
See: `deploy/prd/ACA_VARIABLES_REFERENCE.md`

### For Pre/Post Deployment Checks
See: `deploy/prd/ACA_DEPLOYMENT_CHECKLIST.md`

### For Production Deployment
See: `deploy/prd/PRODUCTION_DEPLOYMENT.md`

## CI/CD Pipeline

The Azure Pipelines CI/CD configuration is located at:
- `deploy/dev/azure-pipelines.yml`

This file defines the automated deployment pipeline for Azure DevOps.

## Common Issues

### "Environment file not found"
Ensure you're running scripts with the correct path to `.env` files:
- From project root: pass `.env.dev.aca.local` or use the default
- From deploy/dev/: pass `../../.env.dev.aca.local`

### Port conflicts on local dev
If ports 3000 (frontend) or 5001 (backend) are in use, update `docker-compose.yml`:
```yaml
frontend:
  ports:
    - "3001:3000"  # Map to different host port

backend:
  ports:
    - "5002:5000"  # Map to different host port
```

### Docker build fails
Ensure Docker has enough disk space and all base images are downloaded:
```bash
# Clean up Docker
docker system prune -a

# Rebuild with no cache
docker-compose -f ./deploy/dev/docker-compose.yml build --no-cache
```

## Scripts Description

### deploy-dev-aca.ps1 (PowerShell)
- Automates development environment deployment to Azure Container Apps
- Features:
  - Azure authentication and subscription setup
  - Resource group and container registry creation
  - Docker image building and pushing
  - Container app deployment
  - Health checks and diagnostics

### deploy-dev-aca.sh (Bash)
- Linux version of development deployment script
- Same features as PowerShell version
- Compatible with Azure DevOps Linux agents, GitHub Actions, etc.

### azure-pipelines.yml
- CI/CD pipeline configuration for Azure DevOps
- Automatically builds, tests, and deploys on git push
- Uses Linux agents and the bash deployment script

## Next Steps

1. **First Time Setup:**
   - Copy `.env.dev.aca` to `.env.dev.aca.local`
   - Edit `.env.dev.aca.local` with your Azure credentials
   - Run the appropriate deployment script for your platform

2. **Verify Deployment:**
   - Check `deploy/prd/ACA_DEPLOYMENT_CHECKLIST.md` for verification steps
   - Test application endpoints

3. **Monitor Deployment:**
   - Azure Portal Container Apps monitoring
   - Application logs in Azure Monitor

---

**Last Updated:** February 22, 2026
