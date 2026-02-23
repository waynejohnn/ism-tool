# Deployment Package Updated - Linux Agent Support

## Summary of Changes

The deployment package has been fully updated to support **Linux agents** for Azure DevOps, GitHub Actions, and local Linux/WSL2 environments.

---

## 📁 New Files Created

### 1. **`deploy-dev-aca.sh`** (Bash Deployment Script)
- **Size**: ~400 lines
- **Purpose**: Automated deployment for Linux environments
- **Features**:
  - Color-coded progress output
  - Environment variable validation
  - 8-step deployment process
  - Support for `--skip-build` and `--skip-resources` flags
  - Comprehensive error handling
- **Usage**: `./deploy-dev-aca.sh --env-file .env.dev.aca.local`

### 2. **`LINUX_DEPLOYMENT_GUIDE.md`** (Complete Linux Documentation)
- **Size**: ~380 lines
- **Coverage**:
  - Prerequisites (local vs Azure DevOps agents)
  - Quick start (4 steps)
  - Environment variable configuration
  - Azure DevOps pipeline integration
  - GitHub Actions workflow examples
  - Script features and flags
  - Verification procedures
  - Common issues and solutions

### 3. **`LINUX_SUPPORT.md`** (Linux Support Overview)
- **Size**: ~200 lines
- **Purpose**: High-level overview of Linux support
- **Contains**:
  - Feature comparison (Windows vs Linux)
  - Deployment methods
  - Platform support matrix
  - Security best practices
  - Quick reference to all documentation

### 4. **`QUICK_REFERENCE.md`** (Quick Reference Card)
- **Size**: ~100 lines
- **Purpose**: TL;DR for quick deployments
- **Contents**:
  - Minimum setup (4 commands)
  - Essential environment variables
  - File purpose reference table
  - Common commands
  - Issue troubleshooting
  - JWT secret generation

---

## 🔄 Files Updated

### 1. **`azure-pipelines.yml`** (Completely Rewritten)
**Before**: Windows-focused basic pipeline
**After**: Full multi-stage Linux pipeline with:
- ✓ Linux agents (`ubuntu-latest`)
- ✓ Build stage (Python/Node.js testing)
- ✓ BuildAndPush stage (Docker images to ACR)
- ✓ DeployDev stage (automatic on `develop` branch)
- ✓ DeployStaging stage (automatic on `main` branch)
- ✓ DeployProduction stage (manual approval)
- ✓ All stages use Bash script execution
- ✓ Proper error handling and artifact publishing

### 2. **`ACA_DEPLOYMENT_PACKAGE.md`** (Enhanced)
**Changes**:
- Added Linux-specific quick start section
- Updated file listing to show platform-specific files
- Added Linux prerequisites section
- Updated documentation map with platform column
- Enhanced security notes with DevOps references
- Added links to all platform guides

---

## 📊 Deployment Comparison

| Feature | Windows | Linux | CI/CD |
|---------|---------|-------|-------|
| **Script Language** | PowerShell | Bash | Bash |
| **Agents** | Windows | Ubuntu | Linux Agents |
| **Docker** | Desktop | Native | Docker Daemon |
| **Secrets** | Env vars | .env file | Variable Groups |
| **Script Path** | `deploy-dev-aca.ps1` | `deploy-dev-aca.sh` | Script in pipeline |
| **Guide** | `ACA_DEV_DEPLOYMENT.md` | `LINUX_DEPLOYMENT_GUIDE.md` | `azure-pipelines.yml` |

---

## 🎯 Key Capabilities

### Linux Script (`deploy-dev-aca.sh`)
```bash
# Standard deployment
./deploy-dev-aca.sh --env-file .env.dev.aca.local

# Skip container builds (reuse images)
./deploy-dev-aca.sh --env-file .env.dev.aca.local --skip-build

# Skip resource creation (updates only)
./deploy-dev-aca.sh --env-file .env.dev.aca.local --skip-resources

# Verbose output
./deploy-dev-aca.sh --env-file .env.dev.aca.local --verbose
```

### Azure DevOps Pipeline (`azure-pipelines.yml`)
- Triggers on `main`, `develop`, and feature branches
- Automatic build and test on all commits
- Automatic deployment to dev on `develop` branch push
- Automatic staging deployment on `main` branch
- Manual approval required for production
- Code coverage reporting
- Integration with Azure Container Registry

### GitHub Actions Support
Complete workflow template provided in `LINUX_DEPLOYMENT_GUIDE.md`

---

## 🔐 Security Improvements

1. **Bash Script Security**
   - Set `-e` for immediate error exit
   - Proper quote handling for variables
   - No hardcoded secrets in script

2. **DevOps Integration**
   - Secrets stored in variable groups
   - No secrets in pipeline YAML
   - Environment-specific configurations

3. **Environment Isolation**
   - Separate `.env.dev.aca` and `.env.dev.aca.local`
   - `.env.dev.aca.local` excluded from git
   - Template supports multiple environments

---

## 📚 Complete Documentation Map

### Quick Start
- **`QUICK_REFERENCE.md`** - 5-minute quick start
- **`LINUX_SUPPORT.md`** - Platform overview

### Platform-Specific Guides
- **Windows**: `ACA_DEV_DEPLOYMENT.md` + `deploy-dev-aca.ps1`
- **Linux**: `LINUX_DEPLOYMENT_GUIDE.md` + `deploy-dev-aca.sh`
- **CI/CD**: `azure-pipelines.yml` (GitHub Actions example in guide)

### Reference Documentation
- **`ACA_VARIABLES_REFERENCE.md`** - All 100+ variables explained
- **`ACA_DEPLOYMENT_CHECKLIST.md`** - Pre/post deployment verification

### Overview Documents
- **`ACA_DEPLOYMENT_PACKAGE.md`** - Package overview and setup
- **`README.md`** - General project documentation

---

## 🚀 Getting Started (Linux)

### Step 1: Copy Environment Template
```bash
cp .env.dev.aca .env.dev.aca.local
```

### Step 2: Edit Configuration
```bash
nano .env.dev.aca.local
# Update required variables
```

### Step 3: Generate JWT Secret
```bash
openssl rand -hex 32
# Copy output to JWT_SECRET
```

### Step 4: Make Script Executable
```bash
chmod +x deploy-dev-aca.sh
```

### Step 5: Deploy
```bash
./deploy-dev-aca.sh --env-file .env.dev.aca.local
```

---

## ✅ Verification Checklist

After deployment:
- [ ] Backend container shows "Running" status
- [ ] Frontend container shows "Running" status
- [ ] Backend FQDN accessible via curl
- [ ] Frontend FQDN loads in browser
- [ ] JWT_SECRET configured in both apps
- [ ] CORS_ORIGINS allows frontend domain
- [ ] Database volume mounted correctly
- [ ] Application logs visible in Azure Portal

---

## 🔧 Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Script permission denied | `chmod +x deploy-dev-aca.sh` |
| Variables not loading | Check `.env.dev.aca.local` exists |
| Azure login required | `az login --subscription <ID>` |
| Docker build fails | Use `--skip-build` flag |
| Resource name exists | Use unique suffix for REGISTRY_NAME |
| Container won't start | Check logs: `az containerapp logs show ...` |

See detailed troubleshooting in platform-specific guides.

---

## 📦 Files Organized By Purpose

### Deployment Executables
- `deploy-dev-aca.ps1` - Windows deployment
- `deploy-dev-aca.sh` - Linux deployment

### Configuration
- `.env.dev.aca` - Template (shared by all platforms)
- `.env.dev.aca.local` - Your config (created by you, not in git)

### Documentation
- **Quick Start**: `QUICK_REFERENCE.md`, `LINUX_SUPPORT.md`
- **Windows Guide**: `ACA_DEV_DEPLOYMENT.md`
- **Linux Guide**: `LINUX_DEPLOYMENT_GUIDE.md`
- **CI/CD**: `azure-pipelines.yml`
- **Reference**: `ACA_VARIABLES_REFERENCE.md`
- **Checklist**: `ACA_DEPLOYMENT_CHECKLIST.md`
- **Overview**: `ACA_DEPLOYMENT_PACKAGE.md`

---

## 🎓 Learning Path

**First Time Deployment?**
1. Start with `QUICK_REFERENCE.md` (5 min read)
2. Choose your platform (Windows or Linux)
3. Read platform-specific guide (15 min read)
4. Follow steps in deployment script comments
5. Use `ACA_DEPLOYMENT_CHECKLIST.md` to verify

**Setting Up CI/CD?**
1. Read `LINUX_DEPLOYMENT_GUIDE.md` → Azure DevOps section
2. Copy `azure-pipelines.yml` to repo
3. Configure service connection in DevOps
4. Create variable group with secrets
5. Push to develop branch to trigger

**Troubleshooting?**
1. Check relevant platform guide (Windows/Linux)
2. Review `ACA_DEPLOYMENT_CHECKLIST.md`
3. Check container logs via Azure CLI
4. Review `ACA_VARIABLES_REFERENCE.md` for config issues

---

## 🎉 Ready to Deploy!

You now have:
- ✓ Bash deployment script for Linux agents
- ✓ Complete Linux deployment documentation
- ✓ Azure DevOps CI/CD pipeline
- ✓ GitHub Actions example workflow
- ✓ Quick reference guides
- ✓ Troubleshooting documentation

**Next Action**: Choose your platform and review the appropriate guide!

