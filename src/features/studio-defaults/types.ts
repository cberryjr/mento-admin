export type StudioDefaultsInput = {
  studioName: string;
  studioContactName: string;
  studioContactEmail: string;
  studioContactPhone: string;
  defaultQuoteTerms: string;
  defaultInvoicePaymentInstructions: string;
};

export type StudioDefaultsRecord = {
  studioId: string;
  studioName: string;
  studioContactName: string;
  studioContactEmail: string;
  studioContactPhone: string;
  defaultQuoteTerms: string;
  defaultInvoicePaymentInstructions: string;
  // Stable contract consumed by downstream quote/invoice prefill workflows.
  prefill: {
    studioName: string;
    studioContactDetails: {
      name: string;
      email: string;
      phone: string;
    };
    defaultQuoteTerms: string;
    defaultInvoicePaymentInstructions: string;
  };
  createdAt: string;
  updatedAt: string;
};

export function buildStudioDefaultsPrefill(input: StudioDefaultsInput) {
  return {
    studioName: input.studioName,
    studioContactDetails: {
      name: input.studioContactName,
      email: input.studioContactEmail,
      phone: input.studioContactPhone,
    },
    defaultQuoteTerms: input.defaultQuoteTerms,
    defaultInvoicePaymentInstructions: input.defaultInvoicePaymentInstructions,
  };
}
