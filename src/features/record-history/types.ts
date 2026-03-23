export type RecordChainNodeMetadata = {
  label: string;
  value: string;
};

export type RecordChainNodeLink = {
  href: string;
  label: string;
  ariaLabel: string;
};

export type RecordChainNode = {
  entityType: "client" | "quote" | "quote_revision" | "invoice";
  entityId: string;
  label: string;
  status?: string;
  timestamp?: string;
  href: string;
  isCurrent: boolean;
  children?: RecordChainNode[];
  metadata?: RecordChainNodeMetadata[];
  relatedLinks?: RecordChainNodeLink[];
};

export type RecordChain = {
  client: RecordChainNode;
  quoteChain: {
    quote: RecordChainNode;
    revisions: RecordChainNode[];
    invoices: RecordChainNode[];
  }[];
  currentEntity: RecordChainNode;
};

export type EntityType = "client" | "quote" | "invoice";
