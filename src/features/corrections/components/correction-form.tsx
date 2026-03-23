"use client";

import Link from "next/link";
import { type FormEvent, type KeyboardEvent, useCallback, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import type { InvoiceDetailRecord } from "@/features/invoices/types";
import type { QuoteDetailRecord } from "@/features/quotes/types";
import { formatCurrencyFromCents } from "@/lib/format/currency";
import { cn } from "@/lib/utils/cn";
import type { ActionResult } from "@/lib/validation/action-result";

type ClientOption = {
  id: string;
  name: string;
};

type QuoteCorrectionInput = {
  quoteId: string;
  corrections: {
    clientId: string;
    sections: Array<{
      id: string;
      title: string;
      description: string;
      lineItems: Array<{
        id: string;
        description: string;
        name: string;
        quantity: number;
        unitLabel: string;
        unitPriceCents: number;
      }>;
    }>;
    status?: "draft" | "accepted";
    terms: string;
  };
};

type InvoiceCorrectionInput = {
  invoiceId: string;
  corrections: {
    clientId: string;
    dates: {
      dueDate: string | null;
      issueDate: string | null;
    };
    paymentInstructions: string;
    sections: Array<{
      id: string;
      title: string;
      description: string;
      lineItems: Array<{
        id: string;
        description: string;
        name: string;
        quantity: number;
        unitLabel: string;
        unitPriceCents: number;
      }>;
    }>;
    status?: "draft" | "sent";
    terms: string;
  };
};

type CorrectionFormProps =
  | {
      mode: "quote";
      record: QuoteDetailRecord;
      clientOptions: ClientOption[];
      backHref: string;
      submitAction: (
        input: QuoteCorrectionInput,
      ) => Promise<ActionResult<{ quote: QuoteDetailRecord }>>;
    }
  | {
      mode: "invoice";
      record: InvoiceDetailRecord;
      clientOptions: ClientOption[];
      backHref: string;
      submitAction: (
        input: InvoiceCorrectionInput,
      ) => Promise<ActionResult<{ invoice: InvoiceDetailRecord }>>;
    };

type FormNotice = {
  tone: "success" | "error";
  title: string;
  message: string;
};

type FormLineItem = {
  id: string;
  name: string;
  description: string;
  quantity: number;
  tempId: string;
  unitLabel: string;
  unitPriceCents: number;
};

type FormSection = {
  id: string;
  description: string;
  lineItems: FormLineItem[];
  tempId: string;
  title: string;
};

type FormState = {
  clientId: string;
  dueDate: string;
  issueDate: string;
  paymentInstructions: string;
  sections: FormSection[];
  status: string;
  terms: string;
};

const SELECT_CLASS_NAME =
  "w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100 disabled:text-zinc-500";

function fieldClassName(hasError: boolean, alignRight = false) {
  return cn(
    hasError && "border-red-500 bg-red-50 focus-visible:outline-red-600",
    alignRight && "text-right tabular-nums",
  );
}

function toFormState(props: CorrectionFormProps): FormState {
  if (props.mode === "quote") {
    return {
      clientId: props.record.clientId,
      dueDate: "",
      issueDate: "",
      paymentInstructions: "",
      sections: props.record.sections.map((section) => ({
        id: section.id,
        description: section.content,
        lineItems: section.lineItems.map((lineItem) => ({
          id: lineItem.id,
          name: lineItem.name,
          description: lineItem.content,
          quantity: lineItem.quantity,
          tempId: lineItem.id,
          unitLabel: lineItem.unitLabel,
          unitPriceCents: lineItem.unitPriceCents,
        })),
        tempId: section.id,
        title: section.title,
      })),
      status: props.record.status,
      terms: props.record.terms,
    };
  }

  return {
    clientId: props.record.clientId,
    dueDate: props.record.dueDate?.slice(0, 10) ?? "",
    issueDate: props.record.issueDate?.slice(0, 10) ?? "",
    paymentInstructions: props.record.paymentInstructions,
    sections: props.record.sections.map((section) => ({
      id: section.id,
      description: section.content,
      lineItems: section.lineItems.map((lineItem) => ({
        id: lineItem.id,
        name: lineItem.name,
        description: lineItem.content,
        quantity: lineItem.quantity,
        tempId: lineItem.id,
        unitLabel: lineItem.unitLabel,
        unitPriceCents: lineItem.unitPriceCents,
      })),
      tempId: section.id,
      title: section.title,
    })),
    status: props.record.status,
    terms: props.record.terms,
  };
}

function StatusNotice({ tone, title, message }: FormNotice) {
  const styles =
    tone === "success"
      ? "border-green-300 bg-green-50 text-green-900"
      : "border-red-300 bg-red-50 text-red-900";

  return (
    <section
      role={tone === "success" ? "status" : "alert"}
      className={`rounded-lg border px-4 py-3 text-sm ${styles}`}
    >
      <p className="font-semibold">{title}</p>
      <p className="mt-1">{message}</p>
    </section>
  );
}

function FieldError({ id, message }: { id: string; message: string | null }) {
  if (!message) {
    return null;
  }

  return (
    <p id={id} className="text-xs font-medium text-red-700">
      {message}
    </p>
  );
}

function calculateTotalCents(sections: FormSection[]): number {
  return sections.reduce((total, section) => {
    return (
      total +
      section.lineItems.reduce((sectionTotal, item) => {
        return sectionTotal + item.quantity * item.unitPriceCents;
      }, 0)
    );
  }, 0);
}

function buildQuoteInput(
  quoteId: string,
  formValues: FormState,
): QuoteCorrectionInput {
  return {
    quoteId,
    corrections: {
      clientId: formValues.clientId,
      sections: formValues.sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        lineItems: section.lineItems.map((lineItem) => ({
          id: lineItem.id,
          description: lineItem.description,
          name: lineItem.name,
          quantity: lineItem.quantity,
          unitLabel: lineItem.unitLabel,
          unitPriceCents: lineItem.unitPriceCents,
        })),
      })),
      status:
        formValues.status === "draft" || formValues.status === "accepted"
          ? formValues.status
          : undefined,
      terms: formValues.terms,
    },
  };
}

function buildInvoiceInput(
  invoiceId: string,
  formValues: FormState,
): InvoiceCorrectionInput {
  return {
    invoiceId,
    corrections: {
      clientId: formValues.clientId,
      dates: {
        dueDate: formValues.dueDate || null,
        issueDate: formValues.issueDate || null,
      },
      paymentInstructions: formValues.paymentInstructions,
      sections: formValues.sections.map((section) => ({
        id: section.id,
        title: section.title,
        description: section.description,
        lineItems: section.lineItems.map((lineItem) => ({
          id: lineItem.id,
          description: lineItem.description,
          name: lineItem.name,
          quantity: lineItem.quantity,
          unitLabel: lineItem.unitLabel,
          unitPriceCents: lineItem.unitPriceCents,
        })),
      })),
      status:
        formValues.status === "draft" || formValues.status === "sent"
          ? formValues.status
          : undefined,
      terms: formValues.terms,
    },
  };
}

export function CorrectionForm(props: CorrectionFormProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<FormState>(() => toFormState(props));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [notice, setNotice] = useState<FormNotice | null>(null);
  const [isPending, startTransition] = useTransition();

  const totalCents = useMemo(
    () => calculateTotalCents(formValues.sections),
    [formValues.sections],
  );
  const isTerminalStatus =
    props.mode === "quote"
      ? props.record.status === "invoiced"
      : props.record.status === "paid";

  const getError = useCallback(
    (fieldKey: string) => fieldErrors[fieldKey]?.[0] ?? null,
    [fieldErrors],
  );

  function updateField(
    field: Exclude<keyof FormState, "sections">,
    value: string,
  ) {
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function updateSectionField(
    sectionTempId: string,
    field: "title" | "description",
    value: string,
  ) {
    setFormValues((previous) => ({
      ...previous,
      sections: previous.sections.map((section) =>
        section.tempId === sectionTempId ? { ...section, [field]: value } : section,
      ),
    }));
  }

  function updateLineItemField(
    sectionTempId: string,
    lineItemTempId: string,
    field: keyof FormLineItem,
    value: string | number,
  ) {
    setFormValues((previous) => ({
      ...previous,
      sections: previous.sections.map((section) =>
        section.tempId !== sectionTempId
          ? section
          : {
              ...section,
              lineItems: section.lineItems.map((lineItem) =>
                lineItem.tempId === lineItemTempId
                  ? { ...lineItem, [field]: value }
                  : lineItem,
              ),
            },
      ),
    }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      if (props.mode === "quote") {
        const result = await props.submitAction(
          buildQuoteInput(props.record.id, formValues),
        );

        if (result.ok) {
          setFormValues(toFormState({ ...props, record: result.data.quote }));
          setFieldErrors({});
          setNotice({
            tone: "success",
            title: "Corrections saved",
            message: "The record was updated and totals were recalculated.",
          });
          router.refresh();
          return;
        }

        setFieldErrors(result.error.fieldErrors ?? {});
        setNotice({
          tone: "error",
          title: "Could not save corrections",
          message: result.error.message,
        });
        return;
      }

      const result = await props.submitAction(
        buildInvoiceInput(props.record.id, formValues),
      );

      if (result.ok) {
        setFormValues(toFormState({ ...props, record: result.data.invoice }));
        setFieldErrors({});
        setNotice({
          tone: "success",
          title: "Corrections saved",
          message: "The record was updated and totals were recalculated.",
        });
        router.refresh();
        return;
      }

      setFieldErrors(result.error.fieldErrors ?? {});
      setNotice({
        tone: "error",
        title: "Could not save corrections",
        message: result.error.message,
      });
    });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLFormElement>) {
    if (event.key !== "Enter" || event.defaultPrevented || event.shiftKey) {
      return;
    }

    const target = event.target;

    if (
      target instanceof HTMLInputElement ||
      target instanceof HTMLSelectElement
    ) {
      event.preventDefault();
      event.currentTarget.requestSubmit();
    }
  }

  return (
    <form className="space-y-6" onKeyDown={handleKeyDown} onSubmit={handleSubmit} noValidate>
      {notice ? <StatusNotice {...notice} /> : null}

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <CardTitle>
                {props.mode === "quote" ? "Correct quote data" : "Correct invoice data"}
              </CardTitle>
              <CardDescription>
                Update the live record directly, preserve continuity, and confirm totals before returning to the workflow.
              </CardDescription>
            </div>
            <Link
              href={props.backHref}
              className="inline-flex items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
            >
              Back to record
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="correction-client" className="text-sm font-medium text-zinc-900">
                Client
              </label>
              <select
                id="correction-client"
                value={formValues.clientId}
                onChange={(event) => updateField("clientId", event.target.value)}
                aria-invalid={Boolean(getError("corrections.clientId")) ? true : undefined}
                aria-describedby={
                  getError("corrections.clientId") ? "correction-client-error" : undefined
                }
                className={cn(SELECT_CLASS_NAME, fieldClassName(Boolean(getError("corrections.clientId"))))}
              >
                {props.clientOptions.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
              <FieldError id="correction-client-error" message={getError("corrections.clientId")} />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="correction-status" className="text-sm font-medium text-zinc-900">
                {props.mode === "quote" ? "Quote status" : "Invoice status"}
              </label>
              <select
                id="correction-status"
                value={formValues.status}
                onChange={(event) => updateField("status", event.target.value)}
                disabled={isTerminalStatus}
                className={SELECT_CLASS_NAME}
              >
                {props.mode === "quote" ? (
                  isTerminalStatus ? (
                    <option value="invoiced">invoiced</option>
                  ) : (
                    <>
                      <option value="draft">draft</option>
                      <option value="accepted">accepted</option>
                    </>
                  )
                ) : isTerminalStatus ? (
                  <option value="paid">paid</option>
                ) : (
                  <>
                    <option value="draft">draft</option>
                    <option value="sent">sent</option>
                  </>
                )}
              </select>
              {isTerminalStatus ? (
                <p className="text-xs text-zinc-500">
                  {props.mode === "quote"
                    ? "Invoiced quotes keep their current lifecycle status during correction."
                    : "Paid invoices keep their current lifecycle status during correction."}
                </p>
              ) : null}
            </div>

            {props.mode === "invoice" ? (
              <>
                <div className="space-y-1.5">
                  <label htmlFor="correction-issue-date" className="text-sm font-medium text-zinc-900">
                    Issue date
                  </label>
                  <Input
                    id="correction-issue-date"
                    type="date"
                    value={formValues.issueDate}
                    onChange={(event) => updateField("issueDate", event.target.value)}
                    aria-invalid={Boolean(getError("corrections.dates.issueDate")) ? true : undefined}
                    aria-describedby={
                      getError("corrections.dates.issueDate")
                        ? "correction-issue-date-error"
                        : undefined
                    }
                    className={fieldClassName(Boolean(getError("corrections.dates.issueDate")))}
                  />
                  <FieldError
                    id="correction-issue-date-error"
                    message={getError("corrections.dates.issueDate")}
                  />
                </div>

                <div className="space-y-1.5">
                  <label htmlFor="correction-due-date" className="text-sm font-medium text-zinc-900">
                    Due date
                  </label>
                  <Input
                    id="correction-due-date"
                    type="date"
                    value={formValues.dueDate}
                    onChange={(event) => updateField("dueDate", event.target.value)}
                    aria-invalid={Boolean(getError("corrections.dates.dueDate")) ? true : undefined}
                    aria-describedby={
                      getError("corrections.dates.dueDate")
                        ? "correction-due-date-error"
                        : undefined
                    }
                    className={fieldClassName(Boolean(getError("corrections.dates.dueDate")))}
                  />
                  <FieldError
                    id="correction-due-date-error"
                    message={getError("corrections.dates.dueDate")}
                  />
                </div>
              </>
            ) : null}

            {props.mode === "invoice" ? (
              <div className="space-y-1.5 lg:col-span-2">
                <label htmlFor="correction-payment-instructions" className="text-sm font-medium text-zinc-900">
                  Payment instructions
                </label>
                <Textarea
                  id="correction-payment-instructions"
                  rows={3}
                  value={formValues.paymentInstructions}
                  onChange={(event) => updateField("paymentInstructions", event.target.value)}
                  aria-invalid={Boolean(getError("corrections.paymentInstructions")) ? true : undefined}
                  aria-describedby={
                    getError("corrections.paymentInstructions")
                      ? "correction-payment-instructions-error"
                      : undefined
                  }
                  className={fieldClassName(Boolean(getError("corrections.paymentInstructions")))}
                />
                <FieldError
                  id="correction-payment-instructions-error"
                  message={getError("corrections.paymentInstructions")}
                />
              </div>
            ) : null}

            <div className="space-y-1.5 lg:col-span-2">
              <label htmlFor="correction-terms" className="text-sm font-medium text-zinc-900">
                Terms
              </label>
              <Textarea
                id="correction-terms"
                rows={3}
                value={formValues.terms}
                onChange={(event) => updateField("terms", event.target.value)}
                aria-invalid={Boolean(getError("corrections.terms")) ? true : undefined}
                aria-describedby={getError("corrections.terms") ? "correction-terms-error" : undefined}
                className={fieldClassName(Boolean(getError("corrections.terms")))}
              />
              <FieldError id="correction-terms-error" message={getError("corrections.terms")} />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Sections and line items
              </p>
              <p className="mt-1 text-sm text-zinc-600">
                Adjust wording, quantities, pricing, and scope details inline without creating a duplicate record.
              </p>
            </div>

            {formValues.sections.map((section, sectionIndex) => {
              const sectionTitleError = getError(`corrections.sections.${sectionIndex}.title`);
              const sectionDescriptionError = getError(
                `corrections.sections.${sectionIndex}.description`,
              );

              return (
                <Card key={section.tempId} className="bg-zinc-50">
                  <CardHeader>
                    <CardTitle>Section {sectionIndex + 1}</CardTitle>
                    <CardDescription>
                      Refine the section copy and any billing rows attached to it.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-1.5">
                        <label htmlFor={`section-title-${section.tempId}`} className="text-sm font-medium text-zinc-900">
                          Section title
                        </label>
                        <Input
                          id={`section-title-${section.tempId}`}
                          value={section.title}
                          onChange={(event) =>
                            updateSectionField(section.tempId, "title", event.target.value)
                          }
                          aria-invalid={Boolean(sectionTitleError) ? true : undefined}
                          aria-describedby={
                            sectionTitleError ? `section-title-error-${section.tempId}` : undefined
                          }
                          className={fieldClassName(Boolean(sectionTitleError))}
                        />
                        <FieldError
                          id={`section-title-error-${section.tempId}`}
                          message={sectionTitleError}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <label htmlFor={`section-description-${section.tempId}`} className="text-sm font-medium text-zinc-900">
                          Section description
                        </label>
                        <Textarea
                          id={`section-description-${section.tempId}`}
                          rows={3}
                          value={section.description}
                          onChange={(event) =>
                            updateSectionField(section.tempId, "description", event.target.value)
                          }
                          aria-invalid={Boolean(sectionDescriptionError) ? true : undefined}
                          aria-describedby={
                            sectionDescriptionError
                              ? `section-description-error-${section.tempId}`
                              : undefined
                          }
                          className={fieldClassName(Boolean(sectionDescriptionError))}
                        />
                        <FieldError
                          id={`section-description-error-${section.tempId}`}
                          message={sectionDescriptionError}
                        />
                      </div>
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead>Details</TableHead>
                          <TableHead className="text-right">Qty</TableHead>
                          <TableHead className="text-right">Unit</TableHead>
                          <TableHead className="text-right">Unit price</TableHead>
                          <TableHead className="text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {section.lineItems.map((lineItem, lineItemIndex) => {
                          const basePath = `corrections.sections.${sectionIndex}.lineItems.${lineItemIndex}`;
                          const nameError = getError(`${basePath}.name`);
                          const descriptionError = getError(`${basePath}.description`);
                          const quantityError = getError(`${basePath}.quantity`);
                          const unitLabelError = getError(`${basePath}.unitLabel`);
                          const unitPriceError = getError(`${basePath}.unitPriceCents`);

                          return (
                            <TableRow key={lineItem.tempId}>
                              <TableCell>
                                <div className="space-y-1.5">
                                  <label className="sr-only" htmlFor={`line-item-name-${lineItem.tempId}`}>
                                    Line item name
                                  </label>
                                  <Input
                                    id={`line-item-name-${lineItem.tempId}`}
                                    value={lineItem.name}
                                    onChange={(event) =>
                                      updateLineItemField(
                                        section.tempId,
                                        lineItem.tempId,
                                        "name",
                                        event.target.value,
                                      )
                                    }
                                    aria-label="Line item name"
                                    aria-invalid={Boolean(nameError) ? true : undefined}
                                    aria-describedby={
                                      nameError ? `line-item-name-error-${lineItem.tempId}` : undefined
                                    }
                                    className={fieldClassName(Boolean(nameError))}
                                  />
                                  <FieldError
                                    id={`line-item-name-error-${lineItem.tempId}`}
                                    message={nameError}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1.5">
                                  <label className="sr-only" htmlFor={`line-item-description-${lineItem.tempId}`}>
                                    Line item description
                                  </label>
                                  <Textarea
                                    id={`line-item-description-${lineItem.tempId}`}
                                    rows={2}
                                    value={lineItem.description}
                                    onChange={(event) =>
                                      updateLineItemField(
                                        section.tempId,
                                        lineItem.tempId,
                                        "description",
                                        event.target.value,
                                      )
                                    }
                                    aria-label="Line item description"
                                    aria-invalid={Boolean(descriptionError) ? true : undefined}
                                    aria-describedby={
                                      descriptionError
                                        ? `line-item-description-error-${lineItem.tempId}`
                                        : undefined
                                    }
                                    className={fieldClassName(Boolean(descriptionError))}
                                  />
                                  <FieldError
                                    id={`line-item-description-error-${lineItem.tempId}`}
                                    message={descriptionError}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1.5">
                                  <label className="sr-only" htmlFor={`line-item-quantity-${lineItem.tempId}`}>
                                    Quantity
                                  </label>
                                  <Input
                                    id={`line-item-quantity-${lineItem.tempId}`}
                                    type="number"
                                    min={1}
                                    step={1}
                                    value={String(lineItem.quantity)}
                                    onChange={(event) =>
                                      updateLineItemField(
                                        section.tempId,
                                        lineItem.tempId,
                                        "quantity",
                                        Number(event.target.value) || 0,
                                      )
                                    }
                                    aria-label="Quantity"
                                    aria-invalid={Boolean(quantityError) ? true : undefined}
                                    aria-describedby={
                                      quantityError
                                        ? `line-item-quantity-error-${lineItem.tempId}`
                                        : undefined
                                    }
                                    className={fieldClassName(Boolean(quantityError), true)}
                                  />
                                  <FieldError
                                    id={`line-item-quantity-error-${lineItem.tempId}`}
                                    message={quantityError}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1.5">
                                  <label className="sr-only" htmlFor={`line-item-unit-label-${lineItem.tempId}`}>
                                    Unit label
                                  </label>
                                  <Input
                                    id={`line-item-unit-label-${lineItem.tempId}`}
                                    value={lineItem.unitLabel}
                                    onChange={(event) =>
                                      updateLineItemField(
                                        section.tempId,
                                        lineItem.tempId,
                                        "unitLabel",
                                        event.target.value,
                                      )
                                    }
                                    aria-label="Unit label"
                                    aria-invalid={Boolean(unitLabelError) ? true : undefined}
                                    aria-describedby={
                                      unitLabelError
                                        ? `line-item-unit-label-error-${lineItem.tempId}`
                                        : undefined
                                    }
                                    className={fieldClassName(Boolean(unitLabelError))}
                                  />
                                  <FieldError
                                    id={`line-item-unit-label-error-${lineItem.tempId}`}
                                    message={unitLabelError}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="space-y-1.5">
                                  <label className="sr-only" htmlFor={`line-item-price-${lineItem.tempId}`}>
                                    Unit price in dollars
                                  </label>
                                  <Input
                                    id={`line-item-price-${lineItem.tempId}`}
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={(lineItem.unitPriceCents / 100).toFixed(2)}
                                    onChange={(event) =>
                                      updateLineItemField(
                                        section.tempId,
                                        lineItem.tempId,
                                        "unitPriceCents",
                                        Math.max(
                                          0,
                                          Math.round((Number(event.target.value) || 0) * 100),
                                        ),
                                      )
                                    }
                                    aria-label="Unit price in dollars"
                                    aria-invalid={Boolean(unitPriceError) ? true : undefined}
                                    aria-describedby={
                                      unitPriceError
                                        ? `line-item-price-error-${lineItem.tempId}`
                                        : undefined
                                    }
                                    className={fieldClassName(Boolean(unitPriceError), true)}
                                  />
                                  <FieldError
                                    id={`line-item-price-error-${lineItem.tempId}`}
                                    message={unitPriceError}
                                  />
                                </div>
                              </TableCell>
                              <TableCell className="text-right font-medium text-zinc-900">
                                {formatCurrencyFromCents(
                                  lineItem.quantity * lineItem.unitPriceCents,
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                Recalculated total
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                Total {formatCurrencyFromCents(totalCents)}
              </p>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving corrections..." : "Save corrections"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
