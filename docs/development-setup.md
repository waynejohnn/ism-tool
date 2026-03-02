# Development Setup Guide

## Prerequisites

Before getting started, ensure you have the following installed on your system:

### Required
- **Docker** (v20.10+): [Download Docker Desktop](https://www.docker.com/products/docker-desktop)
- **Docker Compose** (v2.0+): Included with Docker Desktop
- **Git**: For cloning the repository
- **Code Editor**: VS Code recommended

### Optional (for native development)
- **Node.js** (v18+): For frontend development without Docker
- **Python** (v3.10+): For backend development without Docker
- **SQLite Browser**: For database inspection ([DB Browser for SQLite](https://sqlitebrowser.org/))

---

## Project Structure

```
Use Case Scoring App/
├── backend/                    # Python Flask API
│   ├── app.py                 # Main application
│   ├── models.py              # Database models
│   ├── db.py                  # Database configuration
│   ├── scoring.py             # Scoring algorithm
│   ├── seed.py                # Database seeding
│   ├── requirements.txt        # Python dependencies
│   ├── Dockerfile             # Backend container definition
│   ├── data/                  # Database storage (created at runtime)
│   └── __pycache__/           # Python cache (ignore)
├── frontend/                   # React + Vite UI
│   ├── src/                   # React components and pages
│   ├── public/                # Static assets
│   ├── package.json           # Node dependencies
│   ├── Dockerfile             # Frontend container definition
│   └── index.html             # HTML entry point
├── docs/                       # Documentation
│   ├── api.md                 # API endpoint documentation
│   ├── database.md            # Database schema
│   ├── architecture.md        # System architecture
│   └── security.md            # Security guidelines
├── docker-compose.yml         # Local development setup
├── docker-compose.prod.yml    # Production setup
└── README.md                  # Quick start guide
```

---

## Quick Start

### Option 1: Docker Compose (Recommended)

This is the fastest way to get started for all developers.

#### 1. Clone the Repository
```bash
git clone <repository-url>
cd "Use Case Scoring App"
```

#### 2. Start the Application
```bash
docker compose up --build
```

This will:
- Build both frontend and backend Docker images
- Create and initialize the SQLite database
- Seed default users and criteria
- Start both services

#### 3. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5001
- **Health Check**: http://localhost:5001/health

#### 4. Login
Use default credentials:
```
Email: admin@santeecooper.com
Password: admin123
```

#### 5. Stop the Application
```bash
docker compose down
```

#### 6. Cleanup (Remove Data)
```bash
docker compose down -v
```

This removes containers AND the database volume, allowing a fresh start next time.

---

### Option 2: Native Development (Advanced)

For faster iteration on individual services, you can run them natively.

#### Backend Setup

##### 1. Create Python Virtual Environment
```bash
cd backend
python -m venv venv
```

##### 2. Activate Virtual Environment
**Windows (PowerShell):**
```powershell
.\venv\Scripts\Activate.ps1
```

**macOS/Linux:**
```bash
source venv/bin/activate
```

##### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

##### 4. Initialize Database
```bash
python -c "from app import init_db; init_db()"
```

##### 5. Run Backend
```bash
# Development mode (auto-reload)
export FLASK_ENV=development FLASK_APP=app.py
flask run --host 0.0.0.0 --port 5001

# Or with gunicorn (production-like)
gunicorn app:app --bind 0.0.0.0:5001 --reload
```

Backend will be available at: http://localhost:5001

#### Frontend Setup

##### 1. Install Node Dependencies
```bash
cd frontend
npm install
```

##### 2. Run Development Server
```bash
npm run dev
```

Frontend will be available at: http://localhost:3000
- Includes hot module reloading (changes reflect instantly)

##### 3. Build for Production
```bash
npm run build
```

Creates optimized build in `dist/` directory.

---

## Configuration

### Environment Variables

Create a `.env` file in the root directory to customize settings:

```bash
# Flask Configuration
FLASK_ENV=development          # development or production
FLASK_APP=backend/app.py

# Database
DATABASE_URL=sqlite:///backend/data/app.db

# JWT Authentication
JWT_SECRET=your-secret-key-here
JWT_ISSUER=usecase-scoring

# CORS
CORS_ORIGINS=http://localhost:3000

# Port Configuration
BACKEND_PORT=5001
FRONTEND_PORT=3000

# Logging
LOG_LEVEL=DEBUG
```

### Docker Compose Environment

For `docker-compose.yml`, environment variables are already configured in the service definitions. To override:

```bash
# Set before starting
export FLASK_ENV=production
docker compose up --build
```

---

## Common Development Tasks

### 1. View Backend Logs
```bash
# While docker compose is running
docker compose logs -f backend

# Last 50 lines
docker compose logs --tail=50 backend

# With timestamps and service names
docker compose logs -t backend
```

### 2. View Frontend Logs
```bash
docker compose logs -f frontend
```

### 3. Access Database Shell
```bash
# While containers are running
docker compose exec backend sqlite3 /app/data/app.db

# Then in sqlite shell:
.tables                 # list all tables
.schema use_cases       # view table structure
SELECT COUNT(*) FROM use_cases;  # count records
.quit                   # exit
```

### 4. Run Database Migrations
```bash
# Add a new column to a table
docker compose exec backend python -c "
from db import engine, Base
Base.metadata.create_all(bind=engine)
"
```

### 5. Seed Additional Test Data
```bash
docker compose exec backend python seed.py
```

### 6. View API Documentation
After starting the app:
- See [docs/api.md](api.md) for complete API specs
- Or access Swagger/OpenAPI docs (if implemented)

### 7. Run Backend Tests
```bash
# If pytest is installed
cd backend
python -m pytest test_status_validation.py

# Or run test scripts directly
python test_status_validation.py
```

---

## Database Management

### View Database in GUI
```bash
# Download and open DB Browser for SQLite
# Then open: backend/data/app.db
```

### Export Data
```bash
# Export as CSV
sqlite3 backend/data/app.db << EOF
.mode csv
.output use_cases_export.csv
SELECT * FROM use_cases;
.quit
EOF
```

### Backup Database
```bash
# Copy the database file
cp backend/data/app.db backend/data/app.db.backup
```

### Reset Database (Delete All Data)
```bash
# Option 1: With Docker
docker compose down -v
docker compose up --build

# Option 2: Direct file deletion
rm backend/data/app.db
# Then restart backend to auto-recreate and seed
```

---

## Debugging

### Backend Debugging with VS Code

1. **Install Python extension** in VS Code
2. **Create `.vscode/launch.json`:**
```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Python Flask",
      "type": "python",
      "request": "launch",
      "module": "flask",
      "env": {
        "FLASK_APP": "backend/app.py",
        "FLASK_ENV": "development",
        "FLASK_DEBUG": "1"
      },
      "args": ["run", "--host=0.0.0.0", "--port=5001"],
      "jinja": true,
      "cwd": "${workspaceFolder}"
    }
  ]
}
```

3. **Set breakpoints** and press F5 to start debugging

### Frontend Debugging

1. **Chrome DevTools**: Press F12 in browser
   - Console for JS errors
   - Network tab for API calls
   - Sources tab for step-through debugging
   - React Developer Tools extension recommended

2. **VS Code Debugger**: Install "Debugger for Firefox" or "Debugger for Chrome" extension

### API Testing Tools

#### Using curl
```bash
# Health check
curl http://localhost:5001/health

# Login
curl -X POST http://localhost:5001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@santeecooper.com","password":"admin123"}'

# Get use cases
curl http://localhost:5001/usecases
```

#### Using Postman
1. Download [Postman](https://www.postman.com/downloads/)
2. Import API endpoints from [docs/api.md](api.md)
3. Create collection with authentication setup
4. Test individual endpoints with UI

#### Using REST Client (VS Code)
1. Install [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) extension
2. Create `requests.http`:
```http
### Health Check
GET http://localhost:5001/health

### Login
POST http://localhost:5001/auth/login
Content-Type: application/json

{
  "email": "admin@santeecooper.com",
  "password": "admin123"
}

### Get Use Cases
GET http://localhost:5001/usecases
```

3. Click "Send Request" above each endpoint

---

## Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
lsof -i :5001      # macOS/Linux
netstat -ano | findstr :5001  # Windows (PowerShell)

# Kill the process
kill -9 <PID>       # macOS/Linux
taskkill /PID <PID> /F  # Windows
```

### Docker Container Won't Start
```bash
# Check logs
docker compose logs backend
docker compose logs frontend

# Rebuild from scratch
docker compose down -v
docker compose up --build --no-cache
```

### Database Locked Error
```bash
# Remove any lingering connections
docker compose restart backend

# Or reset database
docker compose down -v
docker compose up --build
```

### Frontend Can't Connect to Backend
1. Verify backend is running: `curl http://localhost:5001/health`
2. Check Docker network: `docker network ls`
3. Verify CORS is enabled in `app.py`
4. Check frontend API endpoint in `frontend/src/api.js`

### Python Module Not Found
```bash
# Reinstall dependencies
cd backend
pip install --force-reinstall -r requirements.txt
```

### Node Modules Issues
```bash
# Clear npm cache and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
```

---

## Code Quality

### Python Code Style
- Use Black for formatting: `pip install black && black backend/`
- Use Flake8 for linting: `pip install flake8 && flake8 backend/`
- Follow PEP 8 conventions

### JavaScript/React Code Style
- Use Prettier for formatting: `npm install --save-dev prettier`
- Use ESLint for linting: `npm install --save-dev eslint`
- Follow Airbnb JavaScript style guide

### Running Linters
```bash
# Backend
cd backend
flake8 .
black --check .

# Frontend
cd frontend
npm run lint
npm run format
```

---

## Useful Commands Reference

| Task | Command |
|------|---------|
| Start all services | `docker compose up --build` |
| Stop all services | `docker compose down` |
| View logs | `docker compose logs -f` |
| Access backend shell | `docker compose exec backend /bin/bash` |
| List containers | `docker compose ps` |
| Rebuild images | `docker compose build --no-cache` |
| Reset everything | `docker compose down -v && docker compose up --build` |
| Check health | `curl http://localhost:5001/health` |
| Database shell | `docker compose exec backend sqlite3 /app/data/app.db` |
| Export logs | `docker compose logs > logs.txt` |

---

## Performance Tips

- **Use `.env` for configuration**: Avoids rebuilding containers
- **Enable Docker BuildKit**: `export DOCKER_BUILDKIT=1` for faster builds
- **Use volume mounts for dev**: Already configured in `docker-compose.yml`
- **Minimize npm dependencies**: Check what's actually needed
- **Use React.memo()** for expensive components

---

## Next Steps

1. **Complete the Quick Start** (Option 1 above)
2. **Read the Architecture** docs to understand the system
3. **Review API Documentation** to understand endpoints
4. **Explore the codebase** in VS Code
5. **Make your first change** and see it rebuild automatically
6. **Consult deployment guides** when ready to deploy to Cloud Run

---

## Related Documentation

- [API Documentation](api.md) - Complete endpoint reference
- [Database Schema](database.md) - Data structure overview
- [Architecture](architecture.md) - System design and data flow
- [Production Deployment](../deploy/prd/PRODUCTION_DEPLOYMENT.md) - Cloud Run deployment guide
- [Security Best Practices](security.md) - Security guidelines

---

**Happy developing!** 🚀

For issues or questions, check [TROUBLESHOOTING.md](../TROUBLESHOOTING.md) or contact the dev team.

