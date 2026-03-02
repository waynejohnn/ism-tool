# Production Readiness (GCP Cloud Run)

## Readiness Checklist

- [ ] GitHub Actions workflow `.github/workflows/deploy-by-branch.yml` is present
- [ ] `deploy/prd` branch exists and is protected
- [ ] `GCP_CREDENTIALS_PRD` and `ENV_FILE_PRD` are set
- [ ] Cloud Run services names are defined in `ENV_FILE_PRD`
- [ ] Backend `/health` endpoint returns HTTP 200 after deployment
- [ ] Frontend URL is reachable after deployment

## Deployment Command

```bash
git push origin deploy/prd
```

## Post-deploy Validation

```bash
curl https://<backend-cloud-run-url>/health
curl -I https://<frontend-cloud-run-url>
```
