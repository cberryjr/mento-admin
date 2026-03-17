export type ClientSummary = {
  id: string;
  name: string;
  contactEmail: string;
  lastQuoteUpdatedAt: string;
};

export const clientFixtures: ClientSummary[] = [
  {
    id: "client-sunrise-yoga",
    name: "Sunrise Yoga Studio",
    contactEmail: "ops@sunriseyoga.example",
    lastQuoteUpdatedAt: "2026-03-10T15:30:00.000Z",
  },
  {
    id: "client-otter-coffee",
    name: "Otter Coffee Roasters",
    contactEmail: "hello@ottercoffee.example",
    lastQuoteUpdatedAt: "2026-03-08T12:15:00.000Z",
  },
];
