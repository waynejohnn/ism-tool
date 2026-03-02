# Admin System Documentation

## Overview

The Use Case Scoring App now includes a comprehensive enterprise security model with an Admin module featuring:

1. **User Administration** - Manage user accounts and role-based access control
2. **Data Administration** - Manage portfolio filter options (Target Year, Capability Category, Executive Sponsor, Status)

## Role-Based Access Control (RBAC)

### Three Core Roles

#### 1. **Admin**
- Full system access
- Create, read, update, delete users
- Manage all filter options
- Create and manage use cases
- Review and score use cases

#### 2. **Reviewer**
- Can review and score use cases
- Read access to portfolio and use case details
- Cannot create or delete use cases
- Cannot manage users or filter options

#### 3. **Read Only**
- View-only access to portfolio and use case details
- Cannot submit scores
- Cannot create, edit, or delete use cases
- Cannot access admin functions

## Backend API Endpoints

### User Management

#### GET /admin/users
Returns all users with their roles and status.

**Response:**
```json
[
  {
    "userId": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "role": "Admin",
    "isActive": true,
    "createdOn": "2026-02-15T...",
    "updatedOn": "2026-02-15T..."
  }
]
```

#### POST /admin/users
Create a new user.

**Request Body:**
```json
{
  "email": "newuser@example.com",
  "fullName": "Jane Smith",
  "role": "Reviewer"
}
```

#### PUT /admin/users/{userId}
Update user role or status.

**Request Body:**
```json
{
  "role": "Admin",
  "fullName": "Jane Smith",
  "isActive": true
}
```

#### DELETE /admin/users/{userId}
Delete a user account.

### Filter Options Management

#### GET /admin/filter-options
Returns all active filter options grouped by category.

**Response:**
```json
{
  "TargetYear": [
    {
      "optionId": "uuid",
      "category": "TargetYear",
      "value": "2025",
      "displayName": "2025",
      "sortOrder": 1,
      "isActive": true
    }
  ],
  "CapabilityCategory": [...],
  "ExecutiveSponsor": [...],
  "Status": [...]
}
```

#### GET /admin/filter-options/{category}
Get options for a specific category.

**Categories:**
- `TargetYear` - Implementation target years
- `CapabilityCategory` - Capability areas/categories
- `ExecutiveSponsor` - Executive sponsor names
- `Status` - Use case status values

#### POST /admin/filter-options
Create a new filter option.

**Request Body:**
```json
{
  "category": "TargetYear",
  "value": "2029",
  "displayName": "2029",
  "sortOrder": 5
}
```

#### PUT /admin/filter-options/{optionId}
Update a filter option.

**Request Body:**
```json
{
  "displayName": "FY2025",
  "sortOrder": 1
}
```

#### DELETE /admin/filter-options/{optionId}
Delete a filter option (soft delete - marks as inactive).

## Frontend Pages

### User Administration Page
**Route:** `/admin/users`

Features:
- View all users in a table with role and status badges
- Add new users with email, name, and role assignment
- Edit user details and roles
- Activate/deactivate users
- Delete users permanently

**Navigation:** Sidebar → Administration → User Administration

### Data Administration Page
**Route:** `/admin/data`

Features:
- Manage filter options by category (tabbed interface)
- View all options sorted by sort order
- Add new options with display name and sort order
- Edit existing options
- Delete options (soft delete)

**Navigation:** Sidebar → Administration → Data Administration

**Categories Managed:**
- **Target Year** - Years for project implementation (2025, 2026, 2027, 2028, etc.)
- **Capability Category** - Categories of capabilities (Cloud Services, Data Analytics, Cybersecurity, AI/ML, Digital Transformation)
- **Executive Sponsor** - Names of executive sponsors responsible for use cases
- **Status** - Use case lifecycle status (Intake, In Review, Approved, Implemented, On Hold)

## Database Models

### User Model
```python
class User(Base):
    user_id: str (Primary Key)
    email: str (Unique)
    full_name: str
    role: str ("Admin", "Reviewer", "Read Only")
    is_active: bool
    created_on: datetime
    updated_on: datetime
```

### FilterOption Model
```python
class FilterOption(Base):
    option_id: str (Primary Key)
    category: str ("TargetYear", "CapabilityCategory", "ExecutiveSponsor", "Status")
    value: str (Stored value)
    display_name: str (User-facing display)
    is_active: bool
    sort_order: int (Display order within category)
    created_on: datetime
    updated_on: datetime
```

## Seed Data

The system seeds with:

### Default Users
- **admin@ism.com** - System Administrator (Admin role)
- **reviewer@ism.com** - Score Reviewer (Reviewer role)
- **readonly@ism.com** - Read Only User (Read Only role)

### Default Filter Options
- **Target Years:** 2025, 2026, 2027, 2028
- **Capability Categories:** Cloud Services, Data Analytics, Cybersecurity, AI/ML, Digital Transformation
- **Executive Sponsors:** John Doe, Jane Smith, Michael Johnson, Sarah Williams
- **Status Values:** Intake, In Review, Approved, Implemented, On Hold

## Security Considerations

1. **Role-Based Access Control**
   - Implement middleware on backend routes to verify user role
   - Frontend can hide UI elements based on user role

2. **Data Validation**
   - All inputs are validated on the backend
   - Email uniqueness enforced at database level
   - Category-value pairs validated for filter options

3. **Soft Delete Strategy**
   - Filter options use soft deletes (is_active flag)
   - Preserves historical data while removing from active lists
   - Users can be marked inactive instead of deleted

4. **Audit Trail**
   - created_on and updated_on timestamps track changes
   - Consider extending with user_id tracking for who made changes

## Usage Examples

### Add a New User
1. Navigate to Administration → User Administration
2. Click "+ Add User"
3. Enter email, full name, and select role
4. Click "Create User"

### Add a New Target Year
1. Navigate to Administration → Data Administration
2. Select "Target Year" tab
3. Click "+ Add Target Year"
4. Enter value (e.g., "2030"), display name, and sort order
5. Click "Create Option"

### Update Filter Option Display
1. Navigate to Administration → Data Administration
2. Select desired category
3. Click "Edit" on the option
4. Modify display name or sort order
5. Click "Update Option"

### Deactivate a User
1. Navigate to Administration → User Administration
2. Find the user in the list
3. Click "Deactivate" button
4. User becomes inactive but record is preserved

## Future Enhancements

1. **Audit Logging** - Track all admin actions with user and timestamp
2. **Bulk Operations** - Import/export users and filter options
3. **Role Permissions Matrix** - Define granular permissions per role
4. **User Groups/Teams** - Organize users by department or team
5. **Two-Factor Authentication** - Enhance security for Admin accounts
6. **Password Management** - Self-service password reset functionality
7. **Filter Option Hierarchy** - Parent-child relationships for options
8. **Activity Dashboard** - Admin dashboard showing system usage and changes
