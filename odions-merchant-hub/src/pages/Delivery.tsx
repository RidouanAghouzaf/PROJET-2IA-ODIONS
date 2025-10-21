// import React, { useState, useEffect } from "react";
// import { Plus, Edit, Trash2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
//   DialogFooter,
// } from "@/components/ui/dialog";
// import { Input } from "@/components/ui/input";
// import { Switch } from "@/components/ui/switch";

// interface DeliveryCompany {
//   id: number;
//   name: string;
//   email: string;
//   phone: string;
//   country: string;
//   status: boolean;
// }

// const TOKEN =
//   "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJUZXN0VXNlciIsImlhdCI6MTc2MDg5MTM1MCwiZXhwIjoxNzYwODk0OTUwfQ.lQb2-EB-HIcp3A7BmWmvXcdvzmtSfoxkm30lEqtJVuY";

// const isValidToken = (token: string) => token.split(".").length === 3;

// export default function DeliveryCompanies() {
//   const [companies, setCompanies] = useState<DeliveryCompany[]>([]);
//   const [openDialog, setOpenDialog] = useState(false);
//   const [editingCompany, setEditingCompany] = useState<DeliveryCompany | null>(null);
//   const [form, setForm] = useState<Omit<DeliveryCompany, "id">>({
//     name: "",
//     email: "",
//     phone: "",
//     country: "",
//     status: true,
//   });
//   const [loading, setLoading] = useState(false);
//   const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

//   const [filters, setFilters] = useState({
//     name: "",
//     email: "",
//     country: "",
//     status: "all", // all | active | inactive
//   });

//   const API_BASE = "http://localhost:5000/api/delivery-companies";

//   const getAuthHeader = () => {
//     if (!TOKEN || !isValidToken(TOKEN)) {
//       setMessage({ type: "error", text: "Invalid or missing token. Please check your authentication." });
//       throw new Error("Invalid token");
//     }
//     return `Bearer ${TOKEN}`;
//   };

//   const apiCall = async (
//     url: string,
//     options: RequestInit = {}
//   ): Promise<{ ok: boolean; data: any; status: number }> => {
//     try {
//       const res = await fetch(url, {
//         ...options,
//         headers: {
//           Authorization: getAuthHeader(),
//           ...(options.headers || {}),
//         },
//       });
//       const data = await res.json();
//       return { ok: res.ok, data, status: res.status };
//     } catch (err) {
//       console.error("API call error:", err);
//       return { ok: false, data: null, status: 0 };
//     }
//   };

//   const fetchCompanies = async () => {
//     const { ok, data, status } = await apiCall(API_BASE);
//     if (status === 401) {
//       setMessage({ type: "error", text: "Unauthorized. Please log in again." });
//       return;
//     }
//     if (ok) {
//       setCompanies(data.delivery_companies || []);
//     } else {
//       setMessage({ type: "error", text: "Failed to load companies." });
//     }
//   };

//   useEffect(() => {
//     fetchCompanies();
//   }, []);

//   const handleSave = async () => {
//     if (!form.name || !form.email || !form.phone || !form.country) {
//       setMessage({ type: "error", text: "All fields are required." });
//       return;
//     }

//     setLoading(true);
//     const method = editingCompany ? "PUT" : "POST";
//     const url = editingCompany ? `${API_BASE}/${editingCompany.id}` : API_BASE;

//     const { ok, data, status } = await apiCall(url, {
//       method,
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify(form),
//     });

//     setLoading(false);

//     if (status === 401) {
//       setMessage({ type: "error", text: "Unauthorized. Please log in again." });
//       return;
//     }

//     if (!ok) {
//       setMessage({ type: "error", text: data.error?.message || "Failed to save company." });
//       return;
//     }

//     await fetchCompanies();
//     closeDialog();
//     setMessage({
//       type: "success",
//       text: editingCompany ? "Company updated successfully." : "Company added successfully.",
//     });
//   };

//   const handleDelete = async (id: number) => {
//     if (!confirm("Are you sure you want to delete this company?")) return;

//     setLoading(true);
//     const { ok, data, status } = await apiCall(`${API_BASE}/${id}`, {
//       method: "DELETE",
//     });
//     setLoading(false);

//     if (status === 401) {
//       setMessage({ type: "error", text: "Unauthorized. Please log in again." });
//       return;
//     }
//     if (!ok) {
//       setMessage({ type: "error", text: data.error?.message || "Failed to delete company." });
//       return;
//     }

//     await fetchCompanies();
//     setMessage({ type: "success", text: "Company deleted successfully." });
//   };

//   const toggleStatus = async (company: DeliveryCompany, newStatus: boolean) => {
//     const { ok, status } = await apiCall(`${API_BASE}/${company.id}/status`, {
//       method: "PATCH",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ status: newStatus }),
//     });

//     if (ok) {
//       setCompanies((prev) =>
//         prev.map((c) => (c.id === company.id ? { ...c, status: newStatus } : c))
//       );
//       setMessage({ type: "success", text: `Status updated for ${company.name}.` });
//     } else if (status === 401) {
//       setMessage({ type: "error", text: "Unauthorized. Please log in again." });
//     }
//   };

//   const openDialogToAdd = () => {
//     setEditingCompany(null);
//     setForm({ name: "", email: "", phone: "", country: "", status: true });
//     setOpenDialog(true);
//   };

//   const openDialogToEdit = (company: DeliveryCompany) => {
//     setEditingCompany(company);
//     setForm({
//       name: company.name,
//       email: company.email,
//       phone: company.phone,
//       country: company.country,
//       status: company.status,
//     });
//     setOpenDialog(true);
//   };

//   const closeDialog = () => {
//     setOpenDialog(false);
//     setEditingCompany(null);
//     setForm({ name: "", email: "", phone: "", country: "", status: true });
//   };

//   const Toast = () =>
//     message ? (
//       <div
//         className={`fixed bottom-6 right-6 px-4 py-2 rounded shadow text-white z-50 cursor-pointer ${
//           message.type === "success" ? "bg-green-600" : "bg-red-600"
//         }`}
//         onClick={() => setMessage(null)}
//         role="alert"
//       >
//         {message.text}
//       </div>
//     ) : null;

//   return (
//     <div className="p-6 space-y-6 relative">
//       <Toast />

//       <div className="flex justify-between items-center">
//         <h1 className="text-2xl font-bold">Delivery Companies</h1>
//         <Button onClick={openDialogToAdd} disabled={loading}>
//           <Plus className="w-4 h-4 mr-2" /> Add Delivery Company
//         </Button>
//       </div>

//       <Card>
//         <CardContent className="p-4 space-y-4 overflow-x-auto">
//           {/* Filters */}
//           <div className="flex flex-wrap gap-4 items-center">
//             <Input
//               placeholder="Filter by Name"
//               value={filters.name}
//               onChange={(e) => setFilters({ ...filters, name: e.target.value })}
//               className="w-[200px]"
//             />
//             <Input
//               placeholder="Filter by Email"
//               value={filters.email}
//               onChange={(e) => setFilters({ ...filters, email: e.target.value })}
//               className="w-[200px]"
//             />
//             <Input
//               placeholder="Filter by Country"
//               value={filters.country}
//               onChange={(e) => setFilters({ ...filters, country: e.target.value })}
//               className="w-[200px]"
//             />
//             <select
//               className="border rounded px-3 py-2 text-sm"
//               value={filters.status}
//               onChange={(e) => setFilters({ ...filters, status: e.target.value })}
//             >
//               <option value="all">All Statuses</option>
//               <option value="active">Active</option>
//               <option value="inactive">Inactive</option>
//             </select>
//           </div>

//           {/* Table */}
//           <table className="w-full text-left border-collapse min-w-[600px]">
//             <thead>
//               <tr className="border-b">
//                 <th className="p-2">Name</th>
//                 <th className="p-2">Email</th>
//                 <th className="p-2">Phone</th>
//                 <th className="p-2">Country</th>
//                 <th className="p-2">Status</th>
//                 <th className="p-2 text-right">Actions</th>
//               </tr>
//             </thead>
//             <tbody>
//               {companies
//                 .filter((c) =>
//                   c.name.toLowerCase().includes(filters.name.toLowerCase())
//                 )
//                 .filter((c) =>
//                   c.email.toLowerCase().includes(filters.email.toLowerCase())
//                 )
//                 .filter((c) =>
//                   c.country.toLowerCase().includes(filters.country.toLowerCase())
//                 )
//                 .filter((c) =>
//                   filters.status === "all"
//                     ? true
//                     : filters.status === "active"
//                     ? c.status
//                     : !c.status
//                 )
//                 .map((c) => (
//                   <tr key={c.id} className="border-b hover:bg-gray-50">
//                     <td className="p-2">{c.name}</td>
//                     <td className="p-2">{c.email}</td>
//                     <td className="p-2">{c.phone}</td>
//                     <td className="p-2">{c.country}</td>
//                     <td className="p-2">
//                       <Switch
//                         checked={c.status}
//                         onCheckedChange={(checked) => toggleStatus(c, checked)}
//                         disabled={loading}
//                       />
//                     </td>
//                     <td className="p-2 flex justify-end gap-2">
//                       <Button
//                         variant="outline"
//                         size="sm"
//                         onClick={() => openDialogToEdit(c)}
//                         disabled={loading}
//                       >
//                         <Edit className="h-4 w-4" />
//                       </Button>
//                       <Button
//                         variant="destructive"
//                         size="sm"
//                         onClick={() => handleDelete(c.id)}
//                         disabled={loading}
//                       >
//                         <Trash2 className="h-4 w-4" />
//                       </Button>
//                     </td>
//                   </tr>
//                 ))}
//             </tbody>
//           </table>
//         </CardContent>
//       </Card>

//       <Dialog open={openDialog} onOpenChange={setOpenDialog}>
//         <DialogContent>
//           <DialogHeader>
//             <DialogTitle>
//               {editingCompany ? "Edit Company" : "Add Delivery Company"}
//             </DialogTitle>
//           </DialogHeader>
//           <div className="space-y-3">
//             <Input
//               placeholder="Company Name"
//               value={form.name}
//               onChange={(e) => setForm({ ...form, name: e.target.value })}
//               disabled={loading}
//             />
//             <Input
//               placeholder="Email"
//               value={form.email}
//               onChange={(e) => setForm({ ...form, email: e.target.value })}
//               disabled={loading}
//             />
//             <Input
//               placeholder="Phone"
//               value={form.phone}
//               onChange={(e) => setForm({ ...form, phone: e.target.value })}
//               disabled={loading}
//             />
//             <Input
//               placeholder="Country"
//               value={form.country}
//               onChange={(e) => setForm({ ...form, country: e.target.value })}
//               disabled={loading}
//             />
//             <div className="flex items-center justify-between">
//               <span>Active</span>
//               <Switch
//                 checked={form.status}
//                 onCheckedChange={(checked) => setForm({ ...form, status: checked })}
//                 disabled={loading}
//               />
//             </div>
//           </div>
//           <DialogFooter>
//             <Button variant="outline" onClick={closeDialog} disabled={loading}>
//               Cancel
//             </Button>
//             <Button onClick={handleSave} disabled={loading}>
//               {editingCompany ? "Save Changes" : "Add Company"}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>
//     </div>
//   );
// }

import { useState, useEffect } from "react";
import { Plus, Pencil, Trash2 } from "lucide-react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";
import { format } from "date-fns";

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

const API_BASE = "http://localhost:3000/api/delivery-companies";

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

  const { user, session } = useAuth();
  const { toast } = useToast();

  // Get access token from auth session
  const getAccessToken = () => {
    // First try to get from session context
    if (session?.access_token) {
      return session.access_token;
    }

    // Fallback: try to get from localStorage
    try {
      const storedSession = localStorage.getItem("supabaseSession");
      if (storedSession) {
        const parsedSession = JSON.parse(storedSession);
        return parsedSession.access_token;
      }
    } catch (error) {
      console.error("Error parsing stored session:", error);
    }
    
    console.log("Access token: Not found");
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
        toast({
          title: "Session expired",
          description: "Please log in again",
          variant: "destructive",
        });
        throw new Error("Unauthorized");
      }

      if (!response.ok) {
        throw new Error(data.error?.message || "Request failed");
      }

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
      toast({
        title: "Failed to load companies",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session || user) {
      fetchCompanies();
    }
  }, [session, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.phone || !formData.country) {
      toast({
        title: "Validation error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const method = editingCompany ? "PUT" : "POST";
      const url = editingCompany ? `${API_BASE}/${editingCompany.id}` : API_BASE;

      await apiCall(url, {
        method,
        body: JSON.stringify(formData),
      });

      await fetchCompanies();
      toast({
        title: editingCompany ? "Company updated" : "Company created",
        description: `Delivery company ${editingCompany ? "updated" : "created"} successfully`,
      });
      closeDialog();
    } catch (error: any) {
      toast({
        title: `Failed to ${editingCompany ? "update" : "create"} company`,
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteCompanyId) return;

    setIsLoading(true);
    try {
      await apiCall(`${API_BASE}/${deleteCompanyId}`, {
        method: "DELETE",
      });

      await fetchCompanies();
      toast({
        title: "Company deleted",
        description: "Delivery company deleted successfully",
      });
      setDeleteCompanyId(null);
    } catch (error: any) {
      toast({
        title: "Failed to delete company",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleStatus = async (company: DeliveryCompany, newStatus: boolean) => {
    setIsLoading(true);
    try {
      await apiCall(`${API_BASE}/${company.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus }),
      });

      setCompanies((prev) =>
        prev.map((c) => (c.id === company.id ? { ...c, status: newStatus } : c))
      );
      
      toast({
        title: "Status updated",
        description: `Status updated for ${company.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to update status",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      country: "",
      status: true,
    });
  };

  const handleEdit = (company: DeliveryCompany) => {
    setEditingCompany(company);
    setFormData({
      name: company.name,
      email: company.email,
      phone: company.phone,
      country: company.country,
      status: company.status,
    });
    setOpen(true);
  };

  const closeDialog = () => {
    setOpen(false);
    setEditingCompany(null);
    resetForm();
  };

  const filteredCompanies = companies.filter((c) => {
    const matchesName = c.name.toLowerCase().includes(filters.name.toLowerCase());
    const matchesEmail = c.email.toLowerCase().includes(filters.email.toLowerCase());
    const matchesCountry = c.country.toLowerCase().includes(filters.country.toLowerCase());
    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "active" && c.status) ||
      (filters.status === "inactive" && !c.status);

    return matchesName && matchesEmail && matchesCountry && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Delivery Companies</h1>
          <p className="text-muted-foreground mt-1">Manage your connected delivery partners</p>
        </div>

        {/* Create Dialog */}
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Add Company
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingCompany ? "Edit" : "Add"} Delivery Company</DialogTitle>
              <DialogDescription>
                {editingCompany ? "Update" : "Add a new"} delivery company details
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Company Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Ameex"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="company@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    placeholder="+212 600 000000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input
                    id="country"
                    placeholder="Morocco"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    required
                    disabled={isLoading}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="status">Active Status</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable this company for order processing
                    </p>
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
                <Button
                  type="button"
                  variant="outline"
                  onClick={closeDialog}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {editingCompany ? "Update" : "Create"} Company
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              placeholder="Filter by name"
              value={filters.name}
              onChange={(e) => setFilters({ ...filters, name: e.target.value })}
            />
            <Input
              placeholder="Filter by email"
              value={filters.email}
              onChange={(e) => setFilters({ ...filters, email: e.target.value })}
            />
            <Input
              placeholder="Filter by country"
              value={filters.country}
              onChange={(e) => setFilters({ ...filters, country: e.target.value })}
            />
            <select
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Desktop Table View */}
      <Card className="hidden md:block">
        {isLoading ? (
          <div className="p-6 space-y-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredCompanies.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No delivery companies found. Add your first company to get started.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Company Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCompanies.map((company) => (
                <TableRow key={company.id}>
                  <TableCell className="font-medium">{company.name}</TableCell>
                  <TableCell>{company.email}</TableCell>
                  <TableCell>{company.phone}</TableCell>
                  <TableCell>{company.country}</TableCell>
                  <TableCell>
                    <Switch
                      checked={company.status}
                      onCheckedChange={(checked) => toggleStatus(company, checked)}
                      disabled={isLoading}
                    />
                  </TableCell>
                  <TableCell>
                    {company.created_at
                      ? format(new Date(company.created_at), "MMM dd, yyyy")
                      : "N/A"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEdit(company)}
                        disabled={isLoading}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteCompanyId(company.id)}
                        disabled={isLoading}
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
      </Card>

      {/* Mobile Card View */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {isLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 w-full" />)
        ) : filteredCompanies.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-muted-foreground">No delivery companies found.</p>
            </CardContent>
          </Card>
        ) : (
          filteredCompanies.map((company) => (
            <Card key={company.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{company.name}</CardTitle>
                  <Switch
                    checked={company.status}
                    onCheckedChange={(checked) => toggleStatus(company, checked)}
                    disabled={isLoading}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{company.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{company.phone}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Country:</span>
                  <span className="font-medium">{company.country}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="font-medium">
                    {company.created_at
                      ? format(new Date(company.created_at), "MMM dd, yyyy")
                      : "N/A"}
                  </span>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleEdit(company)}
                    disabled={isLoading}
                  >
                    <Pencil className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => setDeleteCompanyId(company.id)}
                    disabled={isLoading}
                  >
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteCompanyId}
        onOpenChange={(open) => !open && setDeleteCompanyId(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this delivery company. This action cannot be undone.
              {" "}Companies with existing orders cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}