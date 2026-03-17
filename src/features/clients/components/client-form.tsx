"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { ActionResult } from "@/lib/validation/action-result";
import type { ClientInput, ClientRecord } from "@/features/clients/types";

type ClientFormMode = "create" | "edit";

type ClientFormNotice = {
  tone: "success" | "error";
  title: string;
  message: string;
};

type ClientFormProps = {
  mode: ClientFormMode;
  initialValues: ClientRecord | null;
  submitAction: (input: ClientInput) => Promise<ActionResult<{ client: ClientRecord }>>;
  initialNotice?: ClientFormNotice | null;
};

const EMPTY_VALUES: ClientInput = {
  name: "",
  contactName: "",
  contactEmail: "",
  contactPhone: "",
};

const FIELD_CLASS_NAME =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

function toInput(values: ClientRecord | null): ClientInput {
  if (!values) {
    return EMPTY_VALUES;
  }

  return {
    name: values.name,
    contactName: values.contactName,
    contactEmail: values.contactEmail,
    contactPhone: values.contactPhone,
  };
}

function StatusNotice({ tone, title, message }: ClientFormNotice) {
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

export function ClientForm({
  mode,
  initialValues,
  submitAction,
  initialNotice = null,
}: ClientFormProps) {
  const router = useRouter();
  const initialFormValues = useMemo(() => toInput(initialValues), [initialValues]);
  const [formValues, setFormValues] = useState<ClientInput>(initialFormValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [notice, setNotice] = useState<ClientFormNotice | null>(initialNotice);
  const [isPending, startTransition] = useTransition();

  function handleChange(field: keyof ClientInput, value: string) {
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function getError(field: keyof ClientInput) {
    const errors = fieldErrors[field];
    return errors?.[0] ?? null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasAttemptedSubmit(true);

    startTransition(async () => {
      const result = await submitAction(formValues);

      if (result.ok) {
        const successNotice: ClientFormNotice = {
          tone: "success",
          title: mode === "create" ? "Client created" : "Client saved",
          message:
            mode === "create"
              ? "Client saved. This record is ready for future quotes and invoices."
              : "Client changes saved. Future workflows will use the latest details.",
        };

        if (mode === "create") {
          // On create, navigate to the edit page which displays the success notice
          // via the `initialNotice` prop (passed via the `saved=created` search param).
          router.replace(`/clients/${result.data.client.id}?backTo=/clients&saved=created`);
          router.refresh();
          return;
        }

        setFormValues(toInput(result.data.client));
        setFieldErrors({});
        setHasAttemptedSubmit(false);
        setNotice(successNotice);
        router.refresh();
        return;
      }

      setFieldErrors(result.error.fieldErrors ?? {});
      setNotice({
        tone: "error",
        title: "Could not save client",
        message: result.error.message,
      });
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {notice ? <StatusNotice {...notice} /> : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1">
          <label htmlFor="name" className="text-sm font-medium text-zinc-900">
            Client name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            className={FIELD_CLASS_NAME}
            value={formValues.name}
            onChange={(event) => handleChange("name", event.target.value)}
            aria-invalid={hasAttemptedSubmit ? Boolean(getError("name")) : undefined}
            aria-describedby={getError("name") ? "name-error" : undefined}
          />
          {getError("name") ? (
            <p id="name-error" className="text-xs text-red-700">
              {getError("name")}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="contactName" className="text-sm font-medium text-zinc-900">
            Contact name
          </label>
          <input
            id="contactName"
            name="contactName"
            type="text"
            className={FIELD_CLASS_NAME}
            value={formValues.contactName}
            onChange={(event) => handleChange("contactName", event.target.value)}
            aria-invalid={hasAttemptedSubmit ? Boolean(getError("contactName")) : undefined}
            aria-describedby={getError("contactName") ? "contactName-error" : undefined}
          />
          {getError("contactName") ? (
            <p id="contactName-error" className="text-xs text-red-700">
              {getError("contactName")}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="contactEmail" className="text-sm font-medium text-zinc-900">
            Contact email
          </label>
          <input
            id="contactEmail"
            name="contactEmail"
            type="email"
            className={FIELD_CLASS_NAME}
            value={formValues.contactEmail}
            onChange={(event) => handleChange("contactEmail", event.target.value)}
            aria-invalid={hasAttemptedSubmit ? Boolean(getError("contactEmail")) : undefined}
            aria-describedby={getError("contactEmail") ? "contactEmail-error" : undefined}
          />
          {getError("contactEmail") ? (
            <p id="contactEmail-error" className="text-xs text-red-700">
              {getError("contactEmail")}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label htmlFor="contactPhone" className="text-sm font-medium text-zinc-900">
            Contact phone
          </label>
          <input
            id="contactPhone"
            name="contactPhone"
            type="tel"
            className={FIELD_CLASS_NAME}
            value={formValues.contactPhone}
            onChange={(event) => handleChange("contactPhone", event.target.value)}
            aria-invalid={hasAttemptedSubmit ? Boolean(getError("contactPhone")) : undefined}
            aria-describedby={getError("contactPhone") ? "contactPhone-error" : undefined}
          />
          {getError("contactPhone") ? (
            <p id="contactPhone-error" className="text-xs text-red-700">
              {getError("contactPhone")}
            </p>
          ) : null}
        </div>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isPending
          ? mode === "create"
            ? "Creating client..."
            : "Saving client..."
          : mode === "create"
            ? "Create client"
            : "Save client changes"}
      </button>
    </form>
  );
}
