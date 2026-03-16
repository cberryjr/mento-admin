# mento-admin

A commercial workflow application for solo and small creative studios. Turns reusable service packages into professional quotes and converts accepted quotes into invoices -- replacing spreadsheets, PDFs, and generic business tools.

## What It Does

- **Service Packages** -- Define reusable offerings with sections, line items, and default pricing
- **Quotes** -- Generate client-specific quotes from one or more service packages, then edit freely
- **Invoices** -- Convert accepted quotes into invoices with full lineage tracking
- **Client Records** -- Lightweight client management tied to quotes and invoices
- **Preview** -- Send-ready quote preview as the trust checkpoint before delivery

## Tech Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js (App Router, TypeScript) |
| Styling | Tailwind CSS |
| Database | PostgreSQL (managed, via Vercel Postgres) |
| ORM | Drizzle ORM |
| Validation | Zod |
| Auth | Auth.js (next-auth) |
| State | Server-first rendering; Zustand for quote-editor workflow state |
| PDF | Server-side PDF generation |
| Email | Resend |
| Monitoring | Sentry |
| Deployment | Vercel |
| CI/CD | GitHub Actions + Vercel preview/production deploys |

## Getting Started

### Prerequisites

- Node.js 20.9+
- npm
- PostgreSQL database (local or managed)

### Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Run database migrations
npx drizzle-kit push

# Start development server
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
  app/          # Next.js App Router pages and layouts
  components/   # Shared UI components
  lib/          # Utilities, database, auth config
  server/       # Server actions and business logic
```

## Planning Docs

Planning artifacts produced with the [BMAD Method](https://github.com/bmadcode/BMAD-METHOD) are in `_bmad-output/planning-artifacts/`:

- `prd.md` -- Product Requirements Document
- `architecture.md` -- Architecture Decision Document
- `epics.md` -- Epic and story breakdown
- `ux-design-specification.md` -- UX design specification
- `product-brief-mento-admin-2026-03-13.md` -- Product brief

## License

Private -- not licensed for external use.
