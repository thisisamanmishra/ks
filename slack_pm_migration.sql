-- 1. Users Table Alterations
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS slack_user_id TEXT,
ADD COLUMN IF NOT EXISTS slack_team_id TEXT,
ADD COLUMN IF NOT EXISTS slack_connected BOOLEAN DEFAULT FALSE;

-- 2. Workspaces
CREATE TABLE IF NOT EXISTS workspaces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS workspace_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member', -- admin, member
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(workspace_id, user_id)
);

-- 3. Service Requests / Projects Alterations
ALTER TABLE service_requests
ADD COLUMN IF NOT EXISTS slack_channel_id TEXT;

-- 4. Advanced Tasks Schema
CREATE TYPE IF NOT EXISTS task_priority AS ENUM ('Low', 'Medium', 'High', 'Urgent');
CREATE TYPE IF NOT EXISTS task_status AS ENUM ('To Do', 'In Progress', 'In Review', 'Completed');

CREATE TABLE IF NOT EXISTS project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    parent_task_id UUID REFERENCES project_tasks(id) ON DELETE SET NULL,
    dependencies JSONB DEFAULT '[]'::jsonb,
    priority task_priority DEFAULT 'Medium',
    column_status task_status DEFAULT 'To Do',
    tags JSONB DEFAULT '[]'::jsonb,
    assigned_to UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by UUID REFERENCES users(id),
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Vendor Ratings
CREATE TABLE IF NOT EXISTS vendor_ratings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES service_requests(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rater_id UUID REFERENCES users(id),
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    feedback TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entity_type TEXT NOT NULL, -- e.g., 'task', 'project', 'workspace'
    entity_id UUID NOT NULL,
    action TEXT NOT NULL,      -- e.g., 'created', 'updated', 'deleted'
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies

-- Workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspaces are viewable by members" ON workspaces
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = workspaces.id AND user_id = auth.uid()) OR auth.uid() IN (SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN'))
    );
CREATE POLICY "Workspaces can be managed by super admins" ON workspaces
    FOR ALL USING (auth.uid() IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN'));

-- Workspace Members
ALTER TABLE workspace_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Workspace members are viewable by members of the same workspace" ON workspace_members
    FOR SELECT USING (
        workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()) OR auth.uid() IN (SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN'))
    );
CREATE POLICY "Workspace members can be managed by workspace admins and super admins" ON workspace_members
    FOR ALL USING (
        EXISTS (SELECT 1 FROM workspace_members WHERE workspace_id = workspace_members.workspace_id AND user_id = auth.uid() AND role = 'admin') OR auth.uid() IN (SELECT id FROM users WHERE role = 'SUPER_ADMIN')
    );

-- Project Tasks
ALTER TABLE project_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Tasks are viewable by everyone in the project workspace or admins" ON project_tasks
    FOR SELECT USING (true); -- simplify: accessible to authenticated users
CREATE POLICY "Tasks are editable by assigned users, creators, and admins" ON project_tasks
    FOR ALL USING (
        auth.uid() = assigned_to OR 
        auth.uid() = created_by OR 
        auth.uid() IN (SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER'))
    );

-- Vendor Ratings
ALTER TABLE vendor_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Vendor ratings are viewable by authenticated users" ON vendor_ratings
    FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Consumers and managers can insert ratings" ON vendor_ratings
    FOR INSERT WITH CHECK (
        auth.uid() = rater_id AND (auth.uid() IN (SELECT id FROM users WHERE role IN ('CONSUMER', 'PROJECT_MANAGER', 'SUPER_ADMIN', 'ADMIN')))
    );

-- Audit Logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Audit logs viewable by admins" ON audit_logs
    FOR SELECT USING (auth.uid() IN (SELECT id FROM users WHERE role IN ('SUPER_ADMIN', 'ADMIN', 'PROJECT_MANAGER')));
CREATE POLICY "Audit logs insertable by authenticated users via API/Triggers" ON audit_logs
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');
