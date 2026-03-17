import type { ActionResult } from "@/lib/validation/action-result";

export type InvoiceSummary = {
  id: string;
  invoiceNumber: string;
  title: string;
  status: "draft" | "sent" | "paid";
  updatedAt: string;
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
