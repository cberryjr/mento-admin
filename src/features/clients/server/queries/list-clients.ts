import type { ActionResult } from "@/lib/validation/action-result";
import { clientFixtures, type ClientSummary } from "./client-fixtures";

export async function listClients(): Promise<
  ActionResult<{ clients: ClientSummary[] }> & { meta?: { total: number } }
> {
  return {
    ok: true,
    data: {
      clients: clientFixtures,
    },
    meta: {
      total: clientFixtures.length,
    },
  };
}
