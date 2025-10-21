import React, { useState, useEffect } from "react";
import { Plus, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function UsersTenants() {
  // ===== States =====
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [tenants, setTenants] = useState([]);

  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [isTenantDialogOpen, setIsTenantDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editingTenant, setEditingTenant] = useState(null);

  // ===== Fetch Data from Backend =====
  useEffect(() => {
    fetchTenants();
    fetchUsers();
  }, []);

  const fetchTenants = async () => {
    const res = await fetch("/api/tenants");
    const data = await res.json();
    setTenants(data);
  };

  const fetchUsers = async () => {
    const res = await fetch("/api/users");
    const data = await res.json();
    setUsers(data);
  };

  // ===== Helpers =====
  const getInitials = (name) => name.split(" ").map(n => n[0]).join("").toUpperCase();
  const getStatusBadge = (status) => <Badge variant={status === "ACTIVE" ? "default" : "outline"}>{status}</Badge>;
  const getRoleBadge = (role) => <Badge variant="outline">{role}</Badge>;

  // ===== User Actions =====
  const handleAddUser = async (user) => {
    try {
      const payload = {
        ...user,
        tenant: { id: tenants.find(t => t.name === user.tenant)?.id } // Send tenant id
      };
      const res = await fetch(user.id ? `/api/users/${user.id}` : "/api/users", {
        method: user.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const savedUser = await res.json();
      setUsers(user.id 
        ? users.map(u => u.id === savedUser.id ? savedUser : u)
        : [...users, savedUser]
      );
      setEditingUser(null);
      setIsUserDialogOpen(false);
    } catch (err) {
      console.error("Error saving user:", err);
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await fetch(`/api/users/${id}`, { method: "DELETE" });
      setUsers(users.filter(u => u.id !== id));
    } catch (err) {
      console.error("Error deleting user:", err);
    }
  };

  // ===== Tenant Actions =====
  const handleAddTenant = async (tenant) => {
    try {
      const res = await fetch(tenant.id ? `/api/tenants/${tenant.id}` : "/api/tenants", {
        method: tenant.id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tenant)
      });
      const savedTenant = await res.json();
      setTenants(tenant.id 
        ? tenants.map(t => t.id === savedTenant.id ? savedTenant : t)
        : [...tenants, savedTenant]
      );
      setEditingTenant(null);
      setIsTenantDialogOpen(false);
    } catch (err) {
      console.error("Error saving tenant:", err);
    }
  };

  const handleDeleteTenant = async (id) => {
    try {
      await fetch(`/api/tenants/${id}`, { method: "DELETE" });
      setTenants(tenants.filter(t => t.id !== id));
    } catch (err) {
      console.error("Error deleting tenant:", err);
    }
  };

  // ===== Filtered Users =====
  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role.toLowerCase() === roleFilter;
    const matchesStatus = statusFilter === "all" || u.status.toLowerCase() === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  // ===== UI =====
  return (
    <div className="space-y-6">
      {/* Header & Actions */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Users & Tenants</h1>
        <div className="flex gap-2">
          <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus /> Add User</Button>
            </DialogTrigger>
            <DialogContent>
              <UserForm onSubmit={handleAddUser} initialData={editingUser} onCancel={() => setIsUserDialogOpen(false)} tenants={tenants} />
            </DialogContent>
          </Dialog>
          <Dialog open={isTenantDialogOpen} onOpenChange={setIsTenantDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus /> Add Tenant</Button>
            </DialogTrigger>
            <DialogContent>
              <TenantForm onSubmit={handleAddTenant} initialData={editingTenant} onCancel={() => setIsTenantDialogOpen(false)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader><CardTitle>Filter Users</CardTitle></CardHeader>
        <CardContent className="flex gap-4">
          <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger><SelectValue placeholder="Role" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="manager">Manager</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader><CardTitle>Users</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map(u => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Avatar><AvatarFallback>{getInitials(u.name)}</AvatarFallback></Avatar>
                      {u.name}
                    </div>
                  </TableCell>
                  <TableCell>{u.tenant?.name}</TableCell>
                  <TableCell>{getRoleBadge(u.role)}</TableCell>
                  <TableCell>{getStatusBadge(u.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">Actions</Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => { setEditingUser(u); setIsUserDialogOpen(true); }}><Edit /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteUser(u.id)} className="text-destructive"><Trash2 /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Tenants Table */}
      <Card>
        <CardHeader><CardTitle>Tenants</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Subscription</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tenants.map(t => (
                <TableRow key={t.id}>
                  <TableCell>{t.name}</TableCell>
                  <TableCell>{t.subscription}</TableCell>
                  <TableCell>{getStatusBadge(t.status)}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild><Button variant="ghost" size="sm">Actions</Button></DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => { setEditingTenant(t); setIsTenantDialogOpen(true); }}><Edit /> Edit</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteTenant(t.id)} className="text-destructive"><Trash2 /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
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

// ===== User Form =====
function UserForm({ onSubmit, initialData, onCancel, tenants }) {
  const [name, setName] = useState(initialData?.name || "");
  const [email, setEmail] = useState(initialData?.email || "");
  const [role, setRole] = useState(initialData?.role || "user");
  const [tenant, setTenant] = useState(initialData?.tenant?.name || tenants[0]?.name || "");
  const [status, setStatus] = useState(initialData?.status || "ACTIVE");

  const handleSubmit = () => {
    if (!name || !email) return alert("Please fill all fields");
    onSubmit({ id: initialData?.id, name, email, role, tenant, status });
  };

  return (
    <>
      <DialogHeader><DialogTitle>{initialData ? "Edit User" : "Add User"}</DialogTitle></DialogHeader>
      <div className="grid gap-4 py-4">
        <Input placeholder="Full Name" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} />
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="admin">Admin</SelectItem>
            <SelectItem value="manager">Manager</SelectItem>
            <SelectItem value="user">User</SelectItem>
          </SelectContent>
        </Select>
        <Select value={tenant} onValueChange={setTenant}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {tenants.map(t => <SelectItem key={t.id} value={t.name}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
            <SelectItem value="PENDING">Pending</SelectItem>
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

// ===== Tenant Form =====
function TenantForm({ onSubmit, initialData, onCancel }) {
  const [name, setName] = useState(initialData?.name || "");
  const [subscription, setSubscription] = useState(initialData?.subscription || "Basic");
  const [status, setStatus] = useState(initialData?.status || "ACTIVE");

  const handleSubmit = () => {
    if (!name) return alert("Please fill tenant name");
    onSubmit({ id: initialData?.id, name, subscription, status });
  };

  return (
    <>
      <DialogHeader><DialogTitle>{initialData ? "Edit Tenant" : "Add Tenant"}</DialogTitle></DialogHeader>
      <div className="grid gap-4 py-4">
        <Input placeholder="Tenant Name" value={name} onChange={e => setName(e.target.value)} />
        <Select value={subscription} onValueChange={setSubscription}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="Basic">Basic</SelectItem>
            <SelectItem value="Pro">Pro</SelectItem>
            <SelectItem value="Enterprise">Enterprise</SelectItem>
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ACTIVE">Active</SelectItem>
            <SelectItem value="INACTIVE">Inactive</SelectItem>
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
