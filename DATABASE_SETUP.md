# Vuena ERP Template - Database Setup

## 📋 Overview

This guide walks you through setting up the Supabase database and PowerSync configuration for the Vuena ERP template.

---

## 🗄️ Supabase Setup

### Step 1: Run the Migration

1. Open [Supabase Dashboard](https://supabase.com/dashboard)
2. Navigate to your project
3. Go to **SQL Editor**
4. Copy the contents of `supabase/migrations/001_create_tasks_table.sql`
5. Paste and run the SQL

### What This Creates:

- ✅ **`tasks` table** with columns:

  - `id` (UUID, primary key)
  - `title`, `description`
  - `status` (pending, in_progress, completed)
  - `priority` (low, medium, high)
  - `due_date`
  - `created_at`, `updated_at`
  - `created_by`, `updated_by` (references auth.users)

- ✅ **Indexes** for performance on:

  - `status`
  - `created_by`
  - `created_at`
  - `due_date`

- ✅ **Row Level Security (RLS)** policies:

  - Users can view all tasks
  - Users can create tasks
  - Users can update/delete their own tasks

- ✅ **Triggers**:
  - Auto-updates `updated_at` timestamp

---

## ⚡ PowerSync Setup

### Step 1: Deploy Sync Rules

The sync rules are defined in `powersync-sync-rules.yaml`.

#### Option A: PowerSync Cloud Dashboard

1. Go to [PowerSync Dashboard](https://powersync.com/dashboard)
2. Select your project
3. Navigate to **Sync Rules**
4. Copy the contents of `powersync-sync-rules.yaml`
5. Paste into the editor
6. Click **Deploy**

#### Option B: PowerSync CLI (if you have it)

```bash
powersync deploy powersync-sync-rules.yaml
```

### What This Configures:

- ✅ **User-specific buckets**: Each user only syncs tasks they created
- ✅ **Automatic sync**: Changes propagate in real-time
- ✅ **Offline-first**: Local changes sync when connection restored

---

## 🔐 Environment Variables

Make sure your `.env` file has these variables set:

```env
# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# PowerSync
VITE_POWERSYNC_URL=https://your-instance.powersync.com
VITE_DB_FILENAME=vuena.db
```

---

## ✅ Verify Setup

After setting up Supabase and PowerSync:

1. **Start the app**: `pnpm run dev`
2. **Login** with a Supabase account
3. **Check sync status** in About page (should show "Syncing" in green)
4. **Create a task** in Examples → useKyselyQuery demo
5. **Verify in Supabase**:
   - Go to Table Editor → `tasks`
   - Confirm the task appears
6. **Test real-time sync**:
   - Open app in two browser tabs
   - Create/update a task in one tab
   - Verify it appears instantly in the other tab

---

## 🎯 Next Steps

### Add More Tables

To add additional tables:

1. **Create migration SQL** in `supabase/migrations/`
2. **Update PowerSync schema** in `src/shared/database/schemas/DbSchema.ts`
3. **Update sync rules** in `powersync-sync-rules.yaml`
4. **Create model** extending `BaseModel`
5. **Create views** using composables

### Customize RLS Policies

The default RLS allows users to:

- View all tasks
- Modify only their own tasks

To change this (e.g., team-based permissions):

```sql
-- Example: Allow team members to view tasks
CREATE POLICY "Team members can view tasks"
    ON tasks
    FOR SELECT
    TO authenticated
    USING (
        created_by IN (
            SELECT user_id FROM team_members
            WHERE team_id = current_user_team_id()
        )
    );
```

---

## 📚 Resources

- [Supabase Documentation](https://supabase.com/docs)
- [PowerSync Documentation](https://docs.powersync.com)
- [Kysely Documentation](https://kysely.dev)

---

## 🐛 Troubleshooting

### Tasks not syncing?

1. Check sync status in About page
2. Verify you're logged in
3. Check console for errors
4. Verify PowerSync credentials in `.env`

### RLS blocking operations?

1. Check RLS policies in Supabase dashboard
2. Verify `created_by` is set correctly
3. Check authenticated user's permissions

### Empty tasks list?

1. Create a task using the form
2. Verify task appears in Supabase Table Editor
3. Check PowerSync sync rules are deployed
4. Check browser console for errors
