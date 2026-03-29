# Component Inventory - Mento Admin

## Overview

Mento Admin uses a hybrid component architecture:
- **Shared UI primitives** in `src/components/ui/` - Base design system
- **Feature components** in `src/features/*/components/` - Domain-specific
- **App shell components** in `src/components/app-shell/` - Layout and navigation

---

## Shared UI Components

Location: `src/components/ui/`

### Button

**File:** `button.tsx`

Base button component with variants.

**Props:**
- `variant` - visual style (primary, secondary, ghost, etc.)
- `size` - button size
- Standard button attributes

---

### Card

**File:** `card.tsx`

Container component for content grouping.

**Components:**
- `Card` - Container
- `CardHeader` - Header section
- `CardTitle` - Title text
- `CardContent` - Body content

---

### Dialog

**File:** `dialog.tsx`

Modal dialog for overlays and confirmations.

**Components:**
- `Dialog` - Root container
- `DialogTrigger` - Opening trigger
- `DialogContent` - Modal content
- `DialogHeader` - Header section
- `DialogTitle` - Title
- `DialogDescription` - Subtitle text

---

### Input

**File:** `input.tsx`

Form text input with consistent styling.

**Features:**
- Focus-visible ring styling
- Accessible labels support
- Error state styling

---

### Textarea

**File:** `textarea.tsx`

Multi-line text input.

**Features:**
- Resizable
- Focus-visible ring styling
- Accessible labels support

---

### Table

**File:** `table.tsx`

Data table components.

**Components:**
- `Table` - Container
- `TableHeader` - Header section
- `TableBody` - Body section
- `TableRow` - Row
- `TableHead` - Header cell
- `TableCell` - Data cell

---

## App Shell Components

Location: `src/components/app-shell/`

### Navigation

**Components:**
- Workspace navigation sidebar
- Route links with active states
- Mobile responsive menu

### Feedback

Location: `src/components/feedback/`

**Components:**
- Loading states
- Error messages
- Success notifications
- Empty states

---

## Feature Components

### Auth Feature

Location: `src/features/auth/components/`

**Components:**
- Sign-in form
- Auth-required wrapper
- Session provider

### Clients Feature

Location: `src/features/clients/components/`

**Components:**
- `ClientForm` - Create/edit client
- `ClientList` - Browse clients
- `ClientDetail` - View client with related records

### Service Packages Feature

Location: `src/features/service-packages/components/`

**Components:**
- `ServicePackageForm` - Create/edit packages
- `ServicePackageList` - Library browser
- `ServicePackageDetail` - Package view
- Section and line item editors

### Quotes Feature

Location: `src/features/quotes/components/`

**Components:**
- `QuoteSetupForm` - Initial quote creation
- `QuoteEditor` - Full quote editing interface
- `QuoteEditorSection` - Section management
- `GenerateQuoteButton` - Content generation trigger
- `QuotePreview` - Client-facing preview
- `QuoteList` - Browse quotes
- `RevisionHistory` - View prior versions

**State Management:**
- Uses Zustand store (`quote-editor-store.ts`) for complex draft state

### Invoices Feature

Location: `src/features/invoices/components/`

**Components:**
- `InvoiceDetail` - View/edit invoice
- `InvoicePreview` - Client-facing layout
- `InvoiceList` - Browse invoices

### Studio Defaults Feature

Location: `src/features/studio-defaults/components/`

**Components:**
- `StudioDefaultsForm` - Settings editor

### Workspace Feature

Location: `src/features/workspace/components/`

**Components:**
- `WorkspaceShell` - Layout wrapper
- `WorkspaceOverview` - Dashboard view

### Record History Feature

Location: `src/features/record-history/components/`

**Components:**
- `RecordHistoryView` - Connected record chain display

### Corrections Feature

Location: `src/features/corrections/components/`

**Components:**
- Data correction forms for troubleshooting

### PDF Feature

Location: `src/features/pdf/components/`

**Components:**
- PDF generation utilities

---

## Component Patterns

### Form Pattern

Forms use a consistent pattern:
- Server Action integration
- Client-side validation with Zod
- Error display inline
- Success feedback

Example structure:
```tsx
function FeatureForm() {
  const [state, action, pending] = useActionState(serverAction, initial);
  
  return (
    <form action={action}>
      <Input name="field" />
      {state.error && <ErrorMessage>{state.error}</ErrorMessage>}
      <Button disabled={pending}>Submit</Button>
    </form>
  );
}
```

### List/Detail Pattern

Features follow a consistent list/detail flow:
1. **List page** - Browse with search/filter
2. **New page** - Create new record
3. **Detail page** - View/edit specific record

### Feature Organization

Each feature follows this structure:
```
src/features/feature-name/
├── components/       # React components
│   ├── component.tsx
│   └── component.test.tsx
├── server/          # Server-side code
│   ├── actions/     # Server actions
│   ├── queries/     # Data queries
│   └── repository/  # Database access
├── types/           # Feature types
└── lib/             # Feature utilities
```

---

## Testing

Components include colocated tests:
- **Unit tests:** `*.test.ts` with Vitest
- **Component tests:** `*.test.tsx` with React Testing Library
- **E2E tests:** `tests/e2e/*.spec.ts` with Playwright

**Test patterns:**
- Render with providers
- Query by role/label/text
- Assert on visible output
- Mock server dependencies
