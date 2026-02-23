# Architecture

## Overview
- Flask API with SQLite for intake, scoring, and dashboard services.
- React + Vite frontend for intake, review, scoring, and dashboard views.
- Shared scoring logic in backend/scoring.py.

## Data Flow
1. Intake form posts a new use case to `/usecases`.
2. Review session created in `/reviewsessions`; invite tokens created via `/reviewinvites`.
3. Token users submit scores to `/scores?token=...` and comments to `/reviewcomments?token=...`.
4. `/compute/:useCaseId` calculates totals and updates the dashboard views.

## Security
- Tokenized review links with JWT HS256.
- Short expiration and per-session scope.

## Design Lock
- The current UI/UX design is locked and must not be changed without explicit written authorization from the project owner.
- Any design changes require approval before implementation.
