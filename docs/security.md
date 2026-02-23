# Security

- JWT HS256 tokens for shareable review links.
- Tokens expire within 7 days and are scoped to a single review session.
- Audit events should log token usage, IP, and timestamps (placeholder for future logging).
- Comments should avoid PII/PHI content.
