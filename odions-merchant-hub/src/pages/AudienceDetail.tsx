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
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

const API_URL = "http://localhost:3000/api";

const AudienceDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const accessToken = session?.access_token;

  // 🟢 Helper to attach headers with Authorization
  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  });

  // 🟢 Fetch audience data
  const { data: audience, isLoading: audienceLoading } = useQuery({
    queryKey: ["audience", id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/audiences/${id}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch audience");
      const json = await res.json();
      return json.audience;
    },
    enabled: !!id && !!accessToken,
  });

  // 🟢 Fetch audience-related orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["audience-orders", id],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/orders?audienceId=${id}`, {
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to fetch orders");
      const json = await res.json();
      return json.orders || [];
    },
    enabled: !!audience && !!accessToken,
  });

  const avgOrderValue = orders.length > 0
    ? orders.reduce((sum, order) => sum + Number(order.amount), 0) / orders.length
    : 0;

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

  if (!audience) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/audiences">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <p className="text-muted-foreground">
            Audience not found or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/audiences">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{audience.name}</h1>
          <p className="text-muted-foreground mt-1">
            Created on {format(new Date(audience.created_at), "MMMM dd, yyyy")}
          </p>
        </div>
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Criteria Applied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{audience.criteria_summary || "No criteria"}</div>
            <p className="text-xs text-muted-foreground mt-1">Audience filter</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{orders.length.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">In this segment</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${avgOrderValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per order</p>
          </CardContent>
        </Card>
      </div>

      {/* Orders Table */}
      <Card>
        <CardHeader>
          <CardTitle>Orders in Audience</CardTitle>
          <CardDescription>Detailed view of all orders matching your criteria</CardDescription>
        </CardHeader>
        <CardContent>
          {ordersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No orders found for this audience.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client Name</TableHead>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery Company</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">{order.client_name}</TableCell>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>${Number(order.amount).toFixed(2)}</TableCell>
                    <TableCell>{format(new Date(order.created_at), "MMM dd, yyyy")}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          order.status === "delivered"
                            ? "default"
                            : order.status === "pending"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.delivery_company_name || "N/A"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AudienceDetail;
