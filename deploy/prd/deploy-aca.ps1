Param(
    [Parameter(Mandatory=$false)][string]$ResourceGroup = "santee-cooper-apps",
    [Parameter(Mandatory=$false)][string]$Location = "eastus",
    [Parameter(Mandatory=$false)][string]$StorageAccount = "usecasestorage",
    [Parameter(Mandatory=$false)][string]$FileShare = "appdata",
    [Parameter(Mandatory=$false)][string]$RegistryName = "usecaseregistry",
    [Parameter(Mandatory=$false)][string]$EnvName = "usecaseapp-env",
    [Parameter(Mandatory=$false)][string]$BackendAppName = "usecaseapp-backend",
    [Parameter(Mandatory=$false)][string]$FrontendAppName = "usecaseapp-frontend",
    [Parameter(Mandatory=$false)][string]$BackendImageTag = "backend:latest",
    [Parameter(Mandatory=$false)][string]$FrontendImageTag = "frontend:latest"
)

$ErrorActionPreference = "Stop"

Write-Host "==> Logging into Azure..."
az login | Out-Null

Write-Host "==> Creating resource group..."
az group create --name $ResourceGroup --location $Location | Out-Null

Write-Host "==> Creating storage account..."
az storage account create `
  --name $StorageAccount `
  --resource-group $ResourceGroup `
  --location $Location `
  --sku Standard_LRS | Out-Null

Write-Host "==> Creating file share..."
az storage share create `
  --name $FileShare `
  --account-name $StorageAccount | Out-Null

Write-Host "==> Creating container registry..."
az acr create `
  --resource-group $ResourceGroup `
  --name $RegistryName `
  --sku Basic | Out-Null

Write-Host "==> Logging into container registry..."
az acr login --name $RegistryName | Out-Null

Write-Host "==> Building and pushing backend image..."
docker build -t "$RegistryName.azurecr.io/$BackendImageTag" ./backend

docker push "$RegistryName.azurecr.io/$BackendImageTag"

Write-Host "==> Building and pushing frontend image..."
docker build -t "$RegistryName.azurecr.io/$FrontendImageTag" ./frontend

docker push "$RegistryName.azurecr.io/$FrontendImageTag"

Write-Host "==> Creating Container Apps environment..."
az containerapp env create `
  --name $EnvName `
  --resource-group $ResourceGroup `
  --location $Location | Out-Null

$JwtSecret = [Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
$AcrPassword = az acr credential show --name $RegistryName --query passwords[0].value -o tsv

Write-Host "==> Creating backend Container App..."
az containerapp create `
  --name $BackendAppName `
  --resource-group $ResourceGroup `
  --environment $EnvName `
  --image "$RegistryName.azurecr.io/$BackendImageTag" `
  --ingress external `
  --target-port 5000 `
  --min-replicas 1 `
  --max-replicas 3 `
  --cpu 0.5 `
  --memory 1Gi `
  --environment-variables `
    JWT_SECRET=$JwtSecret `
    FLASK_ENV=production `
    DATABASE_URL="sqlite:////mnt/appdata/app.db" `
  --storage-mounts `
    volumeName=database `
    storageAccountName=$StorageAccount `
    storageName=$FileShare `
    storageType=AzureFiles `
    mountPath=/mnt/appdata `
  --registry-username $RegistryName `
  --registry-password $AcrPassword | Out-Null

$BackendUrl = az containerapp show `
  --name $BackendAppName `
  --resource-group $ResourceGroup `
  --query "properties.configuration.ingress.fqdn" -o tsv

Write-Host "==> Creating frontend Container App..."
az containerapp create `
  --name $FrontendAppName `
  --resource-group $ResourceGroup `
  --environment $EnvName `
  --image "$RegistryName.azurecr.io/$FrontendImageTag" `
  --ingress external `
  --target-port 3000 `
  --min-replicas 1 `
  --max-replicas 3 `
  --cpu 0.5 `
  --memory 1Gi `
  --environment-variables `
    VITE_API_URL="https://$BackendUrl" `
  --registry-username $RegistryName `
  --registry-password $AcrPassword | Out-Null

$FrontendUrl = az containerapp show `
  --name $FrontendAppName `
  --resource-group $ResourceGroup `
  --query "properties.configuration.ingress.fqdn" -o tsv

Write-Host "==> Deployment complete"
Write-Host "Backend URL: https://$BackendUrl"
Write-Host "Frontend URL: https://$FrontendUrl"
Write-Host "Health check: https://$BackendUrl/health"
Write-Host "Login: admin@santeecooper.com / admin123"
