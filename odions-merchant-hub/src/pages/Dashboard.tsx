import React from "react";
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
import { MetricCard } from "@/components/dashboard/MetricCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export default function Dashboard() {
  const mockOrders = [
    { id: "ORD-001", customer: "Alice Johnson", amount: "$299.99", status: "completed" },
    { id: "ORD-002", customer: "Bob Smith", amount: "$149.50", status: "processing" },
    { id: "ORD-003", customer: "Carol Brown", amount: "$89.99", status: "shipped" },
    { id: "ORD-004", customer: "David Wilson", amount: "$199.99", status: "pending" },
  ];

  const mockCampaigns = [
    { name: "Summer Sale 2024", status: "active", sent: 1250, opened: 892 },
    { name: "New Product Launch", status: "completed", sent: 850, opened: 623 },
    { name: "Customer Retention", status: "scheduled", sent: 0, opened: 0 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your business.</p>
        </div>
        <Button className="bg-gradient-primary hover:opacity-90">
          View Reports
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Total Orders"
          value="2,847"
          change="+12.5%"
          changeType="positive"
          icon={ShoppingCart}
        />
        <MetricCard
          title="Refused Orders"
          value="34"
          change="-2.3%"
          changeType="positive"
          icon={XCircle}
        />
        <MetricCard
          title="Revenue"
          value="$84,392"
          change="+18.2%"
          changeType="positive"
          icon={DollarSign}
        />
        <MetricCard
          title="Active Customers"
          value="1,429"
          change="+8.1%"
          changeType="positive"
          icon={Users}
        />
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          title="Campaigns Sent"
          value="15"
          change="+3"
          changeType="positive"
          icon={MessageSquare}
        />
        <MetricCard
          title="Chatbot Sessions"
          value="892"
          change="+25.6%"
          changeType="positive"
          icon={Bot}
        />
        <MetricCard
          title="Conversion Rate"
          value="3.2%"
          change="+0.4%"
          changeType="positive"
          icon={TrendingUp}
        />
        <MetricCard
          title="Avg Order Value"
          value="$127.50"
          change="+$12.30"
          changeType="positive"
          icon={Package}
        />
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Orders</CardTitle>
            <CardDescription>Latest orders from your customers</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <Package className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{order.id}</p>
                      <p className="text-sm text-muted-foreground">{order.customer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{order.amount}</p>
                    <Badge 
                      variant={
                        order.status === "completed" ? "default" : 
                        order.status === "processing" ? "secondary" : 
                        order.status === "shipped" ? "outline" : "destructive"
                      }
                      className="text-xs"
                    >
                      {order.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Campaign Performance */}
        <Card>
          <CardHeader>
            <CardTitle>Campaign Performance</CardTitle>
            <CardDescription>Recent marketing campaign results</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockCampaigns.map((campaign, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{campaign.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {campaign.sent > 0 && `${campaign.sent} sent`}
                        {campaign.opened > 0 && ` • ${campaign.opened} opened`}
                      </p>
                    </div>
                    <Badge 
                      variant={
                        campaign.status === "active" ? "default" : 
                        campaign.status === "completed" ? "secondary" : "outline"
                      }
                    >
                      {campaign.status}
                    </Badge>
                  </div>
                  {campaign.sent > 0 && (
                    <Progress 
                      value={(campaign.opened / campaign.sent) * 100} 
                      className="h-2"
                    />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Audience & Chatbot Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Audience Overview</CardTitle>
            <CardDescription>Customer segmentation breakdown</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">VIP Customers</span>
                <span className="font-medium">142 (10%)</span>
              </div>
              <Progress value={10} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Regular Customers</span>
                <span className="font-medium">857 (60%)</span>
              </div>
              <Progress value={60} className="h-2" />
              
              <div className="flex items-center justify-between">
                <span className="text-sm">New Customers</span>
                <span className="font-medium">430 (30%)</span>
              </div>
              <Progress value={30} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Chatbot Status</CardTitle>
            <CardDescription>AI assistant performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span className="text-sm">Status</span>
                </div>
                <Badge className="bg-success/10 text-success">Online</Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Conversations Today</span>
                <span className="font-medium">127</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Resolution Rate</span>
                <span className="font-medium">94%</span>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm">Avg Response Time</span>
                <span className="font-medium">1.2s</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}