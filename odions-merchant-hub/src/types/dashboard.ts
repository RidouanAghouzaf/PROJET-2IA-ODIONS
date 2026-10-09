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
