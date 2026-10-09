import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle, ArrowDownRight, ArrowUpRight, Bot, ChevronRight, RefreshCw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useAuth } from "../context/AuthContext";
import { useDashboardData, describeError } from "../hooks/useDashboardApi";
import {
  formatCurrency, formatDate, formatNumber, formatPercentage, percentChange, pointChange,
} from "../lib/format";
import type {
  CampaignPerformance, DashboardStats, DashboardTrend, RangeKey, RecentOrder,
} from "../hooks/useDashboardApi";

/* ------------------------------------------------------------------ */
/* Config: match ROUTES to your router. reports: undefined hides the button */
/* ------------------------------------------------------------------ */

const ROUTES: { orders: string; campaigns: string; audiences: string; chatbots: string; reports?: string } = {
  orders: "/orders",
  campaigns: "/campaigns",
  audiences: "/audiences",
  chatbots: "/chatbots",
  reports: undefined,
};

const RANGE_OPTIONS: Array<{ value: RangeKey; label: string }> = [
  { value: "today", label: "Today" },
  { value: "last_7_days", label: "Last 7 days" },
  { value: "last_30_days", label: "Last 30 days" },
  { value: "last_90_days", label: "Last 90 days" },
  { value: "this_month", label: "This month" },
  { value: "previous_month", label: "Previous month" },
];

const GOOD = "text-emerald-600 dark:text-emerald-400";
const BAD = "text-red-600 dark:text-red-400";

const ORDER_STATUS: Record<string, { label: string; badge: string; dot: string }> = {
  delivered:  { label: "Delivered",  badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  completed:  { label: "Completed",  badge: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400", dot: "bg-emerald-500" },
  refused:    { label: "Refused",    badge: "bg-red-500/10 text-red-700 dark:text-red-400",             dot: "bg-red-500" },
  returned:   { label: "Returned",   badge: "bg-orange-500/10 text-orange-700 dark:text-orange-400",    dot: "bg-orange-500" },
  pending:    { label: "Pending",    badge: "bg-amber-500/10 text-amber-700 dark:text-amber-400",       dot: "bg-amber-500" },
  processing: { label: "Processing", badge: "bg-violet-500/10 text-violet-700 dark:text-violet-400",    dot: "bg-violet-500" },
  shipped:    { label: "Shipped",    badge: "bg-sky-500/10 text-sky-700 dark:text-sky-400",             dot: "bg-sky-500" },
};
const orderStatus = (s: string) =>
  ORDER_STATUS[s] ?? { label: s, badge: "bg-muted text-muted-foreground", dot: "bg-muted-foreground/50" };

const CAMPAIGN_STATUS: Record<CampaignPerformance["status"], string> = {
  "En attente": "bg-amber-500/10 text-amber-700 dark:text-amber-400",
  "En cours":   "bg-sky-500/10 text-sky-700 dark:text-sky-400",
  "Envoyée":    "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  "Échouée":    "bg-red-500/10 text-red-700 dark:text-red-400",
};

/* ------------------------------------------------------------------ */
/* Small building blocks                                               */
/* ------------------------------------------------------------------ */

interface Delta { value: number | null; unit: "%" | "pp"; lowerIsBetter?: boolean }

function DeltaText({ delta, className }: { delta?: Delta; className?: string }) {
  if (!delta) return null;
  if (delta.value === null) {
    return <span className={cn("text-xs text-muted-foreground", className)}>No previous data</span>;
  }
  const v = Math.round(delta.value * 10) / 10;
  if (v === 0) return <span className={cn("text-xs text-muted-foreground", className)}>No change</span>;
  const good = delta.lowerIsBetter ? v < 0 : v > 0;
  const Icon = v > 0 ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={cn("inline-flex items-center gap-0.5 text-xs font-medium tabular-nums", good ? GOOD : BAD, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {v > 0 ? "+" : ""}{v.toFixed(1)}{delta.unit === "%" ? "%" : " pts"}
      <span className="sr-only"> compared with the previous period</span>
    </span>
  );
}

function ErrorBlock({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div role="alert" className="flex items-center justify-between gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-destructive">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden />
        {describeError(error)}
      </div>
      <Button variant="outline" size="sm" onClick={onRetry}>
        <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden />Retry
      </Button>
    </div>
  );
}

interface QueryLike { isLoading: boolean; isError: boolean; error: unknown; refetch: () => unknown }

function Panel({
  title, description, query, isEmpty, emptyTitle, emptyHint, actionLabel, onAction, children, className,
}: {
  title: string; description?: string; query: QueryLike; isEmpty?: boolean;
  emptyTitle: string; emptyHint?: string; actionLabel?: string; onAction?: () => void;
  children: ReactNode; className?: string;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card", className)}>
      <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
        {onAction && (
          <Button variant="ghost" size="sm" className="-mr-2 h-8 text-muted-foreground" onClick={onAction}>
            {actionLabel ?? "View all"}<ChevronRight className="ml-0.5 h-3.5 w-3.5" aria-hidden />
          </Button>
        )}
      </header>
      <div className="p-5">
        {query.isLoading ? (
          <div className="space-y-3" aria-busy="true">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-11 w-full" />)}
          </div>
        ) : query.isError ? (
          <ErrorBlock error={query.error} onRetry={() => query.refetch()} />
        ) : isEmpty ? (
          <div className="py-10 text-center">
            <p className="text-sm font-medium text-foreground">{emptyTitle}</p>
            {emptyHint && <p className="mt-1 text-sm text-muted-foreground">{emptyHint}</p>}
          </div>
        ) : children}
      </div>
    </section>
  );
}

/** One cell of a divided KPI strip: a single card, not a wall of identical boxes. */
function Kpi({ label, value, delta, note }: { label: string; value: string; delta?: Delta; note?: string }) {
  return (
    <div className="flex flex-col gap-1.5 bg-card p-5">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tracking-tight text-foreground tabular-nums">{value}</span>
      <div className="flex min-h-4 items-center gap-2">
        <DeltaText delta={delta} />
        {note && <span className="text-xs text-muted-foreground">{note}</span>}
      </div>
    </div>
  );
}

function KpiStrip({ cols, children }: { cols: string; children: ReactNode }) {
  return (
    <div className={cn("grid gap-px overflow-hidden rounded-xl border border-border bg-border", cols)}>
      {children}
    </div>
  );
}

function KpiSkeleton({ count, cols }: { count: number; cols: string }) {
  return (
    <div className={cn("grid gap-px overflow-hidden rounded-xl border border-border bg-border", cols)} aria-busy="true">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="space-y-3 bg-card p-5">
          <Skeleton className="h-4 w-24" /><Skeleton className="h-7 w-20" /><Skeleton className="h-3 w-28" />
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Charts (plain SVG, real data only, no extra dependency)             */
/* ------------------------------------------------------------------ */

function AreaChart({ points, getValue, format, label }: {
  points: DashboardTrend[]; getValue: (p: DashboardTrend) => number; format: (n: number) => string; label: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const values = useMemo(() => points.map(getValue), [points, getValue]);
  const max = Math.max(0, ...values);

  if (!points.length || max === 0) {
    return <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">No activity in this period</p>;
  }

  const W = 100, H = 40;
  const x = (i: number) => (points.length === 1 ? W / 2 : (i / (points.length - 1)) * W);
  const y = (v: number) => H - (v / max) * (H - 3) - 1.5;
  const line = values.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(2)},${y(v).toFixed(2)}`).join(" ");
  const area = `${line} L${x(values.length - 1).toFixed(2)},${H} L${x(0).toFixed(2)},${H} Z`;
  const active = hover ?? null;

  return (
    <div role="img" aria-label={`${label}, highest day ${format(max)}`}>
      <div className="mb-2 flex h-5 items-center justify-between text-xs text-muted-foreground">
        <span>{active !== null ? formatDate(points[active].date) : `${formatDate(points[0].date)} to ${formatDate(points[points.length - 1].date)}`}</span>
        <span className="font-medium text-foreground tabular-nums">{active !== null ? format(values[active]) : `Peak ${format(max)}`}</span>
      </div>
      <div className="relative h-44" onMouseLeave={() => setHover(null)}>
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="h-full w-full overflow-visible">
          {[0.25, 0.5, 0.75].map((g) => (
            <line key={g} x1="0" x2={W} y1={H * g} y2={H * g} className="stroke-border" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          ))}
          <path d={area} className="fill-primary/10" />
          <path d={line} className="fill-none stroke-primary" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {active !== null && (
            <line x1={x(active)} x2={x(active)} y1="0" y2={H} className="stroke-primary/40" strokeWidth="1" vectorEffect="non-scaling-stroke" />
          )}
        </svg>
        {active !== null && (
          <span
            className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card bg-primary"
            style={{ left: `${(x(active) / W) * 100}%`, top: `${(y(values[active]) / H) * 100}%` }}
          />
        )}
        <div className="absolute inset-0 flex">
          {points.map((p, i) => (
            <div key={p.date} className="h-full flex-1" onMouseEnter={() => setHover(i)} />
          ))}
        </div>
      </div>
    </div>
  );
}

function StatusDistribution({ byStatus }: { byStatus: Record<string, number> }) {
  const entries = Object.entries(byStatus).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((s, [, n]) => s + n, 0);
  if (!total) return <p className="flex h-48 items-center justify-center text-sm text-muted-foreground">No orders in this period</p>;
  return (
    <div className="space-y-5">
      <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full" role="img" aria-label="Order status distribution">
        {entries.map(([s, n]) => (
          <div key={s} className={orderStatus(s).dot} style={{ width: `${(n / total) * 100}%` }} title={`${orderStatus(s).label}: ${n}`} />
        ))}
      </div>
      <ul className="space-y-2.5">
        {entries.map(([s, n]) => (
          <li key={s} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span className={cn("h-2 w-2 rounded-full", orderStatus(s).dot)} aria-hidden />{orderStatus(s).label}
            </span>
            <span className="tabular-nums text-foreground">
              {formatNumber(n)} <span className="text-muted-foreground">{formatPercentage((n / total) * 100, 0)}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sections                                                            */
/* ------------------------------------------------------------------ */

const pctDelta = (a: number, b: number, lowerIsBetter = false): Delta => ({ value: percentChange(a, b), unit: "%", lowerIsBetter });

function OrderKpis({ stats }: { stats: DashboardStats }) {
  const { current: c, previous: p } = stats.orders;
  return (
    <KpiStrip cols="grid-cols-2 lg:grid-cols-4">
      <Kpi label="Orders" value={formatNumber(c.total)} delta={pctDelta(c.total, p.total)} />
      <Kpi label="Delivered" value={formatNumber(c.delivered)} delta={pctDelta(c.delivered, p.delivered)} />
      <Kpi label="Refused" value={formatNumber(c.refused)} delta={pctDelta(c.refused, p.refused, true)} />
      <Kpi label="Returned" value={formatNumber(c.returned)} delta={pctDelta(c.returned, p.returned, true)} />
      <Kpi label="Pending" value={formatNumber(c.pending)} delta={pctDelta(c.pending, p.pending, true)} />
      <Kpi label="Customers" value={formatNumber(c.customers)} delta={pctDelta(c.customers, p.customers)} note="Unique by email or name" />
      <Kpi
        label="Average order value"
        value={c.avgOrderValue == null ? "—" : formatCurrency(c.avgOrderValue, 2)}
        delta={{ value: c.avgOrderValue != null && p.avgOrderValue != null ? percentChange(c.avgOrderValue, p.avgOrderValue) : null, unit: "%" }}
        note="Delivered orders"
      />
      <Kpi
        label="Delivery rate"
        value={formatPercentage(c.deliveryRate)}
        delta={{ value: pointChange(c.deliveryRate, p.deliveryRate), unit: "pp" }}
        note="Delivered of total"
      />
    </KpiStrip>
  );
}

function WhatsAppKpis({ stats }: { stats: DashboardStats }) {
  const { current: c, previous: p } = stats.whatsapp;
  return (
    <KpiStrip cols="grid-cols-2 lg:grid-cols-5">
      <Kpi label="Campaigns sent" value={formatNumber(c.campaignsSent)} delta={pctDelta(c.campaignsSent, p.campaignsSent)} />
      <Kpi label="Messages sent" value={formatNumber(c.messagesSent)} delta={pctDelta(c.messagesSent, p.messagesSent)} note="Accepted by WhatsApp" />
      <Kpi label="Delivery rate" value={formatPercentage(c.deliveryRate)} delta={{ value: pointChange(c.deliveryRate, p.deliveryRate), unit: "pp" }} />
      <Kpi label="Read rate" value={formatPercentage(c.readRate)} delta={{ value: pointChange(c.readRate, p.readRate), unit: "pp" }} />
      <Kpi label="Failed messages" value={formatNumber(c.failed)} delta={pctDelta(c.failed, p.failed, true)} />
    </KpiStrip>
  );
}

function RecentOrdersList({ orders }: { orders: RecentOrder[] }) {
  return (
    <ul className="-my-2 divide-y divide-border">
      {orders.map((o) => {
        const s = orderStatus(o.status);
        return (
          <li key={o.id} className="flex items-center justify-between gap-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{o.orderNumber ?? "No order number"}</p>
              <p className="truncate text-xs text-muted-foreground">{o.customer ?? "Unknown customer"}</p>
              <p className="text-xs text-muted-foreground">{formatDate(o.createdAt)}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <span className="text-sm font-medium tabular-nums text-foreground">{formatCurrency(o.amount, 2)}</span>
              <Badge variant="secondary" className={cn("border-0 font-medium", s.badge)}>{s.label}</Badge>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

function RateBar({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="tabular-nums text-foreground">{formatPercentage(value, 0)}</span>
      </div>
      <Progress value={value ?? 0} className="h-1.5" />
    </div>
  );
}

function CampaignList({ campaigns }: { campaigns: CampaignPerformance[] }) {
  return (
    <ul className="-my-2 divide-y divide-border">
      {campaigns.map((c) => (
        <li key={c.id} className="space-y-3 py-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">{c.name}</p>
              <p className="truncate text-xs text-muted-foreground">{c.audienceName ?? "No audience"}</p>
              <p className="text-xs text-muted-foreground">
                {c.sentAt ? `Sent ${formatDate(c.sentAt)}` : `Created ${formatDate(c.createdAt)}`}
              </p>
            </div>
            <Badge variant="secondary" className={cn("shrink-0 border-0 font-medium", CAMPAIGN_STATUS[c.status] ?? "bg-muted text-muted-foreground")}>
              {c.status}
            </Badge>
          </div>
          {c.hasReport ? (
            <>
              <dl className="grid grid-cols-5 gap-2 text-xs">
                {[
                  ["Recipients", c.total],
                  ["Sent", c.sent],
                  ["Delivered", c.delivered],
                  ["Read", c.read],
                  ["Failed", c.failed],
                ].map(([k, v]) => (
                  <div key={k as string}>
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="font-medium tabular-nums text-foreground">{v == null ? "—" : formatNumber(v as number)}</dd>
                  </div>
                ))}
              </dl>
              <div className="grid grid-cols-2 gap-4">
                <RateBar label="Delivery rate" value={c.deliveryRate} />
                <RateBar label="Read rate" value={c.readRate} />
              </div>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No report yet. Results appear after the campaign is sent.</p>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */

export default function Dashboard() {
  const { user, session } = useAuth();
  const navigate = useNavigate();
  const [range, setRange] = useState<RangeKey>("last_30_days");

  const getToken = useCallback((): string | null => {
    if (session?.access_token) return session.access_token;
    try {
      const stored = localStorage.getItem("supabaseSession");
      return stored ? (JSON.parse(stored) as { access_token?: string }).access_token ?? null : null;
    } catch {
      return null;
    }
  }, [session?.access_token]);

  const { stats, recentOrders, campaigns, audiences, chatbots } = useDashboardData(user?.id, range, getToken);
  const s = stats.data;

  const revenueOf = useCallback((p: DashboardTrend) => p.revenue, []);
  const ordersOf = useCallback((p: DashboardTrend) => p.orders, []);
  const revenueDelta = s ? pctDelta(s.orders.current.revenue, s.orders.previous.revenue) : undefined;

  return (
    <div className="mx-auto max-w-7xl space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Orders, WhatsApp campaigns and chatbots for your store.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={range} onValueChange={(v) => setRange(v as RangeKey)}>
            <SelectTrigger className="w-44 bg-card" aria-label="Date range"><SelectValue /></SelectTrigger>
            <SelectContent>
              {RANGE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {ROUTES.reports && <Button onClick={() => navigate(ROUTES.reports!)}>View reports</Button>}
        </div>
      </div>

      {/* Hero: revenue + status */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <section className="rounded-xl border border-border bg-card lg:col-span-2" aria-label="Revenue">
          <div className="flex items-start justify-between gap-4 p-6 pb-2">
            <div>
              <p className="text-sm text-muted-foreground">Revenue from delivered orders</p>
              {stats.isLoading ? (
                <Skeleton className="mt-2 h-10 w-48" />
              ) : s ? (
                <p className="mt-1 text-4xl font-semibold tracking-tight text-foreground tabular-nums sm:text-5xl">
                  {formatCurrency(s.orders.current.revenue)}
                </p>
              ) : null}
            </div>
            {s && <div className="pt-1 text-right"><DeltaText delta={revenueDelta} /><p className="text-xs text-muted-foreground">vs previous period</p></div>}
          </div>
          <div className="p-6 pt-4">
            {stats.isLoading ? (
              <Skeleton className="h-52 w-full" />
            ) : stats.isError || !s ? (
              <ErrorBlock error={stats.error} onRetry={() => stats.refetch()} />
            ) : (
              <AreaChart points={s.trend} getValue={revenueOf} format={(n) => formatCurrency(n)} label="Daily revenue" />
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-card" aria-label="Order status">
          <header className="border-b border-border px-5 py-4">
            <h2 className="text-sm font-semibold text-foreground">Order status</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">Share of orders in this period</p>
          </header>
          <div className="p-5">
            {stats.isLoading ? (
              <div className="space-y-3"><Skeleton className="h-3 w-full" />{Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-5 w-full" />)}</div>
            ) : stats.isError || !s ? (
              <ErrorBlock error={stats.error} onRetry={() => stats.refetch()} />
            ) : (
              <StatusDistribution byStatus={s.orders.current.byStatus} />
            )}
          </div>
        </section>
      </div>

      {/* Order KPIs */}
      <section className="space-y-3" aria-labelledby="orders-h">
        <h2 id="orders-h" className="text-base font-semibold text-foreground">Orders</h2>
        {stats.isLoading ? <KpiSkeleton count={8} cols="grid-cols-2 lg:grid-cols-4" />
          : stats.isError || !s ? <ErrorBlock error={stats.error} onRetry={() => stats.refetch()} />
          : <OrderKpis stats={s} />}
      </section>

      {/* Orders trend */}
      <section className="rounded-xl border border-border bg-card" aria-label="Orders per day">
        <header className="border-b border-border px-5 py-4">
          <h2 className="text-sm font-semibold text-foreground">Orders per day</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">All orders, any status</p>
        </header>
        <div className="p-5">
          {stats.isLoading ? <Skeleton className="h-48 w-full" />
            : stats.isError || !s ? <ErrorBlock error={stats.error} onRetry={() => stats.refetch()} />
            : <AreaChart points={s.trend} getValue={ordersOf} format={formatNumber} label="Daily orders" />}
        </div>
      </section>

      {/* WhatsApp KPIs */}
      <section className="space-y-3" aria-labelledby="wa-h">
        <h2 id="wa-h" className="text-base font-semibold text-foreground">WhatsApp</h2>
        {stats.isLoading ? <KpiSkeleton count={5} cols="grid-cols-2 lg:grid-cols-5" />
          : stats.isError || !s ? <ErrorBlock error={stats.error} onRetry={() => stats.refetch()} />
          : <WhatsAppKpis stats={s} />}
      </section>

      {/* Lists */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Panel
          title="Recent orders" description="Your latest five orders" query={recentOrders}
          isEmpty={!recentOrders.data?.length} emptyTitle="No orders yet" emptyHint="New orders will show up here as they come in."
          actionLabel="All orders" onAction={() => navigate(ROUTES.orders)}
        >
          <RecentOrdersList orders={recentOrders.data ?? []} />
        </Panel>

        <Panel
          title="Campaign performance" description="Your latest WhatsApp campaigns" query={campaigns}
          isEmpty={!campaigns.data?.length} emptyTitle="No campaigns yet" emptyHint="Create a campaign to reach an audience on WhatsApp."
          actionLabel="All campaigns" onAction={() => navigate(ROUTES.campaigns)}
        >
          <CampaignList campaigns={campaigns.data ?? []} />
        </Panel>

        <Panel
          title="Audiences" description="Your saved customer groups" query={audiences}
          isEmpty={!audiences.data?.totalAudiences} emptyTitle="No audiences yet" emptyHint="Build an audience to target a campaign."
          actionLabel="All audiences" onAction={() => navigate(ROUTES.audiences)}
        >
          {audiences.data && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 divide-x divide-border rounded-lg border border-border">
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">Audiences</p>
                  <p className="text-2xl font-semibold tabular-nums">{formatNumber(audiences.data.totalAudiences)}</p>
                </div>
                <div className="p-4">
                  <p className="text-xs text-muted-foreground">Contacts across audiences</p>
                  <p className="text-2xl font-semibold tabular-nums">{formatNumber(audiences.data.totalContacts)}</p>
                </div>
              </div>
              <div>
                <p className="mb-3 text-xs font-medium text-muted-foreground">Largest audiences</p>
                <ul className="space-y-3">
                  {audiences.data.largest.map((a) => {
                    const top = audiences.data!.largest[0].size;
                    return (
                      <li key={a.id} className="space-y-1.5">
                        <div className="flex justify-between gap-3 text-sm">
                          <span className="truncate text-foreground">{a.name}</span>
                          <span className="tabular-nums text-muted-foreground">{formatNumber(a.size)}</span>
                        </div>
                        <Progress value={top ? (a.size / top) * 100 : 0} className="h-1.5" />
                      </li>
                    );
                  })}
                </ul>
              </div>
              <p className="text-xs text-muted-foreground">Audiences can overlap, so the total is not a count of unique customers.</p>
            </div>
          )}
        </Panel>

        <Panel
          title="Chatbots" description="Which assistants are switched on, and where" query={chatbots}
          isEmpty={!chatbots.data?.total} emptyTitle="No chatbots yet" emptyHint="Create a chatbot to answer customers automatically."
          actionLabel="Manage chatbots" onAction={() => navigate(ROUTES.chatbots)}
        >
          {chatbots.data && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Bot className="h-4 w-4 text-muted-foreground" aria-hidden />
                <span className="font-medium text-foreground">{chatbots.data.active} active</span>
                <span className="text-muted-foreground">out of {chatbots.data.total}</span>
              </div>
              <ul className="-my-2 divide-y divide-border">
                {chatbots.data.chatbots.map((b) => (
                  <li key={b.id} className="flex items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{b.name ?? "Untitled chatbot"}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {b.channels.length ? b.channels.map((c) => c.charAt(0).toUpperCase() + c.slice(1)).join(", ") : "No channel enabled"}
                      </p>
                      <p className="text-xs text-muted-foreground">{b.scenarioCount} {b.scenarioCount === 1 ? "scenario" : "scenarios"}</p>
                    </div>
                    <Badge variant="secondary" className={cn("shrink-0 border-0 font-medium", b.isActive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-muted text-muted-foreground")}>
                      {b.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </li>
                ))}
              </ul>
              <p className="text-xs text-muted-foreground">Conversation counts and resolution rate are not tracked yet.</p>
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}