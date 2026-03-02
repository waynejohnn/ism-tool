# Database Schema

## Overview
The Use Case Scoring App uses SQLite with SQLAlchemy ORM. The database is automatically initialized on application startup with schema creation and seeding.

## Table Definitions

### Users Table
Stores user authentication and profile information.

```sql
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'reviewer',
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `user_id` | TEXT | PRIMARY KEY | UUID identifier |
| `email` | TEXT | UNIQUE, NOT NULL | User email address |
| `password_hash` | TEXT | NOT NULL | Bcrypt hashed password |
| `role` | TEXT | DEFAULT 'reviewer' | User role (admin, reviewer, readonly) |
| `created_on` | DATETIME | AUTO | Account creation timestamp |

**Indexes:**
- `users_pkey` on `user_id` (primary key)
- `users_email_key` on `email` (unique)

**Default Users (seeded):**
- Email: `admin@santeecooper.com` / Password: `admin123` (role: admin)
- Email: `reviewer@santeecooper.com` / Password: `reviewer123` (role: reviewer)
- Email: `readonly@santeecooper.com` / Password: `readonly123` (role: readonly)

---

### UseCase Table
Core table for all submitted use cases requiring evaluation.

```sql
CREATE TABLE use_cases (
  use_case_id TEXT PRIMARY KEY,
  use_case_number INTEGER UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'Intake',
  requestor TEXT,
  business_unit TEXT,
  sponsor TEXT,
  technical_sponsor TEXT,
  executive_sponsor TEXT,
  stakeholders TEXT,
  strategic_theme TEXT,
  strategic_details TEXT,
  capability_areas TEXT,
  target_year TEXT,
  expected_timeline TEXT,
  na_value BOOLEAN DEFAULT 0,
  na_feasibility BOOLEAN DEFAULT 0,
  na_org_capability BOOLEAN DEFAULT 0,
  na_strategic BOOLEAN DEFAULT 0,
  na_value_justification TEXT,
  na_feasibility_justification TEXT,
  na_org_capability_justification TEXT,
  na_strategic_justification TEXT,
  na_reviewer_approval BOOLEAN DEFAULT 0,
  na_technical_initiative BOOLEAN DEFAULT 0,
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_on DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `use_case_id` | TEXT PRIMARY KEY | UUID identifier |
| `use_case_number` | INTEGER UNIQUE | Sequential number assigned automatically |
| `title` | TEXT NOT NULL | Use case title |
| `description` | TEXT | Detailed description |
| `status` | TEXT | Current lifecycle status (Intake, In Review, Approved, Implemented, On Hold) |
| `requestor` | TEXT | Person who submitted the use case |
| `business_unit` | TEXT | Responsible business unit |
| `sponsor` | TEXT | Executive sponsor name |
| `technical_sponsor` | TEXT | Technical lead name |
| `executive_sponsor` | TEXT | C-level sponsor name |
| `stakeholders` | TEXT | JSON array of stakeholder names |
| `strategic_theme` | TEXT | JSON array of themes |
| `strategic_details` | TEXT | JSON object with Sales, Expenses, Asset Optimization, Risk fields |
| `capability_areas` | TEXT | JSON array of capability areas |
| `target_year` | TEXT | Year for target implementation |
| `expected_timeline` | TEXT | Implementation timeline (e.g., "6-9 months") |
| `na_value` | BOOLEAN | Is Value dimension Not Applicable? |
| `na_feasibility` | BOOLEAN | Is Feasibility dimension Not Applicable? |
| `na_org_capability` | BOOLEAN | Is Organizational Capability dimension Not Applicable? |
| `na_strategic` | BOOLEAN | Is Strategic Alignment dimension Not Applicable? |
| `na_value_justification` | TEXT | Why Value is N/A |
| `na_feasibility_justification` | TEXT | Why Feasibility is N/A |
| `na_org_capability_justification` | TEXT | Why Org Capability is N/A |
| `na_strategic_justification` | TEXT | Why Strategic is N/A |
| `na_reviewer_approval` | BOOLEAN | Reviewer approved N/A status? |
| `na_technical_initiative` | BOOLEAN | Marked as tech/infrastructure initiative? |
| `created_on` | DATETIME | Record creation timestamp |
| `updated_on` | DATETIME | Last modification timestamp |

**Indexes:**
- `use_cases_pkey` on `use_case_id` (primary key)
- `idx_use_cases_number` on `use_case_number` (unique)
- `idx_use_cases_status` on `status` (for dashboard queries)

---

### ReviewSession Table
Tracks review sessions for each use case evaluation period.

```sql
CREATE TABLE review_sessions (
  session_id TEXT PRIMARY KEY,
  use_case_id TEXT NOT NULL,
  assigned_coe_id TEXT,
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (use_case_id) REFERENCES use_cases(use_case_id) ON DELETE CASCADE
);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `session_id` | TEXT PRIMARY KEY | UUID identifier |
| `use_case_id` | TEXT NOT NULL | Link to use case being reviewed |
| `assigned_coe_id` | TEXT | ID of assigned Center of Excellence reviewer |
| `created_on` | DATETIME | Session creation timestamp |

**Indexes:**
- `review_sessions_pkey` on `session_id`
- Foreign key on `use_case_id`

---

### ReviewInvite Table
Stores tokenized review links with expiration and permissions.

```sql
CREATE TABLE review_invites (
  invite_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  can_edit BOOLEAN DEFAULT 1,
  expires_at DATETIME NOT NULL,
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES review_sessions(session_id) ON DELETE CASCADE
);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `invite_id` | TEXT PRIMARY KEY | UUID identifier |
| `session_id` | TEXT NOT NULL | Link to review session |
| `token` | TEXT UNIQUE | JWT token for public review link |
| `can_edit` | BOOLEAN | Can token holder edit/submit scores? |
| `expires_at` | DATETIME | Token expiration timestamp |
| `created_on` | DATETIME | Invite creation timestamp |

**Indexes:**
- `review_invites_pkey` on `invite_id`
- Unique on `token`
- Foreign key on `session_id`

---

### Score Table
Individual criterion scores submitted by reviewers.

```sql
CREATE TABLE scores (
  score_id TEXT PRIMARY KEY,
  use_case_id TEXT NOT NULL,
  criterion_id TEXT NOT NULL,
  raw_score REAL,
  is_na BOOLEAN DEFAULT 0,
  na_reason TEXT,
  notes TEXT,
  rater_user_id TEXT,
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (use_case_id) REFERENCES use_cases(use_case_id) ON DELETE CASCADE,
  FOREIGN KEY (criterion_id) REFERENCES criteria(criterion_id)
);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `score_id` | TEXT PRIMARY KEY | UUID identifier |
| `use_case_id` | TEXT NOT NULL | Link to use case |
| `criterion_id` | TEXT NOT NULL | Link to scoring criterion |
| `raw_score` | REAL | Numeric score (1.0-3.0 scale) |
| `is_na` | BOOLEAN | Was this marked Not Applicable? |
| `na_reason` | TEXT | Reason for N/A if applicable |
| `notes` | TEXT | Reviewer notes/justification |
| `rater_user_id` | TEXT | ID of reviewer who submitted score |
| `created_on` | DATETIME | Submission timestamp |

**Constraints:**
- `raw_score` should be between 1.0 and 3.0 (if not N/A)
- Either `raw_score` or `is_na=true` should exist

**Indexes:**
- `scores_pkey` on `score_id`
- Foreign keys on `use_case_id`, `criterion_id`
- Index on `use_case_id` (for quick score retrieval)

---

### Criterion Table
The Innovation Scoring Matrix (ISM) scoring criteria definitions.

```sql
CREATE TABLE criteria (
  criterion_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  dimension TEXT NOT NULL,
  polarity TEXT NOT NULL,
  display_order INTEGER,
  guidance_text TEXT,
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `criterion_id` | TEXT PRIMARY KEY | Unique identifier (C01, C02, etc.) |
| `name` | TEXT NOT NULL | Criterion name |
| `dimension` | TEXT NOT NULL | Category (Value, Feasibility, Organizational, Strategic) |
| `polarity` | TEXT NOT NULL | BENEFIT or COST direction |
| `display_order` | INTEGER | Order in UI display |
| `guidance_text` | TEXT | Guidance for scoring this criterion |
| `created_on` | DATETIME | Creation timestamp |

**Dimensions:**
- **Value**: Financial and strategic value assessment
- **Feasibility**: Technical and operational feasibility
- **Organizational**: Organizational capability and capacity
- **Strategic**: Strategic alignment and risk

**Example Records:**
See [seed.py](../backend/seed.py) for complete list of 28 criteria (C01-C28).

---

### Totals Table
Calculated dimension-level and composite scores for each use case.

```sql
CREATE TABLE totals (
  use_case_id TEXT PRIMARY KEY,
  s_value REAL,
  s_feasibility REAL,
  s_organizational REAL,
  s_strategic REAL,
  s_composite REAL,
  updated_on DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (use_case_id) REFERENCES use_cases(use_case_id) ON DELETE CASCADE
);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `use_case_id` | TEXT PRIMARY KEY | Link to use case |
| `s_value` | REAL | Value dimension score |
| `s_feasibility` | REAL | Feasibility dimension score |
| `s_organizational` | REAL | Organizational Capability dimension score |
| `s_strategic` | REAL | Strategic Alignment dimension score |
| `s_composite` | REAL | Overall composite score (weighted average) |
| `updated_on` | DATETIME | Last calculation timestamp |

**Calculation Logic:**
See [backend/scoring.py](../backend/scoring.py) for detailed scoring algorithm. Briefly:
- Dimension scores = average of criterion scores in that dimension
- Composite = weighted average of dimension scores
- Weights and polarities applied per ISM methodology

---

### ReviewComment Table
Comments and notes submitted during review sessions.

```sql
CREATE TABLE review_comments (
  comment_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  text TEXT NOT NULL,
  rater_user_id TEXT,
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES review_sessions(session_id) ON DELETE CASCADE
);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `comment_id` | TEXT PRIMARY KEY | UUID identifier |
| `session_id` | TEXT NOT NULL | Link to review session |
| `text` | TEXT NOT NULL | Comment content |
| `rater_user_id` | TEXT | Comments submitter ID |
| `created_on` | DATETIME | Submission timestamp |

---

### FilterOption Table
Lookup values for dropdown/filter fields (strategic themes, capability areas, etc.).

```sql
CREATE TABLE filter_options (
  option_id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  display_name TEXT NOT NULL,
  value TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_on DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**Columns:**
| Column | Type | Description |
|--------|------|-------------|
| `option_id` | TEXT PRIMARY KEY | UUID identifier |
| `category` | TEXT NOT NULL | Category (strategic_themes, capability_areas, etc.) |
| `display_name` | TEXT | Display label in UI |
| `value` | TEXT | Actual value stored |
| `sort_order` | INTEGER | UI display order |
| `is_active` | BOOLEAN | Is option available for selection? |
| `created_on` | DATETIME | Creation timestamp |

**Indexes:**
- Index on `category` for filtering

---

## Relationships Diagram

```
┌─────────────────┐
│     Users       │
│  (user_id PK)   │
└─────────────────┘

┌──────────────────────┐          ┌──────────────────────┐
│    UseCase           │   1:M    │   ReviewSession      │
│(use_case_id PK)  ├─────────────┤(session_id PK)       │
└──────────────────────┘          └──────────────────────┘
         │ 1:M                              │ 1:M
         │                                  └─────┐
         │                                        │
    ┌────▼──────────────┐              ┌─────────▼──────────┐
    │    Score          │              │   ReviewInvite     │
    │  (score_id PK)    │              │   (invite_id PK)   │
    └────┬──────────────┘              └────────────────────┘
         │ M:1
         │
    ┌────▼──────────────┐
    │   Criterion       │
    │(criterion_id PK)  │
    └───────────────────┘

┌──────────────────────┐
│   Totals             │
│(use_case_id PK FK)   │
└──────────────────────┘

┌──────────────────────┐
│  ReviewComment       │
│(comment_id PK)       │
│(session_id FK)       │
└──────────────────────┘

┌──────────────────────┐
│  FilterOption        │
│(option_id PK)        │
└──────────────────────┘
```

---

## Data Distribution

### Typical Production Data
```
Users:              5-50 (admin + reviewers)
UseCases:          100-500 per quarter
ReviewSessions:    200-1000 per quarter  
Scores:           5600-28000 per quarter (28 criteria × sessions)
Criteria:          28 (fixed ISM criteria)
FilterOptions:    50-100 (various categories)
```

---

## Query Patterns

### Dashboard Kanban
```sql
SELECT * FROM use_cases
GROUP BY status
ORDER BY created_on DESC;
```

### Portfolio Ranking
```sql
SELECT u.*, t.s_composite FROM use_cases u
LEFT JOIN totals t ON u.use_case_id = t.use_case_id
ORDER BY t.s_composite DESC;
```

### Review Scores
```sql
SELECT s.*, c.name, c.dimension FROM scores s
JOIN criteria c ON s.criterion_id = c.criterion_id
WHERE s.use_case_id = ? 
ORDER BY s.created_on DESC;
```

### Latest Scores Per Criterion
```sql
SELECT DISTINCT ON (s.criterion_id) 
       s.score_id, s.criterion_id, s.raw_score, s.is_na
FROM scores s
WHERE s.use_case_id = ?
ORDER BY s.criterion_id, s.created_on DESC;
```

---

## Initialization & Migration

### Automatic Schema Creation
On application startup ([backend/app.py](../backend/app.py)):

```python
Base.metadata.create_all(bind=engine)  # Creates all tables
seed()  # Populates default data
```

### Adding New Columns
The application handles adding missing columns automatically:

```python
# Check for column existence
res = conn.execute(text("PRAGMA table_info('use_cases')"))
cols = [row[1] for row in res]
if 'strategic_details' not in cols:
    conn.execute(text(
        "ALTER TABLE use_cases ADD COLUMN strategic_details TEXT"
    ))
```

### Data Persistence
- **Development**: `/backend/data/app.db` (local SQLite file)
- **Production**: `/app/data/app.db` (Cloud Run container filesystem; prefer external managed DB for long-lived data)

---

## Backup & Recovery

### Manual Backup
```bash
# Export entire database
sqlite3 /backend/data/app.db ".dump" > backup-$(date +%Y%m%d).sql

# Export specific table
sqlite3 /backend/data/app.db ".mode csv" \
  "SELECT * FROM use_cases;" > use_cases_backup.csv
```

### Restore
```bash
# Restore from SQL dump
sqlite3 /backend/data/app.db < backup-20260222.sql
```

---

## Performance Considerations

### Indexes
- Primary keys automatically indexed
- Foreign key indexes on join columns
- Status index for dashboard filtering
- Use case number unique index for lookups

### Query Optimization Tips
1. Always filter by `use_case_id` when query is scoped to one case
2. Use `display_order` for UI ordering (indexed)
3. Pagination recommended for use case lists (1000+ records)
4. Add indexes for frequently filtered fields

### Typical Query Performance
| Query Type | Records | Time |
|------------|---------|------|
| Get single use case | 1 | < 1ms |
| Get all criteria | 28 | < 1ms |
| List 100 use cases | 100 | < 5ms |
| Score calculations | N scores | < 50ms |
| Dashboard kanban | 500-1000 | < 100ms |

---

## Default Seeds

### Users
```python
User(
    user_id=str(uuid.uuid4()),
    email="admin@santeecooper.com",
    password_hash=generate_password_hash("admin123"),
    role="admin"
)
```

### Criteria (ISM - 28 items)
See [backend/seed.py](../backend/seed.py) for full ISM specification.

Organized as:
- **Value**: C01-C07 (Financial Impact, Health & Safety, Risk Mitigation, Customer Experience, Revenue Protection, Asset Optimization, Time to Value)
- **Feasibility**: C08-C14 (Technical Complexity, Resource Requirements, etc.)
- **Organizational**: C15-C21 (Change Readiness, Skill Availability, etc.)
- **Strategic**: C22-C28 (Strategic Alignment, Competitive Position, etc.)

---

## Related Documentation
- [API Endpoints](api.md)
- [Scoring Algorithm](scoring.md)
- [Architecture](architecture.md)

