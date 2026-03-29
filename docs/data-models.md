# Data Models - Mento Admin

## Overview

Mento Admin uses **PostgreSQL** as the primary database with **Drizzle ORM** for type-safe database operations. The schema follows a normalized relational model with explicit foreign keys and studio-scoped data isolation.

## Database Schema

### Core Entities

#### 1. Clients

**Table:** `clients`

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | text | Primary Key, UUID | Unique client identifier |
| `studioId` | text | Not Null, Indexed | Studio ownership |
| `name` | text | Not Null | Client business name |
| `contactName` | text | Not Null, Default "" | Primary contact person |
| `contactEmail` | text | Not Null, Default "" | Contact email |
| `contactPhone` | text | Not Null, Default "" | Contact phone |
| `createdAt` | timestamp | Not Null, Default now | Record creation time |
| `updatedAt` | timestamp | Not Null, Auto-update | Last modification time |

**Indexes:**
- `idx_clients_studio_id` - Studio-scoped queries
- `idx_clients_studio_name_created_at` - Listing with sorting

---

#### 2. Service Packages

**Table:** `service_packages`

Reusable service templates that can be applied to quotes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | text | Primary Key, UUID | Unique package identifier |
| `studioId` | text | Not Null, Indexed | Studio ownership |
| `name` | text | Not Null | Package name |
| `categoryKey` | text | Not Null, Default | Category identifier |
| `categoryLabel` | text | Not Null, Default | Display category name |
| `categoryShortLabel` | text | Not Null, Default | Short category name |
| `category` | text | Not Null | Full category path |
| `startingPriceLabel` | text | Not Null | Price display text |
| `shortDescription` | text | Not Null, Default "" | Brief description |
| `packageTotalCents` | integer | Not Null, Default 0 | Base price in cents |
| `createdAt` | timestamp | Not Null | Creation time |
| `updatedAt` | timestamp | Not Null, Auto-update | Last modification |

**Related Tables:**
- `service_package_sections` - Sections within a package
- `service_package_line_items` - Line items per section
- `service_package_complexity_tiers` - Pricing tiers

---

#### 3. Quotes

**Table:** `quotes`

Central commercial document for client proposals.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | text | Primary Key, UUID | Unique quote identifier |
| `studioId` | text | Not Null, Indexed | Studio ownership |
| `clientId` | text | Foreign Key → clients | Associated client |
| `quoteNumber` | text | Not Null, Unique per studio | Human-readable number |
| `title` | text | Not Null | Quote title |
| `status` | text | Not Null, Default "draft" | draft/accepted/invoiced |
| `terms` | text | Not Null, Default "" | Quote terms and conditions |
| `estimateBreakdownSnapshot` | text | Nullable | Serialized breakdown |
| `generatedAt` | timestamp | Nullable | When quote was generated |
| `createdAt` | timestamp | Not Null | Creation time |
| `updatedAt` | timestamp | Not Null, Auto-update | Last modification |

**Indexes:**
- `idx_quotes_studio_id` - Studio-scoped queries
- `idx_quotes_client_id` - Client's quotes lookup
- `idx_quotes_studio_status` - Status filtering
- `uq_quotes_studio_quote_number` - Unique quote numbers per studio

**Related Tables:**
- `quote_service_packages` - Many-to-many with service packages
- `quote_sections` - Editable sections (copied from packages)
- `quote_line_items` - Editable line items per section
- `quote_revisions` - Version history

---

#### 4. Invoices

**Table:** `invoices`

Billing documents generated from accepted quotes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | text | Primary Key, UUID | Unique invoice identifier |
| `studioId` | text | Not Null, Indexed | Studio ownership |
| `clientId` | text | Foreign Key → clients | Billed client |
| `sourceQuoteId` | text | Foreign Key → quotes | Source accepted quote |
| `invoiceNumber` | text | Not Null, Unique per studio | Human-readable number |
| `title` | text | Not Null | Invoice title |
| `status` | text | Not Null, Default "draft" | Invoice state |
| `issueDate` | timestamp | Nullable | When invoice was issued |
| `dueDate` | timestamp | Nullable | Payment due date |
| `paymentInstructions` | text | Not Null, Default "" | How to pay |
| `terms` | text | Not Null, Default "" | Invoice terms |
| `createdAt` | timestamp | Not Null | Creation time |
| `updatedAt` | timestamp | Not Null, Auto-update | Last modification |

**Indexes:**
- `idx_invoices_studio_id` - Studio-scoped queries
- `idx_invoices_client_id` - Client's invoices lookup
- `idx_invoices_source_quote_id` - Quote-to-invoice trace
- `idx_invoices_studio_status` - Status filtering
- `uq_invoices_studio_invoice_number` - Unique invoice numbers per studio

**Related Tables:**
- `invoice_sections` - Invoice content sections
- `invoice_line_items` - Line items per section

---

#### 5. Studio Defaults

**Table:** `studio_defaults`

Single-row configuration per studio for prefilling new documents.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | text | Primary Key, UUID | Unique record identifier |
| `studioId` | text | Not Null, Unique | Studio ownership |
| `studioName` | text | Not Null, Default "" | Studio display name |
| `studioContactEmail` | text | Not Null, Default "" | Contact email |
| `studioContactPhone` | text | Not Null, Default "" | Contact phone |
| `defaultQuoteTerms` | text | Not Null, Default "" | Prefill for new quotes |
| `defaultInvoicePaymentInstructions` | text | Not Null, Default "" | Prefill for new invoices |
| `createdAt` | timestamp | Not Null | Creation time |
| `updatedAt` | timestamp | Not Null, Auto-update | Last modification |

---

## Entity Relationship Diagram

```
┌─────────────────┐     ┌─────────────────────┐     ┌─────────────────┐
│  studio_defaults│     │     clients         │     │service_packages │
│  (1 per studio) │     │   (many per studio) │     │ (many per studio)│
└────────┬────────┘     └──────────┬──────────┘     └────────┬────────┘
         │                         │                         │
         │                         │                         │
         │              ┌──────────▼──────────┐             │
         │              │      quotes         │◄────────────┘
         │              │  (many per client)  │(via quote_service_packages)
         │              └──────────┬──────────┘
         │                         │
         │              ┌──────────▼──────────┐
         └─────────────►│     invoices        │
                        │(1 per accepted quote)│
                        └─────────────────────┘
```

## Data Relationships

### Quote Lifecycle

1. **Draft Creation** → Quote record created with status="draft"
2. **Generation** → Service packages copied to quote_sections/quote_line_items
3. **Revision** → New quote_revisions record, quote updated
4. **Acceptance** → Quote status="accepted"
5. **Conversion** → Invoice created from quote with source_quote_id

### Record Continuity

All commercial records maintain traceability:
- `invoices.source_quote_id` → Links to originating quote
- `quotes.client_id` → Links to client
- `invoices.client_id` → Denormalized for direct access
- `quote_service_packages.service_package_id` → Links to source packages

## Migration Strategy

- **Tool:** Drizzle Kit
- **Location:** `./drizzle/migrations/`
- **Pattern:** Ordered SQL files with timestamp prefixes
- **Command:** `npm run db:migrate:dev`

## Studio Data Isolation

Every business entity table includes:
- `studioId` column (Not Null, Indexed)
- Studio-scoped queries enforced at repository layer
- Unique constraints include `studioId` (e.g., quote numbers per studio)
