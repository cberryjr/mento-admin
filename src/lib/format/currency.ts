type FormatCurrencyOptions = {
  currency?: string;
  locale?: string;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
};

const DEFAULT_CURRENCY = "USD";
const DEFAULT_LOCALE = "en-US";

export function formatCurrency(amount: number, options: FormatCurrencyOptions = {}) {
  const {
    currency = DEFAULT_CURRENCY,
    locale = DEFAULT_LOCALE,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = options;

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount);
}

export function formatCurrencyFromCents(
  cents: number,
  options: FormatCurrencyOptions = {},
) {
  return formatCurrency(cents / 100, options);
}
