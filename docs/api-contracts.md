# API Contracts - Mento Admin

## Overview

Mento Admin uses a hybrid API architecture:
- **Server Actions** for authenticated mutations (Next.js App Router)
- **Route Handlers** for specific HTTP endpoints (auth, PDF export, health checks)
- **NextAuth.js** for authentication callbacks

All server actions return `ActionResult<T>` envelopes for expected failures rather than throwing.

---

## Route Handlers

### Authentication

**Route:** `POST /api/auth/[...nextauth]`

NextAuth.js dynamic route handling all authentication flows.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET/POST | `/api/auth/signin` | Sign in page/callback |
| GET/POST | `/api/auth/signout` | Sign out |
| GET/POST | `/api/auth/callback/*` | OAuth callbacks |
| GET | `/api/auth/session` | Get current session |
| GET | `/api/auth/csrf` | CSRF token |

**Configuration:** Credentials-based auth with single-studio RBAC

---

### Health Check

**Route:** `GET /api/health`

Returns application health status for deployment verification.

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-03-28T17:30:00Z"
}
```

---

### Invoice PDF Export

**Route:** `GET /api/invoices/[invoiceId]/pdf`

Generates downloadable PDF for client delivery.

**Parameters:**
- `invoiceId` (path) - UUID of the invoice

**Response:** PDF file stream

**Headers:**
- `Content-Type: application/pdf`
- `Content-Disposition: attachment; filename="invoice-{number}.pdf"`

---

### Workspace Overview

**Route:** `GET /api/workspace/overview`

Returns dashboard statistics for the workspace landing page.

**Response:**
```json
{
  "clientsCount": 42,
  "quotesCount": 156,
  "invoicesCount": 89,
  "recentActivity": [...]
}
```

---

## Server Actions

### Client Actions

#### Create Client

**Action:** `createClient`

**Input:**
```typescript
{
  name: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}
```

**Output:** `ActionResult<{ id: string }>`

---

#### Update Client

**Action:** `updateClient`

**Input:**
```typescript
{
  id: string;
  name?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}
```

**Output:** `ActionResult<void>`

---

### Service Package Actions

#### Create Service Package

**Action:** `createServicePackage`

**Input:**
```typescript
{
  name: string;
  categoryKey: string;
  categoryLabel: string;
  shortDescription?: string;
  sections: Array<{
    title: string;
    defaultContent?: string;
    lineItems: Array<{
      name: string;
      defaultContent?: string;
      quantity: number;
      unitLabel?: string;
      unitPriceCents: number;
    }>;
  }>;
}
```

**Output:** `ActionResult<{ id: string }>`

---

#### Update Service Package

**Action:** `updateServicePackage`

**Input:** Package structure with optional fields

**Output:** `ActionResult<void>`

---

### Quote Actions

#### Create Quote

**Action:** `createQuote`

**Input:**
```typescript
{
  clientId: string;
  title: string;
  servicePackageIds?: string[];
}
```

**Output:** `ActionResult<{ id: string; quoteNumber: string }>`

---

#### Generate Quote Content

**Action:** `generateQuoteContent`

Generates quote sections and line items from selected service packages.

**Input:**
```typescript
{
  quoteId: string;
  servicePackageIds: string[];
}
```

**Output:** `ActionResult<void>`

---

#### Revise Quote

**Action:** `reviseQuote`

Creates a new revision of an existing quote, preserving history.

**Input:**
```typescript
{
  quoteId: string;
  reason?: string;
}
```

**Output:** `ActionResult<{ newQuoteId: string; newQuoteNumber: string }>`

---

#### Mark Quote Accepted

**Action:** `markQuoteAccepted`

**Input:** `{ quoteId: string }`

**Output:** `ActionResult<void>`

---

#### Add Quote Section

**Action:** `addQuoteSection`

**Input:** `{ quoteId: string; title: string; position?: number }`

**Output:** `ActionResult<{ id: string }>`

---

#### Remove Quote Section

**Action:** `removeQuoteSection`

**Input:** `{ quoteId: string; sectionId: string }`

**Output:** `ActionResult<void>`

---

#### Reorder Quote Sections

**Action:** `reorderQuoteSections`

**Input:** `{ quoteId: string; orderedSectionIds: string[] }`

**Output:** `ActionResult<void>`

---

#### Add Quote Line Item

**Action:** `addQuoteLineItem`

**Input:**
```typescript
{
  quoteId: string;
  sectionId: string;
  name: string;
  content?: string;
  quantity: number;
  unitLabel?: string;
  unitPriceCents: number;
}
```

**Output:** `ActionResult<{ id: string }>`

---

#### Update Quote Line Item

**Action:** `updateQuoteLineItem`

**Input:** Line item fields (all optional except id)

**Output:** `ActionResult<void>`

---

#### Remove Quote Line Item

**Action:** `removeQuoteLineItem`

**Input:** `{ quoteId: string; lineItemId: string }`

**Output:** `ActionResult<void>`

---

#### Reorder Quote Line Items

**Action:** `reorderQuoteLineItems`

**Input:** `{ quoteId: string; sectionId: string; orderedLineItemIds: string[] }`

**Output:** `ActionResult<void>`

---

#### Correct Quote Data

**Action:** `correctQuoteData`

Admin correction for troubleshooting.

**Input:** Quote fields to correct

**Output:** `ActionResult<void>`

---

### Invoice Actions

#### Create Invoice From Quote

**Action:** `createInvoiceFromQuote`

**Input:** `{ quoteId: string }`

**Output:** `ActionResult<{ id: string; invoiceNumber: string }>`

---

#### Update Invoice

**Action:** `updateInvoice`

**Input:** Invoice fields to update

**Output:** `ActionResult<void>`

---

#### Reopen Invoice

**Action:** `reopenInvoice`

Allows editing a previously finalized invoice.

**Input:** `{ invoiceId: string }`

**Output:** `ActionResult<void>`

---

#### Correct Invoice Data

**Action:** `correctInvoiceData`

Admin correction for troubleshooting.

**Input:** Invoice fields to correct

**Output:** `ActionResult<void>`

---

### Studio Settings Actions

#### Update Studio Defaults

**Action:** `updateStudioDefaults`

**Input:**
```typescript
{
  studioName?: string;
  studioContactEmail?: string;
  studioContactPhone?: string;
  defaultQuoteTerms?: string;
  defaultInvoicePaymentInstructions?: string;
}
```

**Output:** `ActionResult<void>`

---

### Workspace Actions

#### Update Workspace Name

**Action:** `updateWorkspaceName`

**Input:** `{ name: string }`

**Output:** `ActionResult<void>`

---

## Action Result Pattern

All server actions return a standardized result envelope:

```typescript
type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string; code?: string };
```

**Usage:**
- Check `result.success` before accessing `result.data`
- Display `result.error` to user on failure
- Use `result.code` for programmatic error handling

---

## Authentication & Authorization

### Session Requirements

All server actions require an authenticated session:
- `requireSession()` - Ensures user is signed in
- `ensureStudioAccess()` - Ensures user belongs to studio

### Studio Scoping

All data operations are scoped to the user's studio via:
- `studioId` column on all entities
- Repository-level filtering
- Database indexes for performance

---

## Error Handling

### Expected Failures (ActionResult)

- Validation errors (Zod schema failures)
- Business rule violations (e.g., quote already invoiced)
- Not found errors (record doesn't exist)
- Authorization failures (wrong studio)

### Unexpected Errors (Throws)

- Database connection failures
- Code bugs
- Infrastructure issues

Unexpected errors are caught by error boundaries and logged to Sentry.
