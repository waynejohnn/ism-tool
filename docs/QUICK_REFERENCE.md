# Quick Reference - GitHub Actions + Cloud Run

## Branch flow

- `feature/* -> develop`
- `develop -> main`

## Deployment branches

- `deploy/dev` triggers development deploy
- `deploy/tst` triggers test deploy
- `deploy/prd` triggers production deploy

## Required GitHub secrets

- `GCP_CREDENTIALS_DEV`
- `GCP_CREDENTIALS_TST`
- `GCP_CREDENTIALS_PRD`
- `ENV_FILE_DEV`
- `ENV_FILE_TST`
- `ENV_FILE_PRD`

## Minimum env values inside each `ENV_FILE_*`

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_ARTIFACT_REPOSITORY`
- `BACKEND_SERVICE_NAME`
- `FRONTEND_SERVICE_NAME`

## Manual deploy command

```bash
chmod +x ./deploy/dev/deploy-dev-cloudrun.sh
./deploy/dev/deploy-dev-cloudrun.sh --env-file .env.dev.gcp.local
```

## Health checks

```bash
curl https://<backend-service-url>/health
curl -I https://<frontend-service-url>
```
