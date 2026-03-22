"use client";

import { type FormEvent, useCallback, useMemo, useState, useTransition } from "react";
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
import type { UpdateInvoiceFormInput } from "@/features/invoices/server/actions/update-invoice";
import type { InvoiceDetailRecord } from "@/features/invoices/types";
import { randomId } from "@/lib/utils/random-id";
import { cn } from "@/lib/utils/cn";
import type { ActionResult } from "@/lib/validation/action-result";

type InvoiceFormNotice = {
  tone: "success" | "error";
  title: string;
  message: string;
};

type InvoiceFormProps = {
  invoice: InvoiceDetailRecord;
  submitAction: (
    input: UpdateInvoiceFormInput,
  ) => Promise<ActionResult<{ invoice: InvoiceDetailRecord }>>;
};

type FormLineItem = {
  tempId: string;
  id?: string;
  name: string;
  content: string;
  quantity: number;
  unitLabel: string;
  unitPriceCents: number;
  position: number;
};

type FormSection = {
  tempId: string;
  id?: string;
  title: string;
  content: string;
  position: number;
  lineItems: FormLineItem[];
};

type FormState = {
  title: string;
  issueDate: string;
  dueDate: string;
  terms: string;
  paymentInstructions: string;
  sections: FormSection[];
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatUnitPriceValue(cents: number): string {
  return (cents / 100).toFixed(2);
}

function parseUnitPriceValue(value: string): number {
  const parsed = Number.parseFloat(value);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed * 100);
}

function calculateTotal(sections: FormSection[]): number {
  return sections.reduce((total, section) => {
    return total + section.lineItems.reduce((sectionTotal, item) => {
      return sectionTotal + item.quantity * item.unitPriceCents;
    }, 0);
  }, 0);
}

function toFormState(invoice: InvoiceDetailRecord): FormState {
  return {
    title: invoice.title,
    issueDate: invoice.issueDate?.slice(0, 10) ?? "",
    dueDate: invoice.dueDate?.slice(0, 10) ?? "",
    terms: invoice.terms,
    paymentInstructions: invoice.paymentInstructions,
    sections: invoice.sections.map((section) => ({
      tempId: section.id,
      id: section.id,
      title: section.title,
      content: section.content,
      position: section.position,
      lineItems: section.lineItems.map((item) => ({
        tempId: item.id,
        id: item.id,
        name: item.name,
        content: item.content,
        quantity: item.quantity,
        unitLabel: item.unitLabel,
        unitPriceCents: item.unitPriceCents,
        position: item.position,
      })),
    })),
  };
}

function StatusNotice({ tone, title, message }: InvoiceFormNotice) {
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

function fieldClassName(hasError: boolean, alignRight = false) {
  return cn(
    hasError && "border-red-500 bg-red-50 focus-visible:outline-red-600",
    alignRight && "text-right tabular-nums",
  );
}

export function InvoiceForm({ invoice, submitAction }: InvoiceFormProps) {
  const router = useRouter();
  const [formValues, setFormValues] = useState<FormState>(() => toFormState(invoice));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [notice, setNotice] = useState<InvoiceFormNotice | null>(null);
  const [isPending, startTransition] = useTransition();

  const isReadOnly = invoice.status !== "draft";
  const totalCents = useMemo(() => calculateTotal(formValues.sections), [formValues.sections]);

  const getError = useCallback(
    (fieldKey: string) => fieldErrors[fieldKey]?.[0] ?? null,
    [fieldErrors],
  );

  const updateField = useCallback((field: keyof FormState, value: string) => {
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }));
  }, []);

  const updateSectionField = useCallback(
    (sectionTempId: string, field: "title" | "content", value: string) => {
      setFormValues((previous) => ({
        ...previous,
        sections: previous.sections.map((section) =>
          section.tempId === sectionTempId ? { ...section, [field]: value } : section,
        ),
      }));
    },
    [],
  );

  const updateLineItemField = useCallback(
    (
      sectionTempId: string,
      lineItemTempId: string,
      field: keyof FormLineItem,
      value: string | number,
    ) => {
      setFormValues((previous) => ({
        ...previous,
        sections: previous.sections.map((section) =>
          section.tempId !== sectionTempId
            ? section
            : {
                ...section,
                lineItems: section.lineItems.map((item) =>
                  item.tempId === lineItemTempId ? { ...item, [field]: value } : item,
                ),
              },
        ),
      }));
    },
    [],
  );

  const addSection = useCallback(() => {
    setFormValues((previous) => ({
      ...previous,
      sections: [
        ...previous.sections,
        {
          tempId: randomId(),
          title: "",
          content: "",
          position: previous.sections.length,
          lineItems: [],
        },
      ],
    }));
  }, []);

  const removeSection = useCallback((sectionTempId: string) => {
    setFormValues((previous) => ({
      ...previous,
      sections: previous.sections
        .filter((section) => section.tempId !== sectionTempId)
        .map((section, index) => ({ ...section, position: index })),
    }));
  }, []);

  const addLineItem = useCallback((sectionTempId: string) => {
    setFormValues((previous) => ({
      ...previous,
      sections: previous.sections.map((section) =>
        section.tempId !== sectionTempId
          ? section
          : {
              ...section,
              lineItems: [
                ...section.lineItems,
                {
                  tempId: randomId(),
                  name: "",
                  content: "",
                  quantity: 1,
                  unitLabel: "",
                  unitPriceCents: 0,
                  position: section.lineItems.length,
                },
              ],
            },
      ),
    }));
  }, []);

  const removeLineItem = useCallback((sectionTempId: string, lineItemTempId: string) => {
    setFormValues((previous) => ({
      ...previous,
      sections: previous.sections.map((section) =>
        section.tempId !== sectionTempId
          ? section
          : {
              ...section,
              lineItems: section.lineItems
                .filter((item) => item.tempId !== lineItemTempId)
                .map((item, index) => ({ ...item, position: index })),
            },
      ),
    }));
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isReadOnly) {
      return;
    }

    setHasAttemptedSubmit(true);

    startTransition(async () => {
      const input: UpdateInvoiceFormInput = {
        invoiceId: invoice.id,
        title: formValues.title,
        issueDate: formValues.issueDate || null,
        dueDate: formValues.dueDate || null,
        terms: formValues.terms,
        paymentInstructions: formValues.paymentInstructions,
        sections: formValues.sections.map((section) => ({
          id: section.id,
          title: section.title,
          content: section.content,
          position: section.position,
          lineItems: section.lineItems.map((item) => ({
            id: item.id,
            name: item.name,
            content: item.content,
            quantity: item.quantity,
            unitLabel: item.unitLabel,
            unitPriceCents: item.unitPriceCents,
            position: item.position,
          })),
        })),
      };

      const result = await submitAction(input);

      if (result.ok) {
        setFormValues(toFormState(result.data.invoice));
        setFieldErrors({});
        setHasAttemptedSubmit(false);
        setNotice({
          tone: "success",
          title: "Invoice saved",
          message: "Changes have been saved to the invoice draft.",
        });
        router.refresh();
        return;
      }

      setFieldErrors(result.error.fieldErrors ?? {});
      setNotice({
        tone: "error",
        title: "Could not save invoice",
        message: result.error.message,
      });
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {notice ? <StatusNotice {...notice} /> : null}

      {isReadOnly ? (
        <StatusNotice
          tone="error"
          title="Invoice is not in draft status"
          message="Editing is only available for draft invoices."
        />
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{invoice.status === "draft" ? "Edit invoice" : "Invoice details"}</CardTitle>
          <CardDescription>
            Update invoice fields, sections, and line items with immediate totals feedback.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className="space-y-1.5">
              <label htmlFor="invoice-title" className="text-sm font-medium text-zinc-900">
                Invoice title
              </label>
              <Input
                id="invoice-title"
                name="title"
                value={formValues.title}
                onChange={(event) => updateField("title", event.target.value)}
                disabled={isReadOnly}
                aria-invalid={hasAttemptedSubmit && Boolean(getError("title")) ? true : undefined}
                aria-describedby={getError("title") ? "title-error" : undefined}
                className={fieldClassName(Boolean(getError("title")))}
              />
              <FieldError id="title-error" message={getError("title")} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <label htmlFor="invoice-issue-date" className="text-sm font-medium text-zinc-900">
                  Issue date
                </label>
                <Input
                  id="invoice-issue-date"
                  name="issueDate"
                  type="date"
                  value={formValues.issueDate}
                  onChange={(event) => updateField("issueDate", event.target.value)}
                  disabled={isReadOnly}
                  aria-invalid={hasAttemptedSubmit && Boolean(getError("issueDate")) ? true : undefined}
                  aria-describedby={getError("issueDate") ? "issue-date-error" : undefined}
                  className={fieldClassName(Boolean(getError("issueDate")))}
                />
                <FieldError id="issue-date-error" message={getError("issueDate")} />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="invoice-due-date" className="text-sm font-medium text-zinc-900">
                  Due date
                </label>
                <Input
                  id="invoice-due-date"
                  name="dueDate"
                  type="date"
                  value={formValues.dueDate}
                  onChange={(event) => updateField("dueDate", event.target.value)}
                  disabled={isReadOnly}
                  aria-invalid={hasAttemptedSubmit && Boolean(getError("dueDate")) ? true : undefined}
                  aria-describedby={getError("dueDate") ? "due-date-error" : undefined}
                  className={fieldClassName(Boolean(getError("dueDate")))}
                />
                <FieldError id="due-date-error" message={getError("dueDate")} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label
                htmlFor="invoice-payment-instructions"
                className="text-sm font-medium text-zinc-900"
              >
                Payment instructions
              </label>
              <Textarea
                id="invoice-payment-instructions"
                name="paymentInstructions"
                rows={4}
                value={formValues.paymentInstructions}
                onChange={(event) => updateField("paymentInstructions", event.target.value)}
                disabled={isReadOnly}
                aria-invalid={
                  hasAttemptedSubmit && Boolean(getError("paymentInstructions")) ? true : undefined
                }
                aria-describedby={
                  getError("paymentInstructions") ? "payment-instructions-error" : undefined
                }
                className={fieldClassName(Boolean(getError("paymentInstructions")))}
              />
              <FieldError
                id="payment-instructions-error"
                message={getError("paymentInstructions")}
              />
            </div>

            <div className="space-y-1.5">
              <label htmlFor="invoice-terms" className="text-sm font-medium text-zinc-900">
                Terms
              </label>
              <Textarea
                id="invoice-terms"
                name="terms"
                rows={4}
                value={formValues.terms}
                onChange={(event) => updateField("terms", event.target.value)}
                disabled={isReadOnly}
                aria-invalid={hasAttemptedSubmit && Boolean(getError("terms")) ? true : undefined}
                aria-describedby={getError("terms") ? "terms-error" : undefined}
                className={fieldClassName(Boolean(getError("terms")))}
              />
              <FieldError id="terms-error" message={getError("terms")} />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                  Sections and line items
                </p>
                <FieldError id="sections-error" message={getError("sections") ?? getError("form")} />
              </div>
              {!isReadOnly ? (
                <Button variant="outline" size="sm" onClick={addSection}>
                  Add section
                </Button>
              ) : null}
            </div>

            {formValues.sections.length === 0 ? (
              <p className="text-sm text-zinc-500">
                No sections. {isReadOnly ? "" : 'Click "Add section" to begin.'}
              </p>
            ) : (
              <div className="space-y-4">
                {formValues.sections.map((section, sectionIndex) => {
                  const sectionTitleError = getError(`sections.${sectionIndex}.title`);
                  const sectionContentError = getError(`sections.${sectionIndex}.content`);

                  return (
                    <Card key={section.tempId} className="bg-zinc-50">
                      <CardHeader className="flex flex-row items-start justify-between gap-3 space-y-0">
                        <div className="space-y-1">
                          <CardTitle>Section {sectionIndex + 1}</CardTitle>
                          <CardDescription>
                            Edit section copy and the billing rows that contribute to the invoice total.
                          </CardDescription>
                        </div>
                        {!isReadOnly ? (
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => removeSection(section.tempId)}
                            aria-label={`Remove section ${section.title || "untitled"}`}
                          >
                            Remove section
                          </Button>
                        ) : null}
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 sm:grid-cols-2">
                          <div className="space-y-1.5">
                            <label
                              htmlFor={`section-title-${section.tempId}`}
                              className="text-sm font-medium text-zinc-900"
                            >
                              Section title
                            </label>
                            <Input
                              id={`section-title-${section.tempId}`}
                              value={section.title}
                              onChange={(event) =>
                                updateSectionField(section.tempId, "title", event.target.value)
                              }
                              disabled={isReadOnly}
                              aria-invalid={
                                hasAttemptedSubmit && Boolean(sectionTitleError) ? true : undefined
                              }
                              aria-describedby={
                                sectionTitleError
                                  ? `section-title-error-${section.tempId}`
                                  : undefined
                              }
                              className={fieldClassName(Boolean(sectionTitleError))}
                            />
                            <FieldError
                              id={`section-title-error-${section.tempId}`}
                              message={sectionTitleError}
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label
                              htmlFor={`section-content-${section.tempId}`}
                              className="text-sm font-medium text-zinc-900"
                            >
                              Section notes
                            </label>
                            <Textarea
                              id={`section-content-${section.tempId}`}
                              rows={3}
                              value={section.content}
                              onChange={(event) =>
                                updateSectionField(section.tempId, "content", event.target.value)
                              }
                              disabled={isReadOnly}
                              aria-invalid={
                                hasAttemptedSubmit && Boolean(sectionContentError) ? true : undefined
                              }
                              aria-describedby={
                                sectionContentError
                                  ? `section-content-error-${section.tempId}`
                                  : undefined
                              }
                              className={fieldClassName(Boolean(sectionContentError))}
                            />
                            <FieldError
                              id={`section-content-error-${section.tempId}`}
                              message={sectionContentError}
                            />
                          </div>
                        </div>

                        {section.lineItems.length > 0 ? (
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Item</TableHead>
                                <TableHead>Details</TableHead>
                                <TableHead className="text-right">Qty</TableHead>
                                <TableHead className="text-right">Unit</TableHead>
                                <TableHead className="text-right">Unit price</TableHead>
                                <TableHead className="text-right">Total</TableHead>
                                {!isReadOnly ? <TableHead className="w-28 text-right">Actions</TableHead> : null}
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {section.lineItems.map((item, lineItemIndex) => {
                                const nameError = getError(
                                  `sections.${sectionIndex}.lineItems.${lineItemIndex}.name`,
                                );
                                const contentError = getError(
                                  `sections.${sectionIndex}.lineItems.${lineItemIndex}.content`,
                                );
                                const quantityError = getError(
                                  `sections.${sectionIndex}.lineItems.${lineItemIndex}.quantity`,
                                );
                                const unitLabelError = getError(
                                  `sections.${sectionIndex}.lineItems.${lineItemIndex}.unitLabel`,
                                );
                                const unitPriceError = getError(
                                  `sections.${sectionIndex}.lineItems.${lineItemIndex}.unitPriceCents`,
                                );

                                return (
                                  <TableRow key={item.tempId}>
                                    <TableCell>
                                      <div className="space-y-1.5">
                                        <label className="sr-only" htmlFor={`line-item-name-${item.tempId}`}>
                                          Line item name
                                        </label>
                                        <Input
                                          id={`line-item-name-${item.tempId}`}
                                          value={item.name}
                                          onChange={(event) =>
                                            updateLineItemField(
                                              section.tempId,
                                              item.tempId,
                                              "name",
                                              event.target.value,
                                            )
                                          }
                                          disabled={isReadOnly}
                                          placeholder="Line item name"
                                          aria-label="Line item name"
                                          aria-invalid={
                                            hasAttemptedSubmit && Boolean(nameError) ? true : undefined
                                          }
                                          aria-describedby={
                                            nameError ? `line-item-name-error-${item.tempId}` : undefined
                                          }
                                          className={fieldClassName(Boolean(nameError))}
                                        />
                                        <FieldError
                                          id={`line-item-name-error-${item.tempId}`}
                                          message={nameError}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1.5">
                                        <label
                                          className="sr-only"
                                          htmlFor={`line-item-content-${item.tempId}`}
                                        >
                                          Line item description
                                        </label>
                                        <Textarea
                                          id={`line-item-content-${item.tempId}`}
                                          rows={2}
                                          value={item.content}
                                          onChange={(event) =>
                                            updateLineItemField(
                                              section.tempId,
                                              item.tempId,
                                              "content",
                                              event.target.value,
                                            )
                                          }
                                          disabled={isReadOnly}
                                          placeholder="Description"
                                          aria-label="Line item description"
                                          aria-invalid={
                                            hasAttemptedSubmit && Boolean(contentError)
                                              ? true
                                              : undefined
                                          }
                                          aria-describedby={
                                            contentError
                                              ? `line-item-content-error-${item.tempId}`
                                              : undefined
                                          }
                                          className={fieldClassName(Boolean(contentError))}
                                        />
                                        <FieldError
                                          id={`line-item-content-error-${item.tempId}`}
                                          message={contentError}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1.5">
                                        <label
                                          className="sr-only"
                                          htmlFor={`line-item-quantity-${item.tempId}`}
                                        >
                                          Quantity
                                        </label>
                                        <Input
                                          id={`line-item-quantity-${item.tempId}`}
                                          type="number"
                                          min={1}
                                          step={1}
                                          value={String(item.quantity)}
                                          onChange={(event) =>
                                            updateLineItemField(
                                              section.tempId,
                                              item.tempId,
                                              "quantity",
                                              Number(event.target.value) || 0,
                                            )
                                          }
                                          disabled={isReadOnly}
                                          aria-label="Quantity"
                                          aria-invalid={
                                            hasAttemptedSubmit && Boolean(quantityError)
                                              ? true
                                              : undefined
                                          }
                                          aria-describedby={
                                            quantityError
                                              ? `line-item-quantity-error-${item.tempId}`
                                              : undefined
                                          }
                                          className={fieldClassName(Boolean(quantityError), true)}
                                        />
                                        <FieldError
                                          id={`line-item-quantity-error-${item.tempId}`}
                                          message={quantityError}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1.5">
                                        <label
                                          className="sr-only"
                                          htmlFor={`line-item-unit-label-${item.tempId}`}
                                        >
                                          Unit label
                                        </label>
                                        <Input
                                          id={`line-item-unit-label-${item.tempId}`}
                                          value={item.unitLabel}
                                          onChange={(event) =>
                                            updateLineItemField(
                                              section.tempId,
                                              item.tempId,
                                              "unitLabel",
                                              event.target.value,
                                            )
                                          }
                                          disabled={isReadOnly}
                                          placeholder="hrs"
                                          aria-label="Unit label"
                                          aria-invalid={
                                            hasAttemptedSubmit && Boolean(unitLabelError)
                                              ? true
                                              : undefined
                                          }
                                          aria-describedby={
                                            unitLabelError
                                              ? `line-item-unit-label-error-${item.tempId}`
                                              : undefined
                                          }
                                          className={fieldClassName(Boolean(unitLabelError))}
                                        />
                                        <FieldError
                                          id={`line-item-unit-label-error-${item.tempId}`}
                                          message={unitLabelError}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      <div className="space-y-1.5">
                                        <label
                                          className="sr-only"
                                          htmlFor={`line-item-price-${item.tempId}`}
                                        >
                                          Unit price in dollars
                                        </label>
                                        <Input
                                          id={`line-item-price-${item.tempId}`}
                                          type="number"
                                          min={0}
                                          step="0.01"
                                          value={formatUnitPriceValue(item.unitPriceCents)}
                                          onChange={(event) =>
                                            updateLineItemField(
                                              section.tempId,
                                              item.tempId,
                                              "unitPriceCents",
                                              parseUnitPriceValue(event.target.value),
                                            )
                                          }
                                          disabled={isReadOnly}
                                          aria-label="Unit price in dollars"
                                          aria-invalid={
                                            hasAttemptedSubmit && Boolean(unitPriceError)
                                              ? true
                                              : undefined
                                          }
                                          aria-describedby={
                                            unitPriceError
                                              ? `line-item-price-error-${item.tempId}`
                                              : undefined
                                          }
                                          className={fieldClassName(Boolean(unitPriceError), true)}
                                        />
                                        <FieldError
                                          id={`line-item-price-error-${item.tempId}`}
                                          message={unitPriceError}
                                        />
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-right font-medium text-zinc-900">
                                      {formatCents(item.quantity * item.unitPriceCents)}
                                    </TableCell>
                                    {!isReadOnly ? (
                                      <TableCell className="text-right">
                                        <Button
                                          variant="danger"
                                          size="sm"
                                          onClick={() => removeLineItem(section.tempId, item.tempId)}
                                          aria-label={`Remove line item ${item.name || "untitled"}`}
                                        >
                                          Remove
                                        </Button>
                                      </TableCell>
                                    ) : null}
                                  </TableRow>
                                );
                              })}
                            </TableBody>
                          </Table>
                        ) : (
                          <p className="text-sm text-zinc-500">No line items yet.</p>
                        )}

                        {!isReadOnly ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addLineItem(section.tempId)}
                          >
                            Add line item
                          </Button>
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-zinc-200 pt-4">
            <p className="text-sm font-semibold text-zinc-900">Total {formatCents(totalCents)}</p>
            {!isReadOnly ? (
              <Button type="submit" disabled={isPending}>
                {isPending ? "Saving invoice..." : "Save invoice"}
              </Button>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
