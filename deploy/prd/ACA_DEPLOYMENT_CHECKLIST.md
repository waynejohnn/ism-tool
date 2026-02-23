# ACA Dev Deployment - Quick Checklist

## Pre-Deployment Checklist

### Prerequisites
- [ ] Azure CLI installed (`az --version`)
- [ ] Docker installed and running (`docker --version`)
- [ ] PowerShell 7.0+ installed
- [ ] Git repository cloned and up-to-date
- [ ] Application code tested locally

### Azure Setup
- [ ] Azure subscription created
- [ ] Logged into Azure (`az login`)
- [ ] Subscription ID noted: `________________`
- [ ] Tenant ID noted: `________________`
- [ ] Sufficient quota in target region
- [ ] Appropriate permissions (Contributor or Owner role)

### Configuration Files
- [ ] `.env.dev.aca` reviewed and understood
- [ ] `.env.dev.aca.local` created (copy from `.env.dev.aca`)
- [ ] All required variables filled in `.env.dev.aca.local`
- [ ] JWT_SECRET generated (64+ random characters)
- [ ] No credentials committed to git

---

## Configuration Variables

### Required Variables (Must Have)

**Azure & Resources**
- [ ] `AZURE_SUBSCRIPTION_ID` = `_______________________________`
- [ ] `AZURE_TENANT_ID` = `_______________________________`
- [ ] `RESOURCE_GROUP` = `_______________________________`
- [ ] `AZURE_LOCATION` = `_______________________________`

**Registry**
- [ ] `REGISTRY_NAME` = `_______________________________`
- [ ] `REGISTRY_URL` = `_______________________________`

**Container Apps**
- [ ] `CONTAINER_APP_ENVIRONMENT` = `_______________________________`
- [ ] `BACKEND_APP_NAME` = `_______________________________`
- [ ] `FRONTEND_APP_NAME` = `_______________________________`

**Backend Security**
- [ ] `JWT_SECRET` = `_______________________________`
- [ ] `FLASK_ENV` = `production`
- [ ] `CORS_ORIGINS` = `_______________________________`

**Storage**
- [ ] `STORAGE_ACCOUNT_NAME` = `_______________________________`

### Recommended Variables (Should Have)

- [ ] `GUNICORN_WORKERS` = `2` (dev)
- [ ] `BACKEND_MIN_REPLICAS` = `1`
- [ ] `BACKEND_MAX_REPLICAS` = `3`
- [ ] `FRONTEND_MIN_REPLICAS` = `1`
- [ ] `FRONTEND_MAX_REPLICAS` = `2`

---

## Deployment Steps

### Step 1: Prepare Environment
```
[ ] Copy environment file
[ ] Customize all variables
[ ] Validate file syntax (no special characters in values)
[ ] Save without committing to git
```

### Step 2: Verify Prerequisites
```
[ ] Run: az --version
[ ] Run: docker --version
[ ] Run: az account show (verify logged in)
[ ] Confirm $PROFILE exists for PowerShell
```

### Step 3: Build Docker Images
```
[ ] Backend image builds locally
[ ] Frontend image builds locally
[ ] Both images run successfully in Docker
[ ] No security warnings in image layers
```

### Step 4: Run Deployment Script
```
[ ] Navigate to project root directory
[ ] Run: ./../dev/deploy-dev-aca.ps1 -EnvFile .env.dev.aca.local -Verbose
[ ] Script completes without errors
[ ] Review output for URLs and credentials
```

### Step 5: Verify Deployment
```
[ ] Backend container app status: Running
[ ] Frontend container app status: Running
[ ] Backend URL accessible and responds
[ ] Frontend URL accessible and loads
[ ] Cross-origin requests work
```

---

## Post-Deployment Tasks

### URLs to Update
- [ ] Frontend URL: `https://_________________________.azurecontainerapps.io`
- [ ] Backend URL: `https://_________________________.azurecontainerapps.io`

### Access Control
- [ ] Firewall rules configured (if applicable)
- [ ] DNS records updated (if using custom domain)
- [ ] SSL certificates provisioned (if using custom domain)
- [ ] CORS policy updated in backend

### Monitoring
- [ ] Set up Log Analytics workspace (optional)
- [ ] Enable Application Insights (optional)
- [ ] Configure alerting for resource usage
- [ ] Document log access procedures

### Documentation
- [ ] Deployment documented in internal wiki
- [ ] Team notified of URLs
- [ ] Access procedures documented
- [ ] Rollback procedures tested

---

## Testing Checklist

### Backend Tests
```
[ ] Health check endpoint responds: GET /health
[ ] API returns 200 for GET /
[ ] Database initializes correctly
[ ] CORS headers present in responses
[ ] Authentication works (create user → login → token)
```

### Frontend Tests
```
[ ] Application loads without errors
[ ] Navigation between pages works
[ ] API calls succeed
[ ] Forms submit successfully
[ ] Images and assets load
[ ] Browser console shows no errors
```

### Integration Tests
```
[ ] Use Case submission works end-to-end
[ ] Use Case review scores correctly
[ ] User authentication flow works
[ ] Admin panels accessible with correct role
[ ] Database persists data across restarts
```

---

## Troubleshooting Guide

### Issue: Container won't start
```
Check:
[ ] Environment variables syntax (no quotes, proper format)
[ ] Docker image exists in registry
[ ] Image layer size within limits
[ ] Review logs: az containerapp logs show -n <app> -g <rg> --follow
```

### Issue: CORS errors
```
Check:
[ ] CORS_ORIGINS environment variable set correctly
[ ] Frontend domain exactly matches CORS_ORIGINS
[ ] Backend redeployed after CORS_ORIGINS change
[ ] Credentials enabled in CORS config
```

### Issue: Database connection fails
```
Check:
[ ] Storage account created
[ ] File share created
[ ] Storage volume mounted to /app/data
[ ] Database file has correct permissions
[ ] Storage account key valid
```

### Issue: Frontend can't reach backend
```
Check:
[ ] VITE_API_URL set to correct backend domain
[ ] Backend ingress enabled
[ ] Network policies allow communication
[ ] CORS headers configured
[ ] Backend container running and healthy
```

### Issue: Authentication fails
```
Check:
[ ] JWT_SECRET matches across deployments
[ ] Database initialized with users
[ ] User email/password correct
[ ] Session storage working
```

---

## Rollback Procedure

If deployment fails or needs rollback:

```powershell
# Get previous image tag
az acr repository show-tags --name $REGISTRY_NAME --repository $BACKEND_IMAGE_NAME

# Update to previous version
az containerapp update `
  --name $BACKEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --image "$($REGISTRY_URL)/$($BACKEND_IMAGE_NAME):previous"

# Verify
az containerapp show `
  --name $BACKEND_APP_NAME `
  --resource-group $RESOURCE_GROUP `
  --query "properties.provisioningState"
```

---

## Success Criteria

Deployment is successful when:

- [ ] Both container apps show `Provisioned` status
- [ ] Container apps are running (no replicas crashed)
- [ ] Backend and frontend URLs are publicly accessible
- [ ] Frontend loads without errors
- [ ] Backend API responds to requests
- [ ] Database operations work end-to-end
- [ ] User authentication works
- [ ] No error logs in container output
- [ ] All environment variables correctly applied

---

## Support & Escalation

If issues persist:

1. [ ] Check all variables in `.env.dev.aca.local`
2. [ ] Review container logs for specific errors
3. [ ] Verify Azure region has sufficient quota
4. [ ] Check Docker images build locally
5. [ ] Contact Platform Engineering team

**Platform Engineering Contact**: ________________

**Documentation**:
- [ACA Dev Deployment Guide](ACA_DEV_DEPLOYMENT.md)
- [Variables Reference](ACA_VARIABLES_REFERENCE.md)
- [Production Ready Guide](PRODUCTION_READY.md)

---

## Notes & Comments

```
Use this section to document any deviations or special notes:

________________________________________________________________________

________________________________________________________________________

________________________________________________________________________

________________________________________________________________________
```

---

**Last Updated**: February 16, 2026
**Version**: 1.0
**Status**: Ready for Dev Deployment
