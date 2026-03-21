import {
  computeQuoteEstimateBreakdown,
  getDefaultEstimateTierKey,
} from "@/features/quotes/server/calculators/estimate-breakdown";
import type { ServicePackageDetailRecord } from "@/features/service-packages/types";
import { getServicePackageById } from "@/features/service-packages/server/queries/get-service-package-by-id";
import { setQuoteEstimateBreakdownSnapshot } from "@/features/quotes/server/quotes-repository";
import type {
  EstimateBreakdownPayload,
  QuoteDetailRecord,
} from "@/features/quotes/types";

function hasCurrentSnapshot(quote: QuoteDetailRecord): boolean {
  if (!quote.estimateBreakdown) {
    return false;
  }

  const currentSectionIds = quote.sections
    .map((section) => section.id)
    .sort()
    .join(":");
  const snapshotSectionIds = quote.estimateBreakdown.sectionBreakdowns
    .map((section) => section.sectionId)
    .sort()
    .join(":");

  if (
    quote.estimateBreakdown.quoteId !== quote.id ||
    currentSectionIds !== snapshotSectionIds
  ) {
    return false;
  }

  const computedAt = Date.parse(quote.estimateBreakdown.computedAt);
  const updatedAt = Date.parse(quote.updatedAt);

  return Number.isFinite(computedAt) && Number.isFinite(updatedAt)
    ? computedAt >= updatedAt
    : false;
}

function getStoredTierKeys(quote: QuoteDetailRecord): Map<string, string> {
  const tierKeys = new Map<string, string>();

  for (const section of quote.estimateBreakdown?.sectionBreakdowns ?? []) {
    tierKeys.set(section.sectionId, section.source.tierKey);
  }

  return tierKeys;
}

export async function syncQuoteEstimateBreakdownSnapshot(
  quote: QuoteDetailRecord,
): Promise<EstimateBreakdownPayload | null> {
  if (quote.sections.length === 0) {
    if (quote.estimateBreakdown) {
      await setQuoteEstimateBreakdownSnapshot(quote.id, null);
    }

    return null;
  }

  if (hasCurrentSnapshot(quote)) {
    return quote.estimateBreakdown ?? null;
  }

  const servicePackageIds = Array.from(
    new Set(
      quote.sections
        .map((section) => section.sourceServicePackageId)
        .filter(Boolean),
    ),
  );
  const servicePackageResults = await Promise.all(
    servicePackageIds.map(async (servicePackageId) => {
      const result = await getServicePackageById(servicePackageId);
      return [servicePackageId, result] as const;
    }),
  );
  const servicePackages = new Map<string, ServicePackageDetailRecord>();

  for (const [servicePackageId, result] of servicePackageResults) {
    if (result.ok) {
      servicePackages.set(servicePackageId, result.data.servicePackage);
    }
  }

  if (
    quote.sections.some(
      (section) => !servicePackages.has(section.sourceServicePackageId),
    )
  ) {
    return quote.estimateBreakdown ?? null;
  }

  const tierKeys = getStoredTierKeys(quote);

  for (const section of quote.sections) {
    if (tierKeys.has(section.id)) {
      continue;
    }

    const sourcePackage = servicePackages.get(section.sourceServicePackageId);

    if (sourcePackage) {
      tierKeys.set(
        section.id,
        getDefaultEstimateTierKey(sourcePackage.complexityTiers),
      );
    }
  }

  const { sectionBreakdowns, grandTotal } = computeQuoteEstimateBreakdown(
    quote.sections,
    servicePackages,
    tierKeys,
  );
  const estimateBreakdown: EstimateBreakdownPayload = {
    quoteId: quote.id,
    computedAt: new Date().toISOString(),
    sectionBreakdowns,
    grandTotal,
  };

  await setQuoteEstimateBreakdownSnapshot(quote.id, estimateBreakdown);

  return estimateBreakdown;
}
