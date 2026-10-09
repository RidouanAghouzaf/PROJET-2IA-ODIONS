import { useQuery, keepPreviousData } from "@tanstack/react-query";

/* ---------- Types ---------- */
export type RangeKey =
  | "today" | "last_7_days" | "last_30_days" | "last_90_days" | "this_month" | "previous_month";

export interface OrderKpis {
  total: number;
  delivered: number;
  refused: number;
  pending: number;
  returned: number;
  byStatus: Record<string, number>;
  revenue: number;
  customers: number;
  avgOrderValue: number | null;
  deliveryRate: number | null;
}

export interface WhatsAppKpis {
  campaignsSent: number;
  messagesSent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: number | null;
  readRate: number | null;
}

export interface DashboardTrend { date: string; orders: number; revenue: number }

export interface DashboardStats {
  range: { key: RangeKey; from: string; to: string; previousFrom: string; previousTo: string };
  orders: { current: OrderKpis; previous: OrderKpis };
  whatsapp: { current: WhatsAppKpis; previous: WhatsAppKpis };
  trend: DashboardTrend[];
}

export interface RecentOrder {
  id: string;
  orderNumber: string | null;
  customer: string | null;
  amount: number;
  status: string;
  createdAt: string;
}

export type CampaignStatus = "En attente" | "En cours" | "Envoyée" | "Échouée";

export interface CampaignPerformance {
  id: string;
  name: string;
  status: CampaignStatus;
  audienceName: string | null;
  createdAt: string | null;
  sentAt: string | null;
  total: number | null;
  sent: number;
  delivered: number;
  read: number;
  failed: number;
  deliveryRate: number | null;
  readRate: number | null;
  hasReport: boolean;
}

export interface AudienceOverview {
  totalAudiences: number;
  totalContacts: number;
  largest: Array<{ id: string; name: string; size: number }>;
}

export interface ChatbotSummary {
  id: string;
  name: string | null;
  isActive: boolean;
  channels: string[];
  scenarioCount: number;
  updatedAt: string | null;
}

export interface ChatbotStatus { total: number; active: number; chatbots: ChatbotSummary[] }

/* ---------- API + hook ---------- */


const API_BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/api"; // public URL, not a secret

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message);
    this.name = "ApiError";
  }
}

async function apiGet<T>(path: string, token: string | null, params?: Record<string, string>): Promise<T> {
  if (!token) throw new ApiError("Authentication required", 401, "NO_TOKEN");
  const qs = params ? `?${new URLSearchParams(params).toString()}` : "";
  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}${path}${qs}`, {
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    });
  } catch {
    throw new ApiError("Network error", 0, "NETWORK");
  }
  let body: any = null; // eslint-disable-line @typescript-eslint/no-explicit-any -- untyped error envelope
  try { body = await res.json(); } catch { /* non-JSON body */ }
  if (!res.ok) {
    const msg = body?.error?.message ?? (typeof body?.error === "string" ? body.error : "Request failed");
    throw new ApiError(msg, res.status, body?.error?.code);
  }
  return body as T;
}

export function describeError(err: unknown): string {
  if (!(err instanceof ApiError)) return "Something went wrong. Please try again.";
  switch (err.status) {
    case 0:   return "Cannot reach the server. Check your connection.";
    case 401: return "Your session has expired. Please sign in again.";
    case 403: return "You don't have permission to view this data.";
    case 404: return "This data could not be found.";
    case 429: return "Too many requests. Please wait a moment and retry.";
    default:  return err.status >= 500 ? "The server had a problem. Please retry shortly." : err.message;
  }
}

const retry = (count: number, err: unknown) =>
  !(err instanceof ApiError && [400, 401, 403, 404, 429].includes(err.status)) && count < 2;

export function useDashboardData(userId: string | undefined, range: RangeKey, getToken: () => string | null) {
  const base = { enabled: !!userId, staleTime: 60_000, retry } as const;

  const stats = useQuery({
    queryKey: ["dashboard", "stats", userId, range],
    queryFn: () => apiGet<DashboardStats>("/dashboard/stats", getToken(), { range }),
    placeholderData: keepPreviousData,
    ...base,
  });
  const recentOrders = useQuery({
    queryKey: ["dashboard", "recent-orders", userId],
    queryFn: async () => (await apiGet<{ orders: RecentOrder[] }>("/dashboard/recent-orders", getToken(), { limit: "5" })).orders,
    ...base,
  });
  const campaigns = useQuery({
    queryKey: ["dashboard", "campaigns", userId],
    queryFn: async () => (await apiGet<{ campaigns: CampaignPerformance[] }>("/dashboard/campaign-performance", getToken())).campaigns,
    // Poll only while a campaign is actually sending
    refetchInterval: (q) => (q.state.data?.some((c) => c.status === "En cours") ? 10_000 : false),
    ...base,
  });
  const audiences = useQuery({
    queryKey: ["dashboard", "audiences", userId],
    queryFn: () => apiGet<AudienceOverview>("/dashboard/audience-overview", getToken()),
    ...base,
  });
  const chatbots = useQuery({
    queryKey: ["dashboard", "chatbots", userId],
    queryFn: () => apiGet<ChatbotStatus>("/dashboard/chatbot-status", getToken()),
    ...base,
  });

  return { stats, recentOrders, campaigns, audiences, chatbots };
}