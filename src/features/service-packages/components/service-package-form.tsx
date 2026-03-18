"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { ActionResult } from "@/lib/validation/action-result";
import type {
  ServicePackageInput,
  ServicePackageRecord,
} from "@/features/service-packages/types";

type ServicePackageFormMode = "create" | "edit";

type ServicePackageFormNotice = {
  tone: "success" | "error";
  title: string;
  message: string;
};

type ServicePackageFormProps = {
  mode: ServicePackageFormMode;
  initialValues: ServicePackageRecord | null;
  submitAction: (
    input: ServicePackageInput,
  ) => Promise<ActionResult<{ servicePackage: ServicePackageRecord }>>;
  initialNotice?: ServicePackageFormNotice | null;
};

const EMPTY_VALUES: ServicePackageInput = {
  name: "",
  category: "",
  startingPriceLabel: "",
  shortDescription: "",
};

const FIELD_CLASS_NAME =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

function toInput(values: ServicePackageRecord | null): ServicePackageInput {
  if (!values) {
    return EMPTY_VALUES;
  }

  return {
    name: values.name,
    category: values.category,
    startingPriceLabel: values.startingPriceLabel,
    shortDescription: values.shortDescription,
  };
}

function StatusNotice({ tone, title, message }: ServicePackageFormNotice) {
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

export function ServicePackageForm({
  mode,
  initialValues,
  submitAction,
  initialNotice = null,
}: ServicePackageFormProps) {
  const router = useRouter();
  const initialFormValues = useMemo(() => toInput(initialValues), [initialValues]);
  const [formValues, setFormValues] = useState<ServicePackageInput>(initialFormValues);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [notice, setNotice] = useState<ServicePackageFormNotice | null>(initialNotice);
  const [isPending, startTransition] = useTransition();

  function handleChange(field: keyof ServicePackageInput, value: string) {
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function getError(field: keyof ServicePackageInput) {
    const errors = fieldErrors[field];
    return errors?.[0] ?? null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasAttemptedSubmit(true);

    startTransition(async () => {
      const result = await submitAction(formValues);

      if (result.ok) {
        const successNotice: ServicePackageFormNotice = {
          tone: "success",
          title: mode === "create" ? "Service package created" : "Service package saved",
          message:
            mode === "create"
              ? "Service package saved. This reusable source record is ready for future quote workflows."
              : "Service package changes saved. Future quote workflows will use the latest definition.",
        };

        if (mode === "create") {
          router.replace(
            `/service-packages/${result.data.servicePackage.id}?backTo=/service-packages&saved=created`,
          );
          router.refresh();
          return;
        }

        setFormValues(toInput(result.data.servicePackage));
        setFieldErrors({});
        setHasAttemptedSubmit(false);
        setNotice(successNotice);
        router.refresh();
        return;
      }

      setFieldErrors(result.error.fieldErrors ?? {});
      setNotice({
        tone: "error",
        title: "Could not save service package",
        message: result.error.message,
      });
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {notice ? <StatusNotice {...notice} /> : null}

      <section className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-900">Reusable source content</p>
        <p className="mt-1">
          Service packages define reusable source content. Later quote editing happens on
          generated quote content, not on this package itself.
        </p>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="name" className="text-sm font-medium text-zinc-900">
            Service package name
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
          <label htmlFor="category" className="text-sm font-medium text-zinc-900">
            Category
          </label>
          <input
            id="category"
            name="category"
            type="text"
            className={FIELD_CLASS_NAME}
            value={formValues.category}
            onChange={(event) => handleChange("category", event.target.value)}
            aria-invalid={hasAttemptedSubmit ? Boolean(getError("category")) : undefined}
            aria-describedby={getError("category") ? "category-error" : undefined}
          />
          {getError("category") ? (
            <p id="category-error" className="text-xs text-red-700">
              {getError("category")}
            </p>
          ) : null}
        </div>

        <div className="space-y-1">
          <label
            htmlFor="startingPriceLabel"
            className="text-sm font-medium text-zinc-900"
          >
            Starting price guidance
          </label>
          <input
            id="startingPriceLabel"
            name="startingPriceLabel"
            type="text"
            className={FIELD_CLASS_NAME}
            value={formValues.startingPriceLabel}
            onChange={(event) => handleChange("startingPriceLabel", event.target.value)}
            aria-invalid={
              hasAttemptedSubmit ? Boolean(getError("startingPriceLabel")) : undefined
            }
            aria-describedby={
              getError("startingPriceLabel") ? "startingPriceLabel-error" : undefined
            }
          />
          {getError("startingPriceLabel") ? (
            <p id="startingPriceLabel-error" className="text-xs text-red-700">
              {getError("startingPriceLabel")}
            </p>
          ) : null}
        </div>

        <div className="space-y-1 sm:col-span-2">
          <label htmlFor="shortDescription" className="text-sm font-medium text-zinc-900">
            Short summary
          </label>
          <textarea
            id="shortDescription"
            name="shortDescription"
            rows={3}
            className={FIELD_CLASS_NAME}
            value={formValues.shortDescription}
            onChange={(event) => handleChange("shortDescription", event.target.value)}
            aria-invalid={
              hasAttemptedSubmit ? Boolean(getError("shortDescription")) : undefined
            }
            aria-describedby={
              getError("shortDescription")
                ? "shortDescription-error shortDescription-help"
                : "shortDescription-help"
            }
          />
          <p id="shortDescription-help" className="text-xs text-zinc-500">
            Optional. Keep it summary-oriented so the library and future package picker stay clear.
          </p>
          {getError("shortDescription") ? (
            <p id="shortDescription-error" className="text-xs text-red-700">
              {getError("shortDescription")}
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
            ? "Creating service package..."
            : "Saving service package..."
          : mode === "create"
            ? "Create service package"
            : "Save service package changes"}
      </button>
    </form>
  );
}
