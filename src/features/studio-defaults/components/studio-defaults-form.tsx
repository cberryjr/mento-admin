"use client";

import { useMemo, useState, useTransition } from "react";

import { InlineAlert } from "@/components/feedback/inline-alert";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import type { ActionResult } from "@/lib/validation/action-result";
import type {
  StudioDefaultsInput,
  StudioDefaultsRecord,
} from "@/features/studio-defaults/types";

type StudioDefaultsFormProps = {
  initialValues: StudioDefaultsRecord | null;
  submitAction: (
    input: StudioDefaultsInput,
  ) => Promise<ActionResult<{ studioDefaults: StudioDefaultsRecord }>>;
};

const EMPTY_VALUES: StudioDefaultsInput = {
  studioName: "",
  studioContactName: "",
  studioContactEmail: "",
  studioContactPhone: "",
  defaultQuoteTerms: "",
  defaultInvoicePaymentInstructions: "",
};

function toInput(values: StudioDefaultsRecord | null): StudioDefaultsInput {
  if (!values) {
    return EMPTY_VALUES;
  }

  return {
    studioName: values.studioName,
    studioContactName: values.studioContactName,
    studioContactEmail: values.studioContactEmail,
    studioContactPhone: values.studioContactPhone,
    defaultQuoteTerms: values.defaultQuoteTerms,
    defaultInvoicePaymentInstructions: values.defaultInvoicePaymentInstructions,
  };
}

export function StudioDefaultsForm({
  initialValues,
  submitAction,
}: StudioDefaultsFormProps) {
  const initialFormValues = useMemo(() => toInput(initialValues), [initialValues]);
  const [formValues, setFormValues] = useState<StudioDefaultsInput>(initialFormValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<"success" | "error" | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleChange(field: keyof StudioDefaultsInput, value: string) {
    setFormValues((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function getError(field: keyof StudioDefaultsInput) {
    const errors = fieldErrors[field];
    if (!errors?.length) {
      return null;
    }

    return errors[0];
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    startTransition(async () => {
      const result = await submitAction(formValues);

      if (result.ok) {
        setFormValues(toInput(result.data.studioDefaults));
        setFieldErrors({});
        setStatusTone("success");
        setStatusMessage(
          "Studio defaults saved. New quotes and invoices will use these prefills.",
        );
        return;
      }

      setFieldErrors(result.error.fieldErrors ?? {});
      setStatusTone("error");
      setStatusMessage(result.error.message);
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {statusMessage ? (
        <InlineAlert
          title={statusTone === "success" ? "Defaults saved" : "Could not save defaults"}
          message={statusMessage}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="studioName" className="text-sm font-medium text-zinc-900">
            Studio name
          </label>
          <Input
            id="studioName"
            name="studioName"
            type="text"
            value={formValues.studioName}
            onChange={(event) => handleChange("studioName", event.target.value)}
            aria-invalid={Boolean(getError("studioName"))}
            aria-describedby={getError("studioName") ? "studioName-error" : undefined}
          />
          {getError("studioName") ? (
            <p id="studioName-error" className="text-xs text-red-700">
              {getError("studioName")}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="studioContactName" className="text-sm font-medium text-zinc-900">
            Studio contact name
          </label>
          <Input
            id="studioContactName"
            name="studioContactName"
            type="text"
            value={formValues.studioContactName}
            onChange={(event) => handleChange("studioContactName", event.target.value)}
            aria-invalid={Boolean(getError("studioContactName"))}
            aria-describedby={
              getError("studioContactName") ? "studioContactName-error" : undefined
            }
          />
          {getError("studioContactName") ? (
            <p id="studioContactName-error" className="text-xs text-red-700">
              {getError("studioContactName")}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="studioContactEmail" className="text-sm font-medium text-zinc-900">
            Studio contact email
          </label>
          <Input
            id="studioContactEmail"
            name="studioContactEmail"
            type="email"
            value={formValues.studioContactEmail}
            onChange={(event) => handleChange("studioContactEmail", event.target.value)}
            aria-invalid={Boolean(getError("studioContactEmail"))}
            aria-describedby={
              getError("studioContactEmail") ? "studioContactEmail-error" : undefined
            }
          />
          {getError("studioContactEmail") ? (
            <p id="studioContactEmail-error" className="text-xs text-red-700">
              {getError("studioContactEmail")}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="studioContactPhone" className="text-sm font-medium text-zinc-900">
            Studio contact phone
          </label>
          <Input
            id="studioContactPhone"
            name="studioContactPhone"
            type="tel"
            value={formValues.studioContactPhone}
            onChange={(event) => handleChange("studioContactPhone", event.target.value)}
            aria-invalid={Boolean(getError("studioContactPhone"))}
            aria-describedby={
              getError("studioContactPhone") ? "studioContactPhone-error" : undefined
            }
          />
          {getError("studioContactPhone") ? (
            <p id="studioContactPhone-error" className="text-xs text-red-700">
              {getError("studioContactPhone")}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-1">
        <label htmlFor="defaultQuoteTerms" className="text-sm font-medium text-zinc-900">
          Default quote terms
        </label>
        <Textarea
          id="defaultQuoteTerms"
          name="defaultQuoteTerms"
          rows={4}
          value={formValues.defaultQuoteTerms}
          onChange={(event) => handleChange("defaultQuoteTerms", event.target.value)}
          aria-invalid={Boolean(getError("defaultQuoteTerms"))}
          aria-describedby={
            getError("defaultQuoteTerms") ? "defaultQuoteTerms-error" : undefined
          }
        />
        {getError("defaultQuoteTerms") ? (
          <p id="defaultQuoteTerms-error" className="text-xs text-red-700">
            {getError("defaultQuoteTerms")}
          </p>
        ) : null}
      </div>

      <div className="space-y-1">
        <label
          htmlFor="defaultInvoicePaymentInstructions"
          className="text-sm font-medium text-zinc-900"
        >
          Default invoice payment instructions
        </label>
        <Textarea
          id="defaultInvoicePaymentInstructions"
          name="defaultInvoicePaymentInstructions"
          rows={4}
          value={formValues.defaultInvoicePaymentInstructions}
          onChange={(event) =>
            handleChange("defaultInvoicePaymentInstructions", event.target.value)
          }
          aria-invalid={Boolean(getError("defaultInvoicePaymentInstructions"))}
          aria-describedby={
            getError("defaultInvoicePaymentInstructions")
              ? "defaultInvoicePaymentInstructions-error"
              : undefined
          }
        />
        {getError("defaultInvoicePaymentInstructions") ? (
          <p id="defaultInvoicePaymentInstructions-error" className="text-xs text-red-700">
            {getError("defaultInvoicePaymentInstructions")}
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending ? "Saving defaults..." : "Save defaults"}
      </button>
    </form>
  );
}
