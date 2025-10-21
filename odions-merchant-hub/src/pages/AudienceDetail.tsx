import { ArrowLeft, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const AudienceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();

  const accessToken = session?.access_token;

  const formatDate = (dateString: string | null | undefined, formatStr: string) => {
  if (!dateString) return "—";
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "—";
    return format(date, formatStr);
  } catch (error) {
    return "—";
  }
};

  // Helper to attach headers with Authorization
  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  });

  // Fetch audience details
  const { data: audience, isLoading: audienceLoading, error: audienceError } = useQuery({
  queryKey: ["audience", id],
  queryFn: async () => {
    const res = await fetch(`${API_URL}/audiences/${id}`, {
      headers: getHeaders(),
    });
    if (res.status === 401) throw new Error("Unauthorized. Please log in again.");
    if (res.status === 404) throw new Error("Audience not found");
    if (!res.ok) throw new Error("Failed to fetch audience");
    const data = await res.json();
    
    // If the API returns { audience: {...} }, extract it
    return data.audience || data;
  },
  enabled: !!id && !!accessToken,
  });

  // Fetch orders for this audience
  const { data: ordersData, isLoading: ordersLoading } = useQuery({
    queryKey: ["audience-orders", id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/orders?audience_id=${id}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const json = await res.json();
      return json.orders || [];
    },
    enabled: !!id && !!accessToken && !!audience,
  });

  const orders = ordersData || [];

  // Calculate statistics
  const avgOrderValue = orders.length > 0
    ? orders.reduce((sum: number, order: any) => sum + Number(order.amount || 0), 0) / orders.length
    : 0;

  const totalRevenue = orders.reduce((sum: number, order: any) => sum + Number(order.amount || 0), 0);

  // Export function
  const handleExport = () => {
    if (!orders.length) return;

    const csvContent = [
      ["Client Name", "Order Number", "Amount", "Date", "Status", "Delivery Company"],
      ...orders.map((order: any) => [
        order.client_name || "",
        order.order_number || "",
        order.amount || 0,
        format(new Date(order.created_at), "yyyy-MM-dd"),
        order.status || "",
        order.delivery_company?.name || order.delivery_company || "N/A",
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audience-${audience?.name || id}-orders.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  if (!id) {
    return (
      <div className="space-y-6">
        <p className="text-muted-foreground">Audience ID is missing.</p>
      </div>
    );
  }

  if (audienceLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-12 w-full" />
        <div className="grid gap-4 md:grid-cols-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (audienceError || !audience) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => navigate("/audiences")}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Audience Not Found</h1>
          <p className="text-muted-foreground mt-1">
            The audience you're looking for doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    </div>
  );
}

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate("/audiences")}
          title="Back to audiences"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{audience.name}</h1>
          <p className="text-muted-foreground mt-1">
            {audience.description || "No description"}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Created on {formatDate(audience.created_at, "MMMM dd, yyyy")}
          </p>
        </div>
        <Button onClick={handleExport} disabled={orders.length === 0}>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Audience Size</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {audience.size?.toLocaleString() || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Target size</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {orders.length.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              In this segment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Avg Order Value
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${avgOrderValue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per order</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From this audience
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Audience Details Card */}
      <Card>
        <CardHeader>
          <CardTitle>Audience Information</CardTitle>
          <CardDescription>Details about this audience segment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Name</p>
              <p className="text-base mt-1">{audience.name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Size Limit
              </p>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Size Limit
                </p>
                <p className="text-base mt-1">
                  {audience.size && audience.size > 0
                    ? audience.size.toLocaleString()
                    : "Unlimited"}
                </p>
              </div>
            </div>
            <div className="md:col-span-2">
              <p className="text-sm font-medium text-muted-foreground">
                Description
              </p>
              <p className="text-base mt-1">
                {audience.description || "No description provided"}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Created
              </p>
              <p className="text-base mt-1">
                {formatDate(audience.created_at, "MMMM dd, yyyy 'at' hh:mm a")}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Last Updated
              </p>
              <p className="text-base mt-1">
                {formatDate(audience.updated_at, "MMMM dd, yyyy 'at' hh:mm a")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders in Audience</CardTitle>
          <CardDescription>
            {orders.length > 0
              ? `Showing ${orders.length} order${
                  orders.length !== 1 ? "s" : ""
                } matching your criteria`
              : "No orders found for this audience"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">
                No orders found for this audience.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Orders will appear here as they match your audience criteria.
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client Name</TableHead>
                    <TableHead>Order Number</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Delivery Company</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order: any) => (
                    <TableRow
                      key={order.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      <TableCell className="font-medium">
                        {order.client_name || "—"}
                      </TableCell>
                      <TableCell>{order.order_number || "—"}</TableCell>
                      <TableCell className="text-right">
                        ${Number(order.amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {formatDate(order.created_at, "MMM dd, yyyy")}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === "delivered"
                              ? "default"
                              : order.status === "pending"
                              ? "secondary"
                              : order.status === "cancelled"
                              ? "destructive"
                              : "outline"
                          }
                        >
                          {order.status || "unknown"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.delivery_company?.name ||
                          order.delivery_company ||
                          "N/A"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AudienceDetail;