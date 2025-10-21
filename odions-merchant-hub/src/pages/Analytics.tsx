import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Users, Send, TrendingUp, Percent } from "lucide-react";

interface Stats {
  totalAudiences: number;
  totalCampaigns: number;
  avgOpenRate: number;
  avgConversionRate: number;
}

export default function Reports() {
  const [stats, setStats] = useState<Stats>({
    totalAudiences: 0,
    totalCampaigns: 0,
    avgOpenRate: 0,
    avgConversionRate: 0,
  });

  const [performanceData, setPerformanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) return console.warn("No JWT token found");

        // 1️⃣ Fetch Overview analytics
        const overviewRes = await fetch("http://localhost:5000/api/analytics/overview", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const overviewData = await overviewRes.json();
        if (overviewRes.ok) {
          const analytics = overviewData.analytics;

          setStats({
            totalAudiences: analytics.users.total_users,
            totalCampaigns: analytics.campaigns.total,
            avgOpenRate:
              analytics.campaigns.total_recipients > 0
                ? Math.round((analytics.campaigns.total_opens / analytics.campaigns.total_recipients) * 100)
                : 0,
            avgConversionRate:
              analytics.orders.total > 0
                ? Math.round((analytics.orders.delivered / analytics.orders.total) * 100)
                : 0,
          });
        }

        // 2️⃣ Fetch Revenue data (for chart)
        const revenueRes = await fetch("http://localhost:5000/api/analytics/revenue?period=month", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const revenueData = await revenueRes.json();

        if (revenueRes.ok) {
          // backend returns: [{ period, revenue, orders }]
          const chartData = revenueData.revenue.map((item: any) => ({
            month: item.period,
            campaigns: item.orders,
            openRate:
              analytics.campaigns.total_recipients > 0
                ? Math.round((analytics.campaigns.total_opens / analytics.campaigns.total_recipients) * 100)
                : 0,
            conversionRate:
              analytics.orders.total > 0
                ? Math.round((analytics.orders.delivered / analytics.orders.total) * 100)
                : 0,
          }));

          setPerformanceData(chartData);
        }
      } catch (error) {
        console.error("Error fetching analytics:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return <p className="text-muted-foreground">Loading analytics...</p>;

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="text-3xl font-bold">Analytics & Reports</h1>
      <p className="text-muted-foreground">
        Visualize your campaigns and audience performance over time
      </p>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Audiences</p>
              <p className="text-2xl font-bold">{stats.totalAudiences}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Send className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Total Campaigns</p>
              <p className="text-2xl font-bold">{stats.totalCampaigns}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <TrendingUp className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Open Rate</p>
              <p className="text-2xl font-bold">{stats.avgOpenRate}%</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <Percent className="h-6 w-6 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">Avg Conversion</p>
              <p className="text-2xl font-bold">{stats.avgConversionRate}%</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="openRate">Open Rate</TabsTrigger>
          <TabsTrigger value="conversionRate">Conversion Rate</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Campaigns per Month</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="campaigns" fill="#3b82f6" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="openRate">
          <Card>
            <CardHeader>
              <CardTitle>Open Rate Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="openRate" stroke="#10b981" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="conversionRate">
          <Card>
            <CardHeader>
              <CardTitle>Conversion Rate Trend</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Line type="monotone" dataKey="conversionRate" stroke="#f97316" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
