# Project Overview - Mento Admin

## Project Summary

**Mento Admin** is a commercial workflow management application designed for studio owners. It provides an integrated workspace for managing clients, service packages, quotes, and invoices in a single, cohesive interface.

## Purpose

Enable studio owners to:
- Manage client relationships and contact information
- Create reusable service package templates
- Generate professional quotes from service packages
- Track quote revisions and acceptance status
- Convert accepted quotes into invoices
- Maintain complete record continuity across the commercial workflow

## Tech Stack Summary

| Category | Technology |
|----------|------------|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript 5 |
| **UI** | React 19, Tailwind CSS v4 |
| **Database** | PostgreSQL |
| **ORM** | Drizzle ORM |
| **Auth** | NextAuth.js v4 |
| **Testing** | Vitest + Playwright |
| **Deployment** | Vercel |

## Architecture Type

**Feature-Based Monolith**

- Single cohesive codebase
- Feature-first organization
- Next.js App Router with Server Actions
- Server-first rendering pattern

## Repository Structure

```
monolith/
├── Next.js App Router (src/app/)
├── Feature modules (src/features/)
├── Shared components (src/components/)
├── Database layer (src/server/db/)
└── Tests (tests/)
```

## Key Features

1. **Workspace Access** - Secure single-studio workspace with authentication
2. **Client Management** - Create, edit, and view client records
3. **Service Package Library** - Reusable templates for quotes
4. **Quote Workflow** - Generate, edit, revise, and preview quotes
5. **Invoice Generation** - Convert quotes to invoices with PDF export
6. **Record Continuity** - Trace relationships across clients, quotes, and invoices

## Quick Links

- [Architecture](./architecture.md) - System design and patterns
- [Data Models](./data-models.md) - Database schema documentation
- [API Contracts](./api-contracts.md) - Server actions and endpoints
- [Component Inventory](./component-inventory.md) - UI component reference
- [Development Guide](./development-guide.md) - Setup and workflow
- [Source Tree](./source-tree-analysis.md) - Directory structure

## Getting Started

See the [Development Guide](./development-guide.md) for:
- Prerequisites and setup
- Daily development workflow
- Testing commands
- Troubleshooting

## Status

This documentation was generated on 2026-03-28 as part of the project documentation workflow.
