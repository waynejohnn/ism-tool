# API Documentation

## Overview
The Use Case Scoring App backend provides RESTful API endpoints for intake, review, scoring, and dashboard operations. All requests/responses use JSON format.

### Base URL
- **Development**: `http://localhost:5001`
- **Production**: `https://backend-service-xxxxx-uc.a.run.app` (example)

### Authentication
- Most endpoints require a JWT token via `token` query parameter
- Some endpoints (login, health) are public
- Tokens are short-lived and expire after a configured duration

### Response Format
All endpoints return JSON:
```json
{
  "data": {...},
  "error": null
}
```

Error responses:
```json
{
  "error": "Error description",
  "status": 400
}
```

---

## Authentication Endpoints

### Login
**POST** `/auth/login`

Authenticate a user and receive a JWT token.

**Request:**
```json
{
  "email": "admin@santeecooper.com",
  "password": "admin123"
}
```

**Response (200):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "user-uuid-here",
  "email": "admin@santeecooper.com",
  "role": "admin"
}
```

**Error Responses:**
- `400`: Invalid credentials
- `401`: User not found

**Status Codes:**
- `200` - Login successful
- `400` - Invalid request format
- `401` - Invalid credentials

---

### Verify Token
**GET** `/auth/verify`

Verify if current token is valid.

**Query Parameters:**
- `token` (required): JWT token to verify

**Response (200):**
```json
{
  "valid": true,
  "userId": "user-uuid-here",
  "email": "admin@santeecooper.com"
}
```

**Error Responses:**
- `401`: Invalid or expired token

---

### Health Check
**GET** `/health`

Check backend service health and database connectivity.

**Response (200):**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2026-02-22T10:30:00Z"
}
```

**Response (503):**
```json
{
  "status": "unhealthy",
  "database": "disconnected",
  "error": "Connection refused"
}
```

---

## Use Case Endpoints

### Create Use Case (Intake)
**POST** `/usecases`

Submit a new use case for scoring.

**Request:**
```json
{
  "title": "Automation Initiative",
  "description": "Automate manual processes",
  "requestor": "John Doe",
  "businessUnit": "Operations",
  "sponsor": "Jane Smith",
  "technicalSponsor": "Mike Johnson",
  "executiveSponsor": "Dr. Sarah Wilson",
  "stakeholders": ["Dept A", "Dept B"],
  "strategicTheme": ["Cost Reduction", "Operational Efficiency"],
  "strategicDetails": {
    "Sales": "Increase sales throughput",
    "Expenses": "Reduce labor costs",
    "Asset Optimization": "Better resource utilization",
    "Risk": "Reduce operational risk"
  },
  "capabilityAreas": ["Process Automation", "AI/ML"],
  "targetYear": "2026",
  "expectedTimeline": "6-9 months"
}
```

**Response (201):**
```json
{
  "useCaseId": "uuid-here",
  "useCaseNumber": 1,
  "title": "Automation Initiative",
  "status": "Intake",
  "createdOn": "2026-02-22T10:30:00Z"
}
```

**Error Responses:**
- `400`: Missing required fields
- `409`: Duplicate use case title

---

### List All Use Cases
**GET** `/usecases`

Retrieve all use cases.

**Query Parameters:**
- `status` (optional): Filter by status (Intake, In Review, Approved, Implemented, On Hold)
- `pageSize` (optional): Results per page (default: 50)
- `offset` (optional): Pagination offset (default: 0)

**Response (200):**
```json
{
  "total": 10,
  "pageSize": 50,
  "offset": 0,
  "items": [
    {
      "useCaseId": "uuid-1",
      "useCaseNumber": 1,
      "title": "Use Case 1",
      "status": "Intake",
      "requestor": "John Doe",
      "businessUnit": "Operations",
      "createdOn": "2026-02-22T10:30:00Z"
    }
  ]
}
```

---

### Get Use Case Details
**GET** `/usecases/<use_case_id>`

Retrieve detailed information about a specific use case.

**Response (200):**
```json
{
  "useCaseId": "uuid-here",
  "useCaseNumber": 1,
  "title": "Automation Initiative",
  "description": "Automate manual processes",
  "status": "Intake",
  "requestor": "John Doe",
  "businessUnit": "Operations",
  "sponsor": "Jane Smith",
  "technicalSponsor": "Mike Johnson",
  "executiveSponsor": "Dr. Sarah Wilson",
  "strategicTheme": ["Cost Reduction"],
  "targetYear": "2026",
  "totals": {
    "sComposite": 2.45,
    "sValue": 2.5,
    "sFeasibility": 2.3,
    "sOrganizational": 2.4,
    "sStrategic": 2.5
  },
  "createdOn": "2026-02-22T10:30:00Z",
  "updatedOn": "2026-02-22T15:00:00Z"
}
```

**Error Responses:**
- `404`: Use case not found

---

### Update Use Case Status
**PATCH** `/usecases/<use_case_id>`

Update use case status or other fields.

**Request:**
```json
{
  "status": "In Review"
}
```

**Valid Status Values:**
- `Intake` - Initial submission
- `In Review` - Under evaluation
- `Approved` - Approved for implementation
- `Implemented` - Successfully completed
- `On Hold` - Temporarily suspended

**Response (200):**
```json
{
  "useCaseId": "uuid-here",
  "status": "In Review",
  "updatedOn": "2026-02-22T15:00:00Z"
}
```

**Error Responses:**
- `400`: Invalid status value
- `404`: Use case not found

---

### Delete Use Case
**DELETE** `/usecases/<use_case_id>`

Delete a use case and all associated data.

**Response (204):** No content

**Error Responses:**
- `404`: Use case not found

---

## Review Session Endpoints

### Create Review Session
**POST** `/reviewsessions`

Create a review session for a use case.

**Request:**
```json
{
  "useCaseId": "uuid-here",
  "assignedCoEId": "reviewer-uuid"
}
```

**Response (201):**
```json
{
  "sessionId": "session-uuid",
  "useCaseId": "uuid-here",
  "assignedCoEId": "reviewer-uuid",
  "createdOn": "2026-02-22T10:30:00Z"
}
```

**Error Responses:**
- `404`: Use case not found

---

### Create Review Invite
**POST** `/reviewinvites`

Generate a tokenized link for review participation.

**Request:**
```json
{
  "sessionId": "session-uuid",
  "canEdit": true
}
```

**Response (201):**
```json
{
  "inviteId": "invite-uuid",
  "sessionId": "session-uuid",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2026-02-23T10:30:00Z",
  "createdOn": "2026-02-22T10:30:00Z"
}
```

**Error Responses:**
- `404`: Session not found

---

## Scoring Endpoints

### Get Review Context
**GET** `/review`

Fetch use case and criteria data for scoring.

**Query Parameters:**
- `token` (required): Review invite token

**Response (200):**
```json
{
  "useCase": {
    "useCaseId": "uuid-here",
    "useCaseNumber": 1,
    "title": "Automation Initiative",
    "description": "Details...",
    "status": "In Review",
    "requestor": "John Doe",
    "businessUnit": "Operations",
    "naValue": false,
    "naFeasibility": false,
    "naOrgCapability": false,
    "naStrategic": false
  },
  "criteria": [
    {
      "criterionId": "C01",
      "name": "Financial Impact",
      "dimension": "Value",
      "polarity": "BENEFIT",
      "displayOrder": 1
    }
  ]
}
```

**Error Responses:**
- `400`: Missing token parameter
- `401`: Invalid or expired token
- `404`: Use case not found

---

### Update Review N/A Status
**POST** `/review/na`

Mark dimensions as Not Applicable with justification.

**Query Parameters:**
- `token` (required): Review invite token

**Request:**
```json
{
  "naValue": false,
  "naFeasibility": true,
  "naOrgCapability": false,
  "naStrategic": false,
  "naFeasibilityJustification": "Technical dept already evaluated",
  "naReviewerApproval": false,
  "naTechnicalInitiative": false
}
```

**Response (200):**
```json
{
  "success": true,
  "updatedOn": "2026-02-22T15:00:00Z"
}
```

**Error Responses:**
- `400`: Missing or invalid fields
- `401`: Invalid token
- `404`: Use case not found

---

### Submit Score
**POST** `/scores`

Submit a score for a criterion.

**Query Parameters:**
- `token` (required): Review invite token

**Request:**
```json
{
  "criterionId": "C01",
  "rawScore": 2.5,
  "isNA": false,
  "naReason": null,
  "notes": "Strong financial impact expected"
}
```

**Response (201):**
```json
{
  "scoreId": "score-uuid",
  "criterionId": "C01",
  "rawScore": 2.5,
  "isNA": false,
  "createdOn": "2026-02-22T15:00:00Z"
}
```

**Error Responses:**
- `400`: Missing required fields or invalid score value
- `401`: Invalid token

---

### List Scores
**GET** `/scores`

Retrieve all scores for a use case.

**Query Parameters:**
- `token` (required): Review invite token

**Response (200):**
```json
[
  {
    "criterionId": "C01",
    "rawScore": 2.5,
    "isNA": false,
    "naReason": null
  },
  {
    "criterionId": "C02",
    "rawScore": null,
    "isNA": true,
    "naReason": "Not applicable to this initiative"
  }
]
```

**Error Responses:**
- `401`: Invalid token

---

## Computation Endpoints

### Compute Totals
**POST** `/compute/<use_case_id>`

Calculate dimension and composite scores from submitted criterion scores.

**Request:**
```json
{}
```

**Response (200):**
```json
{
  "useCaseId": "uuid-here",
  "sValue": 2.45,
  "sFeasibility": 2.38,
  "sOrganizational": 2.42,
  "sStrategic": 2.5,
  "sComposite": 2.44,
  "updatedOn": "2026-02-22T15:00:00Z"
}
```

**Error Responses:**
- `400`: Invalid N/A dimension configuration
- `404`: Use case not found

---

## Comments Endpoints

### Submit Comment
**POST** `/reviewcomments`

Add a comment to the review session.

**Query Parameters:**
- `token` (required): Review invite token

**Request:**
```json
{
  "text": "Consider phase 2 expansion for greater ROI",
  "raterUserId": "user-id"
}
```

**Response (201):**
```json
{
  "commentId": "comment-uuid",
  "text": "Consider phase 2 expansion...",
  "createdOn": "2026-02-22T15:00:00Z"
}
```

**Error Responses:**
- `401`: Invalid token

---

## Dashboard Endpoints

### Get Kanban View
**GET** `/dashboard/kanban`

Retrieve use cases organized by status lanes.

**Response (200):**
```json
{
  "Intake": [
    {
      "useCaseId": "uuid-1",
      "useCaseNumber": 1,
      "title": "Use Case 1",
      "businessUnit": "Operations"
    }
  ],
  "In Review": [
    {
      "useCaseId": "uuid-2",
      "useCaseNumber": 2,
      "title": "Use Case 2",
      "businessUnit": "Finance"
    }
  ],
  "Completed": []
}
```

---

### Get Portfolio View
**GET** `/dashboard/portfolio`

Retrieve all use cases with scores, sorted by composite score (highest first).

**Response (200):**
```json
[
  {
    "useCaseId": "uuid-1",
    "useCaseNumber": 1,
    "title": "Automation Initiative",
    "businessUnit": "Operations",
    "status": "Approved",
    "totals": {
      "sComposite": 2.45,
      "sValue": 2.5,
      "sFeasibility": 2.3,
      "sOrganizational": 2.4,
      "sStrategic": 2.5
    }
  }
]
```

---

## Admin Endpoints

### List Users
**GET** `/users`

Retrieve all users (admin only).

**Response (200):**
```json
[
  {
    "userId": "user-uuid",
    "email": "admin@santeecooper.com",
    "role": "admin",
    "createdOn": "2026-01-01T00:00:00Z"
  }
]
```

---

### Create User
**POST** `/users`

Create a new user (admin only).

**Request:**
```json
{
  "email": "newuser@santeecooper.com",
  "password": "securePassword123",
  "role": "reviewer"
}
```

**Response (201):**
```json
{
  "userId": "new-uuid",
  "email": "newuser@santeecooper.com",
  "role": "reviewer"
}
```

**Error Responses:**
- `400`: Invalid input
- `409`: Email already exists

---

## Status Endpoints

### Get Valid Statuses
**GET** `/statuses`

Retrieve list of valid use case status values.

**Response (200):**
```json
[
  {
    "value": "Intake",
    "displayName": "Intake",
    "description": "Initial submission stage"
  },
  {
    "value": "In Review",
    "displayName": "In Review",
    "description": "Currently being evaluated"
  },
  {
    "value": "Approved",
    "displayName": "Approved",
    "description": "Approved for implementation"
  },
  {
    "value": "Implemented",
    "displayName": "Implemented",
    "description": "Successfully completed"
  },
  {
    "value": "On Hold",
    "displayName": "On Hold",
    "description": "Temporarily suspended"
  }
]
```

---

## Criteria Endpoints

### List Criteria
**GET** `/criteria`

Retrieve all scoring criteria grouped by dimension.

**Response (200):**
```json
[
  {
    "criterionId": "C01",
    "name": "Financial Impact",
    "dimension": "Value",
    "polarity": "BENEFIT",
    "displayOrder": 1,
    "guidance": "How much measurable financial value will this generate?"
  }
]
```

---

## Error Codes Reference

### HTTP Status Codes
- `200` - Success (GET, POST, PATCH)
- `201` - Created
- `204` - No Content (DELETE)
- `400` - Bad Request (validation error)
- `401` - Unauthorized (invalid/missing token)
- `404` - Not Found
- `409` - Conflict (duplicate, state violation)
- `500` - Server Error

### Common Error Messages
- `Missing token` - Token query parameter required
- `Invalid token` - Token is malformed or expired
- `Use case not found` - Specified use case ID doesn't exist
- `All dimensions are N/A` - Scoring blocked when all 4 dimensions marked Not Applicable
- `Three dimensions are N/A` - Requires technical initiative flag
- `Invalid status value` - Status not in valid list
- `Missing required fields` - Request body incomplete

---

## Rate Limiting
Currently no rate limiting is enforced. Production deployment should implement:
- IP-based rate limiting: 100 requests/minute
- Token-based rate limiting: 1000 requests/hour per user
- Burst limit: 10 requests/second

---

## CORS Policy
- Allowed Origins: Configured per environment
- Allowed Methods: GET, POST, PATCH, DELETE, OPTIONS
- Allowed Headers: Content-Type, Authorization
- Credentials: Included

---

## Authentication Flow

```
1. User logs in with email/password
   POST /auth/login → JWT token

2. Admin creates review session & invite
   POST /reviewsessions → sessionId
   POST /reviewinvites → token (short-lived)

3. Reviewer uses token to submit scores
   GET /review?token=XXX → criteria & use case
   POST /scores?token=XXX → score submission
   GET /scores?token=XXX → retrieve saved scores

4. System computes totals
   POST /compute/:useCaseId → dimension scores
```

---

## Examples

### Complete Scoring Workflow
```bash
# 1. Reviewer gets review link (sent via email, contains token)
TOKEN="eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."

# 2. Load scoring context
curl -G "http://localhost:5001/review" \
  --data-urlencode "token=$TOKEN"

# 3. Submit individual scores
curl -X POST "http://localhost:5001/scores?token=$TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "criterionId": "C01",
    "rawScore": 2.5,
    "isNA": false,
    "notes": "Strong impact"
  }'

# 4. Compute final scores (backend triggers this)
curl -X POST "http://localhost:5001/compute/use-case-id" \
  -H "Content-Type: application/json"

# 5. Retrieve calculated totals
curl "http://localhost:5001/usecases/use-case-id"
```

---

## Version History
- **v1.0** (February 2026) - Initial release with scoring endpoints
- **Upcoming**: Export/reporting endpoints, bulk operations

