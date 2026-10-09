"use client";

import React, { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const COLORS = ["#4f46e5", "#14b8a6", "#f97316", "#ef4444", "#eab308", "#8b5cf6"];

export default function Analytics() {
  const { session } = useAuth();
  const API_BASE_URL = "http://localhost:3000/api/analytics";

  const getAccessToken = () => {
    if (session?.access_token) return session.access_token;
    try {
      const storedSession = localStorage.getItem("supabaseSession");
      if (storedSession) return JSON.parse(storedSession).access_token;
    } catch (e) {
      console.error(e);
    }
    return null;
  };

  const apiCall = async (endpoint: string) => {
    const token = getAccessToken();
    if (!token) throw new Error("No access token");
    const res = await fetch(`${API_BASE_URL}/${endpoint}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error?.message || "Request failed");
    return data;
  };

  // ===== Fetch overview =====
  const { data: overview, isLoading: loadingOverview } = useQuery({
    queryKey: ["analyticsOverview"],
    queryFn: () => apiCall("overview"),
  });

  // ===== Fetch revenue trend =====
  const { data: revenueData, isLoading: loadingRevenue } = useQuery({
    queryKey: ["revenueData"],
    queryFn: () => apiCall("revenue"),
  });

  if (loadingOverview || loadingRevenue) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-20 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  // ===== Process revenue for charts =====
  const revenueTrend = revenueData?.revenue.map((d: any) => ({
    month: d.month,
    campaigns: d.campaigns,
    openRate: d.openRate * 100,
    conversionRate: d.conversionRate * 100,
  })) || [];

  const customerSegmentation = [
    { name: "VIP", value: Math.floor((overview?.analytics?.audiences?.total || 1) * 0.1) },
    { name: "Regular", value: Math.floor((overview?.analytics?.audiences?.total || 1) * 0.6) },
    { name: "New", value: Math.floor((overview?.analytics?.audiences?.total || 1) * 0.3) },
  ];

  const campaignStats = [
    { name: "Total Campaigns", value: overview?.analytics?.campaigns?.total || 0 },
    { name: "Avg Open Rate", value: overview?.analytics?.campaigns?.avgOpenRate || 0 },
    { name: "Avg Conversion Rate", value: overview?.analytics?.campaigns?.avgConversionRate || 0 },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
      <p className="text-muted-foreground">
        Overview of campaigns, audiences, and performance trends
      </p>

      {/* Top Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {campaignStats.map((stat, index) => (
          <Card key={index}>
            <CardHeader>
              <CardTitle>{stat.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stat.value.toFixed?.(2) || stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue Trend Line Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue & Campaign Trends</CardTitle>
          <CardDescription>
            Monthly campaigns, open rate & conversion rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="campaigns" stroke={COLORS[0]} strokeWidth={3} />
              <Line type="monotone" dataKey="openRate" stroke={COLORS[1]} strokeWidth={3} />
              <Line type="monotone" dataKey="conversionRate" stroke={COLORS[2]} strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Customer Segmentation Pie Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Customer Segmentation</CardTitle>
          <CardDescription>
            Distribution of VIP, Regular, and New Customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={customerSegmentation}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {customerSegmentation.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Campaign Performance Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Campaign Performance</CardTitle>
          <CardDescription>
            Campaigns sent vs open rate vs conversion rate
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueTrend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="campaigns" fill={COLORS[0]} />
              <Bar dataKey="openRate" fill={COLORS[1]} />
              <Bar dataKey="conversionRate" fill={COLORS[2]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
