import React, { useState } from "react";
import { ArrowLeft, Download, RefreshCw, Search, Filter, Mail, MessageSquare, Eye, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

export default function AudienceResults() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const itemsPerPage = 10;

  const mockCustomers = [
    {
      id: "1",
      name: "Alice Johnson",
      email: "alice@email.com",
      totalSpent: 2847.50,
      orderCount: 23,
      lastOrder: "2024-01-15",
      avgOrderValue: 123.80,
      customerSince: "2022-03-15",
      loyaltyPoints: 2847,
      engagementScore: 92,
      location: "New York, NY",
      preferredChannel: "email"
    },
    {
      id: "2",
      name: "Bob Smith",
      email: "bob@email.com",
      totalSpent: 1594.25,
      orderCount: 15,
      lastOrder: "2024-01-12",
      avgOrderValue: 106.28,
      customerSince: "2023-01-20",
      loyaltyPoints: 1594,
      engagementScore: 78,
      location: "Los Angeles, CA",
      preferredChannel: "sms"
    },
    {
      id: "3",
      name: "Carol Brown",
      email: "carol@email.com",
      totalSpent: 3421.00,
      orderCount: 31,
      lastOrder: "2024-01-14",
      avgOrderValue: 110.35,
      customerSince: "2021-11-10",
      loyaltyPoints: 3421,
      engagementScore: 96,
      location: "Chicago, IL",
      preferredChannel: "email"
    },
    {
      id: "4",
      name: "David Wilson",
      email: "david@email.com",
      totalSpent: 892.75,
      orderCount: 8,
      lastOrder: "2024-01-10",
      avgOrderValue: 111.59,
      customerSince: "2023-06-05",
      loyaltyPoints: 892,
      engagementScore: 65,
      location: "Houston, TX",
      preferredChannel: "push"
    },
    {
      id: "5",
      name: "Emma Davis",
      email: "emma@email.com",
      totalSpent: 2156.80,
      orderCount: 19,
      lastOrder: "2024-01-13",
      avgOrderValue: 113.52,
      customerSince: "2022-08-20",
      loyaltyPoints: 2156,
      engagementScore: 84,
      location: "Phoenix, AZ",
      preferredChannel: "email"
    },
    {
      id: "6",
      name: "Frank Miller",
      email: "frank@email.com",
      totalSpent: 4231.50,
      orderCount: 42,
      lastOrder: "2024-01-15",
      avgOrderValue: 100.75,
      customerSince: "2021-05-12",
      loyaltyPoints: 4231,
      engagementScore: 98,
      location: "Seattle, WA",
      preferredChannel: "email"
    },
    {
      id: "7",
      name: "Grace Lee",
      email: "grace@email.com",
      totalSpent: 1678.25,
      orderCount: 14,
      lastOrder: "2024-01-11",
      avgOrderValue: 119.88,
      customerSince: "2022-12-03",
      loyaltyPoints: 1678,
      engagementScore: 76,
      location: "Miami, FL",
      preferredChannel: "sms"
    },
    {
      id: "8",
      name: "Henry Clark",
      email: "henry@email.com",
      totalSpent: 3567.90,
      orderCount: 28,
      lastOrder: "2024-01-14",
      avgOrderValue: 127.42,
      customerSince: "2021-09-18",
      loyaltyPoints: 3567,
      engagementScore: 89,
      location: "Denver, CO",
      preferredChannel: "email"
    }
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getEngagementColor = (score: number) => {
    if (score >= 90) return "text-success";
    if (score >= 70) return "text-warning";
    return "text-destructive";
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCustomers(mockCustomers.map(c => c.id));
    } else {
      setSelectedCustomers([]);
    }
  };

  const handleSelectCustomer = (customerId: string, checked: boolean) => {
    if (checked) {
      setSelectedCustomers([...selectedCustomers, customerId]);
    } else {
      setSelectedCustomers(selectedCustomers.filter(id => id !== customerId));
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setIsRefreshing(false);
    }, 2000);
  };

  const handleExport = () => {
    // Mock export functionality
    const blob = new Blob([JSON.stringify(mockCustomers, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'audience-results.json';
    a.click();
  };

  const totalPages = Math.ceil(mockCustomers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentCustomers = mockCustomers.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/audiences")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Audiences
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">Audience Results</h1>
            <p className="text-muted-foreground">VIP Customers - {mockCustomers.length} customers found</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90" onClick={() => navigate("/campaigns")}>
            <MessageSquare className="h-4 w-4 mr-2" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Customers</p>
              <p className="text-2xl font-bold">{mockCustomers.length}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">${mockCustomers.reduce((sum, c) => sum + c.totalSpent, 0).toLocaleString()}</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <p className="text-2xl font-bold">
                ${(mockCustomers.reduce((sum, c) => sum + c.avgOrderValue, 0) / mockCustomers.length).toFixed(2)}
              </p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div>
              <p className="text-sm text-muted-foreground">Avg Engagement</p>
              <p className="text-2xl font-bold text-success">
                {Math.round(mockCustomers.reduce((sum, c) => sum + c.engagementScore, 0) / mockCustomers.length)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Applied Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Applied Filters</CardTitle>
          <CardDescription>Current audience criteria</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-primary/10">
              Total Spent {'>'} $1000
            </Badge>
            <Badge variant="outline" className="bg-primary/10">
              Order Count {'>'} 10
            </Badge>
            <Badge variant="outline" className="bg-primary/10">
              Engagement Score {'>'} 70%
            </Badge>
            <Button variant="ghost" size="sm" onClick={() => navigate("/audience-builder")}>
              <Edit className="h-4 w-4 mr-1" />
              Edit Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>
                {selectedCustomers.length > 0 && `${selectedCustomers.length} selected • `}
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, mockCustomers.length)} of {mockCustomers.length}
              </CardDescription>
            </div>
            
            {selectedCustomers.length > 0 && (
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline">
                  <Mail className="h-4 w-4 mr-2" />
                  Email Selected
                </Button>
                <Button size="sm" variant="outline">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  SMS Selected
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search customers..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Sort */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="totalSpent">Total Spent</SelectItem>
                <SelectItem value="orderCount">Order Count</SelectItem>
                <SelectItem value="lastOrder">Last Order</SelectItem>
                <SelectItem value="engagementScore">Engagement</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
          </div>

          {/* Customer Table */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedCustomers.length === mockCustomers.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Last Order</TableHead>
                  <TableHead>Engagement</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentCustomers.map((customer) => (
                  <TableRow key={customer.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Checkbox
                        checked={selectedCustomers.includes(customer.id)}
                        onCheckedChange={(checked) => handleSelectCustomer(customer.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs">
                            {getInitials(customer.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{customer.name}</p>
                          <p className="text-sm text-muted-foreground">{customer.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">${customer.totalSpent.toLocaleString()}</p>
                        <p className="text-sm text-muted-foreground">Avg: ${customer.avgOrderValue.toFixed(2)}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{customer.orderCount}</TableCell>
                    <TableCell>{new Date(customer.lastOrder).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${getEngagementColor(customer.engagementScore)}`}>
                          {customer.engagementScore}%
                        </span>
                        <div className="w-16 h-2 bg-muted rounded-full">
                          <div 
                            className="h-full bg-success rounded-full" 
                            style={{ width: `${customer.engagementScore}%` }}
                          />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">{customer.location}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Mail className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, mockCustomers.length)} of {mockCustomers.length} customers
            </div>
            
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(page)}
                    className="w-8 h-8 p-0"
                  >
                    {page}
                  </Button>
                ))}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}