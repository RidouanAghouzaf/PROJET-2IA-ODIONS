// import React, { useState, useEffect } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
// import { PlusCircle, Send, Trash2, BarChart } from "lucide-react";

// // Interfaces
// interface Audience {
//   id: number;
//   name: string;
// }

// interface Campaign {
//   id: number;
//   name: string;
//   audience: string;
//   message: string;
//   status: "En attente" | "Envoyée" | "Échouée";
//   scheduledDate: string;
//   report?: CampaignReport;
// }

// interface CampaignReport {
//   sent: number;
//   delivered: number;
//   failed: number;
//   read: number;
// }

// export default function WhatsappCampaigns() {
//   const [campaigns, setCampaigns] = useState<Campaign[]>([]);
//   const [audiences, setAudiences] = useState<Audience[]>([]);
//   const [name, setName] = useState("");
//   const [audience, setAudience] = useState("");
//   const [message, setMessage] = useState("");
//   const [scheduledDate, setScheduledDate] = useState("");
//   const [selectedReport, setSelectedReport] = useState<CampaignReport | null>(null);

//   useEffect(() => {
//     // 🔗 API call simulée – à remplacer par ton backend
//     setAudiences([
//       { id: 1, name: "Clients Premium" },
//       { id: 2, name: "Clients Fidèles" },
//       { id: 3, name: "Commandes refusées" },
//     ]);
//     setCampaigns([
//       {
//         id: 1,
//         name: "Promo Nouvel An",
//         audience: "Clients Premium",
//         message: "Bonne année ! Profitez de -20% sur tout le site 🎉",
//         status: "Envoyée",
//         scheduledDate: "2025-01-01",
//         report: { sent: 100, delivered: 90, failed: 10, read: 70 },
//       },
//     ]);
//   }, []);

//   // Créer une nouvelle campagne
//   const handleCreateCampaign = () => {
//     if (!name || !audience || !message) {
//       alert("Veuillez remplir tous les champs !");
//       return;
//     }
//     const newCampaign: Campaign = {
//       id: campaigns.length + 1,
//       name,
//       audience,
//       message,
//       status: "En attente",
//       scheduledDate,
//     };
//     setCampaigns([...campaigns, newCampaign]);
//     setName("");
//     setAudience("");
//     setMessage("");
//     setScheduledDate("");
//   };

//   // Envoyer une campagne (mock)
//   const handleSendCampaign = (id: number) => {
//     setCampaigns(
//       campaigns.map((c) =>
//         c.id === id
//           ? {
//               ...c,
//               status: Math.random() > 0.2 ? "Envoyée" : "Échouée", // 80% réussite, 20% échec
//               report: {
//                 sent: 100,
//                 delivered: Math.floor(Math.random() * 100),
//                 failed: Math.floor(Math.random() * 20),
//                 read: Math.floor(Math.random() * 90),
//               },
//             }
//           : c
//       )
//     );
//   };

//   // Supprimer une campagne
//   const handleDeleteCampaign = (id: number) => {
//     setCampaigns(campaigns.filter((c) => c.id !== id));
//   };

//   // Voir rapport
//   const handleViewReport = (report: CampaignReport | undefined) => {
//     if (report) {
//       setSelectedReport(report);
//     } else {
//       alert("Aucun rapport disponible pour cette campagne.");
//     }
//   };

//   return (
//     <div className="p-6 space-y-6">
//       {/* Formulaire de création */}
//       <Card className="shadow-md">
//         <CardHeader>
//           <CardTitle>Créer une Campagne WhatsApp</CardTitle>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           <Input placeholder="Nom de la campagne" value={name} onChange={(e) => setName(e.target.value)} />
//           <Select value={audience} onValueChange={setAudience}>
//             <SelectTrigger>
//               <SelectValue placeholder="Sélectionner une audience" />
//             </SelectTrigger>
//             <SelectContent>
//               {audiences.map((a) => (
//                 <SelectItem key={a.id} value={a.name}>
//                   {a.name}
//                 </SelectItem>
//               ))}
//             </SelectContent>
//           </Select>
//           <Textarea placeholder="Message à envoyer" value={message} onChange={(e) => setMessage(e.target.value)} />
//           <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
//           <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleCreateCampaign}>
//             <PlusCircle className="h-4 w-4 mr-2" />
//             Créer Campagne
//           </Button>
//         </CardContent>
//       </Card>

//       {/* Liste des campagnes */}
//       <Card>
//         <CardHeader>
//           <CardTitle>Campagnes Existantes</CardTitle>
//         </CardHeader>
//         <CardContent>
//           <Table>
//             <TableHeader>
//               <TableRow>
//                 <TableHead>Nom</TableHead>
//                 <TableHead>Audience</TableHead>
//                 <TableHead>Message</TableHead>
//                 <TableHead>Date</TableHead>
//                 <TableHead>Statut</TableHead>
//                 <TableHead>Actions</TableHead>
//               </TableRow>
//             </TableHeader>
//             <TableBody>
//               {campaigns.map((c) => (
//                 <TableRow key={c.id}>
//                   <TableCell>{c.name}</TableCell>
//                   <TableCell>{c.audience}</TableCell>
//                   <TableCell>{c.message}</TableCell>
//                   <TableCell>{c.scheduledDate}</TableCell>
//                   <TableCell
//                     className={
//                       c.status === "Envoyée"
//                         ? "text-green-600 font-semibold"
//                         : c.status === "Échouée"
//                         ? "text-red-600 font-semibold"
//                         : "text-yellow-600 font-semibold"
//                     }
//                   >
//                     {c.status}
//                   </TableCell>
//                   <TableCell className="space-x-2">
//                     <Button size="sm" variant="outline" onClick={() => handleSendCampaign(c.id)}>
//                       <Send className="h-4 w-4" />
//                     </Button>
//                     <Button size="sm" variant="secondary" onClick={() => handleViewReport(c.report)}>
//                       <BarChart className="h-4 w-4" />
//                     </Button>
//                     <Button size="sm" variant="destructive" onClick={() => handleDeleteCampaign(c.id)}>
//                       <Trash2 className="h-4 w-4" />
//                     </Button>
//                   </TableCell>
//                 </TableRow>
//               ))}
//             </TableBody>
//           </Table>
//         </CardContent>
//       </Card>

//       {/* Rapport */}
//       {selectedReport && (
//         <Card className="shadow-md">
//           <CardHeader>
//             <CardTitle>Rapport de Performance</CardTitle>
//           </CardHeader>
//           <CardContent>
//             <ul className="list-disc pl-6">
//               <li>📤 Envoyés : {selectedReport.sent}</li>
//               <li>✅ Livrés : {selectedReport.delivered}</li>
//               <li>❌ Échecs : {selectedReport.failed}</li>
//               <li>👀 Lus : {selectedReport.read}</li>
//             </ul>
//             <Button className="mt-4" onClick={() => setSelectedReport(null)}>
//               Fermer
//             </Button>
//           </CardContent>
//         </Card>
//       )}
//     </div>
//   );
// }

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Send, Trash2, BarChart, Loader2 } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

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
  report?: CampaignReport;
}

interface CampaignReport {
  sent: number;
  delivered: number;
  failed: number;
  read: number;
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

  // ===== AUTH & API CALL LOGIC (same as Orders.tsx) =====
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
      throw new Error(data.error?.message || "Request failed");
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
      
      // Map audience names to campaigns
      return campaignsList.map((campaign: any) => {
        const audience = audiences.find((a: Audience) => a.id === campaign.audience_id);
        return {
          ...campaign,
          audience_name: audience?.name || "Unknown Audience"
        };
      });
    },
    enabled: !!user?.id && audiences.length > 0,
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
      toast({ title: "Campaign created successfully!" });
      
      // Reset form
      setName("");
      setAudienceId("");
      setMessage("");
      setScheduledDate("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
      toast({ 
        title: "Success",
        description: data.message || "Campaign sent successfully!" 
      });
      setSending(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
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
      toast({ title: "Campaign deleted successfully" });
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
    sendMutation.mutate(id);
  };

  const handleDeleteCampaign = (id: string) => {
    deleteMutation.mutate(id);
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
      {/* Campaign Creation Form */}
      <Card className="shadow-md dark:bg-[#0A0A0A] dark:text-white">
        <CardHeader>
          <CardTitle>Create WhatsApp Campaign</CardTitle>
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
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Scheduled Date (Optional)</label>
            <Input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
            />
          </div>

          <Button
            className="bg-green-600 hover:bg-green-700 text-white w-full"
            onClick={handleCreateCampaign}
            disabled={createMutation.isPending}
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
          <CardTitle>Existing Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : campaigns.length === 0 ? (
            <p className="text-center text-gray-500 py-8">
              No campaigns yet. Create your first campaign!
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b dark:border-gray-700">
                    <th className="text-left p-3 font-semibold">Name</th>
                    <th className="text-left p-3 font-semibold">Audience</th>
                    <th className="text-left p-3 font-semibold">Message</th>
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
                      <td className="p-3 max-w-xs truncate">{c.message}</td>
                      <td className="p-3">{formatDate(c.scheduled_date)}</td>
                      <td className="p-3">
                        <span
                          className={
                            c.status === "Envoyée"
                              ? "text-green-600 font-semibold"
                              : c.status === "Échouée"
                              ? "text-red-600 font-semibold"
                              : "text-yellow-600 font-semibold"
                          }
                        >
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleSendCampaign(c.id)}
                            disabled={sending === c.id || c.status === "Envoyée"}
                            title="Send campaign"
                          >
                            {sending === c.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleViewReport(c.report)}
                            title="View report"
                          >
                            <BarChart className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDeleteCampaign(c.id)}
                            title="Delete campaign"
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
        <Card className="shadow-md dark:bg-[#0A0A0A] dark:text-white">
          <CardHeader>
            <CardTitle>📊 Performance Report</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                <span className="font-medium">📤 Messages Sent</span>
                <span className="text-xl font-bold">{selectedReport.sent}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
                <span className="font-medium">✅ Delivered</span>
                <span className="text-xl font-bold text-green-600">{selectedReport.delivered}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
                <span className="font-medium">❌ Failed</span>
                <span className="text-xl font-bold text-red-600">{selectedReport.failed}</span>
              </div>
              <div className="flex justify-between items-center p-3 bg-purple-50 dark:bg-purple-900/20 rounded">
                <span className="font-medium">👀 Read</span>
                <span className="text-xl font-bold text-purple-600">{selectedReport.read}</span>
              </div>
            </div>
            <Button className="mt-4 w-full" onClick={() => setSelectedReport(null)}>
              Close Report
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}