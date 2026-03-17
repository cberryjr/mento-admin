export type ClientInput = {
  name: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
};

export type ClientRecord = ClientInput & {
  id: string;
  studioId: string;
  createdAt: string;
  updatedAt: string;
};

export type ClientSummary = {
  id: string;
  name: string;
  contactEmail: string;
  updatedAt: string;
};

export function toClientSummary(client: ClientRecord): ClientSummary {
  return {
    id: client.id,
    name: client.name,
    contactEmail: client.contactEmail,
    updatedAt: client.updatedAt,
  };
}
