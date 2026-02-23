# Frontend Components Documentation

## Overview

The frontend is built with React 18 + Vite and uses a component-based architecture with context for state management and client-side routing via React Router v6.

### Tech Stack
- **React** 18.2 - UI library
- **Vite** 5.4 - Build tool and dev server
- **React Router** 6.26 - Client-side routing
- **CSS Modules/Plain CSS** - Styling

### Project Structure
```
frontend/
├── src/
│   ├── main.jsx              # Entry point
│   ├── App.jsx               # Root component with routing
│   ├── App.js                # Legacy app definition (deprecated)
│   ├── api.js                # API client utilities
│   ├── components/           # Reusable components
│   │   ├── ProtectedRoute.jsx
│   │   ├── Sidebar.jsx
│   │   ├── SideNav.jsx
│   │   ├── TopBar.jsx
│   │   └── TopNav.jsx
│   ├── context/              # State management
│   │   └── AuthContext.jsx
│   ├── pages/                # Page components (routes)
│   │   ├── Dashboard.jsx
│   │   ├── DataAdministration.jsx
│   │   ├── Home.jsx
│   │   ├── Intake.jsx
│   │   ├── Login.jsx
│   │   ├── Review.jsx
│   │   ├── Score.jsx
│   │   ├── UseCaseDetail.jsx
│   │   ├── UseCaseEdit.jsx
│   │   ├── UseCaseList.jsx
│   │   └── UserAdministration.jsx
│   ├── styles/               # Global stylesheets
│   │   ├── DataAdministration.css
│   │   └── UserAdministration.css
│   ├── theme/                # Theme definitions
│   │   ├── modern.css
│   │   └── theme.css
│   └── index.html            # HTML template
└── vite.config.js            # Vite configuration
```

---

## Core Components

### App.jsx
Root component that sets up the application structure and routing.

**Props:** None

**Key Features:**
- Error boundary for catching React errors
- AuthProvider wrapper for authentication context
- React Router setup with protected routes
- Main layout with navigation

**Example:**
```jsx
function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
}
```

**Routes Defined:**
| Path | Component | Auth Required |
|------|-----------|---------------|
| `/login` | Login | No |
| `/` | Home | No |
| `/use-cases` | UseCaseList | No |
| `/intake` | Intake | No |
| `/review` | Review | No |
| `/usecase/:id` | UseCaseDetail | No |
| `/usecase/:id/edit` | UseCaseEdit | No |
| `/admin/users` | UserAdministration | Yes |
| `/admin/data` | DataAdministration | Yes |

---

## Layout Components

### Sidebar / SideNav
Navigation sidebar for main menu items.

**Props:** None

**State:**
- Current active route

**Features:**
- Menu items with icons
- Active state highlighting
- Responsive collapse (mobile)

**Routes Linked:**
- `/` - Home
- `/use-cases` - Use Cases
- `/intake` - New Intake
- `/admin/users` - Users (admin only)
- `/admin/data` - Data (admin only)

---

### TopBar / TopNav
Header navigation with user info and logout.

**Props:** None

**State:**
- Current user info
- User role/permissions

**Features:**
- User profile display
- Logout button
- Breadcrumb navigation (optional)

---

### ProtectedRoute
Higher-order component for routes requiring authentication.

**Props:**
```jsx
<ProtectedRoute>
  <AdminComponent />
</ProtectedRoute>
```

**Features:**
- Checks if user is authenticated
- Redirects to login if not authenticated
- Displays loading state while checking auth

---

## Context: AuthContext

Provides authentication state and utilities to entire app.

**Usage:**
```jsx
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, login, logout, isAuthenticated } = useAuth();
  
  return (
    <div>
      {isAuthenticated && <p>Logged in as {user.email}</p>}
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

**Context API:**
| Method | Parameters | Returns | Description |
|--------|-----------|---------|-------------|
| `login(email, password)` | string, string | Promise<User> | Authenticate user |
| `logout()` | - | void | Clear authentication |
| `user` | - | User object | Current logged-in user |
| `isAuthenticated` | - | boolean | Auth status |
| `token` | - | string | JWT token |

---

## Page Components

### Login.jsx
User authentication page.

**Route:** `/login`

**State:**
```javascript
{
  email: '',
  password: '',
  error: '',
  loading: false
}
```

**Features:**
- Email and password inputs
- Form validation
- Error display
- Redirect to home after login
- Remember functionality (optional)

**API Calls:**
- `POST /auth/login` - Authenticate user

**Example Flow:**
```
User enters credentials → Submit form → API call → Store token → Redirect to home
```

---

### Home.jsx
Landing/dashboard page.

**Route:** `/`

**Features:**
- Welcome message
- Quick access buttons
- Recent use cases (if authenticated)
- Statistics overview
- Call-to-action buttons

---

### Intake.jsx
Form for submitting new use cases.

**Route:** `/intake`

**State:**
```javascript
{
  title: '',
  description: '',
  requestor: '',
  businessUnit: '',
  sponsor: '',
  technicalSponsor: '',
  executiveSponsor: '',
  stakeholders: [],
  stakeholderInput: '',
  strategicTheme: [],
  strategicDetails: {
    Sales: '',
    Expenses: '',
    'Asset Optimization': '',
    Risk: ''
  },
  capabilityAreas: [],
  targetYear: '',
  expectedTimeline: '',
  error: '',
  success: false
}
```

**Form Fields:**
| Field | Type | Required | Notes |
|-------|------|----------|-------|
| title | text | Yes | Use case name |
| description | textarea | No | Detailed description |
| requestor | text | Yes | Submitter name |
| businessUnit | select | Yes | Department/Unit |
| sponsor | text | Yes | Executive sponsor |
| technicalSponsor | text | No | Technical lead |
| executiveSponsor | text | No | C-level sponsor |
| stakeholders | array | No | Multiple entries |
| strategicTheme | multi-select | No | Theme checkboxes |
| strategicDetails | object | No | Text fields per theme |
| capabilityAreas | multi-select | No | Capability checkboxes |
| targetYear | select | No | Implementation year |
| expectedTimeline | text | No | Duration estimate |

**Features:**
- Multi-field form with sections
- Stakeholder dynamic array
- Dropdown selections
- JSON payload assembly
- Success/error messaging

**API Calls:**
- `POST /usecases` - Submit intake

**Example Payload:**
```json
{
  "title": "Process Automation",
  "description": "Automate manual workflows",
  "requestor": "John Doe",
  "businessUnit": "Operations",
  "sponsor": "Jane Smith",
  "stakeholders": ["Dept A", "Dept B"],
  "strategicTheme": ["Cost Reduction"],
  "capabilityAreas": ["Process Automation"],
  "targetYear": "2026",
  "expectedTimeline": "6-9 months"
}
```

---

### UseCaseList.jsx
Browse and manage all use cases.

**Route:** `/use-cases`

**State:**
```javascript
{
  useCases: [],
  selectedStatus: null,
  searchText: '',
  sortBy: 'createdOn',
  loading: false,
  error: ''
}
```

**Features:**
- Table/card view toggle
- Sorting by status, date, score
- Search by title/requestor
- Status filtering
- Pagination
- Click to view/edit
- Delete button

**API Calls:**
- `GET /usecases` - List all
- `GET /usecases?status=:status` - Filter by status
- `DELETE /usecases/:id` - Remove use case

**UI Elements:**
- Table with columns:
  - Use Case Number
  - Title
  - Status
  - Requestor
  - Business Unit
  - Composite Score
  - Actions (View, Edit, Delete)

---

### UseCaseDetail.jsx
View detailed information about a single use case.

**Route:** `/usecase/:id`

**Props:**
- `id` - Use case ID from URL params

**State:**
```javascript
{
  useCase: {},
  totals: {},
  loading: false,
  error: ''
}
```

**Features:**
- Read-only display of all use case fields
- Score breakdown (dimension + composite)
- Timeline and sponsor info
- Status and metadata
- Edit button
- Delete button
- Back navigation

**API Calls:**
- `GET /usecases/:id` - Fetch use case details

**Layout:**
```
┌─────────────────────────────────┐
│  Use Case Header                │
│  Title, Status, Number          │
├─────────────────────────────────┤
│  Overview Section               │
│  - Description, Requestor, etc  │
├─────────────────────────────────┤
│  Scoring Results (if scored)    │
│  - Dimension scores             │
│  - Composite score              │
├─────────────────────────────────┤
│  Sponsor & Timeline             │
│  - Technical, Executive, etc    │
└─────────────────────────────────┘
```

---

### UseCaseEdit.jsx
Modify use case information and N/A settings.

**Route:** `/usecase/:id/edit`

**Props:**
- `id` - Use case ID from URL params

**State:**
```javascript
{
  useCase: {},
  formData: {},
  naSettings: {
    naValue: false,
    naFeasibility: false,
    naOrgCapability: false,
    naStrategic: false,
    naValueJustification: '',
    naFeasibilityJustification: '',
    // ... other justifications
  },
  loading: false,
  error: '',
  success: false
}
```

**Features:**
- Edit all use case fields
- Mark dimensions as N/A
- Provide justifications for N/A
- Technical/infrastructure initiative flag
- Reviewer approval checkbox
- Save changes
- Cancel/discard changes

**API Calls:**
- `GET /usecases/:id` - Fetch current data
- `PATCH /usecases/:id` - Update use case
- `POST /review/na` - Update N/A settings

---

### Review.jsx
Scoring interface for reviewers.

**Route:** `/review`

**Query Parameters:**
- `token` - Review invitation token (optional)

**State:**
```javascript
{
  useCase: {},
  criteria: [],  // ISM criteria
  scores: {},    // criterion ID -> score value
  itemNA: {},    // criterion-level N/A flags
  dimensionNA: {
    'Value': false,
    'Feasibility': false,
    'Organizational Capability': false,
    'Strategic Alignment & Risk': false
  },
  dimensionJustifications: {},
  backendTotals: null,
  technicalInitiative: false,
  reviewerApproval: false,
  loading: false,
  error: '',
  status: ''
}
```

**Core Features:**
1. **Token Input** (if not in URL)
   - Paste token to load review context

2. **Use Case Display**
   - Header with title, status, metadata
   - Description and sponsor info

3. **Dimension-Based Scoring Grid**
   - 4 dimensions (Value, Feasibility, Org, Strategic)
   - Each contains 7 criteria
   - Color-coded dimension sections

4. **Scoring Controls**
   - Number input (1.0-3.0 scale)
   - N/A checkbox per criterion
   - Notes field per criterion
   - Dimension-level N/A checkbox
   - Justification textarea for dimension N/A

5. **Advanced Options**
   - Technical/infrastructure initiative flag (if 3 dims N/A)
   - Reviewer approval (if 3 dims N/A)
   - Validation before submit

6. **Results Display**
   - Dimension scores (after compute)
   - Composite score
   - Weight information

**ISM Scoring Scale:**
- **1.0** - Low/Minimal impact
- **2.0** - Medium/Moderate impact  
- **3.0** - High/Significant impact
- **N/A** - Not Applicable (with justification)

**N/A Logic:**
- 0-1 dimensions N/A: Normal scoring
- 2 dimensions N/A: Allowed, reduced evaluation
- 3 dimensions N/A: Requires technical initiative flag + reviewer approval
- 4 dimensions N/A: Blocked (cannot score)

**API Calls:**
- `GET /review?token=XXX` - Fetch criteria and use case
- `GET /scores?token=XXX` - Load saved scores
- `POST /scores?token=XXX` - Submit individual scores
- `POST /review/na?token=XXX` - Update N/A settings
- `POST /compute/:useCaseId` - Calculate totals
- `POST /reviewcomments?token=XXX` - Add comments

**Data Flow:**
```
1. Load token from URL or input
2. Fetch review context (use case + criteria)
3. Load any previously saved scores
4. User enters scores (1.0-3.0 or N/A)
5. Submit individual scores incrementally
6. Toggle dimension N/A with justification
7. Submit all data
8. Backend computes dimension/composite scores
9. Display results on screen
```

---

### Score.jsx
Simple alternative scoring interface (read-only view of scores).

**Route:** `/score` (not in main nav)

**Query Parameters:**
- `token` - Review token

**State:**
```javascript
{
  token: '',
  criteria: [],
  scores: {},
  status: ''
}
```

**Features:**
- Token input field
- Load and display criteria
- Display loads saved scores
- Shows criteria list

**Note:** This page is simpler/alternative; Review.jsx is the primary scoring interface.

---

### Dashboard.jsx
Project management kanban and portfolio views.

**Route:** `/` (from Home, can also be dedicated route)

**State:**
```javascript
{
  kanban: {
    'Intake': [],
    'Under Review': [],
    'Completed': []
  },
  portfolio: [],
  reviewTokens: {},
  reviewStatus: ''
}
```

**Features:**

1. **Kanban Board**
   - 3 lanes: Intake, Under Review, Completed
   - Cards show: Use Case Title, Business Unit, Composite Score
   - Drag & drop (if implemented)
   - Action buttons:
     - "Start Review" - Creates session, generates token
     - "Open Review" - Links to review page
     - "Copy Link" - Copies shareable URL

2. **Portfolio View**
   - Table with all use cases
   - Sorted by composite score (highest first)
   - Columns:
     - Use Case #
     - Title
     - Status
     - Business Unit
     - Composite Score
     - Individual dimension scores
   - Export option (future)

**API Calls:**
- `GET /dashboard/kanban` - Load kanban data
- `GET /dashboard/portfolio` - Load portfolio data
- `POST /reviewsessions` - Start review session
- `POST /reviewinvites` - Generate token

---

### UserAdministration.jsx
User management interface (admin only).

**Route:** `/admin/users`

**Auth Required:** Yes, must be admin role

**State:**
```javascript
{
  users: [],
  formData: {
    email: '',
    password: '',
    role: 'reviewer'
  },
  loading: false,
  error: '',
  success: false
}
```

**Features:**
- List all users
- Create new user (email, password, role)
- Edit user role
- Delete user
- Disable/enable users
- Role options: admin, reviewer, readonly

**Roles:**
| Role | Permissions |
|------|-------------|
| admin | Full access, user management, data admin |
| reviewer | Can create intakes, score use cases |
| readonly | View-only access to use cases |

**API Calls:**
- `GET /users` - List all users
- `POST /users` - Create new user
- `PATCH /users/:id` - Update user
- `DELETE /users/:id` - Delete user

---

### DataAdministration.jsx
Data management interface (admin only).

**Route:** `/admin/data`

**Auth Required:** Yes, must be admin role

**State:**
```javascript
{
  criteria: [],
  filterOptions: {},
  statuses: [],
  loading: false,
  error: ''
}
```

**Features:**
- View/manage scoring criteria
- Manage filter options (strategic themes, capability areas)
- View valid statuses
- Bulk operations (future)
- Export data (future)
- Audit trail

**Data Sections:**
1. **Criteria Management**
   - List all 28 ISM criteria
   - Dimension grouping
   - Display order
   - Polarity (BENEFIT/COST)

2. **Filter Options**
   - Strategic themes
   - Capability areas
   - Business units
   - Enable/disable options

3. **Status Management**
   - View valid statuses
   - Modify status workflows

**API Calls:**
- `GET /criteria` - List criteria
- `GET /statuses` - List statuses
- `GET /filter-options` - List filter options

---

## API Client Utilities

### api.js
Centralized API communication module.

**Exports:**
```javascript
export async function apiGet(url) 
export async function apiPost(url, data)
export async function apiPatch(url, data)
export async function apiDelete(url)
```

**Features:**
- Automatic token injection from localStorage
- Error handling and response parsing
- Base URL configuration
- Automatic retry logic (optional)

**Example Usage:**
```javascript
import { apiGet, apiPost } from '../api';

// GET request
const useCases = await apiGet('/usecases');

// POST request
const result = await apiPost('/usecases', {
  title: 'New Use Case',
  requestor: 'John Doe'
});

// With token in URL
const review = await apiGet(`/review?token=${token}`);
```

---

## Component Hierarchy

```
App
├── ErrorBoundary
├── AuthProvider (Context)
├── BrowserRouter
│   ├── SideNav
│   ├── TopBar
│   └── Routes
│       ├── /login → Login
│       ├── / → Home
│       ├── /use-cases → UseCaseList
│       ├── /intake → Intake
│       ├── /review → Review
│       ├── /usecase/:id → UseCaseDetail
│       ├── /usecase/:id/edit → UseCaseEdit
│       ├── /admin/users → ProtectedRoute → UserAdministration
│       └── /admin/data → ProtectedRoute → DataAdministration
```

---

## Styling

### CSS Architecture
- **Global**: `theme/modern.css`, `theme/theme.css`
- **Component**: Inline or colocated CSS files
- **Responsive**: Mobile-first approach
- **Variables**: CSS custom properties for colors, spacing

### CSS Classes Naming Convention
```css
.component-name           /* Block */
.component-name__element  /* Element */
.component-name--modifier /* Modifier */
```

### Theme Variables
```css
--color-primary: #0066cc;
--color-success: #00aa00;
--color-warning: #ff9900;
--color-danger: #cc0000;
--spacing-unit: 8px;
--border-radius: 4px;
--font-size-base: 14px;
```

---

## Adding a New Component

### Steps
1. Create component file: `components/MyComponent.jsx`
2. Define component function with JSDoc comments
3. Export component from `index.js` (if using barrel exports)
4. Add component to App routes if it's a page
5. Document in this guide

### Template
```jsx
/**
 * MyComponent
 * 
 * Short description of what the component does.
 * 
 * @component
 * @example
 * return (
 *   <MyComponent prop1="value" prop2={data} />
 * )
 * 
 * @param {Object} props - Component props
 * @param {string} props.prop1 - First prop description
 * @param {boolean} props.prop2 - Second prop description
 * @returns {JSX.Element} The rendered component
 */
export default function MyComponent({ prop1, prop2 }) {
  const [state, setState] = useState(initialValue);

  return (
    <div className="my-component">
      {/* component content */}
    </div>
  );
}
```

---

## Common Patterns

### Form Handling
```jsx
const [formData, setFormData] = useState({
  field1: '',
  field2: ''
});

const handleChange = (e) => {
  const { name, value } = e.target;
  setFormData(prev => ({
    ...prev,
    [name]: value
  }));
};

const handleSubmit = async (e) => {
  e.preventDefault();
  try {
    const result = await apiPost('/endpoint', formData);
    setSuccess(true);
  } catch (error) {
    setError(error.message);
  }
};

return (
  <form onSubmit={handleSubmit}>
    <input name="field1" value={formData.field1} onChange={handleChange} />
    <button type="submit">Submit</button>
  </form>
);
```

### Conditional Rendering
```jsx
{isLoading && <div>Loading...</div>}
{error && <div className="error">{error}</div>}
{data && <div>{/* render data */}</div>}
```

### Token-Based API Calls
```jsx
const token = new URLSearchParams(window.location.search).get('token');
if (token) {
  const data = await apiGet(`/review?token=${token}`);
}
```

---

## Performance Optimization

### React.memo()
Wrap components that receive props but rarely change:
```jsx
export default React.memo(MyComponent);
```

### useMemo and useCallback
Cache expensive computations and function references:
```jsx
const memoizedValue = useMemo(() => expensiveComputation(a, b), [a, b]);
const memoizedCallback = useCallback(() => doSomething(a, b), [a, b]);
```

### Code Splitting
Use React.lazy for large pages:
```jsx
const UserAdmin = React.lazy(() => import('./pages/UserAdministration'));

<Suspense fallback={<Loading />}>
  <UserAdmin />
</Suspense>
```

---

## Testing Components

### Unit Test Example (Jest + React Testing Library)
```javascript
import { render, screen, fireEvent } from '@testing-library/react';
import Login from '../pages/Login';

describe('Login', () => {
  test('renders email input', () => {
    render(<Login />);
    const input = screen.getByPlaceholderText('Email');
    expect(input).toBeInTheDocument();
  });

  test('submits form on button click', () => {
    render(<Login />);
    const button = screen.getByText('Login');
    fireEvent.click(button);
    // assertions here
  });
});
```

---

## Related Documentation
- [API Documentation](api.md) - Backend endpoints
- [Development Setup](development-setup.md) - Environment configuration
- [Architecture](architecture.md) - System design

---

**Last Updated:** February 2026

