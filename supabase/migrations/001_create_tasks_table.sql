-- =====================================================
-- Vuena ERP Template - Database Migration
-- Description: Creates tasks table for examples module
-- =====================================================

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
    priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    due_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_by ON tasks(created_by);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON tasks(due_date);

-- Enable Row Level Security (RLS)
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Allow users to read all tasks (adjust based on your requirements)
CREATE POLICY "Users can view all tasks"
    ON tasks
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow users to insert their own tasks
CREATE POLICY "Users can create tasks"
    ON tasks
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = created_by);

-- Allow users to update their own tasks
CREATE POLICY "Users can update their own tasks"
    ON tasks
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = created_by)
    WITH CHECK (auth.uid() = created_by);

-- Allow users to delete their own tasks
CREATE POLICY "Users can delete their own tasks"
    ON tasks
    FOR DELETE
    TO authenticated
    USING (auth.uid() = created_by);

-- Create function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON tasks TO service_role;

-- =====================================================
-- Sample Data (Optional - for testing)
-- =====================================================
-- Uncomment to insert sample tasks

-- INSERT INTO tasks (title, description, status, priority, created_by, updated_by)
-- VALUES
--     ('Setup PowerSync', 'Configure PowerSync with Supabase backend', 'completed', 'high', auth.uid(), auth.uid()),
--     ('Create BaseModel', 'Implement base model with Kysely', 'completed', 'high', auth.uid(), auth.uid()),
--     ('Build composables', 'Create reusable Vue composables for common patterns', 'in_progress', 'medium', auth.uid(), auth.uid()),
--     ('Write documentation', 'Document the architecture and patterns', 'pending', 'low', auth.uid(), auth.uid()),
--     ('Add unit tests', 'Test composables and models', 'pending', 'medium', auth.uid(), auth.uid());
