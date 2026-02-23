# User Workflows & Processes

## Overview

This document describes the primary user workflows in the Use Case Scoring App, from intake through implementation tracking.

---

## User Roles & Permissions

### Admin Role
- Create and manage user accounts
- Manage scoring criteria and filter options
- View all use cases and scores
- Generate reports and analytics
- System configuration

**Access:** All pages, including `/admin/users` and `/admin/data`

### Reviewer Role
- Submit new use cases (intake)
- Score use cases (primary role)
- Add comments during review
- View use case details and results
- Export data (future)

**Access:** All public pages except admin sections

### Read-Only Role
- View use cases and scores
- Cannot submit or score
- Cannot modify any data
- View-only dashboards

**Access:** Dashboard, list, and detail pages only

---

## Workflow 1: Use Case Intake

### Actors
- **Requestor**: Employee submitting a new use case
- **System**: Automatically assigns use case number and status

### Steps

#### 1. Navigate to Intake Form
```
Home → Sidebar: "New Intake" → /intake
```

#### 2. Complete Use Case Form
| Section | Fields | Required |
|---------|--------|----------|
| **Basic Info** | Title, Description | Yes |
| **Submitter** | Requestor, Business Unit | Yes |
| **Sponsorship** | Sponsor, Tech Sponsor, Executive Sponsor | At least Sponsor |
| **Stakeholders** | Names (dynamic array) | No |
| **Strategic Alignment** | Themes (Security, Cost, Efficiency) | No |
| **Strategic Details** | Sales, Expenses, Asset, Risk impact | No |
| **Capabilities** | Required capability areas | No |
| **Timeline** | Target year, Expected timeline | No |

**Example Form Data:**
```json
{
  "title": "Real-time Analytics Platform",
  "description": "Enterprise-wide analytics using cloud infrastructure",
  "requestor": "Sarah Johnson",
  "businessUnit": "Analytics & Insights",
  "sponsor": "VP Chief Analytics Officer",
  "technicalSponsor": "Director of Engineering",
  "executiveSponsor": "Chief Technology Officer",
  "stakeholders": ["Finance", "Operations", "IT"],
  "strategicTheme": ["Digital Transformation", "Cost Efficiency"],
  "strategicDetails": {
    "Sales": "Enable faster decision-making",
    "Expenses": "Reduce manual reporting time",
    "Asset Optimization": "Better resource allocation",
    "Risk": "Fewer reporting delays/errors"
  },
  "capabilityAreas": ["Cloud Infrastructure", "Data Analytics"],
  "targetYear": "2026",
  "expectedTimeline": "12-18 months"
}
```

#### 3. Submit Form
- System validates all required fields
- Database stores use case
- Auto-assigns `use_case_number` (sequential)
- Sets status to `Intake`
- Success message displays
- Redirect to use case list or detail page

#### 4. Confirmation
```
Success! Your use case has been submitted.
Use Case #: 42
Title: Real-time Analytics Platform
Status: Intake

Next Steps:
- Share with reviewers for evaluation
- Monitor status from dashboard
```

---

## Workflow 2: Use Case Review Setup

### Actors
- **Use Case Owner** or **Admin**: Initiates review
- **System**: Generates review tokens
- **Reviewers**: Invited to evaluate

### Steps

#### 1. Locate Use Case
```
Use Cases List → Find use case → Click "Start Review" button
```

Or from Dashboard:
```
Dashboard → Kanban board → Click "Start Review" button
```

#### 2. System Creates Review Session
Behind the scenes:
```
1. System creates ReviewSession record
2. Links to the use case
3. Assigns default reviewer (CoE lead, optional)
4. Status remains in current status (can review in any state)
```

#### 3. Generate Review Invite Token
```
System generates ReviewInvite:
- Creates JWT token
- Sets expiration (24-72 hours)
- Can edit: true/false permission
```

#### 4. Share Review Link
Options to share:

**Option A: Copy Link**
```
Click "Copy Link" button → Link copied to clipboard

Link Format:
https://app.company.com/review?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

Reviewer receives link via email/Slack/manually
```

**Option B: Direct Link**
```
Click "Open Review" button → Opens review page in current browser
```

#### 5. Multiple Reviewers
Can create multiple tokens for same use case:
```
Generate Token 1 for Reviewer A (expires 24h)
Generate Token 2 for Reviewer B (expires 24h)
Generate Token 3 for Reviewer C (expires 24h)

All tokens evaluate same use case
Results are combined/averaged in final score
```

---

## Workflow 3: Scoring Process

### Actors
- **Reviewer**: Evaluates the use case
- **System**: Validates scores, calculates totals

### Prerequisites
- Reviewer has review token (from invitation)
- Use case is in Intake or In Review status

### Steps

#### 1. Access Review Page
```
Click review link with token → /review?token=XXX
```

#### 2. System Loads Review Context
```
Backend fetches:
- Use case details (title, description, sponsor info)
- All 28 ISM criteria, grouped by dimension
- Any previously saved scores
- N/A status for dimensions
```

#### 3. Review Use Case Information
Page displays:
```
┌─────────────────────────────────────┐
│ Real-time Analytics Platform        │
├─────────────────────────────────────┤
│ Description: Enterprise-wide...     │
│ Business Unit: Analytics            │
│ Requestor: Sarah Johnson            │
│ Sponsor: VP Analytics               │
│ Technical Sponsor: Director Eng      │
└─────────────────────────────────────┘
```

#### 4. Complete N/A Assessment
**First**, reviewer determines which dimensions apply:

```
Does Value dimension apply to this use case?
□ No, mark as N/A
   ↓
Provide justification: "Financial impact already 
measured through separate process"

Does Feasibility dimension apply?
☑ Yes, continue scoring

Does Organizational Capability apply?
☑ Yes, continue scoring

Does Strategic Alignment apply?
☑ Yes, continue scoring
```

**Rules:**
- 0-1 dimensions N/A: ✅ Allowed, proceed normally
- 2 dimensions N/A: ⚠️ Allowed, flag as reduced scope
- 3 dimensions N/A: ⚠️ Requires:
  - Check "Technical/Infrastructure Initiative"
  - Check "Reviewer Approval"
  - Provide justifications
- 4 dimensions N/A: ❌ Blocked, cannot score

#### 5. Score Individual Criteria

**Scoring Scale:**
```
1.0 = Low/Minimal Impact
2.0 = Medium/Moderate Impact
3.0 = High/Significant Impact
```

**Example Scoring for Value Dimension:**
```
Criterion 1: Financial Impact
"How much measurable financial value will this generate?"
Score: 2.5 (medium-high value expected)

Criterion 2: Health & Safety Impact
"Does this reduce safety incidents?"
Score: 1.0 (not primary focus)
N/A: Check box + "Cost reduction focus, not safety focused"

Criterion 3: Risk Mitigation
"How effectively does this reduce risks?"
Score: 3.0 (High - reduces reporting delays/errors)

Criterion 4: Customer Experience  
"Will customer satisfaction improve?"
Score: 2.0 (Moderate - internal analytics tool)

Criterion 5: Revenue Protection
Score: 2.5

Criterion 6: Asset Optimization
Score: 2.5

Criterion 7: Time to Value
Score: 2.0
```

**Reviewer can:**
- Enter numerical scores (1.0-3.0)
- Mark individual items as N/A
- Add notes/justification
- Save progress (scores persist)
- Edit previous scores

#### 6. Review Scores & Make Adjustments
```
Reviewer can see:
- Score entered for each criterion
- Dimension average calculated
- Composite score calculated (displayed live)

Example Results:
Value Dimension Score:     2.29 (avg of 7 criteria)
Feasibility Score:         2.15
Organizational Score:      2.42
Strategic Score:           2.50
─────────────────────────
Composite Score:           2.34 (weighted average)
```

#### 7. Add Comments (Optional)
```
Text area for reviewer notes:
"Strong strategic alignment with digital transformation
initiative. Resource constraints in near term will be 
mitigated by Q3 2026. Recommend fast-track approval."
```

#### 8. Submit Scoring Session
```
Click "Submit Scores" button

System:
1. Validates all required scores entered
2. Checks N/A logic (3 dims = requires flags)
3. Sends all individual criterion scores to backend
4. Triggers backend computation of totals
5. Displays calculated scores
6. Confirms submission success
```

**Confirmation:**
```
✓ Scoring submitted successfully!

Results:
- Value Dimension: 2.29/3.0 (76%)
- Feasibility: 2.15/3.0 (72%)
- Organizational: 2.42/3.0 (81%)
- Strategic: 2.50/3.0 (83%)
- Composite Score: 2.34/3.0 (78%)

Status: Use case ready for decision
```

#### 9. Access Results
```
Link: /usecase/{id}

Shows:
- All submitted scores
- Dimension scores
- Composite ranking
- Reviewer notes
```

---

## Workflow 4: Portfolio Management

### Actors
- **Use Case Owner** or **Admin**: Monitors progress
- **Stakeholders**: View results

### Dashboard Views

#### Kanban Board
```
┌─────────────┬──────────────┬──────────────┐
│   Intake    │ Under Review │  Completed   │
├─────────────┼──────────────┼──────────────┤
│             │              │              │
│ #42         │ #38          │ #30          │
│ Analytics   │ Automation   │ Mobile App   │
│ Unit: AN    │ Unit: OPS    │ Unit: IT     │
│ Score: --   │ Score: 2.34  │ Score: 2.89  │
│             │              │              │
│ [Start Rev] │ [Start Rev]  │ [View]       │
│             │              │              │
├─────────────┼──────────────┼──────────────┤
│ #41         │ #39          │             │
│ Reporting   │ Chatbot      │             │
│ Unit: FIN   │ Unit: CS     │             │
│ Score: --   │ Score: --    │             │
│             │              │             │
│ [Start Rev] │ [Start Rev]  │             │
│             │              │             │
└─────────────┴──────────────┴──────────────┘
```

**Actions:**
- Click card to view details
- Click "Start Review" to launch review session
- Drag card between lanes (if supported)

#### Portfolio View
```
Sorted by Composite Score (High to Low)

| # | Title | Status | Unit | Score | Value | Feas | Org | Strat |
|---|-------|--------|------|-------|-------|------|-----|-------|
|30 | Mobile Platform | Approved | IT | 2.89 | 2.75 | 2.85 | 2.90 | 3.00 |
|38 | Automation | In Review | OPS | 2.34 | 2.29 | 2.15 | 2.42 | 2.50 |
|42 | Analytics | Intake | AN | -- | -- | -- | -- | -- |
|39 | Chatbot | In Review | CS | -- | -- | -- | -- | -- |
|41 | Reporting | Intake | FIN | -- | -- | -- | -- | -- |
```

**Actions:**
- Sort by any column
- Filter by status
- Click row to view details
- Export to CSV (future)

---

## Workflow 5: Use Case Status Management

### Status Lifecycle

```
┌──────────┐
│  Intake  │  ← Initial status when submitted
│  (Waiting for review)
└─────┬────┘
      │ Send for review
      ▼
┌──────────────┐
│ Under Review │  ← Actively being scored
│  (Multiple   │     by reviewers
│   reviewers) │
└────┬────────┘
     │ Reviews complete, decision made
     ├─────────────────────────┬──────────────┐
     ▼                         ▼              ▼
┌──────────┐           ┌──────────┐    ┌──────────┐
│Approved  │           │ On Hold  │    │(Other)   │
│(Funded)  │           │(Defer)   │    └──────────┘
└────┬─────┘           └──────────┘
     │ Implementation begins
     ▼
┌──────────────┐
│ Implemented  │  ← Completed/Live
│  (Live)      │
└──────────────┘
```

**Status Values (in system):**
1. `Intake` - New submission
2. `In Review` - Under evaluation
3. `Approved` - Funded/approved for implementation
4. `Implemented` - Successfully completed
5. `On Hold` - Temporarily deferred

### Changing Status

#### Automatic Status Changes
```
When review session created:
Status may change: Intake → In Review (optional)

After scoring complete:
Status may change: In Review → Approved
```

#### Manual Status Updates
Admin or owner can manually update:
```
Use Case Detail page → Edit → Status dropdown → Save

Example:
Current Status: Intake
Change to: In Review
Reason: Beginning stakeholder evaluation

Confirm update → Status changed to In Review
```

#### Status Validation
```
Only valid transitions allowed:
✓ Intake → In Review
✓ In Review → Approved
✓ In Review → On Hold
✓ Approved → Implemented
✓ Approved → On Hold
✓ On Hold → Approved
✓ Any → Any (admin override)

Invalid transitions should show error:
"Cannot transition from Implemented to Intake"
```

---

## Workflow 6: N/A (Not Applicable) Handling

### Scenario: Infrastructure Project
A use case for upgrading servers doesn't have financial/business value impact.

### Process

#### 1. Reviewer Assesses Dimensions
```
As reviewer fills out score form:

Value Dimension (Financial value, health/safety, risk mitigation, etc.)
Question: "Does this initiative drive measurable value?"
Answer: "No, this is infrastructure maintenance required for compliance"
Action: Check "Mark as N/A"
```

#### 2. Provide Justification
```
When marking N/A, must provide context:

Justification (required text box):
"Infrastructure upgrade is non-discretionary compliance 
requirement. No direct value proposition, but necessary 
system health. Evaluate only on Feasibility and Org Capability."
```

#### 3. System Validates N/A Count
```
As reviewer marks dimensions N/A:

0-1 N/A:    ✅ No restrictions, continue
            Displays: "Reduced scope evaluation"

2 N/A:      ⚠️ Still allowed
            Displays: "This is a reduced scope evaluation
            based on marked N/A dimensions"

3 N/A:      ⚠️ Requires extra approval
            Shows checkboxes:
            ☐ "This is a technical/infrastructure initiative"
            ☐ "I confirm reviewer approval for 3-dim N/A"
            
            If not checked: "Cannot submit - please check boxes"

4 N/A:      ❌ Completely blocked
            Shows error: "All dimensions marked N/A. 
            Scoring blocked. Please contact admin."
```

#### 4. Decision for 3-D N/A
```
Reviewer must confirm when 3 dimensions are N/A:

Technical/Infrastructure Initiative checkbox:
"This is a tech/infrastructure initiative, not a 
business value initiative"
Purpose: Flag that this is systems work, not strategic

Reviewer Approval checkbox:
"I acknowledge and approve this limited scope evaluation"
Purpose: Ensure reviewer understands reduced evaluation

Both required: Cannot submit without checking both
```

#### 5. System Computes with N/A Dimensions
```
Backend scoring algorithm:
- Ignores N/A dimensions in calculations
- Averages only submitted scores

Example: Value = N/A, others scored
Composite = (Feasibility + Org + Strategic) / 3
This 3-factor composite appears instead of 4-factor
```

---

## Workflow 7: Review History & Audit

### Viewing Scores & Comments
```
Use Case Detail page shows:
- All submitted scores (latest per criterion)
- Reviewer comments
- Timestamp of evaluation
- Rater/reviewer name (if available)
```

### Score Changes
```
If reviewer submits new score:
- New score stored with new timestamp
- Previous score still visible in history (audit trail)
- Only latest score used in calculations
- UI shows "Latest Score" with timestamp
```

### Comment History
```
All comments on use case:
- Display in chronological order
- Show reviewer name and timestamp
- Example:

Sarah Chen - Feb 22, 2026 2:45 PM
"Strong alignment with FY26 roadmap. Resource constraints
need to be addressed with ops leadership."

Mike Rodriguez - Feb 22, 2026 1:15 PM
"Technical feasibility looks strong. Consider phased 
approach for risk mitigation."
```

---

## Workflow 8: Admin Data Management

### Viewing System Data

#### Scoring Criteria
```
Admin → Data Administration → Criteria

Shows all 28 ISM criteria:
C01 - Financial Impact        (Dimension: Value)
C02 - Health & Safety Impact  (Dimension: Value)  
C03 - Risk Mitigation         (Dimension: Value)
...
C28 - [Last criterion]        (Dimension: Strategic)

Actions:
- View display order
- View guidance text
- Edit (future)
```

#### Filter Options
```
Admin → Data Administration → Filter Options

Manages dropdown values:

Strategic Themes:
- Digital Transformation ✓ (active)
- Cost Efficiency ✓ (active)
- Security ✓ (active)
- Innovation (inactive)

Business Units:
- Analytics & Insights ✓
- Operations ✓
- Finance ✓
...

Capability Areas:
- Cloud Infrastructure ✓
- Data Analytics ✓
- Mobile Development ✓
- AI/ML ✓
...
```

#### Use Case Statistics
```
Summary stats (future enhancement):
- Total use cases: 127
- By status: Intake (23), In Review (14), Approved (67), Implemented (23)
- Average score: 2.34/3.0
- Highest scoring: Mobile Platform (2.89)
- Lowest scoring: Reporting Tool (1.89)
```

---

## Workflow 9: User Access & Permissions

### Authentication
```
Unauthenticated user visits site:
→ Redirect to /login
→ Enter email, password
→ System validates against users table
→ Create JWT token, store in localStorage
→ Redirect to home page
```

### Role-Based Access Control

#### Admin User
Can access:
- All dashboard views
- All use case details
- Review sessions
- Admin → Users (user management)
- Admin → Data (criteria, filters)

#### Reviewer User
Can access:
- Home, Dashboard
- Use Cases list and details
- Create new use case (intake)
- Review use cases (via token)
- Cannot access admin sections

#### Read-Only User
Can access:
- Home, Dashboard (view only)
- Use Cases list and details (view only)
- Cannot create, edit, or score

#### Unauthenticated
Can only see:
- Login page
- Some home/info pages (depends on config)

---

## Workflow 10: Bulk Operations (Future)

### Use Case Bulk Updates
```
(Planned feature)

Users able to:
- Select multiple use cases
- Change status in bulk
- Assign reviewers in bulk
- Export selected use cases
- Delete multiple use cases with confirmation
```

### Data Export
```
(Planned feature)

Export options:
- Use cases (filtered) → CSV
- Scores (filtered) → JSON or CSV
- Full audit trail → PDF

Filters:
- Date range
- Status
- Business unit
- Composite score range
```

---

## Error Scenarios & Handling

### Expired Token
```
User has review link with token that expired:

Reviewer clicks link:
↓
System checks token expiration
↓
Token is expired (created 72h ago)
↓
Error message displays:
"This review link has expired.
Please request a new link from the use case owner."
↓
Reviewer must request new token from owner
```

### Invalid N/A Submission
```
Reviewer tries to submit with 3 N/A dimensions
but did NOT check approval checkboxes

Error:
"Three dimensions marked N/A. 
Please check:
☐ This is a technical/infrastructure initiative
☐ I confirm reviewer approval"
```

### Missing Required Scores
```
Reviewer tries to submit without scoring all criteria:

Scoring Sheet shows required items:
"Complete scoring required for:"
- Criterion C01: Financial Impact
- Criterion C03: Risk Mitigation
...and 2 others

Action: Fill in remaining scores, then submit
```

### Deleted Use Case
```
Someone deletes a use case that's being reviewed:

Other reviewers with active tokens:
↓
Try to access review page with old token
↓
Backend error: "Use case not found"
↓
Frontend error message:
"This use case has been removed from the system.
The review is no longer available."
```

---

## Common Questions

### Q: Can multiple people score the same use case?
**A:** Yes! Multiple review tokens can be generated for the same use case. Each reviewer submits their own scores. The final score is the latest/representative score (determined by your business logic).

### Q: What happens if I close my browser during scoring?
**A:** Scores are saved individually as you submit them. Return to the review link - your previous scores will still be there (unless you navigated away after submitting).

### Q: Can I change a score I already submitted?
**A:** If the review session is still active (token not expired), you can go back to the review page and update scores. The latest score is what's used in calculations.

### Q: How do I recover if I marked something N/A by mistake?
**A:** Go back to the review page (same token) and uncheck the N/A box, then re-enter a numeric score. This updates the saved score.

### Q: Who can see my scores?
**A:** Once submitted, scores are visible to:
- The use case owner
- Admin users
- Other reviewers (via use case detail page)
- Depends on configuration/roles

### Q: Can I cancel a submitted score?
**A:** No official "cancel" button. You must provide a new score to replace it. Previous scores are kept in audit trail.

---

## Related Documentation
- [API Endpoints](api.md) - Underlying API calls for these workflows
- [Frontend Components](frontend-components.md) - UI components used
- [Database Schema](database.md) - Data structure supporting workflows

---

**Last Updated:** February 2026

