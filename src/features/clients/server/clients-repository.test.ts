import { beforeEach, describe, expect, it } from "vitest";

import {
  __resetClientsStore,
  createClientRecord,
  getClientById,
  listClientsForStudio,
  updateClientRecord,
} from "@/features/clients/server/clients-repository";

describe("clientsRepository", () => {
  beforeEach(() => {
    __resetClientsStore();
  });

  it("lists only studio-scoped clients in a stable alphabetical order", async () => {
    const clients = await listClientsForStudio("default-studio");

    expect(clients.map((client) => client.name)).toEqual([
      "Otter Coffee Roasters",
      "Sunrise Yoga Studio",
    ]);
  });

  it("creates a client record that can be loaded again", async () => {
    const created = await createClientRecord("default-studio", {
      name: "Northwind Creative",
      contactName: "Casey Jones",
      contactEmail: "casey@example.com",
      contactPhone: "+1 555 0100",
    });

    const loaded = await getClientById(created.id);

    expect(loaded).toMatchObject({
      studioId: "default-studio",
      name: "Northwind Creative",
      contactName: "Casey Jones",
      contactEmail: "casey@example.com",
      contactPhone: "+1 555 0100",
    });
  });

  it("updates an existing client without changing its original created timestamp", async () => {
    const existing = await getClientById("client-sunrise-yoga");

    expect(existing).not.toBeNull();

    const updated = await updateClientRecord("default-studio", "client-sunrise-yoga", {
      name: "Sunrise Yoga Collective",
      contactName: "Avery Patel",
      contactEmail: "hello@sunriseyoga.example",
      contactPhone: "+1 555 0123",
    });

    expect(updated).toMatchObject({
      id: "client-sunrise-yoga",
      name: "Sunrise Yoga Collective",
      contactName: "Avery Patel",
      contactEmail: "hello@sunriseyoga.example",
      contactPhone: "+1 555 0123",
    });
    expect(updated?.createdAt).toBe(existing?.createdAt);
    expect(updated?.updatedAt).not.toBe(existing?.updatedAt);
  });
});
