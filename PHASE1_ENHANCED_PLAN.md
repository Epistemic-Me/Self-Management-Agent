# Phase 1 Enhanced Implementation Plan

## Additional Requirements for Phase 1

### **Epic 1.3: Enhanced GitHub Integration**

#### **Objective**: Full GitHub repository and project management integration

#### **Current State**: 
- Basic GitHub repo URL field in project wizard
- No validation or API integration
- No automated repo/project creation

#### **Enhanced Requirements**:

1. **GitHub Repository Association**
   - Validate GitHub repo URLs against GitHub API
   - Check repository access permissions
   - Store repository metadata (owner, name, visibility)
   - Support both existing and new repository creation

2. **GitHub Projects Integration**
   - Create GitHub Projects automatically for client projects
   - Set up project boards with standard columns (Backlog, In Progress, Review, Done)
   - Link project phases to GitHub Project milestones
   - Sync project status between platforms

3. **Issue Template Automation**
   - Auto-create issue templates for common evaluation tasks
   - Generate issues for trace collection milestones
   - Create tracking issues for each evaluation phase
   - Link issues to specific team members and roles

#### **Technical Implementation**:

```typescript
// Enhanced GitHub integration types
interface GitHubIntegration {
  repository: {
    url: string;
    owner: string;
    name: string;
    access_verified: boolean;
    created_by_platform: boolean;
  };
  project: {
    github_project_id: number;
    project_url: string;
    milestone_mapping: Record<string, number>;
  };
  api_config: {
    token: string; // encrypted
    permissions: string[];
    rate_limit_status: GitHubRateLimit;
  };
}

// New backend endpoints
interface GitHubService {
  validateRepository(url: string): Promise<RepositoryValidation>;
  createRepository(config: RepoCreationConfig): Promise<Repository>;
  createProject(repoUrl: string, config: ProjectConfig): Promise<GitHubProject>;
  createIssueTemplates(repoUrl: string, templates: IssueTemplate[]): Promise<void>;
  syncProjectStatus(projectId: string, status: ProjectStatus): Promise<void>;
}
```

#### **Database Schema Updates**:

```sql
-- Add GitHub integration to existing client_projects table
ALTER TABLE client_projects ADD COLUMN github_integration JSONB;
ALTER TABLE client_projects ADD COLUMN github_repo_validated BOOLEAN DEFAULT FALSE;
ALTER TABLE client_projects ADD COLUMN github_project_id INTEGER;

-- New table for GitHub API configuration
CREATE TABLE github_configurations (
    id UUID PRIMARY KEY,
    client_id UUID REFERENCES clients(id),
    encrypted_token TEXT,
    permissions JSONB,
    rate_limit_status JSONB,
    last_sync TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);
```

### **Epic 1.4: User-Based Open Coding Foundation**

#### **Objective**: Enable organizing and tracking open coding activities by individual users

#### **Current State**: 
- No user-specific trace organization
- No individual coding session tracking
- Open coding planned for Phase 2

#### **Enhanced Requirements**:

1. **User Management for Coding**
   - Associate traces with specific annotator users
   - Track individual user coding sessions
   - Monitor per-user annotation progress
   - Support role-based access (SME, Developer, Analyst)

2. **Trace Organization by User**
   - Filter traces by assigned annotator
   - Show user-specific annotation queues
   - Track annotation completion rates per user
   - Support collaborative annotation workflows

3. **User Session Management**
   - Track individual coding sessions (start/end times)
   - Monitor user productivity metrics
   - Support session resumption
   - Handle concurrent user annotations

#### **Technical Implementation**:

```typescript
// User-based coding types
interface AnnotationUser {
  id: string;
  name: string;
  email: string;
  role: 'SME' | 'Developer' | 'Analyst' | 'Admin';
  client_project_id: string;
  permissions: AnnotationPermission[];
  stats: UserAnnotationStats;
}

interface UserCodingSession {
  id: string;
  user_id: string;
  client_project_id: string;
  started_at: Date;
  ended_at?: Date;
  traces_assigned: string[];
  traces_completed: string[];
  progress_percentage: number;
}

interface TraceAssignment {
  trace_id: string;
  assigned_user_id: string;
  assigned_at: Date;
  completed_at?: Date;
  status: 'assigned' | 'in_progress' | 'completed' | 'skipped';
  annotation_data?: any;
}
```

#### **Database Schema Updates**:

```sql
-- User management for annotations
CREATE TABLE annotation_users (
    id UUID PRIMARY KEY,
    client_project_id UUID REFERENCES client_projects(id),
    name VARCHAR NOT NULL,
    email VARCHAR NOT NULL,
    role VARCHAR NOT NULL, -- SME, Developer, Analyst, Admin
    permissions JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

-- User coding sessions
CREATE TABLE user_coding_sessions (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES annotation_users(id),
    client_project_id UUID REFERENCES client_projects(id),
    started_at TIMESTAMP DEFAULT NOW(),
    ended_at TIMESTAMP,
    traces_assigned INTEGER DEFAULT 0,
    traces_completed INTEGER DEFAULT 0,
    session_metadata JSONB
);

-- Trace assignments to users
CREATE TABLE trace_assignments (
    id UUID PRIMARY KEY,
    trace_id UUID REFERENCES traces(id),
    assigned_user_id UUID REFERENCES annotation_users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    completed_at TIMESTAMP,
    status VARCHAR DEFAULT 'assigned',
    annotation_data JSONB
);

-- User performance metrics
CREATE TABLE user_annotation_stats (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES annotation_users(id),
    client_project_id UUID REFERENCES client_projects(id),
    total_assigned INTEGER DEFAULT 0,
    total_completed INTEGER DEFAULT 0,
    avg_time_per_trace INTERVAL,
    quality_score FLOAT,
    last_updated TIMESTAMP DEFAULT NOW()
);
```

#### **UI Components Required**:

```typescript
// New components for Phase 1
interface UserManagementDashboard {
  // Manage annotation users for a project
  users: AnnotationUser[];
  onAddUser: (user: CreateUserRequest) => void;
  onAssignTraces: (userId: string, traceIds: string[]) => void;
  onViewProgress: (userId: string) => void;
}

interface UserCodingQueue {
  // Individual user's annotation queue
  assignedTraces: TraceWithAssignment[];
  currentSession: UserCodingSession;
  onStartSession: () => void;
  onCompleteTrace: (traceId: string, annotation: any) => void;
  onSkipTrace: (traceId: string, reason: string) => void;
}
```

## **Updated Epic Dependencies**

### **Epic 1.1: Project Management & Client Onboarding** 
- **Enhanced**: Include GitHub integration setup in onboarding flow
- **Enhanced**: Include user management setup in onboarding flow

### **Epic 1.3: Enhanced GitHub Integration**
- **Depends on**: Epic 1.1 (client project structure)
- **Enables**: Automated project tracking and issue management

### **Epic 1.4: User-Based Open Coding Foundation**
- **Depends on**: Epic 1.1 (client project structure)  
- **Enables**: Phase 2 collaborative open coding workflows

## **Success Metrics Updates**

### **Additional Phase 1 Success Criteria**:
- [ ] **GitHub Integration**: 3+ client projects with validated GitHub repositories
- [ ] **GitHub Projects**: Automated project board creation for 100% of new projects
- [ ] **Issue Templates**: Standard evaluation issue templates deployed to 3+ repositories
- [ ] **User Management**: 10+ annotation users successfully onboarded across client projects
- [ ] **Trace Assignment**: User-specific trace assignment workflows operational
- [ ] **Session Tracking**: Individual user coding sessions tracked with productivity metrics

## **Implementation Timeline**

### **Week 1-2**: Enhanced GitHub Integration
- Implement GitHub API integration and validation
- Build automated repository and project creation
- Create issue template automation

### **Week 3-4**: User-Based Open Coding Foundation  
- Implement user management for annotation projects
- Build trace assignment and session tracking
- Create user-specific annotation queues

### **Week 5**: Integration & Testing
- End-to-end testing of GitHub integration
- User workflow testing and validation
- Performance optimization and documentation

## **Resource Requirements Update**

- **Additional Backend Work**: +1 week (GitHub API integration)
- **Additional Frontend Work**: +1 week (user management UI)
- **Additional Database Work**: +0.5 weeks (schema updates)

**Total Phase 1 Extension**: +2.5 weeks (from 4 weeks to 6.5 weeks)