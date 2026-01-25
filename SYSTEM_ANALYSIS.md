# TAM Monitoring Platform - System Structure & Business Analysis

## 📋 Executive Summary

The **TAM Monitoring Platform** is a comprehensive public violation reporting and monitoring system developed for TAM Organization (tam.ps). It enables citizens to report violations while providing administrators with a full-featured dashboard for managing reports, users, roles, permissions, and system configuration.

---

## 🏗️ System Architecture

### Technology Stack
- **Framework**: Angular 17
- **Language**: TypeScript
- **State Management**: RxJS (BehaviorSubject/Observable pattern)
- **Forms**: Angular Reactive Forms
- **Routing**: Angular Router with Guards
- **HTTP**: HttpClient with Interceptors
- **Icons**: Lucide Angular
- **PDF Generation**: jsPDF + html2canvas
- **Backend API**: RESTful API at `https://tam-api.wave-pal.net/api`

### Project Structure
```
src/
├── app/
│   ├── auth/                    # Authentication & Authorization
│   │   ├── auth.service.ts      # Login, token management
│   │   ├── auth.guard.ts        # Route protection
│   │   ├── permission.guard.ts  # Permission-based access
│   │   └── login/               # Login component
│   ├── components/              # Reusable UI components
│   │   ├── modal/              # Modal dialog
│   │   ├── confirmation-dialog/ # Confirmation prompts
│   │   ├── dynamic-form/       # Dynamic form builder
│   │   ├── unified-table/      # Data table component
│   │   ├── unified-card/        # Card view component
│   │   ├── view-toggle/         # Table/Card view switcher
│   │   └── toaster/             # Toast notifications
│   ├── directives/              # Custom directives
│   │   └── has-permission.directive.ts
│   ├── interceptors/            # HTTP interceptors
│   │   ├── auth.interceptor.ts  # JWT token injection
│   │   └── error.interceptor.ts # Error handling
│   ├── models/                  # TypeScript interfaces/DTOs
│   ├── pages/                   # Page components
│   │   ├── publicwebsite/      # Public-facing pages
│   │   └── dashboard/          # Admin dashboard
│   ├── services/                # Business logic services
│   └── app-routing.module.ts   # Route configuration
├── environments/                # Environment configs
└── styles.css                   # Global styles
```

---

## 🎯 Business Domain

### Core Business Purpose
The platform serves as a **violation reporting and monitoring system** where:
1. **Public users** can anonymously report violations (public or private)
2. **Administrators** can review, approve/reject, and manage violations
3. **System administrators** can configure categories, questions, users, roles, and permissions

### Key Business Entities

#### 1. **Violations** (Core Entity)
- **Types**: Public (عام) or Private (خاص)
- **Status Flow**:
  - `Pending` (قيد المراجعة) → `Approved` (موافق عليه) / `Rejected` (مرفوض)
  - `Approved` → `Publish` (منشور) / `NotPublish` (غير منشور)
- **Properties**:
  - Location, date, description
  - City, Category, SubCategory
  - Question answers (dynamic)
  - Attachments (images/videos)
  - Contact information (optional)
  - Witness status
  - Personal info visibility

#### 2. **Categories & SubCategories**
- Hierarchical organization of violation types
- Categories contain SubCategories
- Both have active/inactive status

#### 3. **Questions**
- Dynamic questions linked to categories
- **Types**: Text, Yes/No, Rating, Multiple Choice, Date, Number
- Ordered by `order` field
- Required/optional flags
- Options stored as JSON for multiple choice

#### 4. **Users**
- Authentication via email/password
- **Roles**: Multiple roles per user
- **Super Admin**: Bypasses all permission checks
- Profile image support
- Active/inactive status

#### 5. **Roles**
- Named roles (e.g., "Admin", "Moderator")
- **Permissions**: Many-to-many relationship
- Super Admin role flag
- Active/inactive status

#### 6. **Permissions**
- **Format**: `Type.Action` (e.g., `User.Read`, `Violation.Create`)
- **Types**: User, Role, Permission, Violation, Category, SubCategory, Question, City
- **Actions**: Read, Create, Update, Delete, AssignRole, ToggleActivity
- Active/inactive status

#### 7. **Cities**
- Geographic locations for violations
- Active/inactive status

---

## 🔄 Business Workflows

### Public User Workflow

#### 1. **Report Violation** (`/report`)
**Multi-step form (5 steps)**:
1. **Basic Information**:
   - Select City, Category, SubCategory
   - Enter violation date, location, description
   - Mark if witness
2. **Questions** (Dynamic):
   - Load questions based on selected category
   - Answer required/optional questions
3. **Contact Information**:
   - Choose contact preference (email/phone/both/none)
   - Enter email/phone if selected
   - Option to make personal info visible
4. **Attachments**:
   - Upload images/videos (max 10MB each)
   - Preview images
5. **Review & Submit**:
   - Review all information
   - Submit as Public Violation
   - Receive confirmation with violation ID
   - Option to print/view report

**Business Rules**:
- Public violations can be created without authentication
- Can only be updated if status is `Pending`
- Personal info visibility controls what's shown publicly

#### 2. **View Violations** (`/violations`)
- Public list of published violations
- Filtering capabilities
- View violation details

### Admin Dashboard Workflow

#### 1. **Authentication** (`/login`)
- Email/password login
- JWT token stored in localStorage
- Token expiration handling
- Permissions loaded from token/response

#### 2. **Dashboard Overview** (`/dashboard`)
- Statistics component (default landing)
- Sidebar navigation (permission-based visibility)

#### 3. **Violations Management** (`/dashboard/violations`)
**Required Permission**: `Violation.Read`

**Actions**:
- **View**: List all violations (table/card view)
- **Filter**: By type, status, city, category, date range
- **Create**: `Violation.Create` permission
- **Edit**: `Violation.Update` or Super Admin (only if Pending)
- **Delete**: `Violation.Delete` or Super Admin
- **Approve/Reject**: Change acceptance status
- **Publish/Unpublish**: Control publication status
- **Toggle Activity**: Activate/deactivate

**Business Rules**:
- Private violations require authentication to create
- Only creator can update private violations (if Pending)
- Must be Approved before Publishing
- Soft delete (isActive flag)

#### 4. **Categories Management** (`/dashboard/categories`)
**Required Permission**: `Category.Read`

**Actions**:
- CRUD operations with permission checks
- Toggle active/inactive status
- Filter by name, description, status

#### 5. **SubCategories Management** (`/dashboard/subcategories`)
**Required Permission**: `SubCategory.Read`

**Actions**:
- CRUD operations
- Filter by category, name, status
- Toggle active/inactive

#### 6. **Questions Management** (`/dashboard/questions`)
**Required Permission**: `Question.Read`

**Actions**:
- Create questions linked to categories
- Configure question type, order, required flag
- Options for multiple choice (JSON)
- Filter by category, type, status

#### 7. **Users Management** (`/dashboard/users`)
**Required Permission**: `User.Read`

**Actions**:
- **Create**: `User.Create` permission
- **Edit**: `User.Update` or Super Admin
- **Delete**: `User.Delete` or Super Admin
- **Assign Roles**: `User.AssignRole` or Super Admin
- **Toggle Activity**: `User.Update` or Super Admin
- **View**: Table/card view with role display

**Business Rules**:
- Super Admin users cannot assign roles to themselves
- Password optional on update (only if changing)
- Profile image upload support

#### 8. **Roles Management** (`/dashboard/roles`)
**Required Permission**: `Role.Read`

**Actions**:
- **Create**: `Role.Create` permission
- **Edit**: `Role.Update` or Super Admin
- **Delete**: `Role.Delete` or Super Admin
- **Assign Permissions**: `Role.Update` or Super Admin
  - Checkboxes disabled if no permission
  - Visual feedback for disabled state
- **Toggle Activity**: `Role.Update` or Super Admin

**Business Rules**:
- Super Admin role has special handling
- Permissions are assigned via checkboxes
- Many-to-many relationship with permissions

#### 9. **Permissions Management** (`/dashboard/permissions`)
**Required Permission**: `Permission.Read`

**Actions**:
- **View**: List all permissions
- **Edit**: `Permission.Update` or Super Admin (name only)
- **Toggle Activity**: `Permission.Update` or Super Admin
- **No Delete**: Permissions cannot be deleted (backend design)

#### 10. **Cities Management** (`/dashboard/cities`)
**Required Permission**: `City.Read`

**Actions**:
- CRUD operations
- Toggle active/inactive
- Filter capabilities

---

## 🔐 Security & Permissions Model

### Authentication
- **JWT Token**: Stored in localStorage
- **Token Expiration**: Automatic logout on expiry
- **Token Claims**: Includes `IsSuperAdmin` flag
- **HTTP Interceptor**: Automatically adds token to requests

### Authorization
**Three-tier permission system**:

1. **Route-Level** (`PermissionGuard`):
   - Protects dashboard routes
   - Checks specific permission (e.g., `Violation.Read`)
   - Redirects to login if unauthorized

2. **Component-Level** (`*hasPermission` directive):
   - Hides/shows UI elements
   - Used for buttons, menu items
   - Example: `*hasPermission="'User.Create'"`

3. **Service-Level** (`PermissionCheckService`):
   - Programmatic permission checks
   - Used in component logic
   - Methods: `hasPermission()`, `hasAnyPermission()`, `hasAllPermissions()`

### Super Admin Bypass
- Super Admins bypass all permission checks
- Checked via `isSuperAdmin()` method
- Extracted from JWT token or user object

### Permission Format
```
Type.Action
Examples:
- User.Read
- User.Create
- User.Update
- User.Delete
- User.AssignRole
- Violation.Read
- Violation.Create
- Role.Update
- Category.ToggleActivity
```

---

## 📊 Data Models & Relationships

### Entity Relationships
```
User ──┬── Roles (Many-to-Many)
       └── Permissions (via Roles)

Role ──┬── Permissions (Many-to-Many)
       └── Users (Many-to-Many)

Violation ──┬── City (Many-to-One)
            ├── Category (Many-to-One)
            ├── SubCategory (Many-to-One)
            ├── Questions (via QuestionAnswers)
            └── User (createdBy - optional)

Category ──┬── SubCategories (One-to-Many)
           └── Questions (One-to-Many)

Question ──┬── Category (Many-to-One)
           └── Violations (via QuestionAnswers)
```

### Key DTOs
- **ViolationDto**: Full violation with populated relations
- **AddPublicViolationDto**: Public violation creation
- **AddPrivateViolationDto**: Private violation creation
- **UserDto**: User with roles array
- **RoleDto**: Role with permission IDs
- **PermissionDto**: Permission definition
- **CategoryDto**: Category with active status
- **QuestionDto**: Question with type, options, order

---

## 🎨 UI/UX Architecture

### Component Hierarchy
```
AppComponent
├── HeaderComponent (public)
├── FooterComponent (public)
└── Router Outlet
    ├── Public Routes
    │   ├── HomeComponent
    │   ├── ReportViolationComponent
    │   ├── ViolationListComponent
    │   └── AboutComponent
    └── Dashboard Routes
        └── DashboardLayoutComponent
            ├── DashboardSidebarComponent
            ├── DashboardHeaderComponent
            └── Router Outlet
                ├── StatisticsComponent
                ├── ViolationsManagementComponent
                ├── UsersManagementComponent
                └── ... (other management components)
```

### Shared Components
- **UnifiedTableComponent**: Reusable data table with sorting, filtering, actions
- **UnifiedCardComponent**: Card view for data display
- **ViewToggleComponent**: Switch between table/card views
- **ModalComponent**: Reusable modal dialog
- **ConfirmationDialogComponent**: Confirmation prompts
- **DynamicFormComponent**: Dynamic form builder
- **ToasterComponent**: Toast notifications

### View Modes
- **Table View**: Sortable, filterable data table
- **Card View**: Visual card layout
- User preference stored in localStorage

---

## 🔧 Services Architecture

### Core Services

1. **AuthService**
   - Login/logout
   - Token management
   - User state (BehaviorSubject)
   - Permission state (BehaviorSubject)
   - Token expiration checking

2. **ViolationService**
   - CRUD operations
   - Public/Private violation creation
   - Status management (approve/reject/publish)
   - Filtering and pagination

3. **UserService**
   - User CRUD
   - Role assignment
   - Activity toggling

4. **RoleService**
   - Role CRUD
   - Permission assignment/unassignment

5. **PermissionCheckService**
   - Permission validation
   - Super Admin checking
   - Observable permission state

6. **CategoryService, SubCategoryService, QuestionService, CityService**
   - Entity-specific CRUD
   - Filtering capabilities

7. **FileUploadService**
   - File upload handling
   - Image/video support

8. **ToasterService**
   - Success/Error/Warning notifications

9. **ConfirmationDialogService**
   - Reusable confirmation dialogs

---

## 📡 API Integration

### API Base URL
```
https://tam-api.wave-pal.net/api
```

### API Response Format
```typescript
interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | PaginationResponse<T>;
}
```

### Key Endpoints
- `/auth/login` - Authentication
- `/Violation/*` - Violation operations
- `/User/*` - User management
- `/Role/*` - Role management
- `/Permission/*` - Permission management
- `/Category/*` - Category management
- `/SubCategory/*` - SubCategory management
- `/Question/*` - Question management
- `/City/*` - City management

### HTTP Interceptors
1. **AuthInterceptor**: Adds JWT token to all requests
2. **ErrorInterceptor**: Handles HTTP errors globally

---

## 🚀 Key Features

### Public Features
✅ Multi-step violation reporting form
✅ Dynamic questions based on category
✅ File upload (images/videos)
✅ Public violation listing
✅ Print view for reports
✅ Responsive design

### Admin Features
✅ Permission-based access control
✅ User, Role, Permission management
✅ Violation workflow management
✅ Category/SubCategory/Question configuration
✅ City management
✅ Statistics dashboard
✅ Table/Card view toggle
✅ Advanced filtering
✅ Activity toggling (soft delete)

---

## 🔄 State Management

### Reactive State (RxJS)
- **AuthService**: `currentUser$`, `permissions$` (BehaviorSubject)
- **PermissionCheckService**: `permissions$` (BehaviorSubject)
- Component-level state via services and local variables

### Local Storage
- JWT token (`tam_auth_token`)
- User object (`tam_auth_user`)
- Token expiration (`tam_auth_expires_at`)
- Permissions (`tam_auth_permissions`)
- View preferences (e.g., `users-view-mode`)

---

## 📝 Business Rules Summary

### Violations
1. Public violations can be created without auth
2. Private violations require authentication
3. Can only update if status is `Pending`
4. Must be `Approved` before `Publish`
5. Soft delete via `isActive` flag

### Permissions
1. All routes protected with `PermissionGuard`
2. All actions protected with permission checks
3. Super Admin bypasses all checks
4. Permission format: `Type.Action`

### Users
1. Super Admins cannot assign roles to themselves
2. Password optional on update
3. Multiple roles per user
4. Active/inactive status

### Roles
1. Many-to-many with permissions
2. Super Admin role has special handling
3. Permission assignment requires `Role.Update`

### Questions
1. Linked to categories
2. Ordered by `order` field
3. Options stored as JSON for multiple choice
4. Required/optional flags

---

## 🎯 System Strengths

1. **Comprehensive Permission System**: Fine-grained access control
2. **Flexible Question System**: Dynamic questions per category
3. **Dual Violation Types**: Public and private reporting
4. **Reusable Components**: Unified table, card, modal components
5. **Type Safety**: Full TypeScript with interfaces
6. **Responsive Design**: Works on all devices
7. **Error Handling**: Global error interceptor
8. **User Experience**: Multi-step forms, view preferences, toast notifications

---

## 🔮 Potential Enhancements

1. **Real-time Updates**: WebSocket for live violation status
2. **Notifications**: Email/SMS notifications for status changes
3. **Analytics**: Advanced reporting and statistics
4. **Export**: Excel/PDF export for violations
5. **Search**: Full-text search across violations
6. **Comments**: Discussion threads on violations
7. **Workflow Engine**: Customizable approval workflows
8. **Multi-language**: i18n support (currently Arabic-focused)

---

## 📚 Documentation Files

- `README.md` - Project overview
- `SETUP.md` - Installation guide
- `PERMISSIONS_REPORT.md` - Permission implementation audit
- `SYSTEM_ANALYSIS.md` - This document

---

**Last Updated**: January 24, 2026
**Version**: 1.0.0
**Organization**: TAM Organization (tam.ps)
