import { useMemo,useRef, useState } from "react";
import { Plus, Eye, Pencil, Trash2, ChevronLeft, ChevronRight, Search, X, Users, Target, BarChart3, MoreHorizontal, AlertCircle, UserPlus, FileUp, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

/* ------------------ CONSTANTS ------------------ */

const API_URL = "http://localhost:3000/api/audiences";
const PAGE_SIZE = 5;
const MAX_PAGE_BUTTONS = 5;

const FRIENDLY_STATUS_MESSAGES: Record<number, string> = {
  400: "This request couldn't be processed. Please check the form and try again.",
  401: "Your session has expired. Please log in again.",
  403: "You don't have permission to perform this action.",
  404: "This audience could not be found.",
  500: "Something went wrong on our end. Please try again.",
};

/* ------------------ VALIDATION ------------------ */

const audienceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  criteria_summary: z.string().optional(),
});

/* ------------------ TYPES ------------------ */

interface Audience {
  id: string;
  name: string;
  criteria_summary?: string | null;
  size?: number | null;
  created_at: string;
}

/* ================== COMPONENT ================== */

export default function Audiences() {
  const [open, setOpen] = useState(false);
  const [editingAudience, setEditingAudience] = useState<Audience | null>(null);
  const [deleteAudienceId, setDeleteAudienceId] = useState<string | null>(null);
  const [contactsAudience, setContactsAudience] = useState<{ id: string; name: string } | null>(null);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  /* ------------------ FORM ------------------ */

  const form = useForm<z.infer<typeof audienceSchema>>({
    resolver: zodResolver(audienceSchema),
    defaultValues: { name: "", criteria_summary: "" },
  });

  const nameLength = form.watch("name")?.length || 0;

  /* ------------------ HELPERS ------------------ */

  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  });

  const apiRequest = async (url: string, options: RequestInit = {}) => {
    let response: Response;
    try {
      response = await fetch(url, { ...options, headers: getHeaders() });
    } catch {
      throw new Error("Network error. Please check your connection and try again.");
    }
    let data: any = null;
    try {
      data = await response.json();
    } catch {
      // no JSON body
    }
    if (!response.ok) {
      const message =
        data?.error?.message ||
        data?.message ||
        FRIENDLY_STATUS_MESSAGES[response.status] ||
        "Something went wrong. Please try again.";
      throw new Error(message);
    }
    return data;
  };

  /* ------------------ QUERY ------------------ */

  const {
    data: audiences = [],
    isLoading,
    isError,
    refetch,
  } = useQuery<Audience[]>({
    queryKey: ["audiences", accessToken],
    queryFn: () => apiRequest(API_URL).then((data) => data.audiences || []),
    enabled: !!accessToken,
  });

  /* ------------------ MUTATIONS ------------------ */

  // The backend reads "description" and stores it as criteria_summary.
  // "size" is no longer sent: the server computes it from the real contacts.
  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof audienceSchema>) =>
      apiRequest(API_URL, {
        method: "POST",
        body: JSON.stringify({ name: values.name, description: values.criteria_summary }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["audiences"] });
      toast({ title: "Audience created", description: "Now add the contacts it should reach." });
      closeDialog();
      if (data?.audience?.id) setContactsAudience({ id: data.audience.id, name: data.audience.name });
    },
    onError: (error: any) => {
      toast({ title: "Unable to create audience", description: error?.message, variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof audienceSchema>) =>
      apiRequest(`${API_URL}/${editingAudience?.id}`, {
        method: "PUT",
        body: JSON.stringify({ name: values.name, description: values.criteria_summary }),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audiences"] });
      toast({ title: "Audience updated successfully" });
      closeDialog();
    },
    onError: (error: any) => {
      toast({ title: "Unable to update audience", description: error?.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiRequest(`${API_URL}/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["audiences"] });
      toast({ title: "Audience deleted successfully" });
      setDeleteAudienceId(null);
    },
    onError: (error: any) => {
      toast({ title: "Unable to delete audience", description: error?.message, variant: "destructive" });
    },
  });

  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  /* ------------------ SUBMIT / DIALOG HELPERS ------------------ */

  const onSubmit = (values: z.infer<typeof audienceSchema>) => {
    if (isSubmitting) return;
    if (editingAudience) updateMutation.mutate(values);
    else createMutation.mutate(values);
  };

  const openCreateDialog = () => {
    setEditingAudience(null);
    form.reset({ name: "", criteria_summary: "" });
    setOpen(true);
  };

  const handleEdit = (a: Audience) => {
    setEditingAudience(a);
    form.reset({ name: a.name, criteria_summary: a.criteria_summary || "" });
    setOpen(true);
  };

  const closeDialog = () => {
    if (isSubmitting) return;
    setOpen(false);
    setEditingAudience(null);
    form.reset();
  };

  /* ------------------ FILTER + PAGINATION ------------------ */

  const filteredAudiences = useMemo(
    () => audiences.filter((a) => a.name.toLowerCase().includes(search.toLowerCase())),
    [audiences, search]
  );

  const totalPages = Math.max(1, Math.ceil(filteredAudiences.length / PAGE_SIZE));
  const currentPageSafe = Math.min(currentPage, totalPages);
  const paginatedAudiences = filteredAudiences.slice(
    (currentPageSafe - 1) * PAGE_SIZE,
    currentPageSafe * PAGE_SIZE
  );

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setCurrentPage(1);
  };

  const clearSearch = () => {
    setSearch("");
    setCurrentPage(1);
  };

  const rangeStart = filteredAudiences.length === 0 ? 0 : (currentPageSafe - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(currentPageSafe * PAGE_SIZE, filteredAudiences.length);

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const half = Math.floor(MAX_PAGE_BUTTONS / 2);
    let start = Math.max(1, currentPageSafe - half);
    const end = Math.min(totalPages, start + MAX_PAGE_BUTTONS - 1);
    start = Math.max(1, end - MAX_PAGE_BUTTONS + 1);
    for (let p = start; p <= end; p++) pages.push(p);
    return pages;
  }, [currentPageSafe, totalPages]);

  /* ------------------ STATS (derived from real data only) ------------------ */

  const stats = useMemo(() => {
    const total = audiences.length;
    const sizes = audiences.map((a) => a.size || 0);
    const totalCustomers = sizes.reduce((sum, n) => sum + n, 0);
    const averageSize = total > 0 ? Math.round(totalCustomers / total) : 0;
    const largest = sizes.length > 0 ? Math.max(...sizes) : 0;
    return { total, totalCustomers, averageSize, largest };
  }, [audiences]);

  const deletingAudience = audiences.find((a) => a.id === deleteAudienceId) || null;

  const rowMenu = (a: Audience) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={`Actions for ${a.name}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => setContactsAudience({ id: a.id, name: a.name })}>
          <UserPlus className="mr-2 h-4 w-4" />
          Manage contacts
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link to={`/audiences/${a.id}`}>
            <Eye className="mr-2 h-4 w-4" />
            View audience
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleEdit(a)}>
          <Pencil className="mr-2 h-4 w-4" />
          Edit audience
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={() => setDeleteAudienceId(a.id)}
          className="text-destructive focus:text-destructive"
        >
          <Trash2 className="mr-2 h-4 w-4" />
          Delete audience
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  /* ================== RENDER ================== */

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            Audiences <span className="mx-1">/</span> Customer Segments
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Audiences</h1>
          <p className="text-muted-foreground">
            Create and manage targeted customer segments for your marketing campaigns.
          </p>
        </div>

        <Dialog open={open} onOpenChange={(o) => (o ? openCreateDialog() : closeDialog())}>
          <DialogTrigger asChild>
            <Button className="shrink-0" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Create Audience
            </Button>
          </DialogTrigger>

          <DialogContent className="sm:max-w-[560px]">
            <DialogHeader>
              <DialogTitle className="text-xl">
                {editingAudience ? "Edit Audience" : "Create Audience"}
              </DialogTitle>
              <DialogDescription>
                {editingAudience
                  ? "Update the audience information."
                  : "Name your audience. You'll add its contacts right after."}
              </DialogDescription>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <fieldset disabled={isSubmitting} className="space-y-4">
                  <FormField
                    name="name"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Audience Name</FormLabel>
                          <span className="text-xs text-muted-foreground">{nameLength} / 100</span>
                        </div>
                        <FormControl>
                          <Input placeholder="e.g. VIP Customers" maxLength={100} {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Give your audience a recognizable name.</p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    name="criteria_summary"
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="e.g. Customers who ordered in October, Casablanca"
                            rows={3}
                            {...field}
                          />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">Briefly describe who belongs to this audience.</p>
                      </FormItem>
                    )}
                  />

                  {!editingAudience && (
                    <p className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
                      The member count is calculated from the contacts you add, so there is no size to enter.
                    </p>
                  )}
                </fieldset>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={closeDialog} disabled={isSubmitting}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {editingAudience
                      ? updateMutation.isPending
                        ? "Updating..."
                        : "Update Audience"
                      : createMutation.isPending
                      ? "Creating..."
                      : "Create Audience"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Total Audiences" value={stats.total} icon={Target} />
        <StatCard label="Customers" value={stats.totalCustomers.toLocaleString()} icon={Users} />
        <StatCard label="Average Size" value={stats.averageSize.toLocaleString()} icon={BarChart3} />
        <StatCard label="Largest Audience" value={stats.largest.toLocaleString()} icon={Target} />
      </div>

      {/* SEARCH TOOLBAR */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search audiences..."
            value={search}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="h-10 rounded-lg pl-9"
          />
        </div>
        <div className="flex items-center gap-3">
          <p className="text-sm text-muted-foreground">
            {search
              ? `Showing ${filteredAudiences.length} of ${audiences.length} audiences`
              : `${audiences.length} audiences`}
          </p>
          {search && (
            <Button variant="ghost" size="sm" onClick={clearSearch} className="h-8 text-muted-foreground">
              <X className="mr-1.5 h-4 w-4" />
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* ERROR STATE */}
      {isError && !isLoading && (
        <Card className="rounded-xl">
          <CardContent className="flex flex-col items-center justify-center gap-3 py-16 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-5 w-5 text-destructive" />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-foreground">Unable to load audiences</p>
              <p className="text-sm text-muted-foreground">We couldn't load your audiences. Please try again.</p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* DESKTOP TABLE */}
      {!isError && (
        <Card className="hidden overflow-hidden rounded-xl md:block">
          {isLoading ? (
            <SkeletonTable />
          ) : paginatedAudiences.length === 0 ? (
            <EmptyState hasAudiences={audiences.length > 0} onCreate={openCreateDialog} onClearSearch={clearSearch} />
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead>Audience</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedAudiences.map((a) => (
                    <TableRow key={a.id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                            <Users className="h-4 w-4" />
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{a.name}</div>
                            <div className="text-xs text-muted-foreground">Customer segment</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[280px]">
                        {a.criteria_summary ? (
                          <p className="line-clamp-1 text-sm text-foreground" title={a.criteria_summary}>
                            {a.criteria_summary}
                          </p>
                        ) : (
                          <span className="text-sm text-muted-foreground">No description</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          onClick={() => setContactsAudience({ id: a.id, name: a.name })}
                          className="flex items-center gap-1.5 rounded-md px-1 py-0.5 hover:bg-muted"
                          aria-label={`Manage contacts of ${a.name}`}
                        >
                          <Users className="h-3.5 w-3.5 text-muted-foreground" />
                          <span className="font-medium text-foreground">{(a.size || 0).toLocaleString()}</span>
                          <span className="text-xs text-muted-foreground">members</span>
                        </button>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {a.created_at ? format(new Date(a.created_at), "MMM dd, yyyy") : "N/A"}
                      </TableCell>
                      <TableCell className="text-right">{rowMenu(a)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* PAGINATION */}
              <div className="flex flex-col items-center justify-between gap-3 border-t border-border px-4 py-3 sm:flex-row">
                <p className="text-sm text-muted-foreground">
                  Showing {rangeStart}–{rangeEnd} of {filteredAudiences.length} audiences
                </p>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPageSafe === 1}
                    className="h-8"
                  >
                    <ChevronLeft className="mr-1 h-4 w-4" />
                    Previous
                  </Button>
                  <div className="mx-1 flex items-center gap-1">
                    {pageNumbers.map((p) => (
                      <Button
                        key={p}
                        variant={p === currentPageSafe ? "default" : "ghost"}
                        size="sm"
                        onClick={() => setCurrentPage(p)}
                        className="h-8 w-8 p-0"
                      >
                        {p}
                      </Button>
                    ))}
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPageSafe === totalPages}
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
      )}

      {/* MOBILE CARDS */}
      {!isError && (
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {isLoading ? (
            <SkeletonMobile />
          ) : paginatedAudiences.length === 0 ? (
            <EmptyState hasAudiences={audiences.length > 0} onCreate={openCreateDialog} onClearSearch={clearSearch} />
          ) : (
            <>
              {paginatedAudiences.map((a) => (
                <Card key={a.id} className="rounded-xl">
                  <CardContent className="space-y-3 p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <Users className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{a.name}</p>
                          <p className="text-xs text-muted-foreground">Customer segment</p>
                        </div>
                      </div>
                      {rowMenu(a)}
                    </div>

                    <p className="line-clamp-2 text-sm text-muted-foreground" title={a.criteria_summary || undefined}>
                      {a.criteria_summary || "No description"}
                    </p>

                    <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="font-medium text-foreground">{(a.size || 0).toLocaleString()}</span>
                        <span className="text-xs text-muted-foreground">members</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {a.created_at ? format(new Date(a.created_at), "MMM dd, yyyy") : "N/A"}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-muted-foreground">
                  {rangeStart}–{rangeEnd} of {filteredAudiences.length}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPageSafe === 1}
                    className="h-8"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {currentPageSafe} / {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPageSafe === totalPages}
                    className="h-8"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* CONTACTS */}
      <AudienceContactsDialog
        audience={contactsAudience}
        open={!!contactsAudience}
        onOpenChange={(o) => !o && setContactsAudience(null)}
      />

      {/* DELETE CONFIRMATION */}
      <AlertDialog open={!!deleteAudienceId} onOpenChange={() => setDeleteAudienceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deletingAudience ? `Delete "${deletingAudience.name}"?` : "Delete audience?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              The audience and all of its contacts will be deleted. Campaigns that use it will no longer be able to
              send. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteAudienceId && deleteMutation.mutate(deleteAudienceId)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete Audience"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ─── Presentational helper components ──────────────────────────────── */

const StatCard = ({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: number | string;
  icon: typeof Users;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  </div>
);

const SkeletonTable = () => (
  <div>
    <div className="border-b border-border px-4 py-3">
      <div className="grid grid-cols-5 gap-4">
        {["Audience", "Description", "Members", "Created", "Actions"].map((h) => (
          <Skeleton key={h} className="h-3 w-16" />
        ))}
      </div>
    </div>
    <div className="divide-y divide-border">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="grid grid-cols-5 items-center gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-16" />
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
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-8 w-8 rounded-md" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-9 w-full rounded-lg" />
      </div>
    ))}
  </>
);

const EmptyState = ({
  hasAudiences,
  onCreate,
  onClearSearch,
}: {
  hasAudiences: boolean;
  onCreate: () => void;
  onClearSearch: () => void;
}) => (
  <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
      <Target className="h-5 w-5 text-muted-foreground" />
    </div>
    <div className="space-y-1">
      <p className="font-medium text-foreground">{hasAudiences ? "No audiences found" : "No audiences yet"}</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        {hasAudiences
          ? "No audiences match your current search."
          : "Create your first customer segment to start targeting customers with ODIONS marketing campaigns."}
      </p>
    </div>
    {hasAudiences ? (
      <Button variant="outline" size="sm" onClick={onClearSearch}>
        <X className="mr-1.5 h-4 w-4" />
        Clear search
      </Button>
    ) : (
      <Button size="sm" onClick={onCreate}>
        <Plus className="mr-1.5 h-4 w-4" />
        Create Audience
      </Button>
    )}
  </div>
);
/* ─── Contacts dialog (kept in this file on purpose) ─────────────────── */

const CONTACTS_API = "http://localhost:3000/api";
const CONTACTS_CHUNK = 1000;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

interface ContactRow { id: string; name: string | null; phone_number: string }
interface ContactEntry { name: string; phone: string }
interface AddContactsResult {
  added: number;
  duplicates: number;
  invalid: ContactEntry[];
  size: number;
}
interface ContactsDialogProps {
  audience: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const looksLikeHeader = (line: string) =>
  /name|nom|phone|tel|mobile/i.test(line) && !/\d{8,}/.test(line.replace(/[\s.\-()+]/g, ""));

function parseLines(text: string): ContactEntry[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length && looksLikeHeader(lines[0])) lines.shift();
  return lines.map((line) => {
    const parts = line.split(/[,;\t]/).map((p) => p.trim().replace(/^"|"$/g, "")).filter(Boolean);
    if (parts.length <= 1) return { name: "", phone: parts[0] ?? "" };
    return { name: parts.slice(0, -1).join(" "), phone: parts[parts.length - 1] };
  });
}

function AudienceContactsDialog({ audience, open, onOpenChange }: ContactsDialogProps) {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [text, setText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const getToken = (): string | null => {
    if (session?.access_token) return session.access_token;
    try {
      const stored = localStorage.getItem("supabaseSession");
      return stored ? (JSON.parse(stored) as { access_token?: string }).access_token ?? null : null;
    } catch {
      return null;
    }
  };

  const call = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
    const token = getToken();
    if (!token) throw new Error("Please log in again");
    const res = await fetch(`${CONTACTS_API}${path}`, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...options.headers },
    });
    const body = await res.json().catch(() => null);
    if (!res.ok) throw new Error(body?.error?.message ?? (typeof body?.error === "string" ? body.error : "Request failed"));
    return body as T;
  };

  const key = ["audience-contacts", audience?.id];
  const contactsQuery = useQuery({
    queryKey: key,
    queryFn: async () => (await call<{ contacts: ContactRow[] }>(`/audiences/${audience!.id}/contacts`)).contacts,
    enabled: open && !!audience?.id && !!user?.id,
  });

  const refreshAll = () => {
    queryClient.invalidateQueries({ queryKey: key });
    queryClient.invalidateQueries({ queryKey: ["audiences"] });
    queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
  };

  const addMutation = useMutation({
    mutationFn: async (entries: ContactEntry[]): Promise<AddContactsResult> => {
      const total: AddContactsResult = { added: 0, duplicates: 0, invalid: [], size: 0 };
      for (let i = 0; i < entries.length; i += CONTACTS_CHUNK) {
        const r = await call<AddContactsResult>(`/audiences/${audience!.id}/contacts`, {
          method: "POST",
          body: JSON.stringify({ contacts: entries.slice(i, i + CONTACTS_CHUNK) }),
        });
        total.added += r.added;
        total.duplicates += r.duplicates;
        total.invalid.push(...r.invalid);
        total.size = r.size;
      }
      return total;
    },
    onSuccess: (r) => {
      const notes = [
        r.duplicates ? `${r.duplicates} duplicate${r.duplicates > 1 ? "s" : ""} skipped` : "",
        r.invalid.length ? `${r.invalid.length} invalid number${r.invalid.length > 1 ? "s" : ""} skipped` : "",
      ].filter(Boolean).join(", ");
      toast({ title: `${r.added} contact${r.added === 1 ? "" : "s"} added`, description: notes || `Audience now has ${r.size}.` });
      setText(r.invalid.map((i) => (i.name ? `${i.name}, ${i.phone}` : i.phone)).join("\n"));
      refreshAll();
    },
    onError: (e: Error) => {
      toast({ title: "Unable to add contacts", description: e.message, variant: "destructive" });
      refreshAll();
    },
  });

  const removeMutation = useMutation({
    mutationFn: (contactId: string) =>
      call(`/audiences/${audience!.id}/contacts/${contactId}`, { method: "DELETE" }),
    onSuccess: refreshAll,
    onError: (e: Error) => toast({ title: "Unable to remove contact", description: e.message, variant: "destructive" }),
  });

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      toast({ title: "File too large", description: "Please import a file under 2 MB.", variant: "destructive" });
    } else if (/\.xlsx?$/i.test(file.name)) {
      toast({ title: "Excel files aren't supported", description: "In Excel, choose Save As, CSV, then import that file.", variant: "destructive" });
    } else {
      setText(await file.text());
    }
    if (fileRef.current) fileRef.current.value = "";
  };

  const parsed = parseLines(text);
  const contacts = contactsQuery.data ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contacts in {audience?.name}</DialogTitle>
          <DialogDescription>
            These are the people a campaign sends to. Numbers are normalized automatically (06..., 07..., +212...).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="contacts-text" className="text-sm font-medium text-foreground">Add contacts</label>
            <input ref={fileRef} type="file" accept=".csv,.txt,text/csv,text/plain" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()} disabled={addMutation.isPending}>
              <FileUp className="mr-2 h-4 w-4" />
              Import CSV
            </Button>
          </div>
          <Textarea
            id="contacts-text"
            rows={5}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={"One per line, or import a CSV:\nAhmed, 0612345678\nSara, +212700000000"}
            className="resize-none font-mono text-sm"
            disabled={addMutation.isPending}
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              {parsed.length.toLocaleString()} line{parsed.length === 1 ? "" : "s"} ready. Review them, then add.
            </p>
            <Button
              onClick={() => addMutation.mutate(parsed)}
              disabled={!parsed.length || addMutation.isPending}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {addMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Add contacts
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Only add customers who agreed to receive WhatsApp messages from your store.</p>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">Current contacts ({contacts.length})</p>
          {contactsQuery.isLoading ? (
            <div className="space-y-2">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-10 w-full" />)}</div>
          ) : contactsQuery.isError ? (
            <p className="text-sm text-destructive">Unable to load contacts. {(contactsQuery.error as Error).message}</p>
          ) : contacts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border py-8 text-center text-sm text-muted-foreground">
              No contacts yet. Add some above before sending a campaign to this audience.
            </p>
          ) : (
            <ul className="max-h-64 divide-y divide-border overflow-y-auto rounded-lg border border-border">
              {contacts.map((c) => (
                <li key={c.id} className="flex items-center justify-between gap-3 px-3 py-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{c.name || "No name"}</p>
                    <p className="text-xs tabular-nums text-muted-foreground">{c.phone_number}</p>
                  </div>
                  <Button variant="ghost" size="icon" aria-label={`Remove ${c.name || c.phone_number}`} onClick={() => removeMutation.mutate(c.id)} disabled={removeMutation.isPending}>
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}