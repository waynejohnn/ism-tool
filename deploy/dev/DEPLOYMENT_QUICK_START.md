# Simple ACA Deployment Guide

**Status:** ✅ Simple deployment scripts created  
**Location:** `deploy/dev/deploy-aca-simple.ps1` (PowerShell) or `deploy/aca-simple.sh` (Bash)

---

## **Prerequisites**

Before running deployment, you need:

### 1. Install Azure CLI

**Windows:**
```powershell
# Option A: Using winget
winget install Microsoft.AzureCLI

# Option B: Download MSI installer
# https://aka.ms/installazurecliwindows
```

**Verify installation:**
```powershell
az --version
```

### 2. Install/Start Docker

- **Windows:** Download Docker Desktop from https://www.docker.com/products/docker-desktop
- **Start Docker Desktop** and verify it's running:
```powershell
docker ps
```

### 3. Environment File

You should already have `.env.dev.aca.local` in project root with all your values.

**Verify it exists:**
```powershell
Test-Path .\.env.dev.aca.local
# Should return: True
```

---

## **Deployment Steps**

### Step 1: Validate Setup

```powershell
# Check Azure CLI is working
az --version

# Check Docker is running
docker ps

# Check environment file
Get-Content .\.env.dev.aca.local | Select-String "RESOURCE_GROUP|REGISTRY_NAME"
```

**Expected:** All commands succeed without errors.

---

### Step 2: Run Deployment

**From project root, run:**

```powershell
# PowerShell version
./deploy/dev/deploy-aca-simple.ps1 -EnvFile .env.dev.aca.local
```

**Or if using Bash:**
```bash
chmod +x ./deploy/dev/deploy-aca-simple.sh
./deploy/dev/deploy-aca-simple.sh --env-file .env.dev.aca.local
```

---

### Step 3: Monitor Deployment

The script will:
1. ✅ Login to Azure
2. ✅ Create Resource Group
3. ✅ Create Container Registry
4. ✅ Build backend Docker image
5. ✅ Build frontend Docker image
6. ✅ Push images to registry
7. ✅ Create Storage Account for database
8. ✅ Create Container Apps environment
9. ✅ Deploy backend app
10. ✅ Deploy frontend app
11. ✅ Display your application URLs

**Deployment takes 10-15 minutes.** Be patient - Azure is creating infrastructure.

---

### Step 4: When Complete

Once deployment finishes, you'll see:

```
========================================
DEPLOYMENT COMPLETE!
========================================

Application URLs:
  Backend:  https://usecaseapp_backend.xxxxx.azurecontainerapps.io
  Frontend: https://usecaseapp_frontend.xxxxx.azurecontainerapps.io

Next Steps:
  1. Update VITE_API_URL in .env.dev.aca.local
  2. Redeploy frontend with updated API URL
  3. Open frontend URL in browser
```

---

## **Post-Deployment Configuration**

### Step 1: Get Backend URL

Copy the backend URL from deployment output.

### Step 2: Update Environment File

```powershell
# Update .env.dev.aca.local
# Find this line: VITE_API_URL=https://usecaseapp_backend.azurecontainerapps.io
# Replace with: VITE_API_URL=https://<YOUR_BACKEND_URL>
```

### Step 3: Redeploy Frontend

```powershell
# Redeploy frontend with updated API URL
az containerapp update \
  --name usecaseapp_frontend \
  --resource-group RG-SC-DA-APPS-DEV \
  --set-env-vars VITE_API_URL=<YOUR_BACKEND_URL>
```

### Step 4: Access Application

1. Open the frontend URL in your browser
2. You should see the Use Case Scoring App login page
3. Try logging in with test credentials

---

## **Testing**

### Test Backend API

```powershell
$backendUrl = "https://usecaseapp_backend.xxxxx.azurecontainerapps.io"

# Test health endpoint
Invoke-RestMethod -Uri "$backendUrl/health" -Method Get

# Test login endpoint
$body = @{
    email = "admin@santeecooper.com"
    password = "admin123"
} | ConvertTo-Json

Invoke-RestMethod -Uri "$backendUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
```

### Test Frontend

Simply open the frontend URL in your browser and try:
1. Login with admin credentials
2. Navigate to Dashboard
3. Create a new intake
4. Review and score use cases

---

## **Troubleshooting**

### Issue: "az: command not found"
**Solution:** Azure CLI not installed. Install from https://aka.ms/installazurecliwindows

### Issue: "unable to get image"
**Solution:** Docker not running. Start Docker Desktop.

### Issue: "Authentication failed"
**Solution:** 
```powershell
# Re-authenticate
az logout
az login
az account set --subscription a7ed5534-0db3-42a3-a8db-d9e93131295c
```

### Issue: "Resource already exists"
**Solution:** Resource already created. Skip and continue, or delete resource group and restart.

### Issue: Frontend shows "Cannot connect to API"
**Solution:** VITE_API_URL not updated correctly. Verify backend URL and redeploy frontend.

### Issue: Database errors in backend logs
**Solution:** Check storage account and file share were created:
```powershell
az storage account list --resource-group RG-SC-DA-APPS-DEV
az storage share list --account-name strdaappsqueuesdev --account-key <key>
```

---

## **Monitor After Deployment**

### View Application Logs

```powershell
# Backend logs
az containerapp logs show \
  --resource-group RG-SC-DA-APPS-DEV \
  --name usecaseapp_backend \
  --tail 50

# Frontend logs
az containerapp logs show \
  --resource-group RG-SC-DA-APPS-DEV \
  --name usecaseapp_frontend \
  --tail 50
```

### Check Application Status

```powershell
# Backend status
az containerapp show \
  --resource-group RG-SC-DA-APPS-DEV \
  --name usecaseapp_backend \
  --query 'properties.provisioningState'

# Frontend status
az containerapp show \
  --resource-group RG-SC-DA-APPS-DEV \
  --name usecaseapp_frontend \
  --query 'properties.provisioningState'
```

---

## **Next Steps**

1. ✅ Install Azure CLI
2. ✅ Start Docker Desktop
3. ✅ Run `./deploy/dev/deploy-aca-simple.ps1 -EnvFile .env.dev.aca.local`
4. ✅ Wait for deployment to complete
5. ✅ Update frontend API URL
6. ✅ Test application in browser

---

**Ready to deploy? Let me know when you run the script!**
