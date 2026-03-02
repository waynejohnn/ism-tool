# Production Deployment (GCP Cloud Run)

Production deployment is triggered by pushing to `deploy/prd` and executed by GitHub Actions.

## Requirements

- GitHub environment: `production`
- GitHub secrets:
  - `GCP_CREDENTIALS_PRD`
  - `ENV_FILE_PRD`
- `ENV_FILE_PRD` includes:
  - `GCP_PROJECT_ID`
  - `GCP_REGION`
  - `GCP_ARTIFACT_REPOSITORY`
  - `BACKEND_SERVICE_NAME`
  - `FRONTEND_SERVICE_NAME`

## Deploy Trigger

```bash
git push origin deploy/prd
```

## Verification

```bash
curl https://<backend-cloud-run-url>/health
curl -I https://<frontend-cloud-run-url>
```

## Rollback

Use Cloud Run revision traffic rollback:

```bash
gcloud run services update-traffic <service-name> --to-revisions <previous-revision>=100 --region <region> --project <project-id>
```
