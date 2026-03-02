# Cloud Run Deployment Quick Start (Dev)

## Prerequisites

- Docker installed and running
- `gcloud` CLI installed
- `.env.dev.gcp.local` file present in project root
- Authenticated `gcloud` session or GitHub Actions credentials

## Local deploy

```bash
chmod +x ./deploy/dev/deploy-dev-cloudrun.sh
./deploy/dev/deploy-dev-cloudrun.sh --env-file .env.dev.gcp.local
```

## Expected output

- Backend service URL on Cloud Run
- Frontend service URL on Cloud Run

## Verify

```bash
curl https://<backend-cloud-run-url>/health
curl -I https://<frontend-cloud-run-url>
```

## CI/CD deploy

Push to deployment branch:

```bash
git push origin deploy/dev
```
