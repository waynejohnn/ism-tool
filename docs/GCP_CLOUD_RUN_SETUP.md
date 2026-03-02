# GCP Cloud Run Setup Guide

This guide covers the minimum setup required for GitHub Actions deployments to Cloud Run.

## 1) Required GitHub Secrets

Set these repository or environment secrets:

- `GCP_CREDENTIALS_DEV`
- `GCP_CREDENTIALS_TST`
- `GCP_CREDENTIALS_PRD`
- `ENV_FILE_DEV`
- `ENV_FILE_TST`
- `ENV_FILE_PRD`

`GCP_CREDENTIALS_*` must be the full JSON key for a GCP service account.

`ENV_FILE_*` must be multiline `.env` content. Minimum keys:

- `GCP_PROJECT_ID`
- `GCP_REGION`
- `GCP_ARTIFACT_REPOSITORY`
- `BACKEND_SERVICE_NAME`
- `FRONTEND_SERVICE_NAME`

Optional keys:

- `BACKEND_SERVICE_ACCOUNT`
- `FRONTEND_SERVICE_ACCOUNT`
- `BACKEND_ENV_VARS`
- `FRONTEND_ENV_VARS`
- `VITE_API_URL`

## 2) Service Account and IAM Roles

Create one deployer service account per environment (recommended), for example:

- `gha-cloudrun-dev@<project>.iam.gserviceaccount.com`
- `gha-cloudrun-tst@<project>.iam.gserviceaccount.com`
- `gha-cloudrun-prd@<project>.iam.gserviceaccount.com`

Grant these roles to each deployer service account:

- `roles/run.admin`
- `roles/artifactregistry.writer`
- `roles/iam.serviceAccountUser`

If Cloud Run services use runtime service accounts, grant deployer SA permission to impersonate them:

- `roles/iam.serviceAccountUser` on each runtime SA

If Artifact Registry repository-level IAM is used, grant writer at repository scope.

## 3) One-time GCP Provisioning

```bash
# Set context
export PROJECT_ID="<your-project-id>"
export REGION="us-central1"
export REPO="usecase-scoring"
export DEPLOYER_SA="gha-cloudrun-dev"

gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com artifactregistry.googleapis.com cloudbuild.googleapis.com iam.googleapis.com

# Create Artifact Registry repo if needed
gcloud artifacts repositories create "$REPO" \
  --repository-format=docker \
  --location="$REGION" \
  --description="Use case scoring images"

# Create deployer service account
gcloud iam service-accounts create "$DEPLOYER_SA" \
  --display-name="GitHub Actions Cloud Run Deployer"

# Grant project roles
gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.writer"

gcloud projects add-iam-policy-binding "$PROJECT_ID" \
  --member="serviceAccount:${DEPLOYER_SA}@${PROJECT_ID}.iam.gserviceaccount.com" \
  --role="roles/iam.serviceAccountUser"
```

## 4) Generate and Store Service Account Key JSON

```bash
gcloud iam service-accounts keys create ./gha-cloudrun-dev-key.json \
  --iam-account="gha-cloudrun-dev@<project>.iam.gserviceaccount.com"
```

Copy the JSON content into GitHub secret `GCP_CREDENTIALS_DEV`.
Repeat for test and production accounts.

## 5) `ENV_FILE_*` Example

Use this pattern for each environment secret (`ENV_FILE_DEV`, `ENV_FILE_TST`, `ENV_FILE_PRD`):

```dotenv
GCP_PROJECT_ID=my-gcp-project
GCP_REGION=us-central1
GCP_ARTIFACT_REPOSITORY=usecase-scoring
BACKEND_SERVICE_NAME=usecaseapp-backend-dev
FRONTEND_SERVICE_NAME=usecaseapp-frontend-dev
BACKEND_SERVICE_ACCOUNT=usecase-backend-dev@my-gcp-project.iam.gserviceaccount.com
FRONTEND_SERVICE_ACCOUNT=usecase-frontend-dev@my-gcp-project.iam.gserviceaccount.com
BACKEND_ENV_VARS=FLASK_ENV=production,JWT_SECRET=replace-me,CORS_ORIGINS=https://usecaseapp-frontend-dev-xxxxx-uc.a.run.app
FRONTEND_ENV_VARS=
VITE_API_URL=
```

Notes:

- Keep `BACKEND_ENV_VARS` as comma-separated `KEY=VALUE` pairs.
- If `VITE_API_URL` is empty, deployment script auto-uses deployed backend URL.

## 6) Branch-triggered Deployments

Configured in `.github/workflows/deploy-by-branch.yml`:

- push to `deploy/dev` => deploy development
- push to `deploy/tst` => deploy testing
- push to `deploy/prd` => deploy production

## 7) Validation Checklist

After first deploy per environment:

```bash
curl https://<backend-cloud-run-url>/health
curl -I https://<frontend-cloud-run-url>
```

Verify in GCP:

- Cloud Run services exist and latest revisions are healthy
- Container images are present in Artifact Registry
- Runtime service accounts are attached correctly
- Application logs are visible in Cloud Logging

## 8) Optional Hardening

- Enable GitHub Environments with required reviewers for `production`
- Use separate GCP projects for dev/tst/prd
- Rotate service account keys regularly
- Restrict runtime service accounts to least privilege
- Move sensitive runtime vars to Secret Manager and inject via Cloud Run
