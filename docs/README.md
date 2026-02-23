# Use Case Scoring App

This application is designed to score use cases based on various criteria. It consists of a React frontend and a Python backend with a SQLite database.

## Getting Started

### Prerequisites
- Docker
- Docker Compose

### Running the Application
1. Clone the repository.
2. Navigate to the project directory.
3. Run `docker compose up --build` to start the application.

Frontend: http://localhost:3000
Backend: http://localhost:5001

### API Endpoints
- `POST /usecases`: Create intake
- `PATCH /usecases/:id/assign`: Assign CoE reviewer
- `POST /reviewsessions`: Start review session
- `POST /reviewinvites`: Create tokenized review link
- `GET /review?token=...`: Fetch criteria for scoring
- `POST /scores?token=...`: Submit a score
- `POST /reviewcomments?token=...`: Submit a comment
- `POST /compute/:useCaseId`: Compute totals
- `GET /dashboard/kanban`: Kanban lanes
- `GET /dashboard/portfolio`: Portfolio ranking

### Seed Data
`backend/seed.py` currently loads placeholder criteria entries. Replace with the official Appendix A list when available.