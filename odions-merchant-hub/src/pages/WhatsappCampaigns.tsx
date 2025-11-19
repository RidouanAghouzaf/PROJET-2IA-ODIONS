// import React, { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { PlusCircle, Send, Trash2, BarChart, Loader2 } from "lucide-react";
// import { useAuth } from "../context/AuthContext";
// import { useToast } from "@/hooks/use-toast";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

// const API_BASE_URL = "http://localhost:3000/api";

// interface Audience {
//   id: string;
//   name: string;
//   size: number;
//   criteria_summary?: string;
// }

// interface Campaign {
//   id: string;
//   name: string;
//   audience_id: string;
//   audience_name?: string;
//   message: string;
//   status: "En attente" | "Envoyée" | "Échouée";
//   scheduled_date: string;
//   created_at?: string;
//   report?: CampaignReport;
// }

// interface CampaignReport {
//   sent: number;
//   delivered: number;
//   failed: number;
//   read: number;
// }

// const formatDate = (dateString: string) => {
//   if (!dateString) return "—";
//   const date = new Date(dateString);
//   return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
// };

// export default function WhatsappCampaigns() {
//   const { user, session } = useAuth();
//   const { toast } = useToast();
//   const queryClient = useQueryClient();

//   const [name, setName] = useState("");
//   const [audienceId, setAudienceId] = useState("");
//   const [message, setMessage] = useState("");
//   const [scheduledDate, setScheduledDate] = useState("");
//   const [selectedReport, setSelectedReport] = useState<CampaignReport | null>(null);
//   const [sending, setSending] = useState<string | null>(null);

//   // ===== AUTH & API CALL LOGIC (same as Orders.tsx) =====
//   const getAccessToken = () => {
//     if (session?.access_token) return session.access_token;
//     try {
//       const storedSession = localStorage.getItem("supabaseSession");
//       if (storedSession) {
//         const parsed = JSON.parse(storedSession);
//         return parsed.access_token;
//       }
//     } catch (error) {
//       console.error("Error parsing stored session:", error);
//     }
//     return null;
//   };

//   const apiCall = async (url: string, options: RequestInit = {}) => {
//     const token = getAccessToken();
//     if (!token) {
//       toast({
//         title: "Authentication required",
//         description: "Please log in again",
//         variant: "destructive",
//       });
//       throw new Error("No access token");
//     }

//     const response = await fetch(url, {
//       ...options,
//       headers: {
//         Authorization: `Bearer ${token}`,
//         "Content-Type": "application/json",
//         ...options.headers,
//       },
//     });
//     const data = await response.json();
//     if (!response.ok) {
//       throw new Error(data.error?.message || "Request failed");
//     }
//     return data;
//   };

//   // ===== QUERIES =====
//   const { data: audiences = [] } = useQuery({
//     queryKey: ["audiences"],
//     queryFn: () =>
//       apiCall(`${API_BASE_URL}/audiences`).then((res) =>
//         Array.isArray(res) ? res : Array.isArray(res.audiences) ? res.audiences : []
//       ),
//     enabled: !!user?.id,
//   });

//   const { data: campaigns = [], isLoading } = useQuery({
//     queryKey: ["campaigns", user?.id],
//     queryFn: async () => {
//       const res = await apiCall(`${API_BASE_URL}/campaigns`);
//       const campaignsList = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
      
//       // Map audience names to campaigns
//       return campaignsList.map((campaign: any) => {
//         const audience = audiences.find((a: Audience) => a.id === campaign.audience_id);
//         return {
//           ...campaign,
//           audience_name: audience?.name || "Unknown Audience"
//         };
//       });
//     },
//     enabled: !!user?.id && audiences.length > 0,
//   });

//   // ===== MUTATIONS =====
//   const createMutation = useMutation({
//     mutationFn: async () => {
//       if (!name || !audienceId || !message) {
//         throw new Error("Please fill all required fields");
//       }
      
//       return apiCall(`${API_BASE_URL}/campaigns`, {
//         method: "POST",
//         body: JSON.stringify({
//           name,
//           audience_id: audienceId,
//           message,
//           scheduled_date: scheduledDate || new Date().toISOString().split('T')[0],
//           user_id: user?.id,
//         }),
//       });
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
//       toast({ title: "Campaign created successfully!" });
      
//       // Reset form
//       setName("");
//       setAudienceId("");
//       setMessage("");
//       setScheduledDate("");
//     },
//     onError: (error: Error) => {
//       toast({
//         title: "Error",
//         description: error.message,
//         variant: "destructive",
//       });
//     },
//   });

//   const sendMutation = useMutation({
//     mutationFn: async (id: string) => {
//       return apiCall(`${API_BASE_URL}/campaigns/send/${id}`, {
//         method: "POST",
//       });
//     },
//     onSuccess: (data) => {
//       queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
//       toast({ 
//         title: "Success",
//         description: data.message || "Campaign sent successfully!" 
//       });
//       setSending(null);
//     },
//     onError: (error: Error) => {
//       toast({
//         title: "Error",
//         description: error.message,
//         variant: "destructive",
//       });
//       setSending(null);
//     },
//   });

//   const deleteMutation = useMutation({
//     mutationFn: async (id: string) => {
//       return apiCall(`${API_BASE_URL}/campaigns/${id}`, {
//         method: "DELETE",
//       });
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
//       toast({ title: "Campaign deleted successfully" });
//     },
//     onError: (error: Error) => {
//       toast({
//         title: "Error",
//         description: error.message,
//         variant: "destructive",
//       });
//     },
//   });

//   // ===== HANDLERS =====
//   const handleCreateCampaign = () => {
//     createMutation.mutate();
//   };

//   const handleSendCampaign = (id: string) => {
//     setSending(id);
//     sendMutation.mutate(id);
//   };

//   const handleDeleteCampaign = (id: string) => {
//     deleteMutation.mutate(id);
//   };

//   const handleViewReport = (report: CampaignReport | undefined) => {
//     if (report) {
//       setSelectedReport(report);
//     } else {
//       toast({
//         title: "No Report",
//         description: "No report available for this campaign.",
//       });
//     }
//   };

//   return (
//     <div className="p-6 space-y-6">
//       {/* Campaign Creation Form */}
//       <Card className="shadow-md dark:bg-[#0A0A0A] dark:text-white">
//         <CardHeader>
//           <CardTitle>Create WhatsApp Campaign</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <div>
//             <label className="text-sm font-medium mb-2 block">Campaign Name</label>
//             <Input
//               placeholder="e.g., Summer Sale 2025"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//             />
//           </div>
          
//           <div>
//             <label className="text-sm font-medium mb-2 block">Select Audience</label>
//             <Select value={audienceId} onValueChange={setAudienceId}>
//               <SelectTrigger>
//                 <SelectValue placeholder="Choose target audience" />
//               </SelectTrigger>
//               <SelectContent>
//                 {audiences.map((a: Audience) => (
//                   <SelectItem key={a.id} value={a.id}>
//                     {a.name} ({a.size} contacts)
//                   </SelectItem>
//                 ))}
//               </SelectContent>
//             </Select>
//           </div>

//           <div>
//             <label className="text-sm font-medium mb-2 block">Message</label>
//             <Textarea
//               placeholder="Type your WhatsApp message here..."
//               value={message}
//               onChange={(e) => setMessage(e.target.value)}
//               rows={5}
//             />
//           </div>

//           <div>
//             <label className="text-sm font-medium mb-2 block">Scheduled Date (Optional)</label>
//             <Input
//               type="date"
//               value={scheduledDate}
//               onChange={(e) => setScheduledDate(e.target.value)}
//             />
//           </div>

//           <Button
//             className="bg-green-600 hover:bg-green-700 text-white w-full"
//             onClick={handleCreateCampaign}
//             disabled={createMutation.isPending}
//           >
//             {createMutation.isPending ? (
//               <>
//                 <Loader2 className="h-4 w-4 mr-2 animate-spin" />
//                 Creating...
//               </>
//             ) : (
//               <>
//                 <PlusCircle className="h-4 w-4 mr-2" />
//                 Create Campaign
//               </>
//             )}
//           </Button>
//         </CardContent>
//       </Card>

//       {/* Campaigns List */}
//       <Card className="dark:bg-[#0A0A0A] dark:text-white">
//         <CardHeader>
//           <CardTitle>Existing Campaigns</CardTitle>
//         </CardHeader>
//         <CardContent>
//           {isLoading ? (
//             <div className="flex justify-center py-8">
//               <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
//             </div>
//           ) : campaigns.length === 0 ? (
//             <p className="text-center text-gray-500 py-8">
//               No campaigns yet. Create your first campaign!
//             </p>
//           ) : (
//             <div className="overflow-x-auto">
//               <table className="w-full">
//                 <thead>
//                   <tr className="border-b dark:border-gray-700">
//                     <th className="text-left p-3 font-semibold">Name</th>
//                     <th className="text-left p-3 font-semibold">Audience</th>
//                     <th className="text-left p-3 font-semibold">Message</th>
//                     <th className="text-left p-3 font-semibold">Date</th>
//                     <th className="text-left p-3 font-semibold">Status</th>
//                     <th className="text-left p-3 font-semibold">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {campaigns.map((c: Campaign) => (
//                     <tr key={c.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
//                       <td className="p-3 font-medium">{c.name}</td>
//                       <td className="p-3">{c.audience_name}</td>
//                       <td className="p-3 max-w-xs truncate">{c.message}</td>
//                       <td className="p-3">{formatDate(c.scheduled_date)}</td>
//                       <td className="p-3">
//                         <span
//                           className={
//                             c.status === "Envoyée"
//                               ? "text-green-600 font-semibold"
//                               : c.status === "Échouée"
//                               ? "text-red-600 font-semibold"
//                               : "text-yellow-600 font-semibold"
//                           }
//                         >
//                           {c.status}
//                         </span>
//                       </td>
//                       <td className="p-3">
//                         <div className="flex gap-2">
//                           <Button
//                             size="sm"
//                             variant="outline"
//                             onClick={() => handleSendCampaign(c.id)}
//                             disabled={sending === c.id || c.status === "Envoyée"}
//                             title="Send campaign"
//                           >
//                             {sending === c.id ? (
//                               <Loader2 className="h-4 w-4 animate-spin" />
//                             ) : (
//                               <Send className="h-4 w-4" />
//                             )}
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="secondary"
//                             onClick={() => handleViewReport(c.report)}
//                             title="View report"
//                           >
//                             <BarChart className="h-4 w-4" />
//                           </Button>
//                           <Button
//                             size="sm"
//                             variant="destructive"
//                             onClick={() => handleDeleteCampaign(c.id)}
//                             title="Delete campaign"
//                           >
//                             <Trash2 className="h-4 w-4" />
//                           </Button>
//                         </div>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           )}
//         </CardContent>
//       </Card>

//       {/* Report Modal */}
//       {selectedReport && (
//         <Card className="shadow-md dark:bg-[#0A0A0A] dark:text-white">
//           <CardHeader>
//             <CardTitle>📊 Performance Report</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <div className="space-y-3">
//               <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
//                 <span className="font-medium">📤 Messages Sent</span>
//                 <span className="text-xl font-bold">{selectedReport.sent}</span>
//               </div>
//               <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
//                 <span className="font-medium">✅ Delivered</span>
//                 <span className="text-xl font-bold text-green-600">{selectedReport.delivered}</span>
//               </div>
//               <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
//                 <span className="font-medium">❌ Failed</span>
//                 <span className="text-xl font-bold text-red-600">{selectedReport.failed}</span>
//               </div>
//               <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
//                 <span className="font-medium">👀 Read</span>
//                 <span className="text-xl font-bold text-purple-600">{selectedReport.read}</span>
//               </div>
//             </div>
//             <Button className="mt-4 w-full" onClick={() => setSelectedReport(null)}>
//               Close Report
//             </Button>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }

// 

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Send, Trash2, BarChart, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Alert, AlertDescription } from "@/components/ui/alert";

const API_BASE_URL = "http://localhost:3000/api";

interface Audience {
  id: string;
  name: string;
  size: number;
  criteria_summary?: string;
}

interface Campaign {
  id: string;
  name: string;
  audience_id: string;
  audience_name?: string;
  message: string;
  status: "En attente" | "Envoyée" | "Échouée";
  scheduled_date: string;
  created_at?: string;
  sent_at?: string;
  report?: CampaignReport;
}

interface CampaignReport {
  sent: number;
  delivered: number;
  failed: number;
  read: number;
  total?: number;
}

interface SendResult {
  success: boolean;
  message: string;
  details: {
    sent: number;
    failed: number;
    total: number;
    errors?: Array<{
      phone: string;
      name: string;
      error: string;
      code?: string;
    }>;
  };
}

const formatDate = (dateString: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

export default function WhatsappCampaigns() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [audienceId, setAudienceId] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [selectedReport, setSelectedReport] = useState<CampaignReport | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [testPhone, setTestPhone] = useState("");
  const [testingWhatsApp, setTestingWhatsApp] = useState(false);

  // ===== AUTH & API CALL LOGIC =====
  const getAccessToken = () => {
    if (session?.access_token) return session.access_token;
    try {
      const storedSession = localStorage.getItem("supabaseSession");
      if (storedSession) {
        const parsed = JSON.parse(storedSession);
        return parsed.access_token;
      }
    } catch (error) {
      console.error("Error parsing stored session:", error);
    }
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

    const response = await fetch(url, {
      ...options,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error?.message || data.error || "Request failed");
    }
    return data;
  };

  // ===== QUERIES =====
  const { data: audiences = [] } = useQuery({
    queryKey: ["audiences"],
    queryFn: () =>
      apiCall(`${API_BASE_URL}/audiences`).then((res) =>
        Array.isArray(res) ? res : Array.isArray(res.audiences) ? res.audiences : []
      ),
    enabled: !!user?.id,
  });

  const { data: campaigns = [], isLoading } = useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: async () => {
      const res = await apiCall(`${API_BASE_URL}/campaigns`);
      const campaignsList = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];
      
      return campaignsList.map((campaign: any) => {
        const audience = audiences.find((a: Audience) => a.id === campaign.audience_id);
        return {
          ...campaign,
          audience_name: audience?.name || campaign.audience_name || "Unknown Audience"
        };
      });
    },
    enabled: !!user?.id,
    refetchInterval: 5000, // Refetch every 5 seconds to update status
  });

  // ===== MUTATIONS =====
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!name || !audienceId || !message) {
        throw new Error("Please fill all required fields");
      }
      
      return apiCall(`${API_BASE_URL}/campaigns`, {
        method: "POST",
        body: JSON.stringify({
          name,
          audience_id: audienceId,
          message,
          scheduled_date: scheduledDate || new Date().toISOString().split('T')[0],
          user_id: user?.id,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
      toast({ 
        title: "✅ Campaign created!",
        description: "Your campaign is ready to be sent."
      });
      
      // Reset form
      setName("");
      setAudienceId("");
      setMessage("");
      setScheduledDate("");
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error creating campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const sendMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiCall(`${API_BASE_URL}/campaigns/send/${id}`, {
        method: "POST",
      });
    },
    onSuccess: (data: SendResult) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
      setSendResult(data);
      
      if (data.details.failed === 0) {
        toast({ 
          title: "✅ Campaign sent successfully!",
          description: `All ${data.details.sent} messages were sent.`
        });
      } else if (data.details.sent > 0) {
        toast({ 
          title: "⚠️ Campaign partially sent",
          description: `${data.details.sent} sent, ${data.details.failed} failed.`
        });
      } else {
        toast({
          title: "❌ Campaign failed",
          description: "All messages failed to send. Check errors below.",
          variant: "destructive",
        });
      }
      setSending(null);
    },
    onError: (error: Error) => {
      toast({
        title: "❌ Error sending campaign",
        description: error.message,
        variant: "destructive",
      });
      setSending(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiCall(`${API_BASE_URL}/campaigns/${id}`, {
        method: "DELETE",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
      toast({ title: "🗑️ Campaign deleted" });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ===== HANDLERS =====
  const handleCreateCampaign = () => {
    createMutation.mutate();
  };

  const handleSendCampaign = (id: string) => {
    setSending(id);
    setSendResult(null);
    sendMutation.mutate(id);
  };

  const handleDeleteCampaign = (id: string) => {
    if (confirm("Are you sure you want to delete this campaign?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleViewReport = (report: CampaignReport | undefined) => {
    if (report) {
      setSelectedReport(report);
    } else {
      toast({
        title: "No Report",
        description: "No report available for this campaign.",
      });
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Send Result Alert */}
      {sendResult && (
        <Alert className={sendResult.details.failed === 0 ? "border-green-500 bg-green-50 dark:bg-green-900/20" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/20"}>
          <AlertDescription className="space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              {sendResult.details.failed === 0 ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-600" />
              )}
              {sendResult.message}
            </div>
            <div className="text-sm space-y-1">
              <div>✅ Sent: {sendResult.details.sent}</div>
              <div>❌ Failed: {sendResult.details.failed}</div>
              <div>📊 Total: {sendResult.details.total}</div>
            </div>
            {sendResult.details.errors && sendResult.details.errors.length > 0 && (
              <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded border">
                <div className="font-semibold mb-2">Failed Messages:</div>
                <div className="space-y-1 text-xs">
                  {sendResult.details.errors.map((err, idx) => (
                    <div key={idx} className="text-red-600">
                      {err.name || err.phone}: {err.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Button size="sm" variant="outline" onClick={() => setSendResult(null)} className="mt-2">
              Dismiss
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Campaign Creation Form */}
      <Card className="shadow-md dark:bg-[#0A0A0A] dark:text-white">
        <CardHeader>
          <CardTitle>📱 Create WhatsApp Campaign</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Campaign Name</label>
            <Input
              placeholder="e.g., Summer Sale 2025"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-sm font-medium mb-2 block">Select Audience</label>
            <Select value={audienceId} onValueChange={setAudienceId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose target audience" />
              </SelectTrigger>
              <SelectContent>
                {audiences.map((a: Audience) => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.name} ({a.size} contacts)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Message</label>
            <Textarea
              placeholder="Type your WhatsApp message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              {message.length} characters
            </p>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Scheduled Date (Optional)</label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <Button
            className="bg-green-600 hover:bg-green-700 text-white w-full"
            onClick={handleCreateCampaign}
            disabled={createMutation.isPending || !name || !audienceId || !message}
          >
            {createMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <PlusCircle className="h-4 w-4 mr-2" />
                Create Campaign
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Campaigns List */}
      <Card className="dark:bg-[#0A0A0A] dark:text-white">
        <CardHeader>
          <CardTitle>📋 Existing Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-2">No campaigns yet</p>
              <p className="text-sm text-gray-400">Create your first campaign to get started!</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-3 font-semibold">Name</th>
                    <th className="text-left p-3 font-semibold">Audience</th>
                    <th className="text-left p-3 font-semibold">Message Preview</th>
                    <th className="text-left p-3 font-semibold">Date</th>
                    <th className="text-left p-3 font-semibold">Status</th>
                    <th className="text-left p-3 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c: Campaign) => (
                    <tr key={c.id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-900">
                      <td className="p-3 font-medium">{c.name}</td>
                      <td className="p-3">{c.audience_name}</td>
                      <td className="p-3 max-w-xs truncate text-sm text-gray-600 dark:text-gray-400">
                        {c.message}
                      </td>
                      <td className="p-3 text-sm">{formatDate(c.scheduled_date)}</td>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                            c.status === "Envoyée"
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : c.status === "Échouée"
                              ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                              : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                          }`}
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => handleSendCampaign(c.id)}
                            disabled={sending === c.id || c.status === "Envoyée"}
                            title="Send campaign via WhatsApp"
                          >
                            {sending === c.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                          {c.report && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleViewReport(c.report)}
                              title="View campaign report"
                            >
                              <BarChart className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteCampaign(c.id)}
                            title="Delete campaign"
                            disabled={sending === c.id}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Modal */}
      {selectedReport && (
        <Card className="shadow-lg dark:bg-[#0A0A0A] dark:text-white border-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart className="h-5 w-5" />
              Campaign Performance Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Messages Sent</div>
                <div className="text-3xl font-bold text-blue-600">{selectedReport.sent}</div>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Delivered</div>
                <div className="text-3xl font-bold text-green-600">{selectedReport.delivered}</div>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Failed</div>
                <div className="text-3xl font-bold text-red-600">{selectedReport.failed}</div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <div className="text-sm text-gray-600 dark:text-gray-400">Read</div>
                <div className="text-3xl font-bold text-purple-600">{selectedReport.read}</div>
              </div>
            </div>
            {selectedReport.total && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-800 rounded">
                <div className="text-sm">
                  Success Rate: <span className="font-bold">
                    {((selectedReport.sent / selectedReport.total) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            )}
            <Button 
              className="mt-4 w-full" 
              onClick={() => setSelectedReport(null)}
            >
              Close Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}