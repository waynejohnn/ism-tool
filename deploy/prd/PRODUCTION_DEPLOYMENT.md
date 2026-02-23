# Production Deployment Guide

## Azure Container Apps Deployment

### Option 1: Azure SQL Database (Recommended for Production)

**Advantages:**
- Fully managed, enterprise-grade
- Automatic backups and disaster recovery
- High availability and scaling
- No data loss on container restarts
- Built-in security and compliance

**Steps:**

1. **Create Azure SQL Database**
   ```bash
   # Create resource group
   az group create --name usecasescoringapp-rg --location eastus
   
   # Create SQL Server
   az sql server create \
     --name usecasescoringapp-db \
     --resource-group usecasescoringapp-rg \
     --admin-user sqladmin \
     --admin-password <STRONG_PASSWORD>
   
   # Create database
   az sql db create \
     --server usecasescoringapp-db \
     --name usecasedb \
     --resource-group usecasescoringapp-rg \
     --sku S0
   ```

2. **Update Connection String**
   - Replace `DATABASE_URL` environment variable in Container Apps
   - Format: `mssql+pyodbc://user:password@server.database.windows.net/dbname?driver=ODBC+Driver+18+for+SQL+Server`

3. **Update Backend Dependencies**
   ```bash
   # Add to backend/requirements.txt
   pyodbc
   pyodbc-sqlserver  # or sqlalchemy-pyodbc
   ```

---

### Option 2: Azure Files (For SQLite Persistence)

**Advantages:**
- Low cost
- Easy migration from current setup
- Good for small/medium databases

**Steps:**

1. **Create Azure Storage Account**
   ```bash
   az storage account create \
     --name usecasestorage \
     --resource-group usecasescoringapp-rg \
     --kind FileStorage
   
   az storage share create \
     --name database \
     --account-name usecasestorage
   ```

2. **Mount in Container Apps**
   - Add Storage Mount to backend container
   - Mount path: `/app/data`
   - Storage: Azure Files share
   - This persists the SQLite database across restarts

3. **Environment Configuration**
   ```
   DATABASE_URL=sqlite:////mnt/data/app.db
   ```

---

### Option 3: Azure Cosmos DB (NoSQL)

**Advantages:**
- Global distribution
- Serverless pricing
- Real-time data sync

**Requires:**
- Rewriting data models to use Cosmos DB SDK
- More development effort

---

## Recommended Configuration

**For Santee Cooper, we recommend Option 2 (Azure Files + SQLite):**
- Minimal code changes
- Same data model and ORM
- Cost-effective
- Reliable persistence

### Implementation Steps:

1. **Create Azure Storage Account**
   ```bash
   # Login to Azure
   az login
   
   # Create storage
   az storage account create \
     --name usecasescooperdb \
     --resource-group santee-cooper-apps \
     --location eastus
   
   # Create file share
   az storage share create \
     --name appdata \
     --account-name usecasescooperdb
   ```

2. **Create Container Apps Environment**
   ```bash
   az containerapp env create \
     --name usecaseapp-env \
     --resource-group santee-cooper-apps
   ```

3. **Create Backend Container App**
   ```bash
   az containerapp create \
     --name usecaseapp-backend \
     --resource-group santee-cooper-apps \
     --environment usecaseapp-env \
     --image <your-registry>/usecasescoringapp-backend:latest \
     --ingress external \
     --target-port 5000 \
     --cpu 0.5 \
     --memory 1.0Gi \
     --storage-mounts \
       - volumeName=database \
         storageName=usecasescooperdb \
         storageType=AzureFiles \
         mountPath=/app/data
   ```

4. **Create Frontend Container App**
   ```bash
   az containerapp create \
     --name usecaseapp-frontend \
     --resource-group santee-cooper-apps \
     --environment usecaseapp-env \
     --image <your-registry>/usecasescoringapp-frontend:latest \
     --ingress external \
     --target-port 3000 \
     --cpu 0.5 \
     --memory 1.0Gi \
     --environment-variables \
       VITE_API_URL=https://usecaseapp-backend.api.azurecontainerapps.io
   ```

---

## Environment Variables for Production

Create `.env.production`:

```env
# Backend
JWT_SECRET=<generate-strong-secret>
DATABASE_URL=sqlite:////mnt/data/app.db
FLASK_ENV=production
LOG_LEVEL=INFO

# Frontend
VITE_API_URL=https://backend-url.azurecontainerapps.io
```

---

## Security Checklist

- [ ] Change default JWT_SECRET
- [ ] Enable HTTPS/TLS for all connections
- [ ] Use Azure Key Vault for secrets
- [ ] Enable CORS for frontend domain only
- [ ] Set up Azure SQL firewall rules
- [ ] Enable audit logging
- [ ] Use managed identities for Azure resources
- [ ] Enable backup and disaster recovery

---

## Database Initialization

The application auto-initializes on first run:
1. Creates all tables via SQLAlchemy `Base.metadata.create_all()`
2. Seeds default users (admin, reviewer, readonly)
3. Adds any missing columns for backward compatibility

**No manual database setup required!**

---

## Monitoring & Logging

Add Application Insights:

```bash
az containerapp create \
  --name usecaseapp-backend \
  --resource-group santee-cooper-apps \
  --environment usecaseapp-env \
  --applicationinsights-key <INSTRUMENTATION_KEY>
```

---

## Scaling & Performance

**Recommended Settings:**
- Min replicas: 1
- Max replicas: 5
- CPU: 0.5 (for light traffic) to 2 (for heavy)
- Memory: 1.0Gi to 4.0Gi

**Auto-scale rules:**
- Scale up when CPU > 70%
- Scale down when CPU < 30%

---

## Backup & Disaster Recovery

For Azure Files:
- Enable Azure Backup for the storage account
- Snapshots every 24 hours
- Retention: 30 days

For production-grade protection:
- Use Azure SQL Database with geo-replication
- Automatic backups (7-35 days)
- Point-in-time restore available

---

## Cost Estimation (Azure Files Option)

| Service | Cost/Month |
|---------|-----------|
| Storage Account (100GB) | ~$5 |
| Container Apps (1 CPU, 1GB RAM) | ~$15 |
| Data transfer (out) | ~$0.05/GB |
| **Total** | **~$20-50/month** |

---

## Next Steps

1. Choose storage option (recommend Option 2)
2. Create Azure resources
3. Update environment variables
4. Deploy container images to Azure Container Registry
5. Configure Container Apps
6. Test end-to-end
7. Set up monitoring and logging
8. Configure auto-scaling rules
9. Enable backups

For help, contact your Azure administrator or Santee Cooper Cloud team.
