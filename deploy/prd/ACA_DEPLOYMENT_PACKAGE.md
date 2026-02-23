# Use Case Scoring App - ACA Dev Deployment Package

## Overview
This package contains everything needed to deploy the Use Case Scoring Application to Azure Container Apps (ACA) in a dev environment. The application is fully containerized and production-ready.

## 📦 What's Included

### Configuration Files
- **`.env.dev.aca`** - Template with all environment variables
- **`.env.production`** - Production environment template
- **`.env.dev.aca.local`** - Your customized deployment config (create from template)

### Deployment Scripts

**Windows (PowerShell):**
- **`deploy-dev-aca.ps1`** - Automated deployment script for Windows agents

**Linux (Bash/Azure DevOps agents):**
- **`deploy-dev-aca.sh`** - Automated deployment script for Linux agents
- **`azure-pipelines.yml`** - CI/CD pipeline for Azure DevOps with Linux agents

### Documentation

**All Platforms:**
- **`ACA_VARIABLES_REFERENCE.md`** - All configuration variables explained
- **`ACA_DEPLOYMENT_CHECKLIST.md`** - Pre/post deployment checklist
- **`README.md`** - General project documentation

**Windows:**
- **`ACA_DEV_DEPLOYMENT.md`** - Step-by-step deployment guide (PowerShell)

**Linux:**
- **`LINUX_DEPLOYMENT_GUIDE.md`** - Step-by-step deployment guide (Bash/Azure DevOps)

### Application Code
- **`backend/`** - Flask API (production-ready with Gunicorn)
- **`frontend/`** - React SPA (Vite, optimized build)
- **`docker-compose.yml`** - Local development setup
- **`docker-compose.prod.yml`** - Production compose config

### Dockerfiles
- **`backend/Dockerfile`** - Production backend image
- **`frontend/Dockerfile`** - Production frontend image

---

## 🚀 Quick Start (5 minutes)

### For Windows (PowerShell)

1. **Prepare Configuration**
```powershell
Copy-Item ".env.dev.aca" ".env.dev.aca.local"
code .env.dev.aca.local
```

2. **Generate JWT Secret**
```powershell
$secret = [Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
Write-Host "Use this for JWT_SECRET: $secret"
```

3. **Deploy to ACA**
```powershell
.\deploy-dev-aca.ps1 -EnvFile .env.dev.aca.local -Verbose
```

4. **Access Application** - URLs printed in output

### For Linux (Bash/Azure DevOps agents)

1. **Prepare Configuration**
```bash
cp .env.dev.aca .env.dev.aca.local
nano .env.dev.aca.local
```

2. **Generate JWT Secret**
```bash
openssl rand -hex 32
```

3. **Make Script Executable**
```bash
chmod +x deploy-dev-aca.sh
```

4. **Deploy to ACA**
```bash
./deploy-dev-aca.sh --env-file .env.dev.aca.local --verbose
```

5. **Access Application** - URLs printed in output

---

## 📋 Detailed Guides

**Choose your platform:**

- **[Windows Deployment Guide](ACA_DEV_DEPLOYMENT.md)** - PowerShell step-by-step instructions
- **[Linux Deployment Guide](LINUX_DEPLOYMENT_GUIDE.md)** - Bash/Azure DevOps step-by-step instructions
- **[Azure Pipelines CI/CD](azure-pipelines.yml)** - Automated CI/CD with Linux agents

---

## 📋 Required Configuration

Before deployment, you must specify these variables in `.env.dev.aca.local`:

### Azure Credentials
```
AZURE_SUBSCRIPTION_ID=<your-subscription-id>
AZURE_TENANT_ID=<your-tenant-id>
```

### Resource Names (must be globally unique)
```
REGISTRY_NAME=usecaseregistryYOURINIT           # 5-50 chars, alphanumeric
STORAGE_ACCOUNT_NAME=usecasestorageYOURINIT     # 3-24 chars, alphanumeric
RESOURCE_GROUP=santee-cooper-apps-dev
```

### Security
```
JWT_SECRET=<64-character-random-hex-string>
FLASK_ENV=production
```

### Network
```
CORS_ORIGINS=https://<frontend-domain>
VITE_API_URL=https://<backend-domain>
```

### After Deployment, You'll Have:
```
Frontend: https://usecaseapp-frontend-dev.azurecontainerapps.io
Backend:  https://usecaseapp-backend-dev.azurecontainerapps.io
```

See **`ACA_VARIABLES_REFERENCE.md`** for complete variable list.

---

## 📚 Documentation Map

| Document | Purpose | Platform |
|----------|---------|----------|
| **ACA_DEPLOYMENT_CHECKLIST.md** | Pre-flight checklist, testing criteria, troubleshooting | All |
| **ACA_DEV_DEPLOYMENT.md** | Step-by-step deployment guide with all commands | Windows (PowerShell) |
| **LINUX_DEPLOYMENT_GUIDE.md** | Step-by-step deployment guide with all commands | Linux (Bash) |
| **ACA_VARIABLES_REFERENCE.md** | All environment variables explained with examples | All |
| **azure-pipelines.yml** | Automated CI/CD pipeline configuration | Linux (Azure DevOps) |

**Start with**: `ACA_DEPLOYMENT_CHECKLIST.md` → Platform-specific guide

---

## 🔧 Prerequisites

### Windows
- [ ] Azure subscription with sufficient quota
- [ ] Azure CLI installed (`az --version`)
- [ ] Docker Desktop running (`docker --version`)
- [ ] PowerShell 5.1+ or 7.0+ (`$PSVersionTable.PSVersion`)
- [ ] Permissions: Contributor role in Azure subscription

### Linux (Local or Azure DevOps agents)
- [ ] Azure subscription with sufficient quota
- [ ] Azure CLI installed (`az --version`)
- [ ] Docker installed and running
- [ ] Bash 4.0+ (`bash --version`)
- [ ] OpenSSL for secret generation
- [ ] Permissions: Contributor role in Azure subscription

### Install Prerequisites

**Windows:**
```powershell
# Azure CLI
# https://learn.microsoft.com/en-us/cli/azure/install-azure-cli

# Docker Desktop
# https://www.docker.com/products/docker-desktop

# PowerShell 7
# https://github.com/PowerShell/PowerShell/releases
```

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update && sudo apt-get install -y azure-cli docker.io git openssl

# RHEL/CentOS
sudo yum install -y azure-cli docker git openssl
```

---

## 🔐 Security Notes

⚠️ **Important**
- Never commit `.env.dev.aca.local` to git
- JWT_SECRET must be at least 64 random characters
- Use strong, unique values for all secrets
- Rotate secrets regularly in production
- Enable Azure Policy for resource governance
- Store secrets in Azure Key Vault or DevOps Secret Groups
- Consider Azure Key Vault for production secrets

---

## 📊 Architecture

### Components Deployed
```
Azure Container Apps Environment (Dev)
├── Backend Container App
│   ├── Image: usecaseregistry.azurecr.io/usecaseapp-backend:latest
│   ├── Runtime: Python 3.11 + Gunicorn (4 workers)
│   ├── Port: 5000
│   ├── Database: SQLite (persisted to Azure File Share)
│   └── Scaling: 1-3 replicas
│
└── Frontend Container App
    ├── Image: usecaseregistry.azurecr.io/usecaseapp-frontend:latest
    ├── Runtime: Node.js + Vite + React
    ├── Port: 3000
    └── Scaling: 1-2 replicas

Supporting Resources
├── Azure Container Registry (ACR)
├── Azure Storage Account (Database persistence)
├── Azure File Share (Database volume)
└── Azure Container App Environment (Networking)
```

---

## 📈 Resource Sizing

### Development Configuration
```
Backend:
  CPU: 0.5 cores
  Memory: 1Gi
  Min Replicas: 1
  Max Replicas: 3

Frontend:
  CPU: 0.25 cores
  Memory: 0.5Gi
  Min Replicas: 1
  Max Replicas: 2
```

### Estimated Monthly Cost (Dev)
- Container instances: ~$30-50
- Storage: ~$1-5
- Data transfer: ~$0-10
- **Total: ~$35-65/month** (varies by region)

---

## 🔄 Deployment Options

### Option 1: Automated (Recommended)
```powershell
.\deploy-dev-aca.ps1 -EnvFile .env.dev.aca.local
```
✅ Recommended - handles all setup automatically

### Option 2: Manual Steps
See `ACA_DEV_DEPLOYMENT.md` for step-by-step commands

### Option 3: Skip Image Build
```powershell
.\deploy-dev-aca.ps1 -EnvFile .env.dev.aca.local -SkipImageBuild
```
Use if images already exist in registry

### Option 4: Skip Resource Creation
```powershell
.\deploy-dev-aca.ps1 -EnvFile .env.dev.aca.local -SkipResourceCreation
```
Use if Azure resources already exist

---

## ✅ Post-Deployment Verification

### 1. Check Container Status
```powershell
az containerapp show -n usecaseapp-backend-dev -g santee-cooper-apps-dev --query "properties.provisioningState"
```

### 2. View Logs
```powershell
az containerapp logs show -n usecaseapp-backend-dev -g santee-cooper-apps-dev --follow
```

### 3. Test Backend
```powershell
$backend = "https://usecaseapp-backend-dev.azurecontainerapps.io"
Invoke-WebRequest "$backend/health"
```

### 4. Test Frontend
```powershell
$frontend = "https://usecaseapp-frontend-dev.azurecontainerapps.io"
Invoke-WebRequest $frontend
```

---

## 🐛 Troubleshooting

### Container won't start
1. Check logs: `az containerapp logs show -n <app-name> -g <rg> --follow`
2. Verify environment variables
3. Ensure image exists in registry
4. Check resource quotas

### API errors
1. Verify `CORS_ORIGINS` is set correctly
2. Check `JWT_SECRET` is secure
3. Ensure database initialized
4. Review logs for details

### Network issues
1. Verify ingress is enabled
2. Check firewall rules
3. Confirm DNS resolution
4. Test from different networks

See `ACA_DEPLOYMENT_CHECKLIST.md` for more troubleshooting steps.

---

## 📞 Support

- **Documentation**: See files in this package
- **Azure CLI Help**: `az containerapp --help`
- **Issues**: Contact Platform Engineering team
- **Escalation**: Create Azure Support ticket

---

## 🔄 Next Steps

After successful deployment:

1. **Monitor** - Set up Log Analytics and Application Insights
2. **Backup** - Configure automated database backups
3. **CI/CD** - Set up Azure DevOps or GitHub Actions
4. **Domain** - Configure custom domain and SSL
5. **Scaling** - Adjust auto-scaling policies as needed
6. **Production** - Plan production deployment

See `PRODUCTION_READY.md` for production considerations.

---

## 📝 File Manifest

```
Use Case Scoring App - ACA Deployment Package
│
├── Configuration
│   ├── .env.dev.aca              ← Environment template (copy this)
│   ├── .env.production            ← Production template
│   └── .env.dev.aca.local        ← Your customized config (not in git)
│
├── Scripts
│   ├── deploy-dev-aca.ps1        ← Automated deployment (PowerShell)
│   └── deploy-aca.ps1             ← Alternative script
│
├── Documentation
│   ├── ACA_DEPLOYMENT_CHECKLIST.md
│   ├── ACA_DEV_DEPLOYMENT.md
│   ├── ACA_VARIABLES_REFERENCE.md
│   ├── ACA_DEPLOYMENT_PACKAGE.md  ← This file
│   ├── PRODUCTION_READY.md
│   └── README.md
│
├── Application Code
│   ├── backend/
│   │   ├── Dockerfile
│   │   ├── requirements.txt
│   │   ├── app.py
│   │   ├── wsgi.py
│   │   └── ...
│   │
│   ├── frontend/
│   │   ├── Dockerfile
│   │   ├── package.json
│   │   ├── src/
│   │   └── ...
│   │
│   └── docker-compose.yml
│
└── Additional Files
    ├── .dockerignore
    ├── .gitignore
    └── azure-pipelines.yml
```

---

## 📜 Version Info

- **Application**: Use Case Scoring System
- **Package Version**: 1.0
- **Target Environment**: Azure Container Apps (Dev)
- **Created**: February 16, 2026
- **Status**: Production-Ready

---

## 🎯 Key Features

✅ Fully containerized application
✅ Production-grade WSGI server (Gunicorn)
✅ Automated deployment
✅ Scalable architecture
✅ Database persistence
✅ Health checks configured
✅ Logging enabled
✅ CORS properly configured
✅ JWT authentication
✅ Environment isolation

---

**Ready to deploy?** Start with `ACA_DEPLOYMENT_CHECKLIST.md` →
