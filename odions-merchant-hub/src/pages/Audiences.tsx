import { useState, useEffect } from "react";
import { Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";

const API_URL = "http://localhost:3000/api/audiences";

const audienceSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  criteria_summary: z.string().optional(),
  delivery_company: z.string().optional(),
  status: z.string().optional(),
  limit: z.string().optional(),
});

const Audiences = () => {
  const [open, setOpen] = useState(false);
  const [editingAudience, setEditingAudience] = useState<any>(null);
  const [deleteAudienceId, setDeleteAudienceId] = useState<string | null>(null);
  const [audiences, setAudiences] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const { session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const accessToken = session?.access_token;

  const form = useForm<z.infer<typeof audienceSchema>>({
    resolver: zodResolver(audienceSchema),
    defaultValues: {
      name: "",
      criteria_summary: "",
      delivery_company: "",
      status: "",
      limit: "",
    },
  });

  // 🟢 Helper to attach headers with Authorization
  const getHeaders = () => ({
    "Content-Type": "application/json",
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  });

  // 🟢 GET all audiences (no useQuery)
  useEffect(() => {
    const fetchAudiences = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const res = await fetch(API_URL, { headers: getHeaders() });
        if (res.status === 401) throw new Error("Unauthorized. Please log in again.");
        if (!res.ok) throw new Error("Failed to fetch audiences");

        const json = await res.json();
        setAudiences(json.audiences || []);
      } catch (err: any) {
        setError(err.message);
        toast({ title: err.message, variant: "destructive" });
      } finally {
        setIsLoading(false);
      }
    };

    fetchAudiences();
  }, [accessToken]); // refetch when user logs in/out

  // 🟢 CREATE new audience
  const createMutation = useMutation({
    mutationFn: async (values: z.infer<typeof audienceSchema>) => {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          name: values.name,
          criteria_summary:
            values.criteria_summary ||
            `${values.delivery_company || "Any"} delivery, ${
              values.status || "any status"
            }`,
          size: parseInt(values.limit || "0"),
        }),
      });
      if (!res.ok) throw new Error("Failed to create audience");
      return res.json();
    },
    onSuccess: async () => {
      toast({ title: "Audience created successfully" });
      setOpen(false);
      form.reset();
      // refresh list manually
      const res = await fetch(API_URL, { headers: getHeaders() });
      const json = await res.json();
      setAudiences(json.audiences || []);
    },
    onError: (err: any) => {
      toast({
        title: err.message || "Failed to create audience",
        variant: "destructive",
      });
    },
  });

  // 🟢 UPDATE audience
  const updateMutation = useMutation({
    mutationFn: async (values: z.infer<typeof audienceSchema>) => {
      if (!editingAudience) throw new Error("No audience selected for update");

      const res = await fetch(`${API_URL}/${editingAudience.id}`, {
        method: "PUT",
        headers: getHeaders(),
        body: JSON.stringify({
          name: values.name,
          criteria_summary:
            values.criteria_summary ||
            `${values.delivery_company || "Any"} delivery, ${
              values.status || "any status"
            }`,
          size: parseInt(values.limit || "0"),
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Failed to update audience");
      }

      return res.json();
    },
    onSuccess: async () => {
      toast({ title: "Audience updated successfully" });
      setEditingAudience(null);
      setOpen(false);
      form.reset();
      // refresh list manually
      const res = await fetch(API_URL, { headers: getHeaders() });
      const json = await res.json();
      setAudiences(json.audiences || []);
    },
    onError: (err: any) => {
      toast({
        title: err.message || "Failed to update audience",
        variant: "destructive",
      });
    },
  });

  // 🟢 DELETE audience
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: getHeaders(),
      });
      if (!res.ok) throw new Error("Failed to delete audience");
    },
    onSuccess: async () => {
      toast({ title: "Audience deleted successfully" });
      setDeleteAudienceId(null);
      // refresh list manually
      const res = await fetch(API_URL, { headers: getHeaders() });
      const json = await res.json();
      setAudiences(json.audiences || []);
    },
    onError: (err: any) => {
      toast({ title: err.message || "Failed to delete audience", variant: "destructive" });
    },
  });

  // 🟢 Form submit (create or update)
  const onSubmit = (values: z.infer<typeof audienceSchema>) => {
    if (editingAudience) {
      updateMutation.mutate(values);
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (audience: any) => {
    setEditingAudience(audience);
    form.reset({
      name: audience.name,
      criteria_summary: audience.criteria_summary || "",
      delivery_company: "",
      status: "",
      limit: audience.size?.toString() || "",
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingAudience(null);
    form.reset();
  };

  return (
    <div className="space-y-6">
      {/* HEADER + CREATE BUTTON */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Audiences</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage customer segments for targeted campaigns.
          </p>
        </div>

        {/* Create Audience Dialog */}
        <Dialog
          open={open}
          onOpenChange={(isOpen) => {
            if (!isOpen) handleCloseDialog();
            else setOpen(true);
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => {
                setEditingAudience(null);
                form.reset();
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Create Audience
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingAudience ? "Edit Audience" : "Create New Audience"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-4 py-4"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Audience Name</FormLabel>
                      <FormControl>
                        <Input placeholder="High Value Customers" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="criteria_summary"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe this audience segment..."
                          className="min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="delivery_company"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Delivery Company (Optional)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select delivery company" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="dhl">DHL</SelectItem>
                          <SelectItem value="fedex">FedEx</SelectItem>
                          <SelectItem value="ups">UPS</SelectItem>
                          <SelectItem value="local">Local Delivery</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Size Limit (Optional)</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="0" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCloseDialog}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      createMutation.isPending || updateMutation.isPending
                    }
                  >
                    {editingAudience ? "Update Audience" : "Create Audience"}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Audiences Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Audiences</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-10">{error}</div>
          ) : audiences.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              No audiences yet. Create your first audience to get started.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Size</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {audiences.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell className="max-w-md truncate">
                      {a.criteria_summary || "—"}
                    </TableCell>
                    <TableCell>
                      {format(new Date(a.created_at), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell className="text-right">{a.size || 0}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" asChild>
                          <Link to={`/audiences/${a.id}`}>
                            <Eye className="h-4 w-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(a)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteAudienceId(a.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteAudienceId}
        onOpenChange={(o) => !o && setDeleteAudienceId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete audience?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              audience.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                deleteAudienceId && deleteMutation.mutate(deleteAudienceId)
              }
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Audiences;
