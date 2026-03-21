import type { QuoteSectionRecord } from "@/features/quotes/types";
import { calculateQuoteTotalCents } from "@/features/quotes/types";
import { formatCurrencyFromCents } from "@/lib/format/currency";

type QuoteStructureViewProps = {
  sections: QuoteSectionRecord[];
};

function calculateSectionTotal(section: QuoteSectionRecord): number {
  return section.lineItems.reduce((total, li) => total + li.lineTotalCents, 0);
}

export function QuoteStructureView({ sections }: QuoteStructureViewProps) {
  if (sections.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-6 text-center">
        <p className="text-sm text-zinc-600">
          No sections generated yet. Generate quote content from the selected
          service packages to start editing.
        </p>
      </div>
    );
  }

  const grandTotal = calculateQuoteTotalCents(sections);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
          Quote structure ({sections.length} sections)
        </p>
      </div>

      {sections.map((section) => {
        const sectionTotal = calculateSectionTotal(section);

        return (
          <section
            key={section.id}
            className="rounded-xl border border-zinc-200 bg-white p-5"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-zinc-900">
                  {section.title}
                </h3>
                {section.content ? (
                  <p className="mt-1 text-sm text-zinc-600">
                    {section.content}
                  </p>
                ) : null}
              </div>
              <p className="text-sm font-semibold text-zinc-900">
                {formatCurrencyFromCents(sectionTotal)}
              </p>
            </div>

            {section.lineItems.length > 0 ? (
              <div className="mt-4">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-zinc-200 text-left text-xs font-medium uppercase tracking-wide text-zinc-500">
                      <th className="pb-2 pr-3">Item</th>
                      <th className="pb-2 pr-3">Qty</th>
                      <th className="pb-2 pr-3">Unit</th>
                      <th className="pb-2 pr-3 text-right">Unit Price</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {section.lineItems.map((lineItem) => (
                      <tr
                        key={lineItem.id}
                        className="border-b border-zinc-100 last:border-0"
                      >
                        <td className="py-2 pr-3">
                          <p className="font-medium text-zinc-900">
                            {lineItem.name}
                          </p>
                          {lineItem.content ? (
                            <p className="text-xs text-zinc-500">
                              {lineItem.content}
                            </p>
                          ) : null}
                        </td>
                        <td className="py-2 pr-3 text-zinc-700">
                          {lineItem.quantity}
                        </td>
                        <td className="py-2 pr-3 text-zinc-700">
                          {lineItem.unitLabel || "—"}
                        </td>
                        <td className="py-2 pr-3 text-right text-zinc-700">
                          {formatCurrencyFromCents(lineItem.unitPriceCents)}
                        </td>
                        <td className="py-2 text-right font-medium text-zinc-900">
                          {formatCurrencyFromCents(lineItem.lineTotalCents)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
          </section>
        );
      })}

      <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-5 py-4">
        <p className="text-base font-semibold text-zinc-900">Grand total</p>
        <p className="text-lg font-bold text-zinc-900">
          {formatCurrencyFromCents(grandTotal)}
        </p>
      </div>
    </div>
  );
}
