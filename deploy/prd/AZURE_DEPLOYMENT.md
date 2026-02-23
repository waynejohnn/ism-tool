# Use Case Scoring App - Production Deployment

## Quick Start

### Local Development (Current Setup)
```bash
docker compose up -d
```

### Production (With Persistent Storage)
```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## Azure Container Apps Deployment

### Prerequisites
- Azure CLI installed
- Azure subscription
- Docker images pushed to Azure Container Registry

### Quick Deploy (5 minutes)

#### 1. Create Storage Account
```bash
# Create storage for persistent database
az storage account create \
  --name usecasescooperdb \
  --resource-group santee-cooper-apps \
  --location eastus

# Create file share
az storage share create \
  --name appdata \
  --account-name usecasescooperdb

# Get storage key
STORAGE_KEY=$(az storage account keys list \
  --resource-group santee-cooper-apps \
  --account-name usecasescooperdb \
  --query "[0].value" -o tsv)
```

#### 2. Create Container Apps Environment
```bash
az containerapp env create \
  --name usecaseapp-env \
  --resource-group santee-cooper-apps \
  --location eastus
```

#### 3. Deploy Backend with Persistent Storage
```bash
az containerapp create \
  --name usecaseapp-backend \
  --resource-group santee-cooper-apps \
  --environment usecaseapp-env \
  --image <registry>.azurecr.io/usecasescoringapp-backend:latest \
  --ingress external \
  --target-port 5000 \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1Gi \
  --environment-variables \
    JWT_SECRET="$(openssl rand -base64 32)" \
    FLASK_ENV=production \
    DATABASE_URL="sqlite:////mnt/appdata/app.db" \
  --storage-mounts \
    volumeName=database \
    storageAccountName=usecasescooperdb \
    storageName=appdata \
    storageType=AzureFiles \
    mountPath=/mnt/appdata
```

#### 4. Deploy Frontend
```bash
BACKEND_URL=$(az containerapp show \
  --name usecaseapp-backend \
  --resource-group santee-cooper-apps \
  --query "properties.configuration.ingress.fqdn" -o tsv)

az containerapp create \
  --name usecaseapp-frontend \
  --resource-group santee-cooper-apps \
  --environment usecaseapp-env \
  --image <registry>.azurecr.io/usecasescoringapp-frontend:latest \
  --ingress external \
  --target-port 3000 \
  --min-replicas 1 \
  --max-replicas 3 \
  --cpu 0.5 \
  --memory 1Gi \
  --environment-variables \
    VITE_API_URL="https://${BACKEND_URL}"
```

---

## Database Persistence

### How It Works

**Local Development:**
- SQLite database stored in `backend/data/app.db`
- Survives container restart (volume mounted)
- Lost when volume is deleted

**Azure Container Apps:**
- SQLite database stored in Azure Files
- Survives container restart and replacement
- Automatically backed up by Azure
- Shared across all backend instances

### What Persists?
✅ User accounts (admin, reviewer, readonly)  
✅ Use cases and scoring data  
✅ Review sessions and comments  
✅ All application data  

### What Gets Reset?
❌ Nothing (database is persistent!)

---

## Monitoring

### Health Check
```bash
# Local
curl http://localhost:5000/health

# Azure Container Apps
curl https://usecaseapp-backend.region.azurecontainerapps.io/health
```

Response:
```json
{
  "status": "healthy",
  "database": "connected"
}
```

### Logs
```bash
# View real-time logs
az containerapp logs show \
  --name usecaseapp-backend \
  --resource-group santee-cooper-apps \
  --follow

# Export logs to CSV
az containerapp logs list \
  --name usecaseapp-backend \
  --resource-group santee-cooper-apps \
  --format json > logs.json
```

---

## Scaling

### Auto-Scale Configuration
```bash
az containerapp update \
  --name usecaseapp-backend \
  --resource-group santee-cooper-apps \
  --min-replicas 1 \
  --max-replicas 5 \
  --scale-rule-name cpu-scale \
  --scale-rule-type cpu \
  --scale-rule-metadata targetAverageValue=70
```

### Current Settings
- **Min Replicas:** 1 (always running)
- **Max Replicas:** 3 (scales under load)
- **CPU Trigger:** 70% average
- **Memory:** 1GB per instance

---

## Backup & Recovery

### Automatic Backups
Azure Files automatically provides:
- Point-in-time recovery (90 days)
- Geo-redundant storage option
- Snapshots every 24 hours

### Manual Backup
```bash
# Download database from Azure Files
az storage file download \
  --account-name usecasescooperdb \
  --share-name appdata \
  --path app.db \
  --dest ./backup/app.db.$(date +%Y%m%d)
```

### Restore from Backup
```bash
# Upload database to Azure Files
az storage file upload \
  --account-name usecasescooperdb \
  --share-name appdata \
  --source ./backup/app.db.20260215 \
  --path app.db
```

---

## Security

### Production Checklist

- [ ] Change `JWT_SECRET` to random 32+ character string
  ```bash
  openssl rand -base64 32
  ```

- [ ] Enable HTTPS/TLS (automatic in Azure Container Apps)

- [ ] Store secrets in Azure Key Vault
  ```bash
  az keyvault secret set \
    --vault-name usecaseapp-vault \
    --name jwt-secret \
    --value "$(openssl rand -base64 32)"
  ```

- [ ] Configure firewall rules
  - Restrict storage account access to Container Apps only
  - Enable service endpoints

- [ ] Enable audit logging
  ```bash
  az storage account logging update \
    --account-name usecasescooperdb \
    --log rwd \
    --retention 90
  ```

- [ ] Use managed identities (no connection strings in environment)

- [ ] Enable encryption at rest (default: enabled)

---

## Troubleshooting

### Container Fails to Start
```bash
# Check logs
az containerapp logs show \
  --name usecaseapp-backend \
  --resource-group santee-cooper-apps

# Check health
curl https://usecaseapp-backend.region.azurecontainerapps.io/health
```

### Database Connection Errors
- Verify storage account exists
- Check storage account key and connection
- Ensure mount path is correct (`/mnt/appdata`)

### Slow Performance
- Check container CPU/memory usage
- Verify database isn't fragmented
- Consider upgrading CPU tier

### Users Can't Login
- Check database was mounted correctly
- Verify users table has data:
  ```bash
  # SSH into container and check
  docker exec usecaseapp-backend-1 sqlite3 /app/data/app.db \
    "SELECT email, role FROM users;"
  ```

---

## Cost Optimization

### Current Pricing (Monthly)
| Component | Cost |
|-----------|------|
| Storage Account (100GB) | $5 |
| Backend Container (0.5 CPU, 1GB) | $15 |
| Frontend Container (0.5 CPU, 1GB) | $15 |
| Data Transfer (egress) | $0-5 |
| **Total** | **~$35-40/month** |

### Cost Reduction Tips
1. Use smaller CPU (0.25) for off-peak hours
2. Set min replicas to 0 (scales to 0 when idle)
3. Use Azure Files Standard tier instead of Premium
4. Enable Azure Reserved Instances for committed workloads

---

## Upgrade & Maintenance

### Update Backend Image
```bash
# Build and push new image
docker build -t <registry>.azurecr.io/usecasescoringapp-backend:v2 ./backend
docker push <registry>.azurecr.io/usecasescoringapp-backend:v2

# Update Container App
az containerapp update \
  --name usecaseapp-backend \
  --resource-group santee-cooper-apps \
  --image <registry>.azurecr.io/usecasescoringapp-backend:v2
```

### Zero-Downtime Deployment
Container Apps automatically:
- Health checks each instance
- Only routes traffic to healthy instances
- Gracefully terminates old instances

---

## Support

For issues or questions:
1. Check logs: `az containerapp logs show`
2. Review [PRODUCTION_DEPLOYMENT.md](PRODUCTION_DEPLOYMENT.md)
3. Contact Santee Cooper Cloud Team

---

## Quick Reference

**Login (Production):**
- Email: admin@santeecooper.com
- Password: admin123

**API Endpoints:**
- Health: `GET /health`
- Login: `POST /auth/login`
- Verify: `GET /auth/verify`
- Dashboard: `GET /dashboard/portfolio`

**Database:**
- Type: SQLite
- Location: `/app/data/app.db` (local) or `/mnt/appdata/app.db` (Azure)
- Auto-initialized on startup
- Persistent across restarts

---

Last Updated: February 2026
