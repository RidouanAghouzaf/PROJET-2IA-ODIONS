// import { useState, useEffect } from "react";
// import { Plus, Edit, Trash2 } from "lucide-react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Badge } from "@/components/ui/badge";
// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
// import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
// import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
// import { useToast } from "@/hooks/use-toast";
// import { useAuth } from "../context/AuthContext";
// import { format } from "date-fns";

// interface Tenant {
//   id: string;
//   name: string;
//   plan: string;
//   status: string;
//   created_at: string;
//   updated_at: string;
// }

// interface User {
//   id: string;
//   full_name: string;
//   email: string;
//   role: string;
//   phone?: string;
//   avatar_url?: string;
//   created_at: string;
//   updated_at: string;
// }

// const API_BASE = "http://localhost:3000/api";

// export default function Admin() {
//   const { session } = useAuth();
//   const { toast } = useToast();

//   const [users, setUsers] = useState<User[]>([]);
//   const [tenants, setTenants] = useState<Tenant[]>([]);
//   const [isLoading, setIsLoading] = useState(false);

//   const [editingUser, setEditingUser] = useState<User | null>(null);
//   const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

//   const [openUserDialog, setOpenUserDialog] = useState(false);
//   const [openTenantDialog, setOpenTenantDialog] = useState(false);

//   const [userForm, setUserForm] = useState({ full_name: "", email: "", role: "", phone: "" });
//   const [tenantForm, setTenantForm] = useState({ name: "", plan: "", status: "active" });

//   const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
//   const [deleteTenantId, setDeleteTenantId] = useState<string | null>(null);

//   const getAuthHeaders = () => {
//     const token = session?.access_token || localStorage.getItem("supabaseSession") ? JSON.parse(localStorage.getItem("supabaseSession")!).access_token : null;
//     return token ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } : { "Content-Type": "application/json" };
//   };

//   const apiCall = async (url: string, options: RequestInit = {}) => {
//     try {
//       const res = await fetch(url, { ...options, headers: getAuthHeaders() });
//       const data = await res.json();
//       if (!res.ok) throw new Error(data.error || "Request failed");
//       return data;
//     } catch (error: any) {
//       toast({ title: "API Error", description: error.message, variant: "destructive" });
//       throw error;
//     }
//   };

//   const fetchUsers = async () => {
//     setIsLoading(true);
//     try {
//       const data = await apiCall(`${API_BASE}/users`);
//       setUsers(data.users || []);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const fetchTenants = async () => {
//     setIsLoading(true);
//     try {
//       const data = await apiCall(`${API_BASE}/tenants`);
//       setTenants(data.tenants || []);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     if (session) {
//       fetchUsers();
//       fetchTenants();
//     }
//   }, [session]);

//   const handleAddOrUpdateUser = async (user: any) => {
//     try {
//       const method = user.id ? "PUT" : "POST";
//       const url = user.id ? `${API_BASE}/users/${user.id}` : `${API_BASE}/users`;
//       const savedUser = await apiCall(url, { method, body: JSON.stringify(user) });
//       setUsers(user.id ? users.map(u => u.id === savedUser.id ? savedUser : u) : [...users, savedUser]);
//       setEditingUser(null);
//       setOpenUserDialog(false);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleAddOrUpdateTenant = async (tenant: any) => {
//     try {
//       const method = tenant.id ? "PUT" : "POST";
//       const url = tenant.id ? `${API_BASE}/tenants/${tenant.id}` : `${API_BASE}/tenants`;
//       const savedTenant = await apiCall(url, { method, body: JSON.stringify(tenant) });
//       setTenants(tenant.id ? tenants.map(t => t.id === savedTenant.id ? savedTenant : t) : [...tenants, savedTenant]);
//       setEditingTenant(null);
//       setOpenTenantDialog(false);
//     } catch (err) {
//       console.error(err);
//     }
//   };

//   const handleDeleteUser = async (id: string) => {
//     await apiCall(`${API_BASE}/users/${id}`, { method: "DELETE" });
//     setUsers(users.filter(u => u.id !== id));
//     setDeleteUserId(null);
//   };

//   const handleDeleteTenant = async (id: string) => {
//     await apiCall(`${API_BASE}/tenants/${id}`, { method: "DELETE" });
//     setTenants(tenants.filter(t => t.id !== id));
//     setDeleteTenantId(null);
//   };

//   const getRoleBadge = (role: string) => <Badge variant="outline">{role}</Badge>;
//   const getStatusBadge = (status: string) => <Badge variant={status === "active" ? "default" : "outline"}>{status}</Badge>;

//   return (
//     <div className="space-y-6">
//       <div className="flex justify-between items-center">
//         <h1 className="text-3xl font-bold">Users & Tenants</h1>
//         <div className="flex gap-2">
//           <Dialog open={openUserDialog} onOpenChange={setOpenUserDialog}>
//             <DialogTrigger asChild>
//               <Button><Plus /> Add User</Button>
//             </DialogTrigger>
//             <DialogContent>
//               <UserForm
//                 onSubmit={handleAddOrUpdateUser}
//                 initialData={editingUser}
//                 onCancel={() => setOpenUserDialog(false)}
//               />
//             </DialogContent>
//           </Dialog>

//           <Dialog open={openTenantDialog} onOpenChange={setOpenTenantDialog}>
//             <DialogTrigger asChild>
//               <Button><Plus /> Add Tenant</Button>
//             </DialogTrigger>
//             <DialogContent>
//               <TenantForm
//                 onSubmit={handleAddOrUpdateTenant}
//                 initialData={editingTenant}
//                 onCancel={() => setOpenTenantDialog(false)}
//               />
//             </DialogContent>
//           </Dialog>
//         </div>
//       </div>

//       {/* Users Table */}
//       <Card>
//         <CardHeader><CardTitle>Users</CardTitle></CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Email</TableHead>
//                 <TableHead>Role</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {users.map(user => (
//                 <TableRow key={user.id}>
//                   <TableCell>{user.full_name}</TableCell>
//                   <TableCell>{user.email}</TableCell>
//                   <TableCell>{getRoleBadge(user.role)}</TableCell>
//                   <TableCell>
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">Actions</Button></DropdownMenuTrigger>
//                       <DropdownMenuContent>
//                         <DropdownMenuItem onClick={() => { setEditingUser(user); setOpenUserDialog(true); }}><Edit /> Edit</DropdownMenuItem>
//                         <DropdownMenuItem onClick={() => handleDeleteUser(user.id)} className="text-destructive"><Trash2 /> Delete</DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>

//       {/* Tenants Table */}
//       <Card>
//         <CardHeader><CardTitle>Tenants</CardTitle></CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Name</TableHead>
//                 <TableHead>Subscription</TableHead>
//                 <TableHead>Status</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {tenants.map(tenant => (
//                 <TableRow key={tenant.id}>
//                   <TableCell>{tenant.name}</TableCell>
//                   <TableCell>{tenant.plan}</TableCell>
//                   <TableCell>{getStatusBadge(tenant.status)}</TableCell>
//                   <TableCell>
//                     <DropdownMenu>
//                       <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">Actions</Button></DropdownMenuTrigger>
//                       <DropdownMenuContent>
//                         <DropdownMenuItem onClick={() => { setEditingTenant(tenant); setOpenTenantDialog(true); }}><Edit /> Edit</DropdownMenuItem>
//                         <DropdownMenuItem onClick={() => handleDeleteTenant(tenant.id)} className="text-destructive"><Trash2 /> Delete</DropdownMenuItem>
//                       </DropdownMenuContent>
//                     </DropdownMenu>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }

// // ===== Forms =====
// function UserForm({ onSubmit, initialData, onCancel }: any) {
//   const [name, setName] = useState(initialData?.full_name || "");
//   const [email, setEmail] = useState(initialData?.email || "");
//   const [role, setRole] = useState(initialData?.role || "user");
//   const [phone, setPhone] = useState(initialData?.phone || "");

//   const handleSubmit = () => {
//     if (!name || !email || !role) return alert("Fill all fields");
//     onSubmit({ id: initialData?.id, full_name: name, email, role, phone });
//   };

//   return (
//     <>
//       <DialogHeader><DialogTitle>{initialData ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
//       <div className="grid gap-4 py-4">
//         <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
//         <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
//         <Input placeholder="Phone" value={phone} onChange={e => setPhone(e.target.value)} />
//         <Select value={role} onValueChange={setRole}>
//           <SelectTrigger><SelectValue /></SelectTrigger>
//           <SelectContent>
//             <SelectItem value="admin">Admin</SelectItem>
//             <SelectItem value="manager">Manager</SelectItem>
//             <SelectItem value="user">User</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>
//       <DialogFooter>
//         <Button variant="outline" onClick={onCancel}>Cancel</Button>
//         <Button onClick={handleSubmit}>{initialData ? "Update" : "Add"}</Button>
//       </DialogFooter>
//     </>
//   );
// }

// function TenantForm({ onSubmit, initialData, onCancel }: any) {
//   const [name, setName] = useState(initialData?.name || "");
//   const [plan, setSubscription] = useState(initialData?.plan || "Basic");
//   const [status, setStatus] = useState(initialData?.status || "active");

//   const handleSubmit = () => {
//     if (!name) return alert("Tenant name required");
//     onSubmit({ id: initialData?.id, name, plan, status });
//   };

//   return (
//     <>
//       <DialogHeader><DialogTitle>{initialData ? "Edit Tenant" : "Add Tenant"}</DialogTitle></DialogHeader>
//       <div className="grid gap-4 py-4">
//         <Input placeholder="Tenant Name" value={name} onChange={e => setName(e.target.value)} />
//         <Select value={plan} onValueChange={setSubscription}>
//           <SelectTrigger><SelectValue /></SelectTrigger>
//           <SelectContent>
//             <SelectItem value="Free">Free</SelectItem>
//             <SelectItem value="Basic">Basic</SelectItem>
//             <SelectItem value="Premium">Premium</SelectItem>
//           </SelectContent>
//         </Select>
//         <Select value={status} onValueChange={setStatus}>
//           <SelectTrigger><SelectValue /></SelectTrigger>
//           <SelectContent>
//             <SelectItem value="active">Active</SelectItem>
//             <SelectItem value="inactive">Inactive</SelectItem>
//             <SelectItem value="trial">Trial</SelectItem>
//           </SelectContent>
//         </Select>
//       </div>
//       <DialogFooter>
//         <Button variant="outline" onClick={onCancel}>Cancel</Button>
//         <Button onClick={handleSubmit}>{initialData ? "Update" : "Add"}</Button>
//       </DialogFooter>
//     </>
//   );
// }


import { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "../context/AuthContext";

interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
  created_at: string;
  updated_at: string;
}

interface User {
  id: string;
  full_name: string;
  email: string;
  role: string;
  phone?: string;
  created_at: string;
  updated_at: string;
}

const API_BASE = "http://localhost:3000/api";

export default function Admin() {
  const { session } = useAuth();
  const { toast } = useToast();

  const [users, setUsers] = useState<User[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);

  const [openUserDialog, setOpenUserDialog] = useState(false);
  const [openTenantDialog, setOpenTenantDialog] = useState(false);

  const getAuthHeaders = () => {
    const token =
      session?.access_token ||
      JSON.parse(localStorage.getItem("supabaseSession") || "{}")?.access_token;
    return token
      ? { Authorization: `Bearer ${token}`, "Content-Type": "application/json" }
      : { "Content-Type": "application/json" };
  };

  const apiCall = async (url: string, options: RequestInit = {}) => {
    try {
      const res = await fetch(url, { ...options, headers: getAuthHeaders() });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      return data;
    } catch (error: any) {
      toast({
        title: "API Error",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    }
  };

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const data = await apiCall(`${API_BASE}/users`);
      setUsers(data.users || []);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTenants = async () => {
    setIsLoading(true);
    try {
      const data = await apiCall(`${API_BASE}/tenants`);
      setTenants(data.tenants || []);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchUsers();
      fetchTenants();
    }
  }, [session]);

  const handleAddOrUpdateUser = async (user: any) => {
    try {
      const method = user.id ? "PUT" : "POST";
      const url = user.id
        ? `${API_BASE}/users/${user.id}`
        : `${API_BASE}/users`;
      const savedUser = await apiCall(url, {
        method,
        body: JSON.stringify(user),
      });

      setUsers((prev) =>
        user.id
          ? prev.map((u) => (u.id === savedUser.id ? savedUser : u))
          : [...prev, savedUser]
      );

      setEditingUser(null);
      setOpenUserDialog(false);
      toast({ title: `User ${user.id ? "updated" : "created"} successfully` });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOrUpdateTenant = async (tenant: any) => {
    try {
      const method = tenant.id ? "PUT" : "POST";
      const url = tenant.id
        ? `${API_BASE}/tenants/${tenant.id}`
        : `${API_BASE}/tenants`;
      const savedTenant = await apiCall(url, {
        method,
        body: JSON.stringify(tenant),
      });

      setTenants((prev) =>
        tenant.id
          ? prev.map((t) => (t.id === savedTenant.id ? savedTenant : t))
          : [...prev, savedTenant]
      );

      setEditingTenant(null);
      setOpenTenantDialog(false);
      toast({
        title: `Tenant ${tenant.id ? "updated" : "created"} successfully`,
      });
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteUser = async (id: string) => {
    await apiCall(`${API_BASE}/users/${id}`, { method: "DELETE" });
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast({ title: "User deleted successfully" });
  };

  const handleDeleteTenant = async (id: string) => {
    await apiCall(`${API_BASE}/tenants/${id}`, { method: "DELETE" });
    setTenants((prev) => prev.filter((t) => t.id !== id));
    toast({ title: "Tenant deleted successfully" });
  };

  const getRoleBadge = (role: string) => (
    <Badge variant="outline">{role}</Badge>
  );
  const getStatusBadge = (status: string) => (
    <Badge variant={status === "active" ? "default" : "outline"}>{status}</Badge>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Admin Panel</h1>
        <div className="flex gap-2">
          <Dialog open={openUserDialog} onOpenChange={setOpenUserDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingUser(null)}>
                <Plus className="mr-1" /> Add User
              </Button>
            </DialogTrigger>
            <DialogContent>
              <UserForm
                onSubmit={handleAddOrUpdateUser}
                initialData={editingUser}
                onCancel={() => setOpenUserDialog(false)}
              />
            </DialogContent>
          </Dialog>

          <Dialog open={openTenantDialog} onOpenChange={setOpenTenantDialog}>
            <DialogTrigger asChild>
              <Button onClick={() => setEditingTenant(null)}>
                <Plus className="mr-1" /> Add Tenant
              </Button>
            </DialogTrigger>
            <DialogContent>
              <TenantForm
                onSubmit={handleAddOrUpdateTenant}
                initialData={editingTenant}
                onCancel={() => setOpenTenantDialog(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.full_name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{getRoleBadge(user.role)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingUser(user);
                          setOpenUserDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => handleDeleteUser(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader>
          <CardTitle>Tenants</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map((tenant) => (
                <TableRow key={tenant.id}>
                  <TableCell>{tenant.name}</TableCell>
                  <TableCell>{tenant.plan}</TableCell>
                  <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setEditingTenant(tenant);
                          setOpenTenantDialog(true);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-red-600"
                        onClick={() => handleDeleteTenant(tenant.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// ======= USER FORM =======
function UserForm({ onSubmit, initialData, onCancel }: any) {
  const [name, setName] = useState(initialData?.full_name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [role, setRole] = useState(initialData?.role || "user");
  const [phone, setPhone] = useState(initialData?.phone || "");

  const handleSubmit = () => {
    if (!name || !email || !role) return alert("Fill all fields");
    onSubmit({ id: initialData?.id, full_name: name, email, role, phone });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{initialData ? "Edit User" : "Add User"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Input placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>{initialData ? "Update" : "Add"}</Button>
      </DialogFooter>
    </>
  );
}

// ======= TENANT FORM =======
function TenantForm({ onSubmit, initialData, onCancel }: any) {
  const [name, setName] = useState(initialData?.name || "");
  const [plan, setPlan] = useState(initialData?.plan || "Basic");
  const [status, setStatus] = useState(initialData?.status || "active");

  const handleSubmit = () => {
    if (!name) return alert("Tenant name required");
    onSubmit({ id: initialData?.id, name, plan, status });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{initialData ? "Edit Tenant" : "Add Tenant"}</DialogTitle>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <Input placeholder="Tenant Name" value={name} onChange={(e) => setName(e.target.value)} />
        <Select value={plan} onValueChange={setPlan}>
          <SelectTrigger><SelectValue placeholder="Select plan" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Free">Free</SelectItem>
            <SelectItem value="Basic">Basic</SelectItem>
            <SelectItem value="Premium">Premium</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue placeholder="Select status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="trial">Trial</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button onClick={handleSubmit}>{initialData ? "Update" : "Add"}</Button>
      </DialogFooter>
    </>
  );
}
