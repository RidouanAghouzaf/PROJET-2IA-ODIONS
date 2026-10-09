import { useState } from "react";
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Filter,
  MoreHorizontal,
  X,
  Package,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Building2,
  AlertCircle,
} from "lucide-react";
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
import { Card, CardContent } from "@/components/ui/card";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

type OrderStatus = "pending" | "delivered" | "refused" | "returned";

interface DeliveryCompany {
  id: string;
  name: string;
}

interface Order {
  id: string;
  order_number: string;
  client_name: string;
  client_email?: string | null;
  amount: number | string;
  status: OrderStatus;
  delivery_company_id?: string | null;
  delivery_companies?: { id?: string; name: string } | null;
  created_at: string;
}

interface FormData {
  client_name: string;
  client_email: string;
  amount: string;
  status: OrderStatus;
  delivery_company_id: string;
  order_number: string;
}

const EMPTY_FORM: FormData = {
  client_name: "",
  client_email: "",
  amount: "",
  status: "pending",
  delivery_company_id: "",
  order_number: "",
};

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: typeof Clock; className: string; dot: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
    dot: "bg-amber-500",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle2,
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
    dot: "bg-emerald-500",
  },
  refused: {
    label: "Refused",
    icon: XCircle,
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
    dot: "bg-red-500",
  },
  returned: {
    label: "Returned",
    icon: RotateCcw,
    className:
      "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/20",
    dot: "bg-slate-400",
  },
};

const formatAmount = (amount: number | string) => {
  const n = Number(amount);
  return Number.isFinite(n) ? `${n.toFixed(2)} DH` : `${amount} DH`;
};

const formatOrderNumber = (orderNumber: string) =>
  orderNumber?.startsWith("#") ? orderNumber : `#${orderNumber}`;

export default function Orders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

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
  const { data: deliveryCompanies = [] } = useQuery<DeliveryCompany[]>({
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

  const {
    data: orders = [],
    isLoading,
    isError: ordersFailed,
    refetch: refetchOrders,
  } = useQuery<Order[]>({
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
    onError: (error: any) => {
      toast({
        title: "Failed to create order",
        description: error?.message,
        variant: "destructive",
      });
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
      setOpen(false);
      setEditingOrder(null);
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to update order",
        description: error?.message,
        variant: "destructive",
      });
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
    onError: (error: any) => {
      toast({
        title: "Failed to delete order",
        description: error?.message,
        variant: "destructive",
      });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  // ===== HELPERS =====
  const resetForm = () => setFormData(EMPTY_FORM);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return; // prevent duplicate submits
    if (editingOrder) {
      updateMutation.mutate({ id: editingOrder.id, values: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const openCreateDialog = () => {
    setEditingOrder(null);
    resetForm();
    setOpen(true);
  };

  const openEditDialog = (order: Order) => {
    setEditingOrder(order);
    setFormData({
      client_name: order.client_name,
      client_email: order.client_email || "",
      amount: order.amount?.toString() || "",
      status: order.status,
      delivery_company_id: order.delivery_company_id || "",
      order_number: order.order_number,
    });
    setOpen(true);
  };

  const closeDialog = () => {
    if (isSubmitting) return;
    setOpen(false);
    setEditingOrder(null);
    resetForm();
  };

  // ===== FILTERS =====
  const filteredOrders = orders.filter((order) => {
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      order.client_name?.toLowerCase().includes(q) ||
      order.order_number?.toLowerCase().includes(q);
    const matchesStatus = statusFilter === "all" || order.status === statusFilter;
    const matchesCompany =
      companyFilter === "all" || order.delivery_company_id === companyFilter;
    return matchesSearch && matchesStatus && matchesCompany;
  });

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all" || companyFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCompanyFilter("all");
  };

  // ===== STATS (derived from real data, never hardcoded) =====
  const stats = {
    total: orders.length,
    pending: orders.filter((o) => o.status === "pending").length,
    delivered: orders.filter((o) => o.status === "delivered").length,
    refused: orders.filter((o) => o.status === "refused").length,
    returned: orders.filter((o) => o.status === "returned").length,
  };

  // ===== UI =====
  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            Orders <span className="mx-1">/</span> Management
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Orders</h1>
          <p className="text-muted-foreground">
            Manage, monitor and track your customer orders.
          </p>
        </div>

        <Dialog open={open} onOpenChange={(o) => (o ? setOpen(true) : closeDialog())}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              New Order
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[640px]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingOrder ? "Edit Order" : "Create Order"}
              </DialogTitle>
              <DialogDescription>
                {editingOrder
                  ? "Update the information for this order."
                  : "Add a new order to your ODIONS workspace."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6">
              <fieldset disabled={isSubmitting} className="space-y-6">
                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Customer Information</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="client_name">Client Name</Label>
                      <Input
                        id="client_name"
                        value={formData.client_name}
                        onChange={(e) =>
                          setFormData({ ...formData, client_name: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="client_email">Email</Label>
                      <Input
                        id="client_email"
                        type="email"
                        value={formData.client_email}
                        onChange={(e) =>
                          setFormData({ ...formData, client_email: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-sm font-medium text-foreground">Order Information</p>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="order_number">Order Number</Label>
                      <Input
                        id="order_number"
                        value={formData.order_number}
                        onChange={(e) =>
                          setFormData({ ...formData, order_number: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="amount">Amount (DH)</Label>
                      <Input
                        id="amount"
                        type="number"
                        min={0}
                        step={0.01}
                        placeholder="0.00"
                        value={formData.amount}
                        onChange={(e) =>
                          setFormData({ ...formData, amount: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v) =>
                          setFormData({ ...formData, status: v as OrderStatus })
                        }
                      >
                        <SelectTrigger id="status">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="refused">Refused</SelectItem>
                          <SelectItem value="returned">Returned</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="delivery_company_id">Delivery Company</Label>
                      <Select
                        value={formData.delivery_company_id}
                        onValueChange={(v) =>
                          setFormData({ ...formData, delivery_company_id: v })
                        }
                      >
                        <SelectTrigger id="delivery_company_id">
                          <SelectValue placeholder="Select company" />
                        </SelectTrigger>
                        <SelectContent>
                          {deliveryCompanies.map((company) => (
                            <SelectItem key={company.id} value={company.id}>
                              {company.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </fieldset>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {editingOrder
                    ? updateMutation.isPending
                      ? "Updating Order..."
                      : "Update"
                    : createMutation.isPending
                    ? "Creating Order..."
                    : "Create"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total Orders" value={stats.total} icon={Package} />
        <StatCard label="Pending" value={stats.pending} icon={Clock} accent="text-amber-600 dark:text-amber-400" />
        <StatCard label="Delivered" value={stats.delivered} icon={CheckCircle2} accent="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Refused" value={stats.refused} icon={XCircle} accent="text-red-600 dark:text-red-400" />
        <StatCard label="Returned" value={stats.returned} icon={RotateCcw} accent="text-slate-600 dark:text-slate-400" />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search orders, customers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-lg pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-[160px] rounded-lg">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="refused">Refused</SelectItem>
              <SelectItem value="returned">Returned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={companyFilter} onValueChange={setCompanyFilter}>
          <SelectTrigger className="h-10 w-[190px] rounded-lg">
            <SelectValue placeholder="All companies" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All companies</SelectItem>
            {deliveryCompanies.map((company) => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-muted-foreground">
            <X className="mr-1.5 h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Error state */}
      {ordersFailed && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            Failed to load orders.
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchOrders()}>
            Retry
          </Button>
        </div>
      )}

      {/* Desktop Table */}
      <Card className="hidden overflow-hidden rounded-xl md:block">
        {isLoading ? (
          <SkeletonTable />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            hasOrders={orders.length > 0}
            hasActiveFilters={hasActiveFilters}
            onCreate={openCreateDialog}
            onClearFilters={clearFilters}
          />
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-card">
              <TableRow className="hover:bg-transparent">
                <TableHead>Order</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Delivery Company</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id} className="group">
                  <TableCell className="font-medium text-foreground">
                    {formatOrderNumber(order.order_number)}
                  </TableCell>
                  <TableCell>
                    <OrderCustomer name={order.client_name} email={order.client_email} />
                  </TableCell>
                  <TableCell className="font-medium text-foreground">
                    {formatAmount(order.amount)}
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status} />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5 text-sm text-foreground">
                      <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                      {order.delivery_companies?.name || "N/A"}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.created_at ? format(new Date(order.created_at), "MMM dd, yyyy") : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label={`Actions for order ${order.order_number}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem onClick={() => openEditDialog(order)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Order
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteOrderId(order.id)}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete Order
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* Mobile Cards */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading ? (
          <SkeletonMobile />
        ) : filteredOrders.length === 0 ? (
          <EmptyState
            hasOrders={orders.length > 0}
            hasActiveFilters={hasActiveFilters}
            onCreate={openCreateDialog}
            onClearFilters={clearFilters}
          />
        ) : (
          filteredOrders.map((order) => (
            <Card key={order.id} className="rounded-xl">
              <CardContent className="space-y-3 p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium text-foreground">{formatOrderNumber(order.order_number)}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.created_at ? format(new Date(order.created_at), "MMM dd, yyyy") : "N/A"}
                    </p>
                  </div>
                  <OrderStatusBadge status={order.status} />
                </div>

                <OrderCustomer name={order.client_name} email={order.client_email} />

                <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-medium text-foreground">{formatAmount(order.amount)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-sm text-foreground">
                  <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                  {order.delivery_companies?.name || "N/A"}
                </div>

                <div className="flex gap-2 pt-1">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => openEditDialog(order)}
                    aria-label={`Edit order ${order.order_number}`}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 text-destructive hover:text-destructive"
                    onClick={() => setDeleteOrderId(order.id)}
                    aria-label={`Delete order ${order.order_number}`}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteOrderId} onOpenChange={() => setDeleteOrderId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteOrderId && deleteMutation.mutate(deleteOrderId)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Presentational helper components ────────────────────────────────────

const StatCard = ({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof Package;
  accent?: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted", accent)}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  </div>
);

const OrderStatusBadge = ({ status }: { status: OrderStatus }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.className
      )}
    >
      <Icon className="h-3 w-3" aria-hidden="true" />
      {config.label}
    </span>
  );
};

const OrderCustomer = ({ name, email }: { name: string; email?: string | null }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-foreground">{name}</p>
      {email && <p className="truncate text-xs text-muted-foreground">{email}</p>}
    </div>
  </div>
);

const SkeletonTable = () => (
  <div>
    <div className="border-b border-border px-4 py-3">
      <div className="grid grid-cols-7 gap-4">
        {["Order", "Customer", "Amount", "Status", "Company", "Date", "Actions"].map((h) => (
          <Skeleton key={h} className="h-3 w-16" />
        ))}
      </div>
    </div>
    <div className="divide-y divide-border">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="grid grid-cols-7 items-center gap-4 px-4 py-4">
          <Skeleton className="h-4 w-20" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

const SkeletonMobile = () => (
  <>
    {Array.from({ length: 3 }, (_, i) => (
      <div key={i} className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-8 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
        </div>
      </div>
    ))}
  </>
);

const EmptyState = ({
  hasOrders,
  hasActiveFilters,
  onCreate,
  onClearFilters,
}: {
  hasOrders: boolean;
  hasActiveFilters: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
}) => {
  const filtered = hasOrders && hasActiveFilters;
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Package className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">
          {filtered ? "No orders match your filters" : "No orders yet"}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {filtered
            ? "Try adjusting or clearing your filters to see more results."
            : "Orders will appear here when they are created or imported."}
        </p>
      </div>
      {filtered ? (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          <X className="mr-1.5 h-4 w-4" />
          Clear filters
        </Button>
      ) : (
        <Button size="sm" onClick={onCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create Order
        </Button>
      )}
    </div>
  );
};