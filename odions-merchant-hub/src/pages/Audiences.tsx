import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Eye, Edit, Trash2, Filter, Plus, Download } from "lucide-react";

type Audience = {
  id: string;
  name: string;
  deliveryCompany: string;
  store?: string;
  orderStatus: string;
  dateRange: { start: string; end: string };
  minAmount?: number;
  maxAmount?: number;
  numberOfClients?: number | "all";
  products?: string[];
  purchaseFrequency?: number;
  city?: string;
  region?: string;
  country?: string;
  includeRefused?: boolean;
  topLoyal?: boolean;
  clientsCount: number;
  createdAt: string;
};

export default function Audiences() {
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewAudience, setViewAudience] = useState<Audience | null>(null);

  const [formData, setFormData] = useState<Partial<Audience>>({
    name: "",
    deliveryCompany: "",
    store: "",
    orderStatus: "",
    dateRange: { start: "", end: "" },
    minAmount: undefined,
    maxAmount: undefined,
    numberOfClients: undefined,
    products: [],
    purchaseFrequency: undefined,
    city: "",
    region: "",
    country: "",
    includeRefused: false,
    topLoyal: false,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Handle input
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type, checked } = e.target;
    if (type === "checkbox") {
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name) newErrors.name = "Audience name is required";
    if (!formData.deliveryCompany) newErrors.deliveryCompany = "Delivery company is required";
    if (!formData.orderStatus) newErrors.orderStatus = "Order status is required";
    if (!formData.dateRange?.start || !formData.dateRange?.end)
      newErrors.dateRange = "Date range is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Save Audience
  const handleSaveAudience = () => {
    if (validateForm()) {
      const newAudience: Audience = {
        id: `AUD-${(audiences.length + 1).toString().padStart(3, "0")}`,
        name: formData.name!,
        deliveryCompany: formData.deliveryCompany!,
        store: formData.store,
        orderStatus: formData.orderStatus!,
        dateRange: formData.dateRange!,
        minAmount: formData.minAmount,
        maxAmount: formData.maxAmount,
        numberOfClients: formData.numberOfClients,
        products: formData.products,
        purchaseFrequency: formData.purchaseFrequency,
        city: formData.city,
        region: formData.region,
        country: formData.country,
        includeRefused: formData.includeRefused,
        topLoyal: formData.topLoyal,
        clientsCount: Math.floor(Math.random() * 100), // mock
        createdAt: new Date().toISOString(),
      };
      setAudiences([...audiences, newAudience]);
      setIsDialogOpen(false);
      setFormData({});
      setErrors({});
    }
  };

  // Filter audiences
  const filteredAudiences = audiences.filter(
    (aud) =>
      aud.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "all" || aud.orderStatus === statusFilter)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Audiences Management</h1>
          <p className="text-muted-foreground">
            Create and manage customer audiences
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90">
              <Plus className="h-4 w-4 mr-2" />
              Create Audience
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-2xl rounded-xl shadow-2xl p-6 bg-white max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold text-gray-800">
                Create New Audience
              </DialogTitle>
              <DialogDescription className="text-gray-500">
                Define all required criteria for this audience.
              </DialogDescription>
            </DialogHeader>

            {/* Form */}
            <div className="space-y-4">
              <Input
                placeholder="Audience Name"
                name="name"
                value={formData.name || ""}
                onChange={handleInputChange}
              />
              {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}

              <select
                name="deliveryCompany"
                value={formData.deliveryCompany || ""}
                onChange={handleInputChange}
                className="border rounded-md p-2 w-full"
              >
                <option value="">Select Delivery Company</option>
                <option value="Ameex">Ameex</option>
                <option value="Onesta">Onesta</option>
                <option value="Ozon Express">Ozon Express</option>
                <option value="Digilog">Digilog</option>
              </select>
              {errors.deliveryCompany && <p className="text-red-500 text-sm">{errors.deliveryCompany}</p>}

              <Input
                placeholder="Store (optional)"
                name="store"
                value={formData.store || ""}
                onChange={handleInputChange}
              />

              <select
                name="orderStatus"
                value={formData.orderStatus || ""}
                onChange={handleInputChange}
                className="border rounded-md p-2 w-full"
              >
                <option value="">Select Order Status</option>
                <option value="delivered">Delivered</option>
                <option value="refused">Refused</option>
                <option value="pending">Pending</option>
                <option value="returned">Returned</option>
              </select>
              {errors.orderStatus && <p className="text-red-500 text-sm">{errors.orderStatus}</p>}

              <div className="flex gap-2">
                <Input
                  type="date"
                  name="dateRange.start"
                  placeholder="Start Date"
                  value={formData.dateRange?.start || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    dateRange: { ...formData.dateRange!, start: e.target.value }
                  })}
                />
                <Input
                  type="date"
                  name="dateRange.end"
                  placeholder="End Date"
                  value={formData.dateRange?.end || ""}
                  onChange={(e) => setFormData({
                    ...formData,
                    dateRange: { ...formData.dateRange!, end: e.target.value }
                  })}
                />
              </div>
              {errors.dateRange && <p className="text-red-500 text-sm">{errors.dateRange}</p>}

              <div className="flex gap-2">
                <Input
                  placeholder="Min Amount"
                  name="minAmount"
                  type="number"
                  value={formData.minAmount || ""}
                  onChange={handleInputChange}
                />
                <Input
                  placeholder="Max Amount"
                  name="maxAmount"
                  type="number"
                  value={formData.maxAmount || ""}
                  onChange={handleInputChange}
                />
              </div>

              <Input
                placeholder="Number of Clients (all, 50, 100, etc.)"
                name="numberOfClients"
                value={formData.numberOfClients?.toString() || ""}
                onChange={handleInputChange}
              />
              <Input
                placeholder="Products (comma separated)"
                name="products"
                value={formData.products?.join(",") || ""}
                onChange={(e) =>
                  setFormData({ ...formData, products: e.target.value.split(",") })
                }
              />
              <Input
                placeholder="Purchase Frequency"
                name="purchaseFrequency"
                type="number"
                value={formData.purchaseFrequency || ""}
                onChange={handleInputChange}
              />
              <Input
                placeholder="City"
                name="city"
                value={formData.city || ""}
                onChange={handleInputChange}
              />
              <Input
                placeholder="Region"
                name="region"
                value={formData.region || ""}
                onChange={handleInputChange}
              />
              <Input
                placeholder="Country"
                name="country"
                value={formData.country || ""}
                onChange={handleInputChange}
              />
              <div className="flex gap-4 items-center">
                <label>
                  <input
                    type="checkbox"
                    name="includeRefused"
                    checked={formData.includeRefused || false}
                    onChange={handleInputChange}
                  /> Include Refused Orders
                </label>
                <label>
                  <input
                    type="checkbox"
                    name="topLoyal"
                    checked={formData.topLoyal || false}
                    onChange={handleInputChange}
                  /> Top Loyal Customers
                </label>
              </div>
            </div>

            <DialogFooter className="flex justify-end mt-6 border-t pt-4 gap-3">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="px-6">
                Cancel
              </Button>
              <Button
                onClick={handleSaveAudience}
                className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white px-6"
              >
                Save Audience
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Search Audience..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select
          className="border rounded-md p-2"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All Statuses</option>
          <option value="delivered">Delivered</option>
          <option value="refused">Refused</option>
          <option value="pending">Pending</option>
          <option value="returned">Returned</option>
        </select>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" /> Filter
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Audience List</CardTitle>
          <CardDescription>
            List of all customer audiences
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Delivery Company</TableHead>
                <TableHead>Clients Count</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAudiences.map((aud) => (
                <TableRow key={aud.id}>
                  <TableCell>{aud.name}</TableCell>
                  <TableCell>{aud.deliveryCompany}</TableCell>
                  <TableCell>{aud.clientsCount}</TableCell>
                  <TableCell>{new Date(aud.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewAudience(aud)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View Audience Modal */}
      <Dialog open={!!viewAudience} onOpenChange={() => setViewAudience(null)}>
        <DialogContent className="sm:max-w-3xl rounded-xl shadow-2xl p-6 bg-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              {viewAudience?.name}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Audience Details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p>
              <strong>Delivery Company:</strong> {viewAudience?.deliveryCompany}
            </p>
            <p>
              <strong>Order Status:</strong> {viewAudience?.orderStatus}
            </p>
            <p>
              <strong>Clients Count:</strong> {viewAudience?.clientsCount}
            </p>
            <p>
              <strong>Date Range:</strong> {viewAudience?.dateRange.start} - {viewAudience?.dateRange.end}
            </p>
          </div>
          <DialogFooter className="flex justify-end mt-6 border-t pt-4">
            <Button variant="outline" onClick={() => setViewAudience(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
