# Architecture - Mento Admin

## Executive Summary

Mento Admin is a **Next.js web application** built for studio owners to manage their commercial workflow—clients, service packages, quotes, and invoices. It follows a **feature-based architecture** with Next.js App Router, emphasizing server-first rendering and type-safe operations throughout.

**Key Characteristics:**
- Single-studio SaaS (multi-tenancy through studio-scoped data)
- Server Actions for mutations, Route Handlers for specific endpoints
- PostgreSQL with Drizzle ORM for type-safe database operations
- Feature-first code organization for maintainability

---

## Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Framework | Next.js | 16.1.6 | React framework with App Router |
| Language | TypeScript | 5.x | Type-safe JavaScript |
| UI Library | React | 19.2.3 | Component library |
| Styling | Tailwind CSS | v4 | Utility-first CSS |
| Database | PostgreSQL | 14+ | Primary data store |
| ORM | Drizzle ORM | 0.45.x | Type-safe SQL |
| Auth | NextAuth.js | v4 | Authentication |
| State | Zustand | 5.x | Client state (quote editor only) |
| Testing | Vitest | 4.x | Unit/component tests |
| E2E Testing | Playwright | 1.58+ | End-to-end tests |
| Validation | Zod | 4.x | Schema validation |

---

## Architecture Pattern

### Feature-Based Next.js App Router

The application uses Next.js App Router with a **feature-first** organization:

```
src/
├── app/                 # Routes and layouts
├── features/            # Domain modules
│   ├── clients/
│   ├── quotes/
│   ├── invoices/
│   └── ...
├── components/          # Shared UI
├── lib/                 # Utilities
└── server/              # Server-only code
```

**Benefits:**
- Clear domain boundaries
- Co-located related code
- Easier navigation and maintenance
- Clear ownership of features

---

## Data Architecture

### Database Schema

**Core Entities:**
1. **Studio Defaults** - Single-row config per studio
2. **Clients** - Customer records
3. **Service Packages** - Reusable service templates
4. **Quotes** - Commercial proposals with revision history
5. **Invoices** - Billing documents linked to quotes

**Relationships:**
```
Studio (implicit) → Clients → Quotes → Invoices
                    ↓
              Service Packages (templates)
```

**Data Isolation:**
- Every entity has `studioId` column
- Studio-scoped indexes for performance
- Repository-level filtering

### Data Flow

```
Browser
  ↓
Next.js App Router
  ↓
Server Component / Server Action
  ↓
Repository Layer
  ↓
Drizzle ORM
  ↓
PostgreSQL
```

### Server Actions Pattern

All mutations go through Server Actions:
- Type-safe with TypeScript
- Validation with Zod
- Authentication enforced
- `ActionResult<T>` envelope for errors

Example:
```typescript
export async function createQuote(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const data = createQuoteSchema.parse(input);
  // ... business logic
  return { success: true, data: { id: quote.id } };
}
```

---

## API Design

### Hybrid Architecture

| Type | Use Case | Example |
|------|----------|---------|
| Server Actions | Mutations, form submissions | `createQuote`, `updateClient` |
| Route Handlers | HTTP-specific needs | PDF export, auth callbacks |
| API Routes | External integrations | Health check, webhooks |

### Authentication

- **Provider:** NextAuth.js with credentials strategy
- **Session:** JWT-based
- **Access Control:** Single-studio RBAC
- **Protection:** Server-side session validation

### API Contracts

See [api-contracts.md](./api-contracts.md) for complete endpoint documentation.

---

## Component Overview

### Component Layers

```
┌─────────────────────────────────────┐
│  Feature Components                 │  Domain-specific UI
│  (src/features/*/components/)       │
├─────────────────────────────────────┤
│  Shared Components                  │  Reusable UI primitives
│  (src/components/)                  │
├─────────────────────────────────────┤
│  Next.js/App Router                 │  Routing and layouts
│  (src/app/)                         │
└─────────────────────────────────────┘
```

### UI Component Library

**Base Components:**
- Button, Card, Dialog, Input, Textarea, Table

**App Shell:**
- Navigation, Workspace shell, Feedback states

**Feature Components:**
- Forms, Lists, Detail views, Editors

---

## Source Tree

See [source-tree-analysis.md](./source-tree-analysis.md) for detailed directory structure.

**Key Locations:**
- Routes: `src/app/`
- Features: `src/features/`
- Database: `src/server/db/`
- Shared UI: `src/components/`
- Tests: `tests/`

---

## Development Workflow

### Prerequisites

- Node.js 20.x
- PostgreSQL 14+ on localhost:5432

### Setup

```bash
npm install
cp .env.example .env.local
npm run db:setup:local
npm run dev
```

### Testing

```bash
npm test          # Unit tests (Vitest)
npm run test:e2e  # E2E tests (Playwright)
```

See [development-guide.md](./development-guide.md) for complete instructions.

---

## Deployment Architecture

### Platform

- **Hosting:** Vercel (optimized for Next.js)
- **Database:** Managed PostgreSQL
- **CI/CD:** GitHub Actions

### CI/CD Pipeline

```
Push/PR
  ↓
GitHub Actions
  ├── Install
  ├── Lint
  ├── Type Check
  ├── Test
  └── Build
  ↓
Deploy to Vercel
```

### Environment Configuration

| Environment | Database | Purpose |
|-------------|----------|---------|
| Local Dev | localhost | Development |
| Local Test | localhost (isolated) | E2E testing |
| Preview | Managed | PR previews |
| Production | Managed | Live site |

---

## Testing Strategy

### Test Pyramid

```
    /\
   /  \  E2E (Playwright)
  /____\    - User flows
  /    \     - Critical paths
 /      \   
/________\ Integration (Vitest)
/          \  - Component logic
/            \ - Server actions
/______________\
/                \
/__________________\ Unit (Vitest)
                     - Utilities
                     - Pure functions
```

### Test Organization

- **Unit:** `src/**/*.test.ts` - Utilities, helpers
- **Component:** `src/**/*.test.tsx` - React components
- **Integration:** `tests/integration/` - API tests
- **E2E:** `tests/e2e/` - Full user flows

---

## Security Considerations

### Authentication

- Credentials-based auth with bcrypt
- Session-based authentication
- CSRF protection via NextAuth.js

### Authorization

- Studio-scoped data access
- Server-side enforcement
- Repository-level filtering

### Data Protection

- All entities scoped to studio
- Foreign key constraints prevent orphaned data
- SQL injection protection via Drizzle ORM

---

## Performance Considerations

### Database

- Indexed `studioId` columns
- Composite indexes for common queries
- Connection pooling via postgres driver

### Frontend

- Server Components by default
- Minimal client JavaScript
- Selective state management (Zustand only for quote editor)

### Caching

- Next.js default caching strategies
- Cache invalidation on mutations
- No external caching layer (MVP)

---

## Future Considerations

### Scalability

- Current: Single-studio SaaS
- Future: True multi-tenancy if needed
- Database: Can migrate to connection pooling service

### Features

- Email integration (Resend configured)
- Additional payment integrations
- Reporting and analytics

### Technical Debt

- Quote editor state complexity (Zustand helps)
- PDF generation (currently route-based)
- No CDN for static assets (MVP)
