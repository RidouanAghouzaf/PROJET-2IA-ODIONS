import { useState } from "react";
import { Search, Plus, Pencil, Trash2, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";

type OrderStatus = "pending" | "delivered" | "refused" | "returned";

interface FormData {
  client_name: string;
  client_email: string;
  amount: string;
  status: OrderStatus;
  delivery_company_id: string;
  order_number: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case "delivered":
      return "bg-green-500/10 text-green-400 border border-green-500/20";
    case "refused":
      return "bg-red-500/10 text-red-400 border border-red-500/20";
    case "pending":
      return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20";
    case "returned":
      return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
    default:
      return "bg-gray-500/10 text-gray-400 border border-gray-500/20";
  }
};

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<any>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    client_name: "",
    client_email: "",
    amount: "",
    status: "pending",
    delivery_company_id: "",
    order_number: "",
  });

  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
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
    if (!token) {
      toast({
        title: "Authentication required",
        description: "Please log in again",
        variant: "destructive",
      });
      throw new Error("No access token");
    }

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

  // ===== QUERIES =====
  const { data: deliveryCompanies = [] } = useQuery({
    queryKey: ["delivery_companies"],
    queryFn: () =>
      apiCall(`${API_BASE_URL}/delivery_companies`).then((res) =>
        Array.isArray(res)
          ? res
          : Array.isArray(res.delivery_companies)
          ? res.delivery_companies
          : []
      ),
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["orders", user?.id],
    queryFn: () =>
      apiCall(`${API_BASE_URL}/orders?userId=${user?.id}`).then((res) =>
        Array.isArray(res) ? res : Array.isArray(res.orders) ? res.orders : []
      ),
    enabled: !!user?.id,
  });

  // ===== MUTATIONS =====
  const createMutation = useMutation({
    mutationFn: async (values: FormData) =>
      apiCall(`${API_BASE_URL}/orders`, {
        method: "POST",
        body: JSON.stringify({ ...values, userId: user?.id }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
      toast({ title: "Order created successfully" });
      setOpen(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, values }: { id: string; values: FormData }) =>
      apiCall(`${API_BASE_URL}/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
      toast({ title: "Order updated successfully" });
      setEditingOrder(null);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) =>
      apiCall(`${API_BASE_URL}/orders/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["orders", user?.id] });
      toast({ title: "Order deleted successfully" });
      setDeleteOrderId(null);
    },
  });

  // ===== HELPERS =====
  const resetForm = () =>
    setFormData({
      client_name: "",
      client_email: "",
      amount: "",
      status: "pending",
      delivery_company_id: "",
      order_number: "",
    });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingOrder)
      updateMutation.mutate({ id: editingOrder.id, values: formData });
    else createMutation.mutate(formData);
  };

  // ===== FILTERS =====
  const filteredOrders = (orders || []).filter((order: any) => {
    const matchesSearch =
      order.client_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // ===== UI =====
  return (
    <div className="space-y-6 text-foreground">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Orders Overview</h1>
          <p className="text-muted-foreground mt-1">
            Manage and track all your orders
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" /> New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="dark:bg-[#0A0A0A] dark:text-white sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>
                {editingOrder ? "Edit Order" : "Create Order"}
              </DialogTitle>
              <DialogDescription>
                Fill out the form below to{" "}
                {editingOrder ? "update" : "add"} a new order.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Client Name</Label>
                  <Input
                    value={formData.client_name}
                    onChange={(e) =>
                      setFormData({ ...formData, client_name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.client_email}
                    onChange={(e) =>
                      setFormData({ ...formData, client_email: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    value={formData.amount}
                    onChange={(e) =>
                      setFormData({ ...formData, amount: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Order Number</Label>
                  <Input
                    value={formData.order_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        order_number: e.target.value,
                      })
                    }
                    required
                  />
                </div>
                <div>
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(v) =>
                      setFormData({ ...formData, status: v as OrderStatus })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                      <SelectItem value="refused">Refused</SelectItem>
                      <SelectItem value="returned">Returned</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Delivery Company</Label>
                  <Select
                    value={formData.delivery_company_id}
                    onValueChange={(v) =>
                      setFormData({ ...formData, delivery_company_id: v })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select Company" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.isArray(deliveryCompanies) &&
                        deliveryCompanies.map((company: any) => (
                          <SelectItem key={company.id} value={company.id}>
                            {company.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full">
                  {editingOrder ? "Update" : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* ✅ FILTERS BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-1/3">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by client or order number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="refused">Refused</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* ===== ORDERS TABLE ===== */}
      <Card className="dark:bg-[#0A0A0A] border border-gray-800 shadow-lg">
        <CardHeader>
          <CardTitle>Orders List</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="w-full h-32" />
          ) : filteredOrders.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">
              No orders found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((order: any) => (
                  <TableRow key={order.id}>
                    <TableCell>{order.order_number}</TableCell>
                    <TableCell>{order.client_name}</TableCell>
                    <TableCell>{order.client_email}</TableCell>
                    <TableCell>{order.amount}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {order.delivery_companies?.name || "N/A"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(order.created_at), "yyyy-MM-dd")}
                    </TableCell>
                    <TableCell className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingOrder(order);
                          setFormData({
                            client_name: order.client_name,
                            client_email: order.client_email || "",
                            amount: order.amount?.toString() || "",
                            status: order.status,
                            delivery_company_id:
                              order.delivery_company_id || "",
                            order_number: order.order_number,
                          });
                          setOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteOrderId(order.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* DELETE CONFIRMATION */}
      <AlertDialog
        open={!!deleteOrderId}
        onOpenChange={() => setDeleteOrderId(null)}
      >
        <AlertDialogContent className="dark:bg-[#0A0A0A] dark:text-white">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteOrderId && deleteMutation.mutate(deleteOrderId)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
