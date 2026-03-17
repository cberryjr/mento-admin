import type { ActionResult } from "@/lib/validation/action-result";
import { ERROR_CODES } from "@/lib/errors/error-codes";
import { clientFixtures, type ClientSummary } from "./client-fixtures";

export async function getClientById(
  clientId: string,
): Promise<ActionResult<{ client: ClientSummary }>> {
  const client = clientFixtures.find((item) => item.id === clientId);

  if (!client) {
    return {
      ok: false,
      error: {
        code: ERROR_CODES.UNKNOWN,
        message: "Client not found.",
      },
    };
  }

  return {
    ok: true,
    data: {
      client,
    },
  };
}
