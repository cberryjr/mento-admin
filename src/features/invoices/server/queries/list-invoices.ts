import type { ActionResult } from "@/lib/validation/action-result";

export type InvoiceSummary = {
  id: string;
  invoiceNumber: string;
  status: "draft" | "sent" | "paid";
};

export async function listInvoices(): Promise<
  ActionResult<{ invoices: InvoiceSummary[] }> & { meta?: { total: number } }
> {
  const invoices: InvoiceSummary[] = [];

  return {
    ok: true,
    data: {
      invoices,
    },
    meta: {
      total: invoices.length,
    },
  };
}
