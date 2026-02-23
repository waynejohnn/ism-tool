# Project Structure and File Organization Guide

## Overview

The Use Case Scoring App has been reorganized into a clean, maintainable folder structure with clear separation of concerns:

- **`frontend/`** - React application code
- **`backend/`** - Python Flask API and business logic
- **`deploy/`** - Deployment scripts and guides organized by environment (dev, tst, prd)
- **`test/`** - Test files and validation scripts
- **`docs/`** - Documentation (this folder and all references guide)
- **`.github/`** - GitHub configuration and Copilot instructions

## Complete Folder Structure

```
Use Case Scoring App/
│
├── docs/                               # All documentation
│   ├── README.md                       # Main documentation index
│   ├── api.md                          # API endpoint reference
│   ├── database.md                     # Database schema and structure
│   ├── development-setup.md            # Local dev environment guide
│   ├── frontend-components.md          # React component reference
│   ├── workflows.md                    # User workflows and processes
│   ├── architecture.md                 # System architecture overview
│   ├── security.md                     # Security guidelines
│   ├── scoring.md                      # Scoring algorithm documentation
│   ├── DOCUMENTATION_STANDARDS.md      # Documentation guidelines
│   ├── PROJECT_STRUCTURE.md            # This file
│   ├── adr/                            # Architecture Decision Records
│   │   └── 0001-tech-stack.md
│   └── ... (other docs)
│
├── deploy/                             # All deployment-related files
│   ├── README.md                       # Deployment folder guide
│   ├── dev/                            # Development environment
│   │   ├── deploy-dev-aca.ps1          # PowerShell deployment script
│   │   ├── deploy-dev-aca.sh           # Bash deployment script
│   │   ├── docker-compose.yml          # Dev Docker Compose config
│   │   ├── azure-pipelines.yml         # CI/CD pipeline configuration
│   │   └── tmp_payload.json            # Test API payload
│   │
│   ├── tst/                            # Testing environment (reserved)
│   │
│   └── prd/                            # Production environment
│       ├── deploy-aca.ps1              # Production deployment script
│       ├── docker-compose.prod.yml     # Prod Docker Compose config
│       ├── ACA_DEV_DEPLOYMENT.md       # Dev guide (Windows/PowerShell)
│       ├── LINUX_DEPLOYMENT_GUIDE.md   # Dev guide (Linux/Bash)
│       ├── ACA_DEPLOYMENT_CHECKLIST.md # Deployment verification
│       ├── ACA_VARIABLES_REFERENCE.md  # Environment variables
│       └── ... (other deployment docs)
│
├── test/                               # Test and validation scripts
│   ├── README.md                       # Test folder guide
│   ├── test-dimension-calc.py          # Python scoring tests
│   └── test-dimension-calc.js          # JavaScript scoring tests
│
├── frontend/                           # React application
│   ├── package.json
│   ├── vite.config.js
│   ├── Dockerfile
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── context/
│   │   ├── styles/
│   │   ├── theme/
│   │   └── api.js
│   └── public/
│
├── backend/                            # Flask API
│   ├── requirements.txt
│   ├── Dockerfile
│   ├── app.py                          # Main application
│   ├── models.py                       # Database models
│   ├── scoring.py                      # Scoring logic
│   ├── db.py                           # Database initialization
│   ├── wsgi.py                         # WSGI entry point
│   ├── seed.py                         # Database seeding
│   └── data/
│       ├── app.db                      # SQLite database (generated)
│       └── schema.sql                  # Database schema
│
├── .github/
│   ├── copilot-instructions.md         # Copilot workspace guidelines
│   └── workflows/                      # GitHub Actions workflows
│
├── .dockerignore
├── .env.dev.aca                        # Dev environment template
├── .env.production                     # Production environment template
│
└── README.md                           # Project root README
```

## File Location Guidelines

### When Running Scripts

**From Project Root:**
```bash
# PowerShell
./deploy/dev/deploy-dev-aca.ps1 -EnvFile .env.dev.aca.local

# Bash
./deploy/dev/deploy-dev-aca.sh --env-file .env.dev.aca.local

# Docker Compose
docker-compose -f ./deploy/dev/docker-compose.yml up --build
```

**From deploy/dev/ directory:**
```bash
# PowerShell
./deploy-dev-aca.ps1 -EnvFile ../../.env.dev.aca.local

# Bash
./deploy-dev-aca.sh --env-file ../../.env.dev.aca.local
```

### When Writing Documentation

**Link to resources in the same folder:**
```markdown
See [Development Setup](development-setup.md)
```

**Link to resources in deploy/prd/ from docs/:**
```markdown
See [Deployment Checklist](../deploy/prd/ACA_DEPLOYMENT_CHECKLIST.md)
```

**Link to API documentation:**
```markdown
For endpoint details, see [API Reference](api.md)
```

**Link to test files:**
```markdown
Run tests with [test scripts](../test/README.md)
```

## Environment Files

**Location:** Project root  
**Files:**
- `.env.dev.aca` - Development environment template (version controlled)
- `.env.production` - Production environment template (version controlled)
- `.env.dev.aca.local` - Development configuration (local, NOT in version control)

**Scripts reference these with relative paths:**
- From project root: `.env.dev.aca.local`
- From deploy/dev/: `../../.env.dev.aca.local`

## Docker Compose Files

| File | Location | Purpose | Use Case |
|------|----------|---------|----------|
| `docker-compose.yml` | `deploy/dev/` | Development with Docker | Local development |
| `docker-compose.prod.yml` | `deploy/prd/` | Production-like setup | Pre-production testing, staging |

**Important:** These files use relative paths to `../../frontend` and `../../backend` to reference application code.

## Deployment Scripts

All deployment scripts are in `deploy/dev/` and read from:
- `.env.dev.aca.local` - Development environment configuration

Scripts reference application code using relative paths:
- `../../backend` - Backend application
- `../../frontend` - Frontend application

## Database

**Location:** `backend/data/app.db`  
**Type:** SQLite (created on first run)  
**Persistence:** 
- Local: stored in `backend/data/` volume
- Docker: persists via named volume
- Production: Azure Storage Account

**Seeding:**
```bash
python backend/seed.py
```

## Documentation Organization

### Core Documentation (in `docs/`)
- **api.md** - RESTful API endpoints and examples
- **database.md** - Schema, queries, relationships
- **development-setup.md** - Setting up local environment
- **frontend-components.md** - React component reference
- **workflows.md** - User workflows and processes
- **architecture.md** - System design and data flow
- **scoring.md** - ISM scoring algorithm explanation
- **security.md** - Authentication, authorization, data protection
- **DOCUMENTATION_STANDARDS.md** - How to write docs

### Deployment Documentation (in `deploy/prd/`)
- **ACA_DEPLOYMENT_CHECKLIST.md** - Pre/post deployment checks
- **ACA_DEPLOYMENT_PACKAGE.md** - Deployment package overview
- **ACA_VARIABLES_REFERENCE.md** - All environment variables
- **ACA_DEV_DEPLOYMENT.md** - Windows/PowerShell deployment guide
- **LINUX_DEPLOYMENT_GUIDE.md** - Linux/Bash deployment guide
- **PRODUCTION_DEPLOYMENT.md** - Production deployment notes
- **PRODUCTION_READY.md** - Production readiness criteria

### Architecture Decisions (in `docs/adr/`)
- **0001-tech-stack.md** - Technology and framework choices

## Key Rules

### DO ✓
- Store documentation in `docs/` folder
- Store deployment files in `deploy/` folder
- Store test files in `test/` folder
- Use relative paths in scripts
- Keep environment files in project root
- Reference folders by their new paths (e.g., `deploy/dev/`)

### DON'T ✗
- Don't create documentation files in root directory
- Don't mix deployment scripts with application code
- Don't use absolute file paths in scripts
- Don't move environment files without updating scripts
- Don't create new top-level folders without planning

## Updating References When Files Move

If you move files or folders:

1. **Update scripts** with new relative paths
2. **Update documentation** links to reference new locations
3. **Update docker-compose** file paths if needed
4. **Test all scripts** to ensure they can find referenced files
5. **Update CI/CD pipelines** if paths changed

## Troubleshooting Structure

**Script can't find environment file:**
- Check the script is running from the correct directory
- Verify environment file path matches script expectations
- Run from project root with full relative path

**Docker Compose fails to build:**
- Verify context paths in docker-compose-yml are correct
- Ensure frontend and backend folders exist
- Check that Dockerfiles are present

**Documentation links are broken:**
- Verify the file exists at the referenced path
- Use relative paths carefully (especially `../`)
- Use links from within the same folder when possible

## Migration Notes

**What Changed:** (Feb 22, 2026)
- Moved test files to `test/` folder
- Moved deployment scripts to `deploy/dev/` and `deploy/prd/` by environment
- Updated all docker-compose paths to reference correct relative locations
- Updated script default environment file paths
- Created comprehensive documentation for new structure

**What Stayed the Same:**
- Application code location (frontend/, backend/)
- Environment file location (root .env files)
- Database location (backend/data/)
- Core functionality and APIs

## Version History

| Date | Changes |
|------|---------|
| Feb 22, 2026 | Initial project restructuring - moved test files and deployment artifacts to organized folders |
| Feb 22, 2026 | Updated all scripts to use correct relative paths |
| Feb 22, 2026 | Created deployment and test folder READMEs |
| Feb 22, 2026 | Updated documentation standards |

---

**For questions about the structure, see [DOCUMENTATION_STANDARDS.md](DOCUMENTATION_STANDARDS.md)**

**Last Updated:** February 22, 2026
