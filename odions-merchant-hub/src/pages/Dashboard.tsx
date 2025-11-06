import React, { useMemo } from "react";
import {
  ShoppingCart,
  XCircle,
  Users,
  MessageSquare,
  Bot,
  TrendingUp,
  DollarSign,
  Package
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function Dashboard() {
  const { user, session } = useAuth();
  const API_BASE_URL = "http://localhost:3000/api";

  // ===== TOKEN + FETCH LOGIC =====
  const getAccessToken = () => {
    if (session?.access_token) return session.access_token;
    try {
      const storedSession = localStorage.getItem("supabaseSession");
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        return parsed.access_token;
      }
    } catch (error) {
      console.error("Error parsing stored session:", error);
    }
    return null;
  };

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const token = getAccessToken();
    if (!token) throw new Error("No access token");

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || "Request failed");
    }
    return data;
  };

  // ===== FETCH ORDERS =====
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: () =>
      apiCall(`${API_BASE_URL}/orders?userId=${user?.id}`).then((res) =>
        Array.isArray(res) ? res : Array.isArray(res.orders) ? res.orders : []
      ),
    enabled: !!user?.id,
  });

  // ===== CALCULATE METRICS =====
  const metrics = useMemo(() => {
    if (!orders.length) {
      return {
        totalOrders: 0,
        refusedOrders: 0,
        revenue: 0,
        activeCustomers: 0,
        deliveredOrders: 0,
        pendingOrders: 0,
        returnedOrders: 0,
        avgOrderValue: 0,
        recentOrders: [],
        uniqueCustomers: new Set(),
        conversionRate: 0,
      };
    }

    const totalOrders = orders.length;
    const refusedOrders = orders.filter((o: any) => o.status === "refused").length;
    const deliveredOrders = orders.filter((o: any) => o.status === "delivered").length;
    const pendingOrders = orders.filter((o: any) => o.status === "pending").length;
    const returnedOrders = orders.filter((o: any) => o.status === "returned").length;
    
    const revenue = orders.reduce((sum: number, order: any) => {
      return sum + (parseFloat(order.amount) || 0);
    }, 0);

    const uniqueCustomers = new Set(
      orders.map((o: any) => o.client_email || o.client_name).filter(Boolean)
    );

    const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;
    const conversionRate = totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    const recentOrders = [...orders]
      .sort((a: any, b: any) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )
      .slice(0, 4);

    return {
      totalOrders,
      refusedOrders,
      revenue,
      activeCustomers: uniqueCustomers.size,
      deliveredOrders,
      pendingOrders,
      returnedOrders,
      avgOrderValue,
      recentOrders,
      uniqueCustomers,
      conversionRate,
    };
  }, [orders]);

  // ===== CALCULATE TRENDS =====
  const trends = useMemo(() => {
    if (!orders.length) return { orders: 0, revenue: 0, customers: 0, refused: 0, conversion: 0, avgValue: 0 };

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const recentOrders = orders.filter(
      (o: any) => new Date(o.created_at) >= thirtyDaysAgo
    );
    const previousOrders = orders.filter(
      (o: any) =>
        new Date(o.created_at) >= sixtyDaysAgo &&
        new Date(o.created_at) < thirtyDaysAgo
    );

    const calculateChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const recentRevenue = recentOrders.reduce(
      (sum: number, o: any) => sum + (parseFloat(o.amount) || 0),
      0
    );
    const previousRevenue = previousOrders.reduce(
      (sum: number, o: any) => sum + (parseFloat(o.amount) || 0),
      0
    );

    const recentCustomers = new Set(
      recentOrders.map((o: any) => o.client_email || o.client_name)
    ).size;
    const previousCustomers = new Set(
      previousOrders.map((o: any) => o.client_email || o.client_name)
    ).size;

    const recentRefused = recentOrders.filter((o: any) => o.status === "refused").length;
    const previousRefused = previousOrders.filter((o: any) => o.status === "refused").length;

    const recentDelivered = recentOrders.filter((o: any) => o.status === "delivered").length;
    const previousDelivered = previousOrders.filter((o: any) => o.status === "delivered").length;
    
    const recentConversion = recentOrders.length > 0 ? (recentDelivered / recentOrders.length) * 100 : 0;
    const previousConversion = previousOrders.length > 0 ? (previousDelivered / previousOrders.length) * 100 : 0;

    const recentAvgValue = recentOrders.length > 0 ? recentRevenue / recentOrders.length : 0;
    const previousAvgValue = previousOrders.length > 0 ? previousRevenue / previousOrders.length : 0;

    return {
      orders: calculateChange(recentOrders.length, previousOrders.length),
      revenue: calculateChange(recentRevenue, previousRevenue),
      customers: calculateChange(recentCustomers, previousCustomers),
      refused: calculateChange(recentRefused, previousRefused),
      conversion: recentConversion - previousConversion,
      avgValue: recentAvgValue - previousAvgValue,
    };
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "delivered":
      case "completed":
        return "bg-blue-500/20 text-blue-400 dark:bg-blue-500/20 dark:text-blue-400 border-0";
      case "refused":
        return "bg-red-500/20 text-red-400 dark:bg-red-500/20 dark:text-red-400 border-0";
      case "pending":
        return "bg-red-500/20 text-red-400 dark:bg-red-500/20 dark:text-red-400 border-0";
      case "processing":
        return "bg-purple-500/20 text-purple-400 dark:bg-purple-500/20 dark:text-purple-400 border-0";
      case "shipped":
        return "bg-gray-500/20 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400 border-0";
      default:
        return "bg-gray-500/20 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400 border-0";
    }
  };

  // Mock campaign data
  const mockCampaigns = [
    { name: "Summer Sale 2024", sent: 1250, opened: 892, status: "active" },
    { name: "New Product Launch", sent: 850, opened: 623, status: "completed" },
    { name: "Customer Retention", sent: 0, opened: 0, status: "scheduled" },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back! Here's what's happening with your business.</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700 text-white">
          View Reports
        </Button>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Orders */}
        <div className="bg-card border border-border rounded-lg p-6 hover:border-muted-foreground/20 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-sm">Total Orders</span>
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-foreground">{metrics.totalOrders.toLocaleString()}</div>
            <div className={`text-sm ${trends.orders >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trends.orders >= 0 ? '+' : ''}{trends.orders.toFixed(1)}% vs last month
            </div>
          </div>
        </div>

        {/* Refused Orders */}
        <div className="bg-card border border-border rounded-lg p-6 hover:border-muted-foreground/20 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-sm">Refused Orders</span>
            <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-foreground">{metrics.refusedOrders}</div>
            <div className={`text-sm ${trends.refused <= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trends.refused >= 0 ? '+' : ''}{trends.refused.toFixed(1)}% vs last month
            </div>
          </div>
        </div>

        {/* Revenue */}
        <div className="bg-card border border-border rounded-lg p-6 hover:border-muted-foreground/20 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-sm">Revenue</span>
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-foreground">${metrics.revenue.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}</div>
            <div className={`text-sm ${trends.revenue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trends.revenue >= 0 ? '+' : ''}{trends.revenue.toFixed(1)}% vs last month
            </div>
          </div>
        </div>

        {/* Active Customers */}
        <div className="bg-card border border-border rounded-lg p-6 hover:border-muted-foreground/20 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-sm">Active Customers</span>
            <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-foreground">{metrics.activeCustomers.toLocaleString()}</div>
            <div className={`text-sm ${trends.customers >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trends.customers >= 0 ? '+' : ''}{trends.customers.toFixed(1)}% vs last month
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Campaigns Sent - Mock Data */}
        <div className="bg-card border border-border rounded-lg p-6 hover:border-muted-foreground/20 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-sm">Campaigns Sent</span>
            <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-foreground">15</div>
            <div className="text-sm text-green-500">+3 vs last month</div>
          </div>
        </div>

        {/* Chatbot Sessions - Mock Data */}
        <div className="bg-card border border-border rounded-lg p-6 hover:border-muted-foreground/20 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-sm">Chatbot Sessions</span>
            <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-500" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-foreground">892</div>
            <div className="text-sm text-green-500">+25.6% vs last month</div>
          </div>
        </div>

        {/* Conversion Rate */}
        <div className="bg-card border border-border rounded-lg p-6 hover:border-muted-foreground/20 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-sm">Conversion Rate</span>
            <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-foreground">{metrics.conversionRate.toFixed(1)}%</div>
            <div className={`text-sm ${trends.conversion >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trends.conversion >= 0 ? '+' : ''}{trends.conversion.toFixed(1)}% vs last month
            </div>
          </div>
        </div>

        {/* Avg Order Value */}
        <div className="bg-card border border-border rounded-lg p-6 hover:border-muted-foreground/20 transition-colors">
          <div className="flex items-center justify-between mb-4">
            <span className="text-muted-foreground text-sm">Avg Order Value</span>
            <div className="w-10 h-10 bg-orange-500/10 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-orange-500" />
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-3xl font-bold text-foreground">${metrics.avgOrderValue.toFixed(2)}</div>
            <div className={`text-sm ${trends.avgValue >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              {trends.avgValue >= 0 ? '+' : ''}${Math.abs(trends.avgValue).toFixed(2)} vs last month
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Recent Orders</CardTitle>
            <CardDescription className="text-muted-foreground">Latest orders from your customers</CardDescription>
          </CardHeader>
          <CardContent>
            {metrics.recentOrders.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No orders yet</p>
            ) : (
              <div className="space-y-4">
                {metrics.recentOrders.map((order: any) => (
                  <div key={order.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center">
                        <Package className="w-4 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{order.order_number}</p>
                        <p className="text-sm text-muted-foreground">{order.client_name}</p>
                      </div>
                    </div>
                    <div className="text-right flex items-center gap-3">
                      <span className="font-medium text-foreground">${parseFloat(order.amount).toFixed(2)}</span>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Campaign Performance</CardTitle>
            <CardDescription className="text-muted-foreground">Recent marketing campaign results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {mockCampaigns.map((campaign, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {campaign.sent > 0 && `${campaign.sent} sent • ${campaign.opened} opened`}
                      </p>
                    </div>
                    <Badge 
                      className={
                        campaign.status === "active" 
                          ? "bg-blue-500/20 text-blue-400 border-0" 
                          : campaign.status === "completed"
                          ? "bg-purple-500/20 text-purple-400 border-0"
                          : "bg-gray-500/20 text-gray-600 dark:text-gray-400 border-0"
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  {campaign.sent > 0 && (
                    <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"
                        style={{ width: `${(campaign.opened / campaign.sent) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Additional Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Audience Overview */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Audience Overview</CardTitle>
            <CardDescription className="text-muted-foreground">Customer segmentation breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-foreground">
                  <span className="text-sm">VIP Customers</span>
                  <span className="font-medium">142 (10%)</span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: '10%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-foreground">
                  <span className="text-sm">Regular Customers</span>
                  <span className="font-medium">857 (60%)</span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: '60%' }} />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-foreground">
                  <span className="text-sm">New Customers</span>
                  <span className="font-medium">430 (30%)</span>
                </div>
                <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                  <div className="absolute h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full" style={{ width: '30%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Chatbot Status */}
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-foreground">Chatbot Status</CardTitle>
            <CardDescription className="text-muted-foreground">AI assistant performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-muted-foreground">Status</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-0">Online</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Conversations Today</span>
                <span className="font-medium text-foreground">127</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Resolution Rate</span>
                <span className="font-medium text-foreground">94%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Response Time</span>
                <span className="font-medium text-foreground">1.2s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}