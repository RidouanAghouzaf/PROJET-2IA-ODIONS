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
import { Eye, Download, Filter } from "lucide-react";

type Order = {
  id: string;
  clientName: string;
  deliveryCompany: string;
  store?: string;
  status: string;
  totalAmount: number;
  date: string;
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([
    {
      id: "ORD-001",
      clientName: "John Doe",
      deliveryCompany: "Ameex",
      store: "Store 1",
      status: "delivered",
      totalAmount: 250,
      date: "2025-09-10",
    },
    {
      id: "ORD-002",
      clientName: "Jane Smith",
      deliveryCompany: "Onesta",
      store: "Store 2",
      status: "pending",
      totalAmount: 150,
      date: "2025-09-11",
    },
  ]);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  const filteredOrders = orders.filter(
    (order) =>
      order.clientName.toLowerCase().includes(searchTerm.toLowerCase()) &&
      (statusFilter === "all" || order.status === statusFilter)
  );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground">
            List of all orders and their details
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        <Input
          placeholder="Search by client..."
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
          <CardTitle>Orders List</CardTitle>
          <CardDescription>All orders of your e-commerce stores</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Delivery Company</TableHead>
                <TableHead>Store</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell>{order.id}</TableCell>
                  <TableCell>{order.clientName}</TableCell>
                  <TableCell>{order.deliveryCompany}</TableCell>
                  <TableCell>{order.store}</TableCell>
                  <TableCell>{order.status}</TableCell>
                  <TableCell>{order.totalAmount} DH</TableCell>
                  <TableCell>{new Date(order.date).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setViewOrder(order)}
                      >
                        <Eye className="h-4 w-4" />
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

      {/* View Order Modal */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="sm:max-w-2xl rounded-xl shadow-2xl p-6 bg-white max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-gray-800">
              Order Details
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Detailed information for order {viewOrder?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 mt-4">
            <p>
              <strong>Client:</strong> {viewOrder?.clientName}
            </p>
            <p>
              <strong>Delivery Company:</strong> {viewOrder?.deliveryCompany}
            </p>
            <p>
              <strong>Store:</strong> {viewOrder?.store}
            </p>
            <p>
              <strong>Status:</strong> {viewOrder?.status}
            </p>
            <p>
              <strong>Total Amount:</strong> {viewOrder?.totalAmount} DH
            </p>
            <p>
              <strong>Date:</strong> {viewOrder?.date}
            </p>
          </div>
          <DialogFooter className="flex justify-end mt-6 border-t pt-4">
            <Button variant="outline" onClick={() => setViewOrder(null)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
