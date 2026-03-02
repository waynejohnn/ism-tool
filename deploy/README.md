# Deployment

Deployment is managed with GitHub Actions and Google Cloud Run.

## Branch-triggered deployments

- `deploy/dev` triggers development deployment
- `deploy/tst` triggers testing deployment
- `deploy/prd` triggers production deployment

## Scripts

- `deploy/gcp/deploy-cloudrun.sh` - shared Cloud Run deploy script
- `deploy/dev/deploy-dev-cloudrun.sh` - development wrapper
- `deploy/tst/deploy-tst-cloudrun.sh` - testing wrapper
- `deploy/prd/deploy-prd-cloudrun.sh` - production wrapper

## Required GitHub secrets

Per environment (`DEV`, `TST`, `PRD`):

- `GCP_CREDENTIALS_<ENV>`: GCP service account key JSON
- `ENV_FILE_<ENV>`: multiline env content consumed by deploy script

## Required env values in each `ENV_FILE_*`

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_ARTIFACT_REPOSITORY`
- `BACKEND_SERVICE_NAME`
- `FRONTEND_SERVICE_NAME`

Optional:

- `BACKEND_SERVICE_ACCOUNT`
- `FRONTEND_SERVICE_ACCOUNT`
- `BACKEND_ENV_VARS`
- `FRONTEND_ENV_VARS`
- `VITE_API_URL`

## Local manual deployment

```bash
chmod +x ./deploy/dev/deploy-dev-cloudrun.sh
./deploy/dev/deploy-dev-cloudrun.sh --env-file .env.dev.gcp.local
```
