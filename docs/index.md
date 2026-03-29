# Mento Admin - Project Documentation Index

**Generated:** 2026-03-28

---

## Project Overview

| Attribute | Value |
|-----------|-------|
| **Type** | Monolith (single cohesive codebase) |
| **Primary Language** | TypeScript |
| **Architecture** | Feature-based Next.js App Router |

### Quick Reference

- **Tech Stack:** Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS v4 + PostgreSQL + Drizzle ORM
- **Entry Point:** `src/app/layout.tsx`
- **Architecture Pattern:** Feature-based with Server Actions

---

## Generated Documentation

### Core Documentation

- [Project Overview](./project-overview.md) - Executive summary and quick reference
- [Architecture](./architecture.md) - System design, patterns, and decisions
- [Source Tree Analysis](./source-tree-analysis.md) - Annotated directory structure

### Technical Reference

- [Data Models](./data-models.md) - Database schema and entity relationships
- [API Contracts](./api-contracts.md) - Server actions and API endpoints
- [Component Inventory](./component-inventory.md) - UI component organization
- [Development Guide](./development-guide.md) - Setup, workflow, and troubleshooting

---

## Existing Documentation

- [README.md](../README.md) - Project setup and daily workflow

---

## Getting Started

### For Development

1. Read the [Development Guide](./development-guide.md) for setup instructions
2. Review [Architecture](./architecture.md) for system understanding
3. Reference [API Contracts](./api-contracts.md) when working with data

### For New Features

1. Check [Component Inventory](./component-inventory.md) for reusable UI
2. Review [Data Models](./data-models.md) for schema constraints
3. Follow patterns in [Source Tree](./source-tree-analysis.md)

---

## Project Structure Summary

```
mento-admin/
├── src/
│   ├── app/              # Next.js App Router routes
│   ├── features/         # 11 feature modules
│   ├── components/       # Shared UI primitives
│   ├── server/db/        # Database schema (12 tables)
│   └── lib/              # Utilities
├── tests/                # E2E and integration tests
├── drizzle/              # Database migrations
└── docs/                 # This documentation
```

---

## Key Technologies

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16.1.6 |
| UI | React 19.2.3 |
| Styling | Tailwind CSS v4 |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Auth | NextAuth.js v4 |
| Testing | Vitest + Playwright |

---

## AI Context for Development

This documentation is optimized for AI-assisted development:

- **Architecture** provides system context
- **Data Models** provide schema constraints
- **API Contracts** provide interface specifications
- **Component Inventory** provides UI patterns

When working with AI assistants, reference the relevant document for context.
