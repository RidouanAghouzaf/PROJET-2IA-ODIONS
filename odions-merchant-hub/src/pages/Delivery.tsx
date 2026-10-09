"use client";

import { useState, useEffect } from "react";
import {
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Search,
  Building2,
  Mail,
  Phone,
  Globe,
  MoreHorizontal,
  Power,
  PowerOff,
  X,
  PackageSearch,
  FilterX,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
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
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DeliveryCompany {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  status: boolean;
  created_at: string;
  updated_at: string;
}

const API_BASE = "http://localhost:3000/api/delivery_companies";
const PAGE_SIZE = 5;

export default function DeliveryCompanies() {
  const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
  const [open, setOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<DeliveryCompany | null>(null);
  const [deleteCompanyId, setDeleteCompanyId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    country: "",
    status: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    name: "",
    email: "",
    country: "",
    status: "all",
  });
  const [currentPage, setCurrentPage] = useState(1);

  const { user, session } = useAuth();
  const { toast } = useToast();

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const getAccessToken = () => {
    if (session?.access_token) return session.access_token;
    try {
      const storedSession = localStorage.getItem("supabaseSession");
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        return parsedSession.access_token;
      }
    } catch (error) {
      console.error("Error parsing stored session:", error);
    }
    return null;
  };

  const apiCall = async (url: string, options: RequestInit = {}) => {
    const token = getAccessToken();
    if (!token) {
      toast({ title: "Authentication required", description: "Please log in again", variant: "destructive" });
      throw new Error("No access token");
    }
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      const data = await response.json();
      if (response.status === 401) {
        toast({ title: "Session expired", description: "Please log in again", variant: "destructive" });
        throw new Error("Unauthorized");
      }
      if (!response.ok) throw new Error(data.error?.message || "Request failed");
      return data;
    } catch (error: any) {
      console.error("API call error:", error);
      throw error;
    }
  };

  const fetchCompanies = async () => {
    setIsLoading(true);
    try {
      const data = await apiCall(API_BASE);
      setCompanies(data.delivery_companies || []);
    } catch (error: any) {
      toast({ title: "Failed to load companies", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session || user) fetchCompanies();
  }, [session, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone || !formData.country) {
      toast({ title: "Validation error", description: "All fields are required", variant: "destructive" });
      return;
    }
    setIsLoading(true);
    try {
      const method = editingCompany ? "PUT" : "POST";
      const url = editingCompany ? `${API_BASE}/${editingCompany.id}` : API_BASE;
      await apiCall(url, { method, body: JSON.stringify(formData) });
      await fetchCompanies();
      toast({ title: editingCompany ? "Company updated" : "Company created", description: `Delivery company ${editingCompany ? "updated" : "created"} successfully` });
      closeDialog();
    } catch (error: any) {
      toast({ title: `Failed to ${editingCompany ? "update" : "create"} company`, description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCompanyId) return;
    setIsLoading(true);
    try {
      await apiCall(`${API_BASE}/${deleteCompanyId}`, { method: "DELETE" });
      await fetchCompanies();
      toast({ title: "Company deleted", description: "Delivery company deleted successfully" });
      setDeleteCompanyId(null);
    } catch (error: any) {
      toast({ title: "Failed to delete company", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (company: DeliveryCompany, newStatus: boolean) => {
    setIsLoading(true);
    try {
      await apiCall(`${API_BASE}/${company.id}/status`, { method: "PATCH", body: JSON.stringify({ status: newStatus }) });
      setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, status: newStatus } : c));
      toast({ title: "Status updated", description: `Status updated for ${company.name}` });
    } catch (error: any) {
      toast({ title: "Failed to update status", description: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => setFormData({ name: "", email: "", phone: "", country: "", status: true });
  const handleEdit = (company: DeliveryCompany) => { setEditingCompany(company); setFormData({ name: company.name, email: company.email, phone: company.phone, country: company.country, status: company.status }); setOpen(true); };
  const closeDialog = () => { setOpen(false); setEditingCompany(null); resetForm(); };

  // Filtering
  const filteredCompanies = companies.filter(c => {
    const matchesName = c.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchesEmail = c.email.toLowerCase().includes(filters.email.toLowerCase());
    const matchesCountry = c.country.toLowerCase().includes(filters.country.toLowerCase());
    const matchesStatus = filters.status === "all" || (filters.status === "active" && c.status) || (filters.status === "inactive" && !c.status);
    return matchesName && matchesEmail && matchesCountry && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredCompanies.length / PAGE_SIZE);
  const paginatedCompanies = filteredCompanies.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const handleNextPage = () => setCurrentPage(p => Math.min(p + 1, totalPages));
  const handlePrevPage = () => setCurrentPage(p => Math.max(p - 1, 1));
  const goToPage = (p: number) => setCurrentPage(p);

  const rangeStart = filteredCompanies.length === 0 ? 0 : (currentPage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPage * PAGE_SIZE, filteredCompanies.length);

  // Stats (reflect full data set, not just current page/filters)
  const totalCount = companies.length;
  const activeCount = companies.filter(c => c.status).length;
  const inactiveCount = totalCount - activeCount;

  const hasActiveFilters =
    filters.name !== "" || filters.email !== "" || filters.country !== "" || filters.status !== "all";

  const clearFilters = () => setFilters({ name: "", email: "", country: "", status: "all" });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            Settings <span className="mx-1">/</span> Delivery Companies
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Delivery Companies</h1>
          <p className="text-muted-foreground">Manage and monitor your connected delivery partners.</p>
        </div>

        <Dialog open={open} onOpenChange={(o) => { if (!o) closeDialog(); else setOpen(true); }}>
          <DialogTrigger asChild>
            <Button disabled={isLoading} className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingCompany ? "Edit Delivery Company" : "Add Delivery Company"}
              </DialogTitle>
              <DialogDescription>
                {editingCompany
                  ? "Update the details for this delivery partner."
                  : "Connect a new delivery partner to your ODIONS workspace."}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-5 py-4">
                <FormField
                  icon={Building2}
                  label="Company Name"
                  helper="The official name of the delivery company."
                  value={formData.name}
                  onChange={(v) => setFormData({ ...formData, name: v })}
                  disabled={isLoading}
                />
                <FormField
                  icon={Mail}
                  label="Email"
                  type="email"
                  helper="Contact email for this delivery partner."
                  value={formData.email}
                  onChange={(v) => setFormData({ ...formData, email: v })}
                  disabled={isLoading}
                />
                <FormField
                  icon={Phone}
                  label="Phone"
                  helper="Primary contact number."
                  value={formData.phone}
                  onChange={(v) => setFormData({ ...formData, phone: v })}
                  disabled={isLoading}
                />
                <FormField
                  icon={Globe}
                  label="Country"
                  helper="Country where the delivery company operates."
                  value={formData.country}
                  onChange={(v) => setFormData({ ...formData, country: v })}
                  disabled={isLoading}
                />
                <div className="flex items-center justify-between rounded-lg border border-border bg-muted/40 px-4 py-3">
                  <div className="space-y-0.5">
                    <Label htmlFor="status">Active Status</Label>
                    <p className="text-sm text-muted-foreground">Enable this company for order processing.</p>
                  </div>
                  <Switch
                    id="status"
                    checked={formData.status}
                    onCheckedChange={(checked) => setFormData({ ...formData, status: checked })}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog} disabled={isLoading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {editingCompany
                    ? (isLoading ? "Saving..." : "Save Changes")
                    : (isLoading ? "Creating..." : "Create Company")}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <StatCard label="Total" value={totalCount} />
        <StatCard label="Active" value={activeCount} accent="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Inactive" value={inactiveCount} accent="text-muted-foreground" />
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search delivery companies..."
            value={filters.name}
            onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            className="h-10 rounded-lg pl-9"
          />
        </div>
        <div className="relative w-full sm:w-56">
          <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by email"
            value={filters.email}
            onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            className="h-10 rounded-lg pl-9"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Globe className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Filter by country"
            value={filters.country}
            onChange={(e) => setFilters({ ...filters, country: e.target.value })}
            className="h-10 rounded-lg pl-9"
          />
        </div>
        <select
          className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring sm:w-44"
          value={filters.status}
          onChange={(e) => setFilters({ ...filters, status: e.target.value })}
        >
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-muted-foreground">
            <X className="mr-1.5 h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Desktop Table */}
      <Card className="hidden overflow-hidden rounded-xl md:block">
        {isLoading ? (
          <SkeletonTable />
        ) : paginatedCompanies.length === 0 ? (
          <EmptyState hasActiveFilters={hasActiveFilters} onAdd={() => setOpen(true)} onClearFilters={clearFilters} />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead>Company</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedCompanies.map((company) => (
                  <TableRow key={company.id} className="group">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <CompanyAvatar name={company.name} />
                        <div>
                          <div className="font-medium text-foreground">{company.name}</div>
                          <div className="text-xs text-muted-foreground">Delivery partner</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-foreground">{company.email}</div>
                      <div className="text-xs text-muted-foreground">{company.phone}</div>
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{company.country}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <StatusBadge active={company.status} />
                        <Switch
                          checked={company.status}
                          onCheckedChange={(checked) => toggleStatus(company, checked)}
                          disabled={isLoading}
                        />
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {company.created_at ? format(new Date(company.created_at), "MMM dd, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" disabled={isLoading}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-44">
                          <DropdownMenuItem onClick={() => handleEdit(company)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => toggleStatus(company, !company.status)}>
                            {company.status ? (
                              <PowerOff className="mr-2 h-4 w-4" />
                            ) : (
                              <Power className="mr-2 h-4 w-4" />
                            )}
                            {company.status ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteCompanyId(company.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {/* Pagination */}
            <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
              <p className="text-sm text-muted-foreground">
                Showing {rangeStart}–{rangeEnd} of {filteredCompanies.length} companies
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" />
                  Previous
                </Button>
                <div className="mx-1 flex items-center gap-1">
                  {Array.from({ length: totalPages || 1 }, (_, i) => i + 1).map((p) => (
                    <Button
                      key={p}
                      variant={p === currentPage ? "default" : "ghost"}
                      size="sm"
                      onClick={() => goToPage(p)}
                      className="h-8 w-8 p-0"
                    >
                      {p}
                    </Button>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages || totalPages === 0}
                  className="h-8"
                >
                  Next
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading ? (
          <SkeletonMobile />
        ) : paginatedCompanies.length === 0 ? (
          <EmptyState hasActiveFilters={hasActiveFilters} onAdd={() => setOpen(true)} onClearFilters={clearFilters} />
        ) : (
          <>
            {paginatedCompanies.map((company) => (
              <Card key={company.id} className="rounded-xl">
                <CardContent className="space-y-4 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CompanyAvatar name={company.name} />
                      <div>
                        <div className="font-medium text-foreground">{company.name}</div>
                        <div className="text-xs text-muted-foreground">Delivery partner</div>
                      </div>
                    </div>
                    <StatusBadge active={company.status} />
                  </div>

                  <div className="space-y-2 rounded-lg bg-muted/40 p-3 text-sm">
                    <div className="flex items-center gap-2 text-foreground">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {company.email}
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {company.phone}
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                      {company.country}
                    </div>
                    <div className="flex items-center justify-between pt-1 text-xs text-muted-foreground">
                      <span>Created {company.created_at ? format(new Date(company.created_at), "MMM dd, yyyy") : "N/A"}</span>
                      <Switch
                        checked={company.status}
                        onCheckedChange={(checked) => toggleStatus(company, checked)}
                        disabled={isLoading}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" onClick={() => handleEdit(company)} disabled={isLoading}>
                      <Pencil className="mr-1.5 h-3.5 w-3.5" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => setDeleteCompanyId(company.id)}
                      disabled={isLoading}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <div className="flex items-center justify-between pt-1">
              <p className="text-xs text-muted-foreground">
                {rangeStart}–{rangeEnd} of {filteredCompanies.length}
              </p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1} className="h-8">
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground">{currentPage} / {totalPages || 1}</span>
                <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage === totalPages || totalPages === 0} className="h-8">
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCompanyId} onOpenChange={(open) => !open && setDeleteCompanyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this delivery company. This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ─── Presentational helper components ────────────────────────────────────

const StatCard = ({ label, value, accent }: { label: string; value: number; accent?: string }) => (
  <div className="rounded-xl border border-border bg-card px-4 py-3 sm:px-5 sm:py-4">
    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
    <p className={cn("mt-1 text-2xl font-semibold text-foreground", accent)}>{value}</p>
  </div>
);

const StatusBadge = ({ active }: { active: boolean }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
      active
        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400"
        : "bg-muted text-muted-foreground"
    )}
  >
    <span
      className={cn(
        "h-1.5 w-1.5 rounded-full",
        active ? "bg-emerald-500" : "bg-muted-foreground/50"
      )}
    />
    {active ? "Active" : "Inactive"}
  </span>
);

const CompanyAvatar = ({ name }: { name: string }) => (
  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
    {name?.charAt(0)?.toUpperCase() || "?"}
  </div>
);

const FormField = ({ icon: Icon, label, value, onChange, disabled, type = "text", helper }: any) => (
  <div className="space-y-1.5">
    <Label>{label}</Label>
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        type={type}
        onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        disabled={disabled}
        required
        className="pl-9"
      />
    </div>
    {helper && <p className="text-xs text-muted-foreground">{helper}</p>}
  </div>
);

const SkeletonTable = () => (
  <div>
    <div className="border-b border-border px-4 py-3">
      <div className="grid grid-cols-6 gap-4">
        {["Company", "Contact", "Country", "Status", "Created", "Actions"].map((h) => (
          <Skeleton key={h} className="h-3 w-16" />
        ))}
      </div>
    </div>
    <div className="divide-y divide-border">
      {[1, 2, 3, 4].map((row) => (
        <div key={row} className="grid grid-cols-6 items-center gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-16 rounded-full" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="ml-auto h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

const SkeletonMobile = () => (
  <>
    {[1, 2, 3].map((i) => (
      <div key={i} className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-20 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
        </div>
      </div>
    ))}
  </>
);

const EmptyState = ({
  hasActiveFilters,
  onAdd,
  onClearFilters,
}: {
  hasActiveFilters: boolean;
  onAdd: () => void;
  onClearFilters: () => void;
}) => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      {hasActiveFilters ? (
        <FilterX className="h-5 w-5 text-muted-foreground" />
      ) : (
        <PackageSearch className="h-5 w-5 text-muted-foreground" />
      )}
    </div>
    <div className="space-y-1">
      <p className="font-medium text-foreground">
        {hasActiveFilters ? "No companies match your filters" : "No delivery companies found"}
      </p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {hasActiveFilters
          ? "Try adjusting or clearing your filters to see more results."
          : "Connect your first delivery partner to start importing and managing your order data."}
      </p>
    </div>
    {hasActiveFilters ? (
      <Button variant="outline" size="sm" onClick={onClearFilters}>
        <X className="mr-1.5 h-4 w-4" />
        Clear Filters
      </Button>
    ) : (
      <Button size="sm" onClick={onAdd}>
        <Plus className="mr-1.5 h-4 w-4" />
        Add Delivery Company
      </Button>
    )}
  </div>
);