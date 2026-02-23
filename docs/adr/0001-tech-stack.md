# ADR 0001: Tech Stack

## Status
Accepted

## Context
The project requires a lightweight internal web application with fast iteration and minimal infra.

## Decision
Use Flask + SQLite for the API and React + Vite for the frontend.

## Consequences
- Fast local setup and simple deployment.
- Can migrate to a more robust stack later if needed.
