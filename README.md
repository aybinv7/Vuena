# ERP Template with PowerSync

A scalable, modular **Enterprise Resource Planning (ERP) template** built with **Vue 3**, **Framework7**, **PowerSync**, and **Capacitor** for cross-platform deployment. This template provides a solid foundation for building offline-first, real-time syncing ERP applications with a mobile-first approach.

## 🚀 Features

- **Offline-First Architecture**: Built with PowerSync for robust offline support and automatic data synchronization
- **Real-Time Sync**: Instant data synchronization across devices using PowerSync and Supabase
- **Modular Design**: Clean module architecture for easy scalability and maintenance
- **Mobile-First**: Framework7-based UI optimized for iOS and Android with Capacitor
- **Type-Safe**: Full TypeScript support with Kysely for type-safe database queries
- **Developer Experience**: Auto-imports, hot reload, and comprehensive developer tools

## 📦 Tech Stack

- **Frontend**: Vue 3 with TypeScript and Composition API
- **UI Framework**: Framework7 (lite-bundle) with Vue integration
- **Database & Sync**: PowerSync with Kysely for type-safe queries
- **Backend**: Supabase (PostgreSQL with Row Level Security)
- **Mobile**: Capacitor for iOS/Android builds
- **State Management**: Pinia with persisted state
- **Styling**: Tailwind CSS
- **Internationalization**: Vue I18n
- **Build Tool**: Vite

## 📁 Project Structure

```
src/
├── modules/              # Feature modules
│   ├── _template/       # Module template for creating new modules
│   ├── auth/            # Authentication module
│   ├── home/            # Dashboard and navigation
│   ├── contacts/        # Example: Contacts module (coming soon)
│   ├── documents/       # Example: Documents module (coming soon)
│   └── [expenses/groups] # Example: FairShare modules (reference implementation)
├── shared/              # Shared resources
│   ├── components/      # Reusable UI components
│   ├── composables/     # Reusable Vue composables
│   ├── database/        # PowerSync database configuration
│   │   ├── base/        # Base entity and model classes
│   │   └── schemas/     # Database schema definitions
│   ├── services/        # Shared services
│   ├── stores/          # Global Pinia stores
│   └── utils/           # Utility functions
├── plugins/             # App plugins (Capacitor, etc.)
├── router/              # Global routing configuration
└── assets/              # Static assets (images, fonts, etc.)
```

## 🏗️ Module Architecture

Each module follows a consistent structure:

```
src/modules/{module-name}/
├── components/          # Module-specific components
├── composables/         # Module-specific composables
├── router/
│   └── routes/          # Module routes
├── services/            # Module-specific services
├── stores/              # Module state management
├── views/               # Module pages
└── types.ts             # Module type definitions
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Supabase account (for backend)
- PowerSync account (for sync infrastructure)

### Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/ayb/erp-template-powersync.git
   cd erp-template-powersync
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_POWERSYNC_URL=your_powersync_url
   ```

4. **Set up Supabase database**

   Run the SQL schema from `schema.sql` in your Supabase SQL editor to create tables and set up Row Level Security policies.

5. **Configure PowerSync**

   Deploy the sync rules from `powersync-sync-rules.yaml` to your PowerSync instance.

6. **Start development server**
   ```bash
   pnpm run dev
   ```

## 📝 Available Scripts

### Development

- `pnpm dev` - Start development server with hot reload
- `pnpm start` - Alias for `pnpm dev`

### Build

- `pnpm build` - Build for production with type checking
- `pnpm build-only` - Build without type checking
- `pnpm preview` - Preview production build locally

### Mobile

- `pnpm ios` - Build and sync to iOS project
- `pnpm ios-open` - Build, sync, and open in Xcode
- `pnpm android` - Build and sync to Android project
- `pnpm android-open` - Build, sync, and open in Android Studio

### Type Checking

- `pnpm type-check` - Run TypeScript type checking

## 🎨 Creating a New Module

1. **Use the module template**

   ```bash
   cp -r src/modules/_template src/modules/your-module-name
   ```

2. **Update the module files**

   - Define routes in `router/routes/index.ts`
   - Create views in `views/`
   - Add components in `components/`
   - Define types in `types.ts`

3. **Register module routes**

   Import and add your module routes in `src/router/index.ts`

4. **Create database schema (if needed)**

   Add tables to `src/shared/database/schemas/DbSchema.ts` and update `schema.sql`

For detailed instructions, see [docs/MODULE_CREATION.md](docs/MODULE_CREATION.md) (coming soon).

## 🗄️ Database Architecture

The template uses **PowerSync** for offline-first data synchronization with **Kysely** for type-safe queries.

### Base Tables (Generic ERP Foundation)

- `organizations` - Top-level organizational units
- `organizational_units` - Departments, teams, projects
- `contacts` - Customers, suppliers, employees
- `documents` - Generic document structure (invoices, orders, etc.)
- `document_lines` - Line items for documents
- `products` - Products/services catalog
- `transactions` - Financial transactions
- `user_roles` - Role-based access control

### Example Tables (FairShare Module - Reference Implementation)

- `groups` - Expense groups
- `members` - Group membership
- `expenses` - Expense records
- `splits` - Expense splits
- `settlements` - Payment settlements

See [docs/DATABASE_PATTERNS.md](docs/DATABASE_PATTERNS.md) (coming soon) for detailed database patterns and PowerSync integration.

## 🔐 Authentication & Authorization

- **Authentication**: Supabase Auth with email/password
- **Authorization**: Row Level Security (RLS) policies in PostgreSQL
- **Multi-tenancy**: Organization/group-based data isolation
- **Offline**: PowerSync handles authentication token management

## 📱 Mobile Development

### Setup Capacitor

```bash
# Add iOS platform
npx cap add ios

# Add Android platform
npx cap add android
```

### Build for Mobile

```bash
# iOS
pnpm run ios-open

# Android
pnpm run android-open
```

### Capacitor Plugins Included

- `@capacitor/app` - App lifecycle events
- `@capacitor/keyboard` - Keyboard management
- `@capacitor/status-bar` - Status bar styling
- `@capacitor/splash-screen` - Splash screen control
- `@capacitor-community/sqlite` - SQLite for PowerSync

## 🎯 Code Style & Conventions

### Import Aliases

- `@/*` - Paths relative to `src/` directory
- `@modules/*` - Paths relative to `src/modules/` directory

### Naming Conventions

- **Components**: PascalCase (e.g., `UserProfile.vue`)
- **Composables**: `use{Feature}` pattern (e.g., `useEntityList.ts`)
- **Stores**: `use{Feature}.stores.ts` (e.g., `useAuth.stores.ts`)
- **Routes**: `{module}Routes` arrays (e.g., `contactsRoutes`)

### Auto-Imports

Vue composables, VueUse functions, and Framework7 components are auto-imported via `unplugin-auto-import` and `unplugin-vue-components`. Check `.biomelintrc-auto-import.json` for the complete list.

## 🧪 Testing

Testing infrastructure coming soon. The template will include:

- Unit tests with Vitest
- Component tests with Testing Library
- E2E tests for mobile builds

## 📚 Documentation

- [AGENTS.md](AGENTS.md) - Agent/AI developer guidelines
- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) - Architecture overview (coming soon)
- [docs/MODULE_CREATION.md](docs/MODULE_CREATION.md) - Module creation guide (coming soon)
- [docs/DATABASE_PATTERNS.md](docs/DATABASE_PATTERNS.md) - Database patterns (coming soon)

## 🤝 Contributing

This is a template project. Feel free to fork and customize for your specific ERP needs. The modular architecture is designed to make it easy to add, remove, or modify modules.

## 📄 License

UNLICENSED - This is a template for private use.

## 🔗 Resources

- [Framework7 Documentation](https://framework7.io/docs/)
- [Vue 3 Documentation](https://vuejs.org/)
- [PowerSync Documentation](https://docs.powersync.com/)
- [Supabase Documentation](https://supabase.com/docs)
- [Capacitor Documentation](https://capacitorjs.com/)
- [Kysely Documentation](https://kysely.dev/)

## 💡 Example Modules

This template includes the **FairShare expense splitting app** as a reference implementation demonstrating:

- Relational data modeling (groups, expenses, splits)
- PowerSync sync patterns
- Offline-first CRUD operations
- Framework7 UI components
- Multi-user collaboration

Use it as a guide for building your own ERP modules!
