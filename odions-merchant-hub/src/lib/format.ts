const CURRENCY = "MAD";

export const formatNumber = (n: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(n);

export const formatCurrency = (n: number, decimals = 0) =>
  `${new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals }).format(n)} ${CURRENCY}`;

export const formatPercentage = (n: number | null | undefined, digits = 1) =>
  n == null || !Number.isFinite(n) ? "—" : `${n.toFixed(digits)}%`;

export const formatDate = (value?: string | null) => {
  if (!value) return "—";
  const d = new Date(value.length === 10 ? `${value}T12:00:00` : value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

export const percentChange = (current: number, previous: number): number | null =>
  previous > 0 ? ((current - previous) / previous) * 100 : null;

export const pointChange = (current: number | null, previous: number | null): number | null =>
  current == null || previous == null ? null : current - previous;
