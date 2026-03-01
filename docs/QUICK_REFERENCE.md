# Quick Reference Card - Linux Deployment

## ⚡ TL;DR (Linux Agents)

```bash
# 1. Copy and edit environment
cp .env.dev.aca .env.dev.aca.local
nano .env.dev.aca.local

# 2. Generate JWT secret
openssl rand -hex 32
# Copy output to JWT_SECRET in .env.dev.aca.local

# 3. Make script executable
chmod +x ./deploy/dev/deploy-dev-aca.sh

# 4. Deploy
./deploy/dev/deploy-dev-aca.sh --env-file .env.dev.aca.local
```

---

## 🔍 Minimum Environment Variables

```bash
AZURE_SUBSCRIPTION_ID=              # Required
AZURE_TENANT_ID=                    # Required
RESOURCE_GROUP=                     # Required
REGISTRY_NAME=                      # Required (globally unique)
STORAGE_ACCOUNT_NAME=               # Required (globally unique)
JWT_SECRET=                         # Required (64 chars minimum)
```

---

## 📋 File Purpose Quick Reference

| File | Purpose | Use When |
|------|---------|----------|
| `.env.dev.aca` | Template | Setting up new deployment |
| `deploy/dev/deploy-dev-aca.sh` | Bash script | Deploying from Linux agent |
| `deploy/prd/LINUX_DEPLOYMENT_GUIDE.md` | Full instructions | First-time deployment |
| `deploy/prd/ACA_VARIABLES_REFERENCE.md` | All variables | Need detailed variable info |
| `deploy/prd/ACA_DEPLOYMENT_CHECKLIST.md` | Verification | Testing deployment |
| `deploy/dev/azure-pipelines.yml` | CI/CD pipeline | Automated deployments |

---

## 🚀 Deployment Methods

### Local Linux/WSL2
```bash
./deploy-dev-aca.sh --env-file .env.dev.aca.local
```

### Azure DevOps Pipeline
```bash
# Push to develop branch
git push origin develop
# Pipeline runs automatically
```

### GitHub Actions
```bash
# Branch flow
# feature/* -> develop
# develop -> main

# Deployment triggers by branch
git push origin deploy/dev   # triggers dev deployment
git push origin deploy/tst   # triggers test deployment
git push origin deploy/prd   # triggers production deployment
```

Required GitHub Secrets:
- AZURE_CREDENTIALS_DEV
- AZURE_CREDENTIALS_TST
- AZURE_CREDENTIALS_PRD
- ENV_FILE_DEV
- ENV_FILE_TST
- ENV_FILE_PRD

---

## 🛠️ Useful Commands

```bash
# Test configuration only (skip build and resources)
./deploy/dev/deploy/dev/deploy-dev-aca.sh --env-file .env.dev.aca.local --skip-build --skip-resources

# Verbose output for debugging
./deploy/dev/deploy-dev-aca.sh --env-file .env.dev.aca.local --verbose

# View backend logs
az containerapp logs show --name usecaseapp-backend-dev --resource-group santee-cooper-dev --follow

# View deployment status
az containerapp show --name usecaseapp-backend-dev --resource-group santee-cooper-dev --query properties.provisioningState

# Get frontend URL
az containerapp show --name usecaseapp-frontend-dev --resource-group santee-cooper-dev --query properties.configuration.ingress.fqdn
```

---

## 🔑 Generate JWT Secret

```bash
# Secure random 64-character hex string
openssl rand -hex 32
```

Output example:
```
a1b2c3d4e5f6789012345678901234567890abcdef1234567890abcdef123456
```

---

## 🚨 Common Issues

### 1. "Permission denied" on script
```bash
chmod +x deploy-dev-aca.sh
```

### 2. Azure login required
```bash
az login --subscription YOUR_SUBSCRIPTION_ID
```

### 3. Resource name already exists
Update REGISTRY_NAME or STORAGE_ACCOUNT_NAME with unique suffix

### 4. Container won't start
```bash
az containerapp logs show --name usecaseapp-backend-dev --resource-group santee-cooper-dev
# Check output for error messages
```

---

## ✅ Deployment Verification

After deployment completes, verify:

```bash
# Check container status
az containerapp show --name usecaseapp-backend-dev \
  --resource-group santee-cooper-dev \
  --query properties.provisioningState

# Get application URLs (from script output or run)
az containerapp show --name usecaseapp-backend-dev \
  --resource-group santee-cooper-dev \
  --query properties.configuration.ingress.fqdn

# Test backend health endpoint
curl https://<backend-url>/health
```

Expected response: HTTP 200 with application running

---

## 📚 Documentation Map

Start here → Read full guide → Deploy:

```
LINUX_SUPPORT.md (this file)
    ↓
LINUX_DEPLOYMENT_GUIDE.md (choose your platform)
    ↓
Deploy script (deploy-dev-aca.sh)
    ↓
ACA_DEPLOYMENT_CHECKLIST.md (verify success)
```

---

## 🔐 Security Quick Checklist

- [ ] JWT_SECRET is 64+ random characters
- [ ] `.env.dev.aca.local` is in `.gitignore`
- [ ] Never commit `.env.*.local` files
- [ ] CORS_ORIGINS contains your frontend domain only
- [ ] Regular secret rotation schedule in place

---

## 📞 Support

For detailed help:
- **Setup questions**: See `deploy/prd/LINUX_DEPLOYMENT_GUIDE.md`
- **Variable reference**: See `deploy/prd/ACA_VARIABLES_REFERENCE.md`
- **Troubleshooting**: See platform-specific guide
- **Verification**: See `ACA_DEPLOYMENT_CHECKLIST.md`

