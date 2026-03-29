# Source Tree Analysis - Mento Admin

## Project Root Structure

```
mento-admin/
├── .github/
│   └── workflows/
│       └── ci.yml              # GitHub Actions CI pipeline
├── docs/                       # Generated documentation
├── drizzle/
│   └── migrations/             # Database migration files
├── public/                     # Static assets
├── scripts/
│   └── db/                     # Database utility scripts
│   │   ├── create-local-dbs.ts
│   │   ├── migrate.ts
│   │   ├── reset-test-db.ts
│   │   └── seed-dev.ts
├── src/                        # Main source code
│   ├── app/                    # Next.js App Router
│   ├── components/             # Shared UI components
│   ├── features/               # Feature modules
│   ├── lib/                    # Utility libraries
│   ├── server/                 # Server-only code
│   ├── styles/                 # Global styles
│   └── types/                  # Global TypeScript types
├── tests/
│   ├── e2e/                    # Playwright E2E tests
│   └── integration/            # Integration tests
├── .env.example                # Environment template
├── .env.local                  # Local environment (gitignored)
├── drizzle.config.ts           # Drizzle ORM configuration
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies and scripts
├── playwright.config.ts        # Playwright test config
├── README.md                   # Project setup guide
├── tsconfig.json               # TypeScript configuration
├── vitest.config.ts            # Vitest test configuration
└── vitest.setup.ts             # Test setup file
```

---

## App Router Structure

```
src/app/
├── (auth)/                     # Auth route group (no layout)
│   ├── signin/
│   │   └── page.tsx            # Sign in page
│   └── layout.tsx              # Auth layout
├── (workspace)/                # Protected workspace routes
│   ├── clients/
│   │   ├── [clientId]/
│   │   │   └── page.tsx        # Client detail/edit
│   │   ├── new/
│   │   │   └── page.tsx        # Create client
│   │   └── page.tsx            # Clients list
│   ├── invoices/
│   │   ├── [invoiceId]/
│   │   │   ├── page.tsx        # Invoice detail/edit
│   │   │   └── preview/
│   │   │       └── page.tsx    # Invoice preview/PDF
│   │   └── page.tsx            # Invoices list
│   ├── quotes/
│   │   ├── [quoteId]/
│   │   │   ├── page.tsx        # Quote editor
│   │   │   ├── preview/
│   │   │   │   └── page.tsx    # Quote preview
│   │   │   └── revisions/
│   │   │       └── page.tsx    # Revision history
│   │   ├── new/
│   │   │   └── page.tsx        # Create quote
│   │   └── page.tsx            # Quotes list
│   ├── service-packages/
│   │   ├── [servicePackageId]/
│   │   │   └── page.tsx        # Package detail/edit
│   │   ├── new/
│   │   │   └── page.tsx        # Create package
│   │   └── page.tsx            # Package library
│   ├── settings/
│   │   └── page.tsx            # Studio settings
│   ├── workspace/
│   │   └── page.tsx            # Dashboard/overview
│   ├── layout.tsx              # Workspace shell (protected)
│   └── page.tsx                # Redirect to workspace
├── api/                        # API routes
│   ├── auth/[...nextauth]/
│   │   └── route.ts            # NextAuth.js handler
│   ├── health/
│   │   └── route.ts            # Health check endpoint
│   ├── invoices/[invoiceId]/pdf/
│   │   ├── route.ts            # PDF generation
│   │   └── route.test.ts       # PDF route tests
│   └── workspace/overview/
│       └── route.ts            # Dashboard data
├── layout.tsx                  # Root layout
├── not-found.tsx               # 404 page
└── page.tsx                    # Landing/marketing page
```

---

## Features Structure

```
src/features/
├── auth/                       # Authentication
│   ├── components/
│   ├── server/
│   └── types/
├── clients/                    # Client management
│   ├── components/
│   │   ├── client-form.tsx
│   │   ├── client-form.test.tsx
│   │   └── ...
│   ├── server/
│   │   ├── actions/
│   │   │   ├── create-client.ts
│   │   │   ├── create-client.test.ts
│   │   │   ├── update-client.ts
│   │   │   └── update-client.test.ts
│   │   ├── queries/
│   │   └── repository/
│   └── types/
├── corrections/                # Data correction tools
│   └── components/
├── invoices/                   # Invoice workflow
│   ├── components/
│   └── server/
│       └── actions/
├── pdf/                        # PDF generation
│   └── components/
├── quotes/                     # Quote workflow (core feature)
│   ├── components/
│   │   ├── generate-quote-button.tsx
│   │   ├── quote-editor-section.tsx
│   │   ├── quote-setup-form.tsx
│   │   └── ...
│   ├── server/
│   │   └── actions/
│   │       ├── create-quote.ts
│   │       ├── generate-quote-content.ts
│   │       ├── revise-quote.ts
│   │       ├── mark-quote-accepted.ts
│   │       └── ...
│   ├── store/
│   │   └── quote-editor-store.ts   # Zustand store
│   └── types/
├── record-history/             # Record tracing
│   └── components/
├── service-packages/           # Service library
│   ├── components/
│   └── server/
│       └── actions/
├── studio-defaults/            # Settings
│   ├── components/
│   └── server/
│       └── actions/
└── workspace/                  # Workspace shell
    ├── components/
    └── actions/
```

---

## Server Structure

```
src/server/
└── db/
    ├── schema/                 # Drizzle table definitions
    │   ├── clients.ts
    │   ├── index.ts            # Schema exports
    │   ├── invoices.ts
    │   ├── quote-revisions.ts
    │   ├── quote-sections.ts
    │   ├── quotes.ts
    │   ├── service-packages.ts
    │   └── studio-defaults.ts
    ├── get-database-url.ts     # Database URL resolution
    └── index.ts                # Database connection
```

---

## Shared Components

```
src/components/
├── app-shell/                  # Layout components
│   ├── navigation.tsx
│   └── workspace-shell.tsx
├── feedback/                   # UI feedback
│   ├── error-message.tsx
│   ├── loading-spinner.tsx
│   └── success-message.tsx
└── ui/                         # Base UI primitives
    ├── button.tsx
    ├── card.tsx
    ├── dialog.tsx
    ├── input.tsx
    ├── table.tsx
    └── textarea.tsx
```

---

## Library Utilities

```
src/lib/
├── env.ts                      # Environment validation
├── env.test.ts                 # Env tests
└── validation/
    └── action-result.ts        # Action result types
```

---

## Critical Entry Points

| Entry Point | Purpose |
|-------------|---------|
| `src/app/layout.tsx` | Root layout with providers |
| `src/app/page.tsx` | Marketing landing page |
| `src/app/(workspace)/layout.tsx` | Protected workspace shell |
| `src/app/(workspace)/workspace/page.tsx` | Dashboard |
| `src/server/db/index.ts` | Database connection |
| `src/app/api/auth/[...nextauth]/route.ts` | Auth handler |

---

## Test Locations

| Test Type | Location Pattern |
|-----------|------------------|
| Unit | `src/**/*.test.ts` |
| Component | `src/**/*.test.tsx` |
| Integration | `tests/integration/**/*.test.ts` |
| E2E | `tests/e2e/**/*.spec.ts` |

---

## Key Design Patterns

### Feature Co-location
All code for a feature lives together:
```
features/quotes/
├── components/         # UI
├── server/actions/     # Mutations
├── server/queries/     # Data fetching
└── store/              # State (if needed)
```

### Route Group Organization
- `(auth)` - Unauthenticated routes
- `(workspace)` - Protected business logic routes

### Database Schema Organization
- One file per domain entity
- Index file for centralized exports
- Foreign key relationships explicit
