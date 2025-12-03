# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Overview

This is an **ERP template** built with Vue 3, Framework7, PowerSync, and Capacitor. It uses a **modular architecture** for scalability and includes **FairShare** (expense splitting app) as a reference implementation module.

## Stack

- **Frontend**: Vue 3 with TypeScript and Composition API (`<script setup>`)
- **UI Framework**: Framework7 (lite-bundle) with Vue integration
- **Database & Sync**: PowerSync with Kysely for type-safe queries
- **Backend**: Supabase (PostgreSQL + Authentication)
- **Mobile**: Capacitor for iOS/Android builds
- **State Management**: Pinia with persisted state
- **Styling**: Tailwind CSS
- **Internationalization**: Vue I18n
- **Build Tool**: Vite

## Build/Lint/Test Commands

### Development

- `pnpm run dev` - Start development server
- `pnpm start` - Alias for development server

### Build

- `pnpm run build` - Build web app for production (with type checking)
- `pnpm run build-only` - Build web app without type checking
- `pnpm run preview` - Preview production build locally on port 4173

### Mobile

- `pnpm run ios` - Build and copy to iOS capacitor project
- `pnpm run ios-open` - Build, copy to iOS, and open in Xcode
- `pnpm run android` - Build and copy to Android capacitor project
- `pnpm run android-open` - Build, copy to Android, and open in Android Studio

### Type Checking

- `pnpm run type-check` - Run TypeScript type checking (vue-tsc --noEmit)

## Code Style Guidelines

### Imports

- Use `@/*` alias for paths relative to `src/` directory (e.g., `@/modules/home/views/Home.vue`)
- Use `@modules/*` alias for paths relative to `src/modules/*` directory (configured in vite.config.ts)
- Import types with `import type` syntax for TypeScript type imports
- Auto-imported functions are configured via `unplugin-auto-import` and listed in `.biomelintrc-auto-import.json`

### Formatting

- Use TypeScript with strict type checking
- Use Vue 3 Composition API with `<script setup>` syntax
- Use Tailwind CSS utility classes with arbitrary values (e.g., `!rounded-b-2xl`)
- Component names follow Framework7 naming convention (e.g., `F7Page`, `F7Navbar`)

### Naming Conventions

- **Route arrays**: `{module}Routes` (e.g., `homeRoutes`, `aboutRoutes`)
- **Vue components**: PascalCase (e.g., `Home.vue`, `About.vue`)
- **Composables**: `use{Feature}` pattern (e.g., `useAppTheme`, `useEntityList`)
- **Store files**: `use{Feature}.stores.ts` pattern (note the plural "stores")
- **Service files**: `{feature}.service.ts` (e.g., `auth.service.ts`)

### Error Handling

- Async route loading uses dynamic imports with `.then()` for component resolution
- TypeScript types from Framework7 are imported as `import type { Router } from "framework7/types"`

## Project Structure

### Modular Architecture

This template uses a **modular architecture** where each feature is self-contained:

```
src/
├── modules/{module-name}/   # Feature modules (self-contained)
│   ├── components/          # Module-specific components
│   ├── composables/         # Module-specific composables
│   ├── router/
│   │   └── routes/          # Module route definitions
│   ├── services/            # Module-specific services
│   ├── stores/              # Module state (Pinia)
│   ├── views/               # Module pages
│   └── types.ts             # Module type definitions
├── shared/                  # Shared resources across modules
│   ├── components/          # Reusable UI components
│   ├── composables/         # Reusable composables
│   ├── database/            # PowerSync database config
│   │   ├── base/            # Base entity/model classes
│   │   ├── schemas/         # Database schema definitions
│   │   └── connector.database.ts
│   ├── services/            # Global services
│   ├── stores/              # Global stores
│   └── utils/               # Utility functions
├── plugins/                 # App plugins (Capacitor, etc.)
├── router/                  # Global routing configuration
│   ├── global/              # Global routes
│   ├── guards/              # Route guards
│   └── types/               # Router types
└── assets/                  # Static assets
```

### ERP-Specific Modules

When creating ERP modules follow these patterns:

1. **Entity-based modules** (e.g., contacts, products, invoices):

   - Use `useEntity` composable for CRUD operations
   - Create typed stores with Pinia
   - Define PowerSync schema in `shared/database/schemas/`

2. **Transaction modules** (e.g., documents, orders):

   - Use master-detail pattern (header + lines)
   - Implement workflow states
   - Support drafts and offline editing

3. **Reporting modules** (e.g., analytics, dashboards):
   - Use reactive queries with PowerSync
   - Leverage aggregation patterns
   - Support offline data visualization

## Code-specific Rules

### Auto-imports and VueUse Functions

- `useLocalStorage`, `computed`, `provide`, `inject`, `onMounted`, and other Vue composables are auto-imported via `unplugin-auto-import`
- These functions are configured in `vite.config.ts` with the `getFramework7AutoImports()` function
- No need to manually import these functions from 'vue' or other libraries
- Check `.biomelintrc-auto-import.json` for the complete list of auto-imported functions

### Framework7 Component Resolution

- Framework7 components can be used in both PascalCase (F7Page, F7Navbar) and kebab-case (f7-page, f7-navbar)
- The `Framework7VueResolver()` in `src/shared/utils/resolvers/resolvers.ts` handles the component resolution
- Components are automatically resolved from 'framework7-vue' package

### Route Configuration

- Each module has its own routes defined in `src/modules/{module}/router/routes/index.ts`
- Route arrays must be named as `{module}Routes` (e.g., `homeRoutes`, `aboutRoutes`)
- Async route loading uses dynamic imports with `.then()` for component resolution
- Route parameters use `Router.RouteParameters[]` type from Framework7

### Database Patterns

#### PowerSync Schema Definition

Define tables in `src/shared/database/schemas/DbSchema.ts`:

```typescript
import { column, Schema, Table } from "@powersync/web";

const contacts = new Table(
  {
    name: column.text,
    email: column.text,
    phone: column.text,
    organization_id: column.text,
    created_at: column.text,
    updated_at: column.text,
  },
  { indexes: { org: ["organization_id"] } }
);

export const DbSchema = new Schema({
  contacts,
  // ... other tables
});
```

#### Kysely Type-Safe Queries

Use PowerSync with Kysely for type-safe database access:

```typescript
const contacts = await db
  .selectFrom("contacts")
  .selectAll()
  .where("organization_id", "=", orgId)
  .execute();
```

#### Supabase Schema (schema.sql)

- Define tables with UUIDs as primary keys
- Implement Row Level Security (RLS) policies for multi-tenancy
- Use security definer functions for helper queries
- Create publication for PowerSync: `create publication powersync for table ...`

#### PowerSync Sync Rules (powersync-sync-rules.yaml)

- Define bucket definitions for data partitioning
- Use parameters for user-specific data filtering
- Sync related tables in the same bucket

### Theme Provider Pattern

- The `useAppThemeProvider` composable must be called in a parent component to provide theme context
- `useAppTheme` hook can only be used within components that have a parent with the theme provider
- Theme and dark mode preferences are stored in localStorage with keys "app-theme" and "dark-mode"

### Import Aliases

- Use `@/*` for paths relative to `src/` directory (e.g., `@/modules/home/views/Home.vue`)
- Use `@modules/*` for paths relative to `src/modules/*` directory
- These aliases are configured in `vite.config.ts` under resolve.alias

### Capacitor Plugin Integration

- Capacitor functionality is managed through `src/plugins/capacitor.plugin.ts`
- Android back button, keyboard, and splash screen handling are integrated automatically
- All Capacitor plugins are initialized in the main App component
- PowerSync uses `@capacitor-community/sqlite` for mobile database

### Component Structure

- Vue components use PascalCase naming (e.g., `Home.vue`, `About.vue`)
- Components use `<script setup>` syntax with TypeScript
- Framework7 components follow the F7 prefix convention (e.g., `F7Page`, `F7Navbar`)

### Store Files

- Store files use `use{Feature}.stores.ts` pattern (note the plural "stores")
- Stores are located in `src/shared/stores/` or `src/modules/{module}/stores/`
- Pinia with persisted state is configured globally
- Use `defineStore` with composition API style

## ERP Development Patterns

### 1. Creating a New Module

To create a new module for ERP functionality:

1. **Copy the template**:

   ```bash
   cp -r src/modules/_template src/modules/your-module
   ```

2. **Define the database schema** in `src/shared/database/schemas/DbSchema.ts`

3. **Update Supabase schema** in `schema.sql` with tables and RLS policies

4. **Create PowerSync sync rules** in `powersync-sync-rules.yaml`

5. **Implement views** following Framework7 patterns

6. **Register routes** in your module's `router/routes/index.ts`

### 2. Offline-First CRUD Operations

Use PowerSync for offline-first CRUD:

```typescript
// Create
await db.insertInto("contacts").values({ id: uuid(), name, email }).execute();

// Read (reactive)
const contacts = useQuery(() => db.selectFrom("contacts").selectAll());

// Update
await db
  .updateTable("contacts")
  .set({ name: newName })
  .where("id", "=", contactId)
  .execute();

// Delete
await db.deleteFrom("contacts").where("id", "=", contactId).execute();
```

PowerSync automatically syncs changes to Supabase and other devices.

### 3. Multi-Tenancy Patterns

Use organization/group-based data isolation:

```sql
-- RLS Policy Example
create policy "Users can view their org data" on contacts
  for select using (
    organization_id in (
      select organization_id from user_organizations
      where user_id = auth.uid()
    )
  );
```

### 4. Role-Based Access Control

Implement roles using `user_roles` table:

```typescript
// Check permission
const hasPermission = (permission: string) => {
  const userStore = useAuthStore();
  return userStore.permissions.includes(permission);
};
```

### 5. Document Workflows

For documents with workflows (draft → submitted → approved):

```typescript
// Document state machine
const states = {
  DRAFT: "draft",
  SUBMITTED: "submitted",
  APPROVED: "approved",
  REJECTED: "rejected",
} as const;

// Transitions
const canTransition = (from: State, to: State) => {
  // Define valid transitions
};
```

## Reference Module: FairShare

The **FairShare expense splitting app** is included as a reference implementation demonstrating:

- **Modules**: `groups`, `expenses`
- **Database**: Relational schema (groups, members, expenses, splits, settlements)
- **PowerSync**: Bucket-based sync with user-specific data filtering
- **Framework7**: Mobile UI patterns (lists, sheets, swipe actions)
- **Offline**: Full offline CRUD with optimistic updates

Study these modules to understand ERP patterns in practice.

## Testing

Testing infrastructure is being developed. Future patterns will include:

- Unit tests for composables and services (Vitest)
- Component tests (Testing Library)
- E2E tests for mobile builds (Appium/Maestro)

## Documentation

- [README.md](README.md) - Getting started and overview
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture deep dive (coming soon)
- [docs/MODULE_CREATION.md](docs/MODULE_CREATION.md) - Module creation guide (coming soon)
- [docs/DATABASE_PATTERNS.md](docs/DATABASE_PATTERNS.md) - Database patterns (coming soon)

## Common Tasks

### Add a new database table

1. Update `src/shared/database/schemas/DbSchema.ts`
2. Update `schema.sql` with table definition and RLS policies
3. Update `powersync-sync-rules.yaml` with sync rules
4. Run migrations in Supabase
5. Deploy sync rules to PowerSync

### Add a new route

1. Define route in `src/modules/{module}/router/routes/index.ts`
2. Create view component in `src/modules/{module}/views/`
3. Import routes in global router (`src/router/index.ts`)

### Add a new shared component

1. Create component in `src/shared/components/{category}/`
2. Use PascalCase naming
3. Component will be auto-imported via `unplugin-vue-components`

### Add a new composable

1. Create in `src/shared/composables/` or module-specific `composables/`
2. Use `use{Feature}` naming pattern
3. Export the composable function
