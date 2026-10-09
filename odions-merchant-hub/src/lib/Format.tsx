const CURRENCY = "MAD"; // single place to change the currency label

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

export const formatCurrency = (n: number, decimals = 0) =>
  `${new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)} ${CURRENCY}`;

export const formatPercentage = (n: number | null | undefined, digits = 1) =>
  n == null || !Number.isFinite(n) ? "—" : `${n.toFixed(digits)}%`;

export const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value); // plain dates: avoid timezone shift
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

/** % change; null when there is no previous-period baseline (never fake +100%). */
export const percentChange = (current: number, previous: number): number | null =>
  previous > 0 ? ((current - previous) / previous) * 100 : null;

/** Percentage-point change between two rates. */
export const pointChange = (current: number | null, previous: number | null): number | null =>
  current == null || previous == null ? null : current - previous;