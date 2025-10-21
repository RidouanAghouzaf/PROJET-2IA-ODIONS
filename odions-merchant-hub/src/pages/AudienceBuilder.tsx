import React, { useState } from "react";
import { Save, Eye, ArrowLeft, Plus, X, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";

interface FilterCriteria {
  id: string;
  type: string;
  field: string;
  operator: string;
  value: any;
  label: string;
}

export default function AudienceBuilder() {
  const navigate = useNavigate();
  const [audienceName, setAudienceName] = useState("");
  const [audienceDescription, setAudienceDescription] = useState("");
  const [filters, setFilters] = useState<FilterCriteria[]>([]);
  const [previewCount, setPreviewCount] = useState(0);

  // Mock data for live preview
  const mockCustomerBase = 1429;

  const filterTypes = [
    { value: "demographic", label: "Demographics" },
    { value: "behavioral", label: "Behavioral" },
    { value: "transactional", label: "Transactional" },
    { value: "geographic", label: "Geographic" },
    { value: "engagement", label: "Engagement" },
  ];

  const filterFields = {
    demographic: [
      { value: "age", label: "Age" },
      { value: "gender", label: "Gender" },
      { value: "registrationDate", label: "Registration Date" },
    ],
    behavioral: [
      { value: "lastVisit", label: "Last Visit" },
      { value: "pageViews", label: "Page Views" },
      { value: "sessionDuration", label: "Session Duration" },
      { value: "deviceType", label: "Device Type" },
    ],
    transactional: [
      { value: "totalSpent", label: "Total Amount Spent" },
      { value: "orderCount", label: "Number of Orders" },
      { value: "avgOrderValue", label: "Average Order Value" },
      { value: "lastOrderDate", label: "Last Order Date" },
      { value: "favoriteCategory", label: "Favorite Category" },
    ],
    geographic: [
      { value: "country", label: "Country" },
      { value: "city", label: "City" },
      { value: "state", label: "State/Province" },
    ],
    engagement: [
      { value: "emailOpens", label: "Email Opens" },
      { value: "emailClicks", label: "Email Clicks" },
      { value: "smsResponses", label: "SMS Responses" },
      { value: "loyaltyPoints", label: "Loyalty Points" },
    ],
  };

  const operators = {
    string: [
      { value: "equals", label: "Equals" },
      { value: "contains", label: "Contains" },
      { value: "startsWith", label: "Starts with" },
    ],
    number: [
      { value: "equals", label: "Equals" },
      { value: "greaterThan", label: "Greater than" },
      { value: "lessThan", label: "Less than" },
      { value: "between", label: "Between" },
    ],
    date: [
      { value: "before", label: "Before" },
      { value: "after", label: "After" },
      { value: "between", label: "Between" },
      { value: "lastDays", label: "Last X days" },
    ],
  };

  const addFilter = () => {
    const newFilter: FilterCriteria = {
      id: Date.now().toString(),
      type: "",
      field: "",
      operator: "",
      value: "",
      label: "",
    };
    setFilters([...filters, newFilter]);
  };

  const removeFilter = (id: string) => {
    setFilters(filters.filter(f => f.id !== id));
    updatePreview();
  };

  const updateFilter = (id: string, updates: Partial<FilterCriteria>) => {
    setFilters(filters.map(f => f.id === id ? { ...f, ...updates } : f));
    updatePreview();
  };

  const updatePreview = () => {
    // Mock calculation - in real app this would call API
    const validFilters = filters.filter(f => f.type && f.field && f.operator);
    const baseReduction = validFilters.length * 0.2; // Each filter reduces audience by ~20%
    const calculatedCount = Math.max(50, Math.floor(mockCustomerBase * (1 - baseReduction)));
    setPreviewCount(calculatedCount);
  };

  React.useEffect(() => {
    updatePreview();
  }, [filters]);

  const getFieldType = (field: string) => {
    const numberFields = ["age", "totalSpent", "orderCount", "avgOrderValue", "pageViews", "sessionDuration", "emailOpens", "emailClicks", "loyaltyPoints"];
    const dateFields = ["registrationDate", "lastVisit", "lastOrderDate"];
    
    if (numberFields.includes(field)) return "number";
    if (dateFields.includes(field)) return "date";
    return "string";
  };

  const renderValueInput = (filter: FilterCriteria, index: number) => {
    const fieldType = getFieldType(filter.field);
    
    if (filter.field === "gender") {
      return (
        <Select value={filter.value} onValueChange={(value) => updateFilter(filter.id, { value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select gender" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="male">Male</SelectItem>
            <SelectItem value="female">Female</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    if (filter.field === "deviceType") {
      return (
        <Select value={filter.value} onValueChange={(value) => updateFilter(filter.id, { value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select device" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="mobile">Mobile</SelectItem>
            <SelectItem value="desktop">Desktop</SelectItem>
            <SelectItem value="tablet">Tablet</SelectItem>
          </SelectContent>
        </Select>
      );
    }
    
    if (filter.field === "favoriteCategory") {
      return (
        <Select value={filter.value} onValueChange={(value) => updateFilter(filter.id, { value })}>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="electronics">Electronics</SelectItem>
            <SelectItem value="fashion">Fashion</SelectItem>
            <SelectItem value="home">Home & Garden</SelectItem>
            <SelectItem value="sports">Sports</SelectItem>
            <SelectItem value="books">Books</SelectItem>
          </SelectContent>
        </Select>
      );
    }

    if (fieldType === "number" && filter.operator === "between") {
      return (
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filter.value?.min || ""}
            onChange={(e) => updateFilter(filter.id, { 
              value: { ...filter.value, min: e.target.value } 
            })}
          />
          <Input
            type="number"
            placeholder="Max"
            value={filter.value?.max || ""}
            onChange={(e) => updateFilter(filter.id, { 
              value: { ...filter.value, max: e.target.value } 
            })}
          />
        </div>
      );
    }

    if (fieldType === "date") {
      return (
        <Input
          type={filter.operator === "lastDays" ? "number" : "date"}
          placeholder={filter.operator === "lastDays" ? "Number of days" : "Select date"}
          value={filter.value}
          onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
        />
      );
    }

    return (
      <Input
        type={fieldType === "number" ? "number" : "text"}
        placeholder={`Enter ${filter.field}`}
        value={filter.value}
        onChange={(e) => updateFilter(filter.id, { value: e.target.value })}
      />
    );
  };

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
            <h1 className="text-3xl font-bold text-foreground">Audience Builder</h1>
            <p className="text-muted-foreground">Create targeted customer segments with advanced filtering</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/audience-results")}>
            <Eye className="h-4 w-4 mr-2" />
            Preview Results
          </Button>
          <Button className="bg-gradient-primary hover:opacity-90">
            <Save className="h-4 w-4 mr-2" />
            Save Audience
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Builder Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Audience Information</CardTitle>
              <CardDescription>Give your audience a name and description</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audienceName">Audience Name</Label>
                <Input
                  id="audienceName"
                  placeholder="e.g., High-Value Customers"
                  value={audienceName}
                  onChange={(e) => setAudienceName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="audienceDescription">Description</Label>
                <Textarea
                  id="audienceDescription"
                  placeholder="Describe your target audience..."
                  value={audienceDescription}
                  onChange={(e) => setAudienceDescription(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Filter Criteria */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Filter Criteria</CardTitle>
                  <CardDescription>Define who should be included in this audience</CardDescription>
                </div>
                <Button onClick={addFilter} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Filter
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {filters.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Filter className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No filters added yet</p>
                  <p className="text-sm">Click "Add Filter" to start building your audience</p>
                </div>
              ) : (
                filters.map((filter, index) => (
                  <div key={filter.id} className="p-4 border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Filter {index + 1}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFilter(filter.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      {/* Filter Type */}
                      <div className="space-y-2">
                        <Label>Category</Label>
                        <Select
                          value={filter.type}
                          onValueChange={(value) => {
                            updateFilter(filter.id, { 
                              type: value, 
                              field: "", 
                              operator: "", 
                              value: "" 
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            {filterTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Field */}
                      <div className="space-y-2">
                        <Label>Field</Label>
                        <Select
                          value={filter.field}
                          onValueChange={(value) => {
                            updateFilter(filter.id, { 
                              field: value, 
                              operator: "", 
                              value: "" 
                            });
                          }}
                          disabled={!filter.type}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select field" />
                          </SelectTrigger>
                          <SelectContent>
                            {filter.type && filterFields[filter.type as keyof typeof filterFields]?.map((field) => (
                              <SelectItem key={field.value} value={field.value}>
                                {field.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Operator */}
                      <div className="space-y-2">
                        <Label>Operator</Label>
                        <Select
                          value={filter.operator}
                          onValueChange={(value) => {
                            updateFilter(filter.id, { operator: value, value: "" });
                          }}
                          disabled={!filter.field}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select operator" />
                          </SelectTrigger>
                          <SelectContent>
                            {filter.field && operators[getFieldType(filter.field) as keyof typeof operators]?.map((op) => (
                              <SelectItem key={op.value} value={op.value}>
                                {op.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Value */}
                      <div className="space-y-2">
                        <Label>Value</Label>
                        {renderValueInput(filter, index)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>

        {/* Live Preview */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Live Preview
              </CardTitle>
              <CardDescription>Real-time audience size calculation</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Audience Size */}
              <div className="text-center">
                <div className="text-4xl font-bold text-primary mb-2">
                  {previewCount.toLocaleString()}
                </div>
                <p className="text-muted-foreground">Estimated customers</p>
                <div className="flex items-center justify-center gap-2 mt-2 text-sm text-muted-foreground">
                  <span>of {mockCustomerBase.toLocaleString()} total</span>
                  <Badge variant="outline">
                    {((previewCount / mockCustomerBase) * 100).toFixed(1)}%
                  </Badge>
                </div>
              </div>

              {/* Progress Visualization */}
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span>Audience Coverage</span>
                  <span>{((previewCount / mockCustomerBase) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(previewCount / mockCustomerBase) * 100} className="h-3" />
              </div>

              {/* Active Filters */}
              {filters.length > 0 && (
                <div>
                  <h4 className="font-medium mb-3">Active Filters</h4>
                  <div className="space-y-2">
                    {filters.filter(f => f.type && f.field).map((filter, index) => (
                      <div key={filter.id} className="text-sm p-2 bg-muted rounded">
                        <strong>{filterTypes.find(t => t.value === filter.type)?.label}</strong>
                        <div className="text-muted-foreground">
                          {filter.field} {filter.operator} {filter.value}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Estimated Metrics */}
              <div className="pt-4 border-t space-y-3">
                <h4 className="font-medium">Estimated Metrics</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Avg Order Value</p>
                    <p className="font-medium">$127.50</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Conversion Rate</p>
                    <p className="font-medium">3.2%</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total Revenue</p>
                    <p className="font-medium">${(previewCount * 127.50).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Engagement</p>
                    <p className="font-medium">68%</p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-4 border-t space-y-2">
                <Button className="w-full" variant="outline" onClick={() => navigate("/audience-results")}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Customer List
                </Button>
                <Button className="w-full bg-gradient-primary hover:opacity-90">
                  <Save className="h-4 w-4 mr-2" />
                  Save & Create Audience
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}