"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import type { ActionResult } from "@/lib/validation/action-result";
import type { QuoteDetailRecord } from "@/features/quotes/types";
import type { CreateQuoteSchemaInput } from "@/features/quotes/schemas/create-quote-schema";
import type { ClientSummary } from "@/features/clients/types";
import type { ServicePackageSummary } from "@/features/service-packages/types";

type QuoteSetupFormNotice = {
  tone: "success" | "error";
  title: string;
  message: string;
};

type QuoteSetupFormProps = {
  clients: ClientSummary[];
  servicePackages: ServicePackageSummary[];
  submitAction: (
    input: CreateQuoteSchemaInput,
  ) => Promise<ActionResult<{ quote: QuoteDetailRecord }>>;
};

type SetupStage = "client" | "packages";

const FIELD_CLASS_NAME =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

const SEARCH_FIELD_CLASS_NAME =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

function StatusNotice({ tone, title, message }: QuoteSetupFormNotice) {
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

export function QuoteSetupForm({
  clients,
  servicePackages,
  submitAction,
}: QuoteSetupFormProps) {
  const router = useRouter();
  const [stage, setStage] = useState<SetupStage>("client");
  const [selectedClientId, setSelectedClientId] = useState("");
  const [selectedPackageIds, setSelectedPackageIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [terms, setTerms] = useState("");
  const [packageSearch, setPackageSearch] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [notice, setNotice] = useState<QuoteSetupFormNotice | null>(null);
  const [isPending, startTransition] = useTransition();

  const filteredPackages = useMemo(
    () =>
      servicePackages.filter((sp) => {
        const q = packageSearch.trim().toLowerCase();
        if (q === "") return true;
        return [sp.name, sp.category, sp.shortDescription].some((v) =>
          v.toLowerCase().includes(q),
        );
      }),
    [servicePackages, packageSearch],
  );

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId) ?? null,
    [clients, selectedClientId],
  );

  const selectedPackages = useMemo(
    () =>
      selectedPackageIds
        .map((id) => servicePackages.find((sp) => sp.id === id))
        .filter((sp): sp is ServicePackageSummary => sp !== undefined),
    [selectedPackageIds, servicePackages],
  );

  function getError(field: string) {
    return fieldErrors[field]?.[0] ?? null;
  }

  function handleSelectClient(clientId: string) {
    setSelectedClientId(clientId);
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.clientId;
      return next;
    });
  }

  function handleTogglePackage(packageId: string) {
    setSelectedPackageIds((prev) =>
      prev.includes(packageId)
        ? prev.filter((id) => id !== packageId)
        : [...prev, packageId],
    );
    setFieldErrors((prev) => {
      const next = { ...prev };
      delete next.selectedServicePackageIds;
      return next;
    });
  }

  function handleRemovePackage(packageId: string) {
    setSelectedPackageIds((prev) => prev.filter((id) => id !== packageId));
  }

  function goToPackages() {
    if (!selectedClientId) {
      setFieldErrors({ clientId: ["Select a client before continuing."] });
      return;
    }

    setStage("packages");
    setFieldErrors({});
  }

  function goBackToClient() {
    setStage("client");
    setFieldErrors({});
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setHasAttemptedSubmit(true);

    const errors: Record<string, string[]> = {};

    if (!selectedClientId) {
      errors.clientId = ["Select a client before continuing."];
    }

    if (selectedPackageIds.length === 0) {
      errors.selectedServicePackageIds = [
        "Select at least one service package.",
      ];
    }

    if (!title.trim()) {
      errors.title = ["Quote title is required."];
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    startTransition(async () => {
      const result = await submitAction({
        clientId: selectedClientId,
        title: title.trim(),
        selectedServicePackageIds: selectedPackageIds,
        terms: terms.trim(),
      });

      if (result.ok) {
        router.push(
          `/quotes/${result.data.quote.id}?backTo=/quotes&saved=created`,
        );
        router.refresh();
        return;
      }

      setFieldErrors(result.error.fieldErrors ?? {});
      setNotice({
        tone: "error",
        title: "Could not create quote",
        message: result.error.message,
      });
    });
  }

  return (
    <form className="space-y-6" onSubmit={handleSubmit} noValidate>
      {notice ? <StatusNotice {...notice} /> : null}

      <section className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 text-sm text-zinc-700">
        <p className="font-semibold text-zinc-900">Quote setup</p>
        <p className="mt-1">
          Associate a client and select reusable service packages to start your
          quote draft.
        </p>
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={goBackToClient}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            stage === "client"
              ? "bg-zinc-900 text-white"
              : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          1. Client
        </button>
        <button
          type="button"
          onClick={goToPackages}
          className={`rounded-md px-4 py-2 text-sm font-medium ${
            stage === "packages"
              ? "bg-zinc-900 text-white"
              : "border border-zinc-300 text-zinc-700 hover:bg-zinc-100"
          }`}
        >
          2. Service Packages
        </button>
      </div>

      {stage === "client" ? (
        <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="text-lg font-semibold text-zinc-900">
            Select client
          </h3>

          {clients.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
              <p className="text-sm text-zinc-600">
                No clients exist yet. Create a client to associate with this
                quote.
              </p>
              <Link
                href="/clients/new"
                className="mt-3 inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              >
                Create client
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {clients.map((client) => (
                  <label
                    key={client.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-zinc-200 px-4 py-3 hover:bg-zinc-50"
                  >
                    <input
                      type="radio"
                      name="clientId"
                      value={client.id}
                      checked={selectedClientId === client.id}
                      onChange={() => handleSelectClient(client.id)}
                      className="h-4 w-4"
                    />
                    <span>
                      <span className="block text-sm font-medium text-zinc-900">
                        {client.name}
                      </span>
                      <span className="block text-xs text-zinc-500">
                        {client.contactEmail}
                      </span>
                    </span>
                  </label>
                ))}
              </div>

              {getError("clientId") ? (
                <p className="text-xs text-red-700">{getError("clientId")}</p>
              ) : null}

              <button
                type="button"
                onClick={goToPackages}
                className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              >
                Continue to service packages
              </button>
            </>
          )}
        </section>
      ) : null}

      {stage === "packages" ? (
        <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">
              Select service packages
            </h3>
            {selectedClient ? (
              <p className="mt-1 text-sm text-zinc-600">
                For client: {selectedClient.name}
              </p>
            ) : null}
          </div>

          <div className="space-y-1">
            <label
              htmlFor="title"
              className="text-sm font-medium text-zinc-900"
            >
              Quote title
            </label>
            <input
              id="title"
              type="text"
              className={FIELD_CLASS_NAME}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (e.target.value.trim()) {
                  setFieldErrors((prev) => {
                    const next = { ...prev };
                    delete next.title;
                    return next;
                  });
                }
              }}
              placeholder="e.g. Brand Campaign Q2 2026"
              aria-invalid={
                hasAttemptedSubmit ? Boolean(getError("title")) : undefined
              }
              aria-describedby={getError("title") ? "title-error" : undefined}
            />
            {getError("title") ? (
              <p id="title-error" className="text-xs text-red-700">
                {getError("title")}
              </p>
            ) : null}
          </div>

          {servicePackages.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
              <p className="text-sm text-zinc-600">
                No service packages exist yet. Create reusable packages to
                select for this quote.
              </p>
              <Link
                href="/service-packages/new"
                className="mt-3 inline-flex rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              >
                Create service package
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-1">
                <label
                  htmlFor="package-search"
                  className="text-sm font-medium text-zinc-900"
                >
                  Search packages
                </label>
                <input
                  id="package-search"
                  type="search"
                  className={SEARCH_FIELD_CLASS_NAME}
                  value={packageSearch}
                  onChange={(e) => setPackageSearch(e.target.value)}
                  placeholder="Search by name, category, or summary"
                />
              </div>

              {filteredPackages.length === 0 ? (
                <p className="text-sm text-zinc-600">
                  No service packages match your search.
                </p>
              ) : (
                <div className="space-y-2">
                  {filteredPackages.map((sp) => (
                    <label
                      key={sp.id}
                      className="flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-200 px-4 py-3 hover:bg-zinc-50"
                    >
                      <input
                        type="checkbox"
                        checked={selectedPackageIds.includes(sp.id)}
                        onChange={() => handleTogglePackage(sp.id)}
                        className="mt-1 h-4 w-4"
                      />
                      <span>
                        <span className="block text-sm font-medium text-zinc-900">
                          {sp.name}
                        </span>
                        <span className="block text-xs text-zinc-500">
                          {sp.category} · Starts at {sp.startingPriceLabel}
                        </span>
                        {sp.shortDescription ? (
                          <span className="block text-xs text-zinc-500">
                            {sp.shortDescription}
                          </span>
                        ) : null}
                      </span>
                    </label>
                  ))}
                </div>
              )}

              {getError("selectedServicePackageIds") ? (
                <p className="text-xs text-red-700">
                  {getError("selectedServicePackageIds")}
                </p>
              ) : null}

              {selectedPackages.length > 0 ? (
                <div className="space-y-2 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Selected packages ({selectedPackages.length})
                  </p>
                  {selectedPackages.map((sp) => (
                    <div
                      key={sp.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="text-sm text-zinc-900">{sp.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePackage(sp.id)}
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs text-zinc-700"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </>
          )}

          <div className="space-y-1">
            <label
              htmlFor="terms"
              className="text-sm font-medium text-zinc-900"
            >
              Terms (optional)
            </label>
            <textarea
              id="terms"
              rows={3}
              className={FIELD_CLASS_NAME}
              value={terms}
              onChange={(e) => setTerms(e.target.value)}
              placeholder="Default quote terms or notes"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={goBackToClient}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
            >
              Back
            </button>
            <button
              type="submit"
              disabled={isPending}
              className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending ? "Creating quote..." : "Create quote draft"}
            </button>
          </div>
        </section>
      ) : null}
    </form>
  );
}
