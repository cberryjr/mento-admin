"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

import type { ActionResult } from "@/lib/validation/action-result";
import {
  calculateLineItemTotalCents,
  calculateServicePackageTotalCents,
  createDefaultComplexityTiers,
  formatServicePackageStartingPriceLabel,
  normalizeCatalogMetadata,
  normalizeComplexityTiers,
  type ServicePackageDetailRecord,
  type ServicePackageComplexityTierInput,
  type ServicePackageInput,
  type ServicePackageLineItemInput,
  type ServicePackageSectionInput,
} from "@/features/service-packages/types";
import { SERVICE_CATEGORY_PROFILES } from "@/features/service-packages/catalog-contract";

type ServicePackageFormMode = "create" | "edit";

type ServicePackageFormNotice = {
  tone: "success" | "error";
  title: string;
  message: string;
};

type ServicePackageFormProps = {
  mode: ServicePackageFormMode;
  initialValues: ServicePackageDetailRecord | null;
  submitAction: (
    input: ServicePackageInput,
  ) => Promise<ActionResult<{ servicePackage: ServicePackageDetailRecord }>>;
  initialNotice?: ServicePackageFormNotice | null;
};

const FIELD_CLASS_NAME =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900";

function createLocalId(prefix: string) {
  const suffix = globalThis.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2, 10);
  return `${prefix}-${suffix}`;
}

function createEmptyLineItem(sectionId: string, position = 1): ServicePackageLineItemInput {
  return {
    id: createLocalId("line-item"),
    sectionId,
    name: "",
    defaultContent: "",
    quantity: 1,
    unitLabel: "",
    unitPriceCents: 0,
    position,
  };
}

function createEmptySection(position = 1): ServicePackageSectionInput {
  const sectionId = createLocalId("section");

  return {
    id: sectionId,
    title: "",
    defaultContent: "",
    position,
    lineItems: [createEmptyLineItem(sectionId, 1)],
  };
}

function normalizeSections(sections: ServicePackageSectionInput[]): ServicePackageSectionInput[] {
  return sections.map((section, sectionIndex) => ({
    ...section,
    position: sectionIndex + 1,
    lineItems: section.lineItems.map((lineItem, lineItemIndex) => ({
      ...lineItem,
      sectionId: section.id,
      position: lineItemIndex + 1,
    })),
  }));
}

function toInput(values: ServicePackageDetailRecord | null): ServicePackageInput {
  if (!values) {
    const defaultCategory = SERVICE_CATEGORY_PROFILES[0];
    return {
      name: "",
      categoryKey: defaultCategory.key,
      categoryLabel: defaultCategory.label,
      categoryShortLabel: defaultCategory.shortLabel,
      category: defaultCategory.label,
      shortDescription: "",
      complexityTiers: createDefaultComplexityTiers(defaultCategory.key),
      sections: [createEmptySection(1)],
    };
  }

  const sections = Array.isArray(values.sections) ? values.sections : [];

  const catalog = normalizeCatalogMetadata(values);

  return {
    name: values.name,
    categoryKey: catalog.categoryKey,
    categoryLabel: catalog.categoryLabel,
    categoryShortLabel: catalog.categoryShortLabel,
    category: catalog.category,
    shortDescription: values.shortDescription,
    complexityTiers: normalizeComplexityTiers(catalog.categoryKey, values.complexityTiers),
    sections:
      sections.length > 0
        ? normalizeSections(
            sections.map((section) => ({
              id: section.id,
              title: section.title,
              defaultContent: section.defaultContent,
              position: section.position,
              lineItems: section.lineItems.map((lineItem) => ({
                id: lineItem.id,
                sectionId: lineItem.sectionId,
                name: lineItem.name,
                defaultContent: lineItem.defaultContent,
                quantity: lineItem.quantity,
                unitLabel: lineItem.unitLabel,
                unitPriceCents: lineItem.unitPriceCents,
                position: lineItem.position,
              })),
            })),
          )
        : [createEmptySection(1)],
  };
}

function moveItem<T>(items: T[], fromIndex: number, toIndex: number) {
  if (toIndex < 0 || toIndex >= items.length) {
    return items;
  }

  const nextItems = [...items];
  const [movedItem] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, movedItem);
  return nextItems;
}

function formatCurrencyInputValue(unitPriceCents: number): string {
  return unitPriceCents === 0 ? "0" : String(unitPriceCents / 100);
}

function parseCurrencyInputValue(value: string): number {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || value.trim() === "") {
    return 0;
  }

  // Use toFixed(2) before parsing to avoid floating-point rounding errors
  // like 1.005 * 100 = 100.499... → 100 instead of 101.
  const fixedCents = Number((parsed * 100).toFixed(0));
  return Math.max(0, fixedCents);
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

  const packageTotalCents = useMemo(
    () => calculateServicePackageTotalCents(formValues.sections),
    [formValues.sections],
  );
  const startingPriceLabel = useMemo(
    () => formatServicePackageStartingPriceLabel(packageTotalCents),
    [packageTotalCents],
  );

  function setSections(updater: (sections: ServicePackageSectionInput[]) => ServicePackageSectionInput[]) {
    setFormValues((previous) => ({
      ...previous,
      sections: normalizeSections(updater(previous.sections)),
    }));
  }

  function handleMetadataChange(field: "name" | "shortDescription", value: string) {
    setFormValues((previous) => ({
      ...previous,
      [field]: value,
    }));
  }

  function handleCategoryChange(nextCategoryKey: ServicePackageInput["categoryKey"]) {
    const profile = SERVICE_CATEGORY_PROFILES.find((item) => item.key === nextCategoryKey);

    if (!profile) {
      return;
    }

    setFormValues((previous) => ({
      ...previous,
      categoryKey: profile.key,
      categoryLabel: profile.label,
      categoryShortLabel: profile.shortLabel,
      category: profile.label,
      complexityTiers: normalizeComplexityTiers(
        profile.key,
        previous.categoryKey === profile.key ? previous.complexityTiers : createDefaultComplexityTiers(profile.key),
      ),
    }));
  }

  function setComplexityTiers(
    updater: (tiers: ServicePackageComplexityTierInput[]) => ServicePackageComplexityTierInput[],
  ) {
    setFormValues((previous) => ({
      ...previous,
      complexityTiers: normalizeComplexityTiers(previous.categoryKey, updater(previous.complexityTiers)),
    }));
  }

  function handleTierChange(
    tierId: string,
    field: "descriptor",
    value: string,
  ) {
    setComplexityTiers((tiers) =>
      tiers.map((tier) => (tier.id === tierId ? { ...tier, [field]: value } : tier)),
    );
  }

  function handleTierTimeGuidanceChange(
    tierId: string,
    field: "minValue" | "maxValue" | "unit",
    value: string,
  ) {
    setComplexityTiers((tiers) =>
      tiers.map((tier) => {
        if (tier.id !== tierId) {
          return tier;
        }

        if (field === "unit") {
          return {
            ...tier,
            timeGuidance: {
              ...tier.timeGuidance,
              unit: value as ServicePackageComplexityTierInput["timeGuidance"]["unit"],
            },
          };
        }

        const parsed = Math.max(1, Number.parseInt(value || "1", 10) || 1);

        return {
          ...tier,
          timeGuidance: {
            ...tier.timeGuidance,
            [field]: parsed,
          },
        };
      }),
    );
  }

  function handleTierVariableDefaultsChange(
    tierId: string,
    field: "quantity" | "durationValue" | "durationUnit" | "resolution" | "revisions" | "urgency",
    value: string,
  ) {
    setComplexityTiers((tiers) =>
      tiers.map((tier) => {
        if (tier.id !== tierId) {
          return tier;
        }

        if (field === "durationUnit") {
          return {
            ...tier,
            variableDefaults: {
              ...tier.variableDefaults,
              durationUnit: value === "none" ? null : (value as ServicePackageComplexityTierInput["variableDefaults"]["durationUnit"]),
              durationValue:
                value === "none"
                  ? null
                  : (tier.variableDefaults.durationValue ?? 1),
            },
          };
        }

        if (field === "resolution") {
          return {
            ...tier,
            variableDefaults: {
              ...tier.variableDefaults,
              resolution: value === "none" ? null : (value as ServicePackageComplexityTierInput["variableDefaults"]["resolution"]),
            },
          };
        }

        if (field === "urgency") {
          return {
            ...tier,
            variableDefaults: {
              ...tier.variableDefaults,
              urgency: value as ServicePackageComplexityTierInput["variableDefaults"]["urgency"],
            },
          };
        }

        const parsed = Math.max(0, Number.parseInt(value || "0", 10) || 0);

        if (field === "durationValue") {
          return {
            ...tier,
            variableDefaults: {
              ...tier.variableDefaults,
              durationValue: parsed <= 0 ? null : parsed,
            },
          };
        }

        return {
          ...tier,
          variableDefaults: {
            ...tier.variableDefaults,
            [field]: field === "revisions" ? parsed : Math.max(1, parsed),
          },
        };
      }),
    );
  }

  function updateTierListField(
    tierId: string,
    field: "deliverables" | "processNotes",
    index: number,
    value: string,
  ) {
    setComplexityTiers((tiers) =>
      tiers.map((tier) => {
        if (tier.id !== tierId) {
          return tier;
        }

        const nextValues = [...tier[field]];
        nextValues[index] = value;
        return {
          ...tier,
          [field]: nextValues,
        };
      }),
    );
  }

  function addTierListField(tierId: string, field: "deliverables" | "processNotes") {
    setComplexityTiers((tiers) =>
      tiers.map((tier) =>
        tier.id === tierId
          ? {
              ...tier,
              [field]: [...tier[field], ""],
            }
          : tier,
      ),
    );
  }

  function removeTierListField(
    tierId: string,
    field: "deliverables" | "processNotes",
    index: number,
  ) {
    setComplexityTiers((tiers) =>
      tiers.map((tier) => {
        if (tier.id !== tierId || tier[field].length === 1) {
          return tier;
        }

        return {
          ...tier,
          [field]: tier[field].filter((_item, itemIndex) => itemIndex !== index),
        };
      }),
    );
  }

  function handleSectionChange(
    sectionId: string,
    field: "title" | "defaultContent",
    value: string,
  ) {
    setSections((sections) =>
      sections.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section,
      ),
    );
  }

  function handleLineItemChange(
    sectionId: string,
    lineItemId: string,
    field: "name" | "defaultContent" | "unitLabel",
    value: string,
  ) {
    setSections((sections) =>
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lineItems: section.lineItems.map((lineItem) =>
                lineItem.id === lineItemId ? { ...lineItem, [field]: value } : lineItem,
              ),
            }
          : section,
      ),
    );
  }

  function handleLineItemNumberChange(
    sectionId: string,
    lineItemId: string,
    field: "quantity" | "unitPriceCents",
    value: string,
  ) {
    const normalizedValue =
      field === "unitPriceCents"
        ? parseCurrencyInputValue(value)
        : Math.max(1, Number.parseInt(value || "1", 10) || 1);

    setSections((sections) =>
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lineItems: section.lineItems.map((lineItem) =>
                lineItem.id === lineItemId
                  ? { ...lineItem, [field]: normalizedValue }
                  : lineItem,
              ),
            }
          : section,
      ),
    );
  }

  function getError(field: string) {
    return fieldErrors[field]?.[0] ?? null;
  }

  function getSectionError(sectionId: string, field: "title" | "defaultContent" | "lineItems") {
    return getError(`sectionsById.${sectionId}.${field}`);
  }

  function getLineItemError(
    lineItemId: string,
    field: "name" | "defaultContent" | "quantity" | "unitLabel" | "unitPriceCents",
  ) {
    return getError(`lineItemsById.${lineItemId}.${field}`);
  }

  function getTierError(
    tierId: string,
    field:
      | "descriptor"
      | "deliverables"
      | "processNotes"
      | "timeGuidance.minValue"
      | "timeGuidance.maxValue"
      | "timeGuidance.unit"
      | "variableDefaults.quantity"
      | "variableDefaults.durationValue"
      | "variableDefaults.durationUnit"
      | "variableDefaults.resolution"
      | "variableDefaults.revisions"
      | "variableDefaults.urgency",
  ) {
    return getError(`complexityTiersById.${tierId}.${field}`);
  }

  function getTierListItemError(
    tierId: string,
    field: "deliverables" | "processNotes",
    index: number,
  ) {
    return getError(`complexityTiersById.${tierId}.${field}.${index}`);
  }

  function addSection() {
    setSections((sections) => [...sections, createEmptySection(sections.length + 1)]);
  }

  function removeSection(sectionId: string) {
    setSections((sections) => sections.filter((section) => section.id !== sectionId));
  }

  function moveSection(sectionId: string, direction: -1 | 1) {
    setSections((sections) => {
      const currentIndex = sections.findIndex((section) => section.id === sectionId);
      return moveItem(sections, currentIndex, currentIndex + direction);
    });
  }

  function addLineItem(sectionId: string) {
    setSections((sections) =>
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lineItems: [
                ...section.lineItems,
                createEmptyLineItem(sectionId, section.lineItems.length + 1),
              ],
            }
          : section,
      ),
    );
  }

  function removeLineItem(sectionId: string, lineItemId: string) {
    setSections((sections) =>
      sections.map((section) =>
        section.id === sectionId
          ? {
              ...section,
              lineItems: section.lineItems.filter((lineItem) => lineItem.id !== lineItemId),
            }
          : section,
      ),
    );
  }

  function moveLineItem(sectionId: string, lineItemId: string, direction: -1 | 1) {
    setSections((sections) =>
      sections.map((section) => {
        if (section.id !== sectionId) {
          return section;
        }

        const currentIndex = section.lineItems.findIndex((lineItem) => lineItem.id === lineItemId);

        return {
          ...section,
          lineItems: moveItem(section.lineItems, currentIndex, currentIndex + direction),
        };
      }),
    );
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
              ? "Service package saved. This reusable source record now includes structured sections, line items, and pricing guidance."
              : "Service package changes saved. Future quote workflows will use the latest structured package definition.",
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

  const categoryError = getError("categoryKey") ?? getError("category");

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

      <section className="grid gap-4 rounded-xl border border-zinc-200 bg-white p-5 sm:grid-cols-2">
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
            onChange={(event) => handleMetadataChange("name", event.target.value)}
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
          <select
            id="category"
            name="category"
            className={FIELD_CLASS_NAME}
            value={formValues.categoryKey}
            onChange={(event) =>
              handleCategoryChange(event.target.value as ServicePackageInput["categoryKey"])
            }
            aria-invalid={hasAttemptedSubmit ? Boolean(categoryError) : undefined}
            aria-describedby={categoryError ? "category-error" : undefined}
          >
            {SERVICE_CATEGORY_PROFILES.map((profile) => (
              <option key={profile.key} value={profile.key}>
                {profile.label}
              </option>
            ))}
          </select>
          {categoryError ? (
            <p id="category-error" className="text-xs text-red-700">
              {categoryError}
            </p>
          ) : null}
        </div>

        <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
            Package total
          </p>
          <p className="mt-1 text-lg font-semibold text-zinc-900">{startingPriceLabel}</p>
          <p className="mt-1 text-xs text-zinc-600">
            Derived from structured line items and saved as the library starting price summary.
          </p>
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
            onChange={(event) => handleMetadataChange("shortDescription", event.target.value)}
            aria-invalid={hasAttemptedSubmit ? Boolean(getError("shortDescription")) : undefined}
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
      </section>

      <section className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5">
        <div>
          <h3 className="text-lg font-semibold text-zinc-900">Complexity matrix</h3>
          <p className="mt-1 text-sm text-zinc-600">
            Define Standard, Advanced, and Premium defaults for deliverables, timing, and production variables.
          </p>
        </div>

        {getError("complexityTiers") ? (
          <p className="text-sm text-red-700">{getError("complexityTiers")}</p>
        ) : null}

        {formValues.complexityTiers.map((tier) => (
          <section key={tier.id} className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <div>
              <p className="text-sm font-semibold text-zinc-900">{tier.title}</p>
              <p className="text-xs text-zinc-500 uppercase tracking-wide">{tier.tier}</p>
            </div>

            <div className="space-y-1">
              <label htmlFor={`tier-${tier.id}-descriptor`} className="text-sm font-medium text-zinc-900">
                Tier descriptor
              </label>
              <input
                id={`tier-${tier.id}-descriptor`}
                type="text"
                className={FIELD_CLASS_NAME}
                value={tier.descriptor}
                onChange={(event) => handleTierChange(tier.id, "descriptor", event.target.value)}
                aria-invalid={hasAttemptedSubmit ? Boolean(getTierError(tier.id, "descriptor")) : undefined}
              />
              {getTierError(tier.id, "descriptor") ? (
                <p className="text-xs text-red-700">{getTierError(tier.id, "descriptor")}</p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label htmlFor={`tier-${tier.id}-time-min`} className="text-sm font-medium text-zinc-900">
                  Min time
                </label>
                <input
                  id={`tier-${tier.id}-time-min`}
                  type="number"
                  min={1}
                  className={FIELD_CLASS_NAME}
                  value={tier.timeGuidance.minValue}
                  onChange={(event) =>
                    handleTierTimeGuidanceChange(tier.id, "minValue", event.target.value)
                  }
                />
                {getTierError(tier.id, "timeGuidance.minValue") ? (
                  <p className="text-xs text-red-700">{getTierError(tier.id, "timeGuidance.minValue")}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor={`tier-${tier.id}-time-max`} className="text-sm font-medium text-zinc-900">
                  Max time
                </label>
                <input
                  id={`tier-${tier.id}-time-max`}
                  type="number"
                  min={1}
                  className={FIELD_CLASS_NAME}
                  value={tier.timeGuidance.maxValue}
                  onChange={(event) =>
                    handleTierTimeGuidanceChange(tier.id, "maxValue", event.target.value)
                  }
                />
                {getTierError(tier.id, "timeGuidance.maxValue") ? (
                  <p className="text-xs text-red-700">{getTierError(tier.id, "timeGuidance.maxValue")}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor={`tier-${tier.id}-time-unit`} className="text-sm font-medium text-zinc-900">
                  Time unit
                </label>
                <select
                  id={`tier-${tier.id}-time-unit`}
                  className={FIELD_CLASS_NAME}
                  value={tier.timeGuidance.unit}
                  onChange={(event) =>
                    handleTierTimeGuidanceChange(tier.id, "unit", event.target.value)
                  }
                >
                  <option value="day">day</option>
                  <option value="week">week</option>
                </select>
                {getTierError(tier.id, "timeGuidance.unit") ? (
                  <p className="text-xs text-red-700">{getTierError(tier.id, "timeGuidance.unit")}</p>
                ) : null}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-1">
                <label htmlFor={`tier-${tier.id}-quantity`} className="text-sm font-medium text-zinc-900">
                  Quantity default
                </label>
                <input
                  id={`tier-${tier.id}-quantity`}
                  type="number"
                  min={1}
                  className={FIELD_CLASS_NAME}
                  value={tier.variableDefaults.quantity}
                  onChange={(event) =>
                    handleTierVariableDefaultsChange(tier.id, "quantity", event.target.value)
                  }
                />
                {getTierError(tier.id, "variableDefaults.quantity") ? (
                  <p className="text-xs text-red-700">{getTierError(tier.id, "variableDefaults.quantity")}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor={`tier-${tier.id}-duration-value`} className="text-sm font-medium text-zinc-900">
                  Duration default
                </label>
                <input
                  id={`tier-${tier.id}-duration-value`}
                  type="number"
                  min={0}
                  className={FIELD_CLASS_NAME}
                  value={tier.variableDefaults.durationValue ?? 0}
                  onChange={(event) =>
                    handleTierVariableDefaultsChange(tier.id, "durationValue", event.target.value)
                  }
                />
                {getTierError(tier.id, "variableDefaults.durationValue") ? (
                  <p className="text-xs text-red-700">{getTierError(tier.id, "variableDefaults.durationValue")}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor={`tier-${tier.id}-duration-unit`} className="text-sm font-medium text-zinc-900">
                  Duration unit
                </label>
                <select
                  id={`tier-${tier.id}-duration-unit`}
                  className={FIELD_CLASS_NAME}
                  value={tier.variableDefaults.durationUnit ?? "none"}
                  onChange={(event) =>
                    handleTierVariableDefaultsChange(tier.id, "durationUnit", event.target.value)
                  }
                >
                  <option value="none">Not applicable</option>
                  <option value="day">day</option>
                  <option value="week">week</option>
                </select>
                {getTierError(tier.id, "variableDefaults.durationUnit") ? (
                  <p className="text-xs text-red-700">{getTierError(tier.id, "variableDefaults.durationUnit")}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor={`tier-${tier.id}-resolution`} className="text-sm font-medium text-zinc-900">
                  Resolution default
                </label>
                <select
                  id={`tier-${tier.id}-resolution`}
                  className={FIELD_CLASS_NAME}
                  value={tier.variableDefaults.resolution ?? "none"}
                  onChange={(event) =>
                    handleTierVariableDefaultsChange(tier.id, "resolution", event.target.value)
                  }
                >
                  <option value="none">Not applicable</option>
                  <option value="hd">HD</option>
                  <option value="4k">4K</option>
                  <option value="print">Print</option>
                </select>
                {getTierError(tier.id, "variableDefaults.resolution") ? (
                  <p className="text-xs text-red-700">{getTierError(tier.id, "variableDefaults.resolution")}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor={`tier-${tier.id}-revisions`} className="text-sm font-medium text-zinc-900">
                  Revisions default
                </label>
                <input
                  id={`tier-${tier.id}-revisions`}
                  type="number"
                  min={0}
                  className={FIELD_CLASS_NAME}
                  value={tier.variableDefaults.revisions}
                  onChange={(event) =>
                    handleTierVariableDefaultsChange(tier.id, "revisions", event.target.value)
                  }
                />
                {getTierError(tier.id, "variableDefaults.revisions") ? (
                  <p className="text-xs text-red-700">{getTierError(tier.id, "variableDefaults.revisions")}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <label htmlFor={`tier-${tier.id}-urgency`} className="text-sm font-medium text-zinc-900">
                  Urgency default
                </label>
                <select
                  id={`tier-${tier.id}-urgency`}
                  className={FIELD_CLASS_NAME}
                  value={tier.variableDefaults.urgency}
                  onChange={(event) =>
                    handleTierVariableDefaultsChange(tier.id, "urgency", event.target.value)
                  }
                >
                  <option value="standard">standard</option>
                  <option value="rush">rush</option>
                </select>
                {getTierError(tier.id, "variableDefaults.urgency") ? (
                  <p className="text-xs text-red-700">{getTierError(tier.id, "variableDefaults.urgency")}</p>
                ) : null}
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">Deliverables</p>
                <button
                  type="button"
                  onClick={() => addTierListField(tier.id, "deliverables")}
                  className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700"
                >
                  Add deliverable
                </button>
              </div>
              {getTierError(tier.id, "deliverables") ? (
                <p className="text-xs text-red-700">{getTierError(tier.id, "deliverables")}</p>
              ) : null}
              {tier.deliverables.map((deliverable, deliverableIndex) => (
                <div key={`${tier.id}-deliverable-${deliverableIndex}`} className="flex gap-2">
                  <input
                    aria-label={`Deliverable ${tier.title} ${deliverableIndex + 1}`}
                    type="text"
                    className={FIELD_CLASS_NAME}
                    value={deliverable}
                    onChange={(event) =>
                      updateTierListField(
                        tier.id,
                        "deliverables",
                        deliverableIndex,
                        event.target.value,
                      )
                    }
                    />
                    {getTierListItemError(tier.id, "deliverables", deliverableIndex) ? (
                      <p className="text-xs text-red-700">
                        {getTierListItemError(tier.id, "deliverables", deliverableIndex)}
                      </p>
                    ) : null}
                  <button
                    type="button"
                    onClick={() => removeTierListField(tier.id, "deliverables", deliverableIndex)}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">Process notes</p>
                <button
                  type="button"
                  onClick={() => addTierListField(tier.id, "processNotes")}
                  className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-700"
                >
                  Add note
                </button>
              </div>
              {getTierError(tier.id, "processNotes") ? (
                <p className="text-xs text-red-700">{getTierError(tier.id, "processNotes")}</p>
              ) : null}
              {tier.processNotes.map((note, noteIndex) => (
                <div key={`${tier.id}-note-${noteIndex}`} className="flex gap-2">
                  <input
                    aria-label={`Process note ${tier.title} ${noteIndex + 1}`}
                    type="text"
                    className={FIELD_CLASS_NAME}
                    value={note}
                    onChange={(event) =>
                      updateTierListField(tier.id, "processNotes", noteIndex, event.target.value)
                    }
                    />
                    {getTierListItemError(tier.id, "processNotes", noteIndex) ? (
                      <p className="text-xs text-red-700">
                        {getTierListItemError(tier.id, "processNotes", noteIndex)}
                      </p>
                    ) : null}
                  <button
                    type="button"
                    onClick={() => removeTierListField(tier.id, "processNotes", noteIndex)}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-xs"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>
        ))}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-zinc-900">Sections and line items</h3>
            <p className="mt-1 text-sm text-zinc-600">
              Define reusable sections, default content, pricing guidance, and ordering.
            </p>
          </div>
          <button
            type="button"
            onClick={addSection}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
          >
            Add section
          </button>
        </div>

        {getError("sections") ? (
          <p className="text-sm text-red-700">{getError("sections")}</p>
        ) : null}

        {formValues.sections.length === 0 ? (
          <section className="rounded-xl border border-dashed border-zinc-300 bg-white px-4 py-5 text-sm text-zinc-600">
            No sections yet. Add a section to start defining reusable package structure.
          </section>
        ) : null}

        {formValues.sections.map((section, sectionIndex) => {
          const sectionTotalCents = calculateServicePackageTotalCents([section]);

          return (
            <section
              key={section.id}
              className="space-y-4 rounded-xl border border-zinc-200 bg-white p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                    Section {sectionIndex + 1}
                  </p>
                  <p className="mt-1 text-sm text-zinc-600">
                    Section total {formatServicePackageStartingPriceLabel(sectionTotalCents)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => moveSection(section.id, -1)}
                    disabled={sectionIndex === 0}
                    aria-label={`Move section ${sectionIndex + 1} up`}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Move up
                  </button>
                  <button
                    type="button"
                    onClick={() => moveSection(section.id, 1)}
                    disabled={sectionIndex === formValues.sections.length - 1}
                    aria-label={`Move section ${sectionIndex + 1} down`}
                    className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Move down
                  </button>
                  <button
                    type="button"
                    onClick={() => removeSection(section.id)}
                    aria-label={`Remove section ${sectionIndex + 1}`}
                    className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                  >
                    Remove section
                  </button>
                </div>
              </div>

              <div className="grid gap-4 lg:grid-cols-[1.2fr,1fr]">
                <div className="space-y-1">
                  <label
                    htmlFor={`section-${section.id}-title`}
                    className="text-sm font-medium text-zinc-900"
                  >
                    Section title
                  </label>
                  <input
                    id={`section-${section.id}-title`}
                    type="text"
                    className={FIELD_CLASS_NAME}
                    value={section.title}
                    onChange={(event) =>
                      handleSectionChange(section.id, "title", event.target.value)
                    }
                    aria-invalid={
                      hasAttemptedSubmit ? Boolean(getSectionError(section.id, "title")) : undefined
                    }
                    aria-describedby={
                      getSectionError(section.id, "title")
                        ? `section-${section.id}-title-error`
                        : undefined
                    }
                  />
                  {getSectionError(section.id, "title") ? (
                    <p id={`section-${section.id}-title-error`} className="text-xs text-red-700">
                      {getSectionError(section.id, "title")}
                    </p>
                  ) : null}
                </div>

                <div className="space-y-1">
                  <label
                    htmlFor={`section-${section.id}-default-content`}
                    className="text-sm font-medium text-zinc-900"
                  >
                    Section default content
                  </label>
                  <textarea
                    id={`section-${section.id}-default-content`}
                    rows={3}
                    className={FIELD_CLASS_NAME}
                    value={section.defaultContent}
                    onChange={(event) =>
                      handleSectionChange(section.id, "defaultContent", event.target.value)
                    }
                    aria-invalid={
                      hasAttemptedSubmit
                        ? Boolean(getSectionError(section.id, "defaultContent"))
                        : undefined
                    }
                    aria-describedby={
                      getSectionError(section.id, "defaultContent")
                        ? `section-${section.id}-default-content-error`
                        : undefined
                    }
                  />
                  {getSectionError(section.id, "defaultContent") ? (
                    <p
                      id={`section-${section.id}-default-content-error`}
                      className="text-xs text-red-700"
                    >
                      {getSectionError(section.id, "defaultContent")}
                    </p>
                  ) : null}
                </div>
              </div>

              {getSectionError(section.id, "lineItems") ? (
                <p className="text-xs text-red-700">{getSectionError(section.id, "lineItems")}</p>
              ) : null}

              <div className="space-y-3">
                {section.lineItems.length === 0 ? (
                  <section className="rounded-lg border border-dashed border-zinc-300 px-4 py-4 text-sm text-zinc-600">
                    No line items yet. Add a line item to define reusable pricing guidance.
                  </section>
                ) : null}

                {section.lineItems.map((lineItem, lineItemIndex) => {
                  const lineItemTotalCents = calculateLineItemTotalCents(lineItem);

                  return (
                    <section
                      key={lineItem.id}
                      className="space-y-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4"
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                            Line item {lineItemIndex + 1}
                          </p>
                          <p className="mt-1 text-sm text-zinc-600">
                            Total {formatServicePackageStartingPriceLabel(lineItemTotalCents)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => moveLineItem(section.id, lineItem.id, -1)}
                            disabled={lineItemIndex === 0}
                            aria-label={`Move line item ${lineItemIndex + 1} up`}
                            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Move up
                          </button>
                          <button
                            type="button"
                            onClick={() => moveLineItem(section.id, lineItem.id, 1)}
                            disabled={lineItemIndex === section.lineItems.length - 1}
                            aria-label={`Move line item ${lineItemIndex + 1} down`}
                            className="rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-700 hover:bg-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Move down
                          </button>
                          <button
                            type="button"
                            onClick={() => removeLineItem(section.id, lineItem.id)}
                            aria-label={`Remove line item ${lineItemIndex + 1}`}
                            className="rounded-md border border-red-300 px-3 py-2 text-sm text-red-700 hover:bg-red-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                          >
                            Remove line item
                          </button>
                        </div>
                      </div>

                      <div className="grid gap-4 lg:grid-cols-2">
                        <div className="space-y-1 lg:col-span-2">
                          <label
                            htmlFor={`line-item-${lineItem.id}-name`}
                            className="text-sm font-medium text-zinc-900"
                          >
                            Line item name
                          </label>
                          <input
                            id={`line-item-${lineItem.id}-name`}
                            type="text"
                            className={FIELD_CLASS_NAME}
                            value={lineItem.name}
                            onChange={(event) =>
                              handleLineItemChange(section.id, lineItem.id, "name", event.target.value)
                            }
                            aria-invalid={
                              hasAttemptedSubmit ? Boolean(getLineItemError(lineItem.id, "name")) : undefined
                            }
                            aria-describedby={
                              getLineItemError(lineItem.id, "name")
                                ? `line-item-${lineItem.id}-name-error`
                                : undefined
                            }
                          />
                          {getLineItemError(lineItem.id, "name") ? (
                            <p id={`line-item-${lineItem.id}-name-error`} className="text-xs text-red-700">
                              {getLineItemError(lineItem.id, "name")}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-1 lg:col-span-2">
                          <label
                            htmlFor={`line-item-${lineItem.id}-default-content`}
                            className="text-sm font-medium text-zinc-900"
                          >
                            Line item default content
                          </label>
                          <textarea
                            id={`line-item-${lineItem.id}-default-content`}
                            rows={3}
                            className={FIELD_CLASS_NAME}
                            value={lineItem.defaultContent}
                            onChange={(event) =>
                              handleLineItemChange(
                                section.id,
                                lineItem.id,
                                "defaultContent",
                                event.target.value,
                              )
                            }
                            aria-invalid={
                              hasAttemptedSubmit
                                ? Boolean(getLineItemError(lineItem.id, "defaultContent"))
                                : undefined
                            }
                            aria-describedby={
                              getLineItemError(lineItem.id, "defaultContent")
                                ? `line-item-${lineItem.id}-default-content-error`
                                : undefined
                            }
                          />
                          {getLineItemError(lineItem.id, "defaultContent") ? (
                            <p
                              id={`line-item-${lineItem.id}-default-content-error`}
                              className="text-xs text-red-700"
                            >
                              {getLineItemError(lineItem.id, "defaultContent")}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-1">
                          <label
                            htmlFor={`line-item-${lineItem.id}-quantity`}
                            className="text-sm font-medium text-zinc-900"
                          >
                            Quantity
                          </label>
                          <input
                            id={`line-item-${lineItem.id}-quantity`}
                            type="number"
                            min={1}
                            step={1}
                            className={FIELD_CLASS_NAME}
                            value={String(lineItem.quantity)}
                            onChange={(event) =>
                              handleLineItemNumberChange(
                                section.id,
                                lineItem.id,
                                "quantity",
                                event.target.value,
                              )
                            }
                            aria-invalid={
                              hasAttemptedSubmit
                                ? Boolean(getLineItemError(lineItem.id, "quantity"))
                                : undefined
                            }
                            aria-describedby={
                              getLineItemError(lineItem.id, "quantity")
                                ? `line-item-${lineItem.id}-quantity-error`
                                : undefined
                            }
                          />
                          {getLineItemError(lineItem.id, "quantity") ? (
                            <p id={`line-item-${lineItem.id}-quantity-error`} className="text-xs text-red-700">
                              {getLineItemError(lineItem.id, "quantity")}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-1">
                          <label
                            htmlFor={`line-item-${lineItem.id}-unit-label`}
                            className="text-sm font-medium text-zinc-900"
                          >
                            Unit label
                          </label>
                          <input
                            id={`line-item-${lineItem.id}-unit-label`}
                            type="text"
                            className={FIELD_CLASS_NAME}
                            value={lineItem.unitLabel}
                            onChange={(event) =>
                              handleLineItemChange(
                                section.id,
                                lineItem.id,
                                "unitLabel",
                                event.target.value,
                              )
                            }
                            aria-invalid={
                              hasAttemptedSubmit
                                ? Boolean(getLineItemError(lineItem.id, "unitLabel"))
                                : undefined
                            }
                            aria-describedby={
                              getLineItemError(lineItem.id, "unitLabel")
                                ? `line-item-${lineItem.id}-unit-label-error`
                                : undefined
                            }
                          />
                          {getLineItemError(lineItem.id, "unitLabel") ? (
                            <p id={`line-item-${lineItem.id}-unit-label-error`} className="text-xs text-red-700">
                              {getLineItemError(lineItem.id, "unitLabel")}
                            </p>
                          ) : null}
                        </div>

                        <div className="space-y-1">
                          <label
                            htmlFor={`line-item-${lineItem.id}-unit-price`}
                            className="text-sm font-medium text-zinc-900"
                          >
                            Unit price
                          </label>
                          <input
                            id={`line-item-${lineItem.id}-unit-price`}
                            type="number"
                            min={0}
                            step="0.01"
                            className={FIELD_CLASS_NAME}
                            value={formatCurrencyInputValue(lineItem.unitPriceCents)}
                            onChange={(event) =>
                              handleLineItemNumberChange(
                                section.id,
                                lineItem.id,
                                "unitPriceCents",
                                event.target.value,
                              )
                            }
                            aria-invalid={
                              hasAttemptedSubmit
                                ? Boolean(getLineItemError(lineItem.id, "unitPriceCents"))
                                : undefined
                            }
                            aria-describedby={
                              getLineItemError(lineItem.id, "unitPriceCents")
                                ? `line-item-${lineItem.id}-unit-price-error line-item-${lineItem.id}-unit-price-help`
                                : `line-item-${lineItem.id}-unit-price-help`
                            }
                          />
                          <p id={`line-item-${lineItem.id}-unit-price-help`} className="text-xs text-zinc-500">
                            Enter the reusable unit price in dollars. The app stores whole cents.
                          </p>
                          {getLineItemError(lineItem.id, "unitPriceCents") ? (
                            <p id={`line-item-${lineItem.id}-unit-price-error`} className="text-xs text-red-700">
                              {getLineItemError(lineItem.id, "unitPriceCents")}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </section>
                  );
                })}

                <button
                  type="button"
                  onClick={() => addLineItem(section.id)}
                  className="rounded-md border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900"
                >
                  Add line item
                </button>
              </div>
            </section>
          );
        })}
      </section>

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
