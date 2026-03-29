# Development Guide - Mento Admin

## Prerequisites

- **Node.js:** 20.x or higher
- **PostgreSQL:** 14+ running on localhost:5432
- **npm:** Comes with Node.js

---

## Initial Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local` if your PostgreSQL credentials differ from defaults:
```
DATABASE_URL=postgresql://username:password@localhost:5432/mento-admin-dev
TEST_DATABASE_URL=postgresql://username:password@localhost:5432/mento-admin-test
```

### 3. Create Databases

```bash
npm run db:setup:local
```

This creates:
- `mento-admin-dev` - Development database
- `mento-admin-test` - Test database
- Runs migrations
- Seeds development data

---

## Daily Development Workflow

### Start Development Server

```bash
npm run dev
```

App runs at `http://localhost:3000`

### Refresh Development Data

```bash
npm run db:seed:dev
```

Resets dev database with fresh fixtures.

---

## Testing

### Unit Tests (Vitest)

```bash
npm test
```

Runs all `*.test.ts` and `*.test.tsx` files in:
- `src/**/*.test.*`
- `tests/integration/**/*.test.*`

### E2E Tests (Playwright)

**Important:** Stop `npm run dev` first, then:

```bash
npm run test:e2e
```

Playwright will:
1. Reset the test database
2. Start an isolated dev server on port 3000
3. Run tests against Chrome and Safari

---

## Database Commands

| Command | Description |
|---------|-------------|
| `npm run db:create-local` | Create dev and test databases |
| `npm run db:migrate:dev` | Apply migrations to dev database |
| `npm run db:seed:dev` | Load fixtures into dev database |
| `npm run db:reset:test` | Reset test database (migrations + truncate + seed) |
| `npm run db:setup:local` | Full setup (create + migrate + seed + reset test) |

### Safety Rules

- Scripts only allow `localhost` targets
- Test reset refuses non-test database names
- Dev seed refuses non-dev database names

---

## Code Quality

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npx tsc --noEmit
```

### CI Pipeline

GitHub Actions runs on push/PR:
1. Install dependencies
2. Lint
3. Type check
4. Test
5. Build

---

## Project Structure

```
mento-admin/
├── src/
│   ├── app/              # Next.js App Router
│   │   ├── (auth)/       # Auth group routes
│   │   ├── (workspace)/  # Protected workspace routes
│   │   ├── api/          # API routes
│   │   ├── layout.tsx    # Root layout
│   │   └── page.tsx      # Landing page
│   ├── components/       # Shared UI components
│   │   ├── app-shell/    # Layout components
│   │   ├── feedback/     # Loading/error states
│   │   └── ui/           # Base UI primitives
│   ├── features/         # Feature modules
│   │   ├── auth/         # Authentication
│   │   ├── clients/      # Client management
│   │   ├── quotes/       # Quote workflow
│   │   ├── invoices/     # Invoice generation
│   │   ├── service-packages/  # Service library
│   │   ├── studio-defaults/   # Settings
│   │   ├── workspace/         # Workspace shell
│   │   ├── record-history/    # Record tracing
│   │   ├── corrections/       # Data fixes
│   │   └── pdf/               # PDF generation
│   ├── lib/              # Shared utilities
│   ├── server/           # Server-only code
│   │   └── db/           # Database layer
│   │       ├── schema/   # Drizzle schemas
│   │       └── index.ts  # DB connection
│   ├── styles/           # Global styles
│   └── types/            # Global types
├── tests/
│   ├── e2e/              # Playwright tests
│   └── integration/      # Integration tests
├── drizzle/              # Database migrations
├── scripts/              # Utility scripts
├── docs/                 # Documentation
└── .github/workflows/    # CI configuration
```

---

## Key Technologies

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5 |
| UI | React 19 |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v4 |
| State | Zustand (quote editor only) |
| Testing | Vitest + Playwright |
| Validation | Zod |

---

## Environment Variables

Required in `.env.local`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mento-admin-dev
TEST_DATABASE_URL=postgresql://user:pass@localhost:5432/mento-admin-test

# Auth
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
STUDIO_OWNER_EMAIL=owner@example.com
STUDIO_OWNER_PASSWORD=your-password

# Optional
SENTRY_DSN=          # Error tracking
RESEND_API_KEY=      # Email sending
```

---

## Troubleshooting

### Database Connection Issues

**Problem:** Migration or seed fails

**Solutions:**
1. Confirm PostgreSQL is running: `pg_isready`
2. Verify credentials in `.env.local`
3. Check database exists: `psql -l | grep mento`
4. Ensure user can create databases

### Playwright Auth Fails

**Problem:** E2E tests can't sign in

**Solutions:**
1. Verify `STUDIO_OWNER_EMAIL` and `STUDIO_OWNER_PASSWORD` in `.env.local`
2. Ensure test database is reset: `npm run db:reset:test`
3. Check that seed data includes the test user

### App Falls Back to In-Memory

**Problem:** Database URL unreachable

**Solutions:**
1. Verify `DATABASE_URL` format
2. Confirm PostgreSQL is running
3. Check network/firewall settings
4. Review error logs for connection details

---

## Contributing

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Feature-based organization
- Colocated tests

### Pull Request Process

1. Create feature branch
2. Make changes with tests
3. Run full validation: `npm run lint && npx tsc --noEmit && npm test`
4. Submit PR
5. CI must pass before merge

---

## Architecture Notes

### Feature-First Organization

Code is organized by feature domain rather than technical layer:
- Co-location of components, actions, and queries
- Clear boundaries between features
- Shared code in `src/components/` and `src/lib/`

### Server-First Pattern

- Server Actions for mutations
- Route Handlers for HTTP endpoints
- Server Components by default
- Client Components for interactivity

### Data Flow

```
UI Component
    ↓
Server Action (validation + auth)
    ↓
Repository (database access)
    ↓
Drizzle ORM
    ↓
PostgreSQL
```
