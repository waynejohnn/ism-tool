# Reorganization Summary

## Overview

This document captures the repository reorganization work completed to improve maintainability and clarity of ownership across code, deployment assets, tests, and documentation.

## What Was Reorganized

### 1) Deployment Assets Consolidated

Deployment content is organized under `deploy/` by environment and purpose:

- `deploy/dev/` for development deployment helpers
- `deploy/tst/` for test deployment helpers
- `deploy/prd/` for production deployment assets
- `deploy/gcp/` for shared Cloud Run deployment logic

### 2) Documentation Centralized

Project documentation is organized under `docs/` with dedicated files for:

- architecture
- API reference
- database details
- development setup
- workflow and process guidance
- deployment quick references

### 3) Tests Grouped by Scope

Testing scripts and guides are grouped under `test/` for easier CI and local execution.

### 4) CI/CD Standardized

Automation is standardized on GitHub Actions with branch-based deployment flow:

- `deploy/dev` for development deployments
- `deploy/tst` for testing deployments
- `deploy/prd` for production deployments

## Current Structure (High Level)

```text
backend/          API and business logic
frontend/         UI application
deploy/           Deployment scripts and environment wrappers
docs/             Project and operational documentation
test/             Validation and test scripts
.github/workflows CI/CD workflows
```

## Operational Outcomes

- Clearer separation of application code and operational assets
- Simpler onboarding for developers and operators
- Predictable branch-to-environment deployment behavior
- Reduced duplication in deployment scripts via shared wrappers

## Ongoing Maintenance Guidelines

- Keep deployment documentation in `deploy/` and `docs/`
- Keep user/system reference docs in `docs/`
- Keep environment-specific automation inside `deploy/<env>/`
- Keep CI/CD changes aligned with branch flow and environment naming

## Last Updated

March 1, 2026
