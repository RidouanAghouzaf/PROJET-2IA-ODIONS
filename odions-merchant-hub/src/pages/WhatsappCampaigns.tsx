// import { useMemo, useState } from "react";
// import { Button } from "@/components/ui/button";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
// import { Textarea } from "@/components/ui/textarea";
// import {
//   Plus,
//   Send,
//   Trash2,
//   BarChart3,
//   Loader2,
//   AlertCircle,
//   CheckCircle2,
//   XCircle,
//   Clock,
//   MessageSquare,
//   Users,
//   MoreHorizontal,
//   ChevronDown,
//   ChevronUp,
//   CheckCheck,
// } from "lucide-react";
// import { useAuth } from "../context/AuthContext";
// import { useToast } from "@/hooks/use-toast";
// import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
// import {
//   Dialog,
//   DialogContent,
//   DialogDescription,
//   DialogFooter,
//   DialogHeader,
//   DialogTitle,
//   DialogTrigger,
// } from "@/components/ui/dialog";
// import {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
// } from "@/components/ui/sheet";
// import {
//   AlertDialog,
//   AlertDialogAction,
//   AlertDialogCancel,
//   AlertDialogContent,
//   AlertDialogDescription,
//   AlertDialogFooter,
//   AlertDialogHeader,
//   AlertDialogTitle,
// } from "@/components/ui/alert-dialog";
// import {
//   DropdownMenu,
//   DropdownMenuContent,
//   DropdownMenuItem,
//   DropdownMenuSeparator,
//   DropdownMenuTrigger,
// } from "@/components/ui/dropdown-menu";
// import { Skeleton } from "@/components/ui/skeleton";
// import { Label } from "@/components/ui/label";
// import { cn } from "@/lib/utils";

// const API_BASE_URL = "http://localhost:3000/api";

// /* ------------------ TYPES (unchanged shape, from existing API) ------------------ */

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
//   audience_size?: number;
//   message: string;
//   status: "En attente" | "En cours" | "Envoyée" | "Échouée";
//   scheduled_date: string;
//   created_at?: string;
//   sent_at?: string;
//   report?: CampaignReport;
// }

// interface CampaignReport {
//   sent: number;
//   delivered: number;
//   failed: number;
//   read: number;
//   total?: number;
// }

// interface SendResult {
//   success: boolean;
//   message: string;
//   details: {
//     sent: number;
//     failed: number;
//     total: number;
//     errors?: Array<{
//       phone: string;
//       name: string;
//       error: string;
//       code?: string;
//     }>;
//   };
// }

// const formatDate = (dateString?: string) => {
//   if (!dateString) return "—";
//   const date = new Date(dateString);
//   return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
// };

// const STATUS_CONFIG: Record<
//   Campaign["status"],
//   { icon: typeof Clock; className: string }
// > = {
//   "En attente": {
//     icon: Clock,
//     className:
//       "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
//   },
//   "Envoyée": {
//     icon: CheckCircle2,
//     className:
//       "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
//   },
//   "Échouée": {
//     icon: XCircle,
//     className:
//       "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
//   },
//   "En cours": {
//   icon: Loader2,
//   className: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
// },
// };

// const ratesFor = (report?: CampaignReport) => {
//   if (!report) return null;
//   const denominator = report.total ?? report.sent;
//   if (!denominator) return null;
//   return {
//     delivery: Math.round((report.delivered / denominator) * 100),
//     read: Math.round((report.read / denominator) * 100),
//     failure: Math.round((report.failed / denominator) * 100),
//   };
// };

// /* ================== COMPONENT ================== */

// export default function WhatsappCampaigns() {
//   const { user, session } = useAuth();
//   const { toast } = useToast();
//   const queryClient = useQueryClient();

//   const [createOpen, setCreateOpen] = useState(false);
//   const [name, setName] = useState("");
//   const [audienceId, setAudienceId] = useState("");
//   const [message, setMessage] = useState("");
//   const [scheduledDate, setScheduledDate] = useState("");
//   const [sendMode, setSendMode] = useState<"now" | "later">("now");

//   const [reportCampaign, setReportCampaign] = useState<Campaign | null>(null);
//   const [detailsCampaign, setDetailsCampaign] = useState<Campaign | null>(null);
//   const [sendConfirmCampaign, setSendConfirmCampaign] = useState<Campaign | null>(null);
//   const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);
//   const [sending, setSending] = useState<string | null>(null);
//   const [sendResult, setSendResult] = useState<SendResult | null>(null);
//   const [showErrorDetails, setShowErrorDetails] = useState(false);

//   // ===== AUTH & API CALL LOGIC (UNCHANGED) =====
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
//       throw new Error(data.error?.message || data.error || "Request failed");
//     }
//     return data;
//   };

//   // ===== QUERIES (UNCHANGED) =====
//   const {
//     data: audiences = [],
//     isError: audiencesFailed,
//   } = useQuery({
//     queryKey: ["audiences"],
//     queryFn: () =>
//       apiCall(`${API_BASE_URL}/audiences`).then((res) =>
//         Array.isArray(res) ? res : Array.isArray(res.audiences) ? res.audiences : []
//       ),
//     enabled: !!user?.id,
//   });

//   const {
//     data: campaigns = [],
//     isLoading,
//     isError: campaignsFailed,
//     refetch: refetchCampaigns,
//   } = useQuery({
//     queryKey: ["campaigns", user?.id],
//     queryFn: async () => {
//       const res = await apiCall(`${API_BASE_URL}/campaigns`);
//       const campaignsList = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];

//       // Map audience names to campaigns (kept identical, plus a derived, read-only
//       // audience_size for display purposes only — no new API calls or fields sent to the backend)
//       return campaignsList.map((campaign: any) => {
//         const audience = audiences.find((a: Audience) => a.id === campaign.audience_id);
//         return {
//           ...campaign,
//           audience_name: audience?.name || campaign.audience_name || "Unknown Audience",
//           audience_size: audience?.size,
//         };
//       });
//     },
//     enabled: !!user?.id,
//     refetchInterval: 5000, // Refetch every 5 seconds to update status
//   });

//   // ===== MUTATIONS (UNCHANGED) =====
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
//           scheduled_date: scheduledDate || new Date().toISOString().split("T")[0],
//           user_id: user?.id,
//         }),
//       });
//     },
//     onSuccess: () => {
//       queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
//       toast({
//         title: "Campaign created",
//         description: "Your campaign is ready to be sent.",
//       });

//       // Reset form
//       setName("");
//       setAudienceId("");
//       setMessage("");
//       setScheduledDate("");
//       setSendMode("now");
//       setCreateOpen(false);
//     },
//     onError: (error: Error) => {
//       toast({
//         title: "Unable to create campaign",
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
//     onSuccess: (data: SendResult) => {
//       queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
//       setSendResult(data);

//       if (data.details.failed === 0) {
//         toast({
//           title: "Campaign sent successfully",
//           description: `All ${data.details.sent} messages were sent.`,
//         });
//       } else if (data.details.sent > 0) {
//         toast({
//           title: "Campaign partially sent",
//           description: `${data.details.sent} sent, ${data.details.failed} failed.`,
//         });
//       } else {
//         toast({
//           title: "Campaign failed",
//           description: "All messages failed to send. Check errors below.",
//           variant: "destructive",
//         });
//       }
//       setSending(null);
//       setSendConfirmCampaign(null);
//     },
//     onError: (error: Error) => {
//       toast({
//         title: "Unable to send campaign",
//         description: error.message,
//         variant: "destructive",
//       });
//       setSending(null);
//       setSendConfirmCampaign(null);
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
//       toast({ title: "Campaign deleted" });
//       setDeleteCampaignId(null);
//     },
//     onError: (error: Error) => {
//       toast({
//         title: "Unable to delete campaign",
//         description: error.message,
//         variant: "destructive",
//       });
//     },
//   });

//   // ===== HANDLERS (logic unchanged, only wired to new UI) =====
//   const handleCreateCampaign = () => {
//     if (createMutation.isPending) return;
//     createMutation.mutate();
//   };

//   const handleSendCampaign = (id: string) => {
//     setSending(id);
//     setSendResult(null);
//     sendMutation.mutate(id);
//   };

//   const handleDeleteCampaign = (id: string) => {
//     deleteMutation.mutate(id);
//   };

//   const openCreateDialog = () => {
//     setName("");
//     setAudienceId("");
//     setMessage("");
//     setScheduledDate("");
//     setSendMode("now");
//     setCreateOpen(true);
//   };

//   // ===== DERIVED DATA =====
//   const selectedAudience = useMemo(
//     () => audiences.find((a: Audience) => a.id === audienceId),
//     [audiences, audienceId]
//   );

//   const stats = useMemo(
//     () => ({
//       total: campaigns.length,
//       sent: campaigns.filter((c: Campaign) => c.status === "Envoyée").length,
//       pending: campaigns.filter((c: Campaign) => c.status === "En attente").length,
//       failed: campaigns.filter((c: Campaign) => c.status === "Échouée").length,
//     }),
//     [campaigns]
//   );

//   const deletingCampaign = campaigns.find((c: Campaign) => c.id === deleteCampaignId) || null;

//   const canSubmitCreate = !!name && !!audienceId && !!message;

//   return (
//     <div className="space-y-6">
//       {/* HEADER */}
//       <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
//         <div className="space-y-1">
//           <h1 className="text-3xl font-bold tracking-tight">WhatsApp Campaigns</h1>
//           <p className="text-muted-foreground">
//             Create, schedule and monitor WhatsApp marketing campaigns.
//           </p>
//         </div>
//         <Button className="shrink-0 bg-emerald-600 text-white hover:bg-emerald-700" onClick={openCreateDialog}>
//           <Plus className="mr-2 h-4 w-4" />
//           Create Campaign
//         </Button>
//       </div>

//       {/* STATS */}
//       {isLoading ? (
//         <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
//           {Array.from({ length: 4 }, (_, i) => (
//             <Skeleton key={i} className="h-16 rounded-xl" />
//           ))}
//         </div>
//       ) : (
//         <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
//           <StatCard label="Total Campaigns" value={stats.total} icon={MessageSquare} />
//           <StatCard label="Sent" value={stats.sent} icon={CheckCircle2} accent="text-emerald-600 dark:text-emerald-400" />
//           <StatCard label="Pending" value={stats.pending} icon={Clock} accent="text-amber-600 dark:text-amber-400" />
//           <StatCard label="Failed" value={stats.failed} icon={XCircle} accent="text-red-600 dark:text-red-400" />
//         </div>
//       )}

//       {/* ERROR STATE */}
//       {campaignsFailed && !isLoading && (
//         <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
//           <div className="flex items-center gap-2 text-sm text-destructive">
//             <AlertCircle className="h-4 w-4" />
//             Unable to load campaigns. Please try again.
//           </div>
//           <Button variant="outline" size="sm" onClick={() => refetchCampaigns()}>
//             Retry
//           </Button>
//         </div>
//       )}

//       {/* CAMPAIGNS TABLE (desktop) */}
//       {!campaignsFailed && (
//         <Card className="hidden overflow-hidden rounded-xl md:block">
//           {isLoading ? (
//             <TableSkeleton />
//           ) : campaigns.length === 0 ? (
//             <EmptyState onCreate={openCreateDialog} />
//           ) : (
//             <table className="w-full text-sm">
//               <thead>
//                 <tr className="border-b border-border text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
//                   <th className="px-4 py-3">Campaign</th>
//                   <th className="px-4 py-3">Audience</th>
//                   <th className="px-4 py-3">Recipients</th>
//                   <th className="px-4 py-3">Schedule</th>
//                   <th className="px-4 py-3">Status</th>
//                   <th className="px-4 py-3">Performance</th>
//                   <th className="px-4 py-3 text-right">Actions</th>
//                 </tr>
//               </thead>
//               <tbody className="divide-y divide-border">
//                 {campaigns.map((c: Campaign) => (
//                   <tr
//                     key={c.id}
//                     className="cursor-pointer hover:bg-muted/40"
//                     onClick={() => setDetailsCampaign(c)}
//                   >
//                     <td className="px-4 py-3">
//                       <p className="font-medium text-foreground">{c.name}</p>
//                       <p className="text-xs text-muted-foreground">{formatDate(c.created_at)}</p>
//                     </td>
//                     <td className="px-4 py-3 text-foreground">{c.audience_name}</td>
//                     <td className="px-4 py-3">
//                       <div className="flex items-center gap-1.5 text-foreground">
//                         <Users className="h-3.5 w-3.5 text-muted-foreground" />
//                         {(c.audience_size ?? 0).toLocaleString()}
//                       </div>
//                     </td>
//                     <td className="px-4 py-3 text-muted-foreground">{formatDate(c.scheduled_date)}</td>
//                     <td className="px-4 py-3">
//                       <StatusBadge status={c.status} />
//                     </td>
//                     <td className="px-4 py-3">
//                       {c.report ? (
//                         <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
//                           <span>Sent {c.report.sent}</span>
//                           <span>Delivered {c.report.delivered}</span>
//                           <span>Read {c.report.read}</span>
//                         </div>
//                       ) : (
//                         <span className="text-xs text-muted-foreground">—</span>
//                       )}
//                     </td>
//                     <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
//                       <DropdownMenu>
//                         <DropdownMenuTrigger asChild>
//                           <Button variant="ghost" size="icon" aria-label={`Actions for ${c.name}`}>
//                             <MoreHorizontal className="h-4 w-4" />
//                           </Button>
//                         </DropdownMenuTrigger>
//                         <DropdownMenuContent align="end" className="w-48">
//                           <DropdownMenuItem
//                             onClick={() => setSendConfirmCampaign(c)}
//                             disabled={sending === c.id || c.status === "Envoyée" || c.status === "En cours"}
//                           >
//                             <Send className="mr-2 h-4 w-4" />
//                             Send campaign
//                           </DropdownMenuItem>
//                           <DropdownMenuItem
//                             onClick={() => setReportCampaign(c)}
//                             disabled={!c.report}
//                           >
//                             <BarChart3 className="mr-2 h-4 w-4" />
//                             View report
//                           </DropdownMenuItem>
//                           <DropdownMenuSeparator />
//                           <DropdownMenuItem
//                             onClick={() => setDeleteCampaignId(c.id)}
//                             className="text-destructive focus:text-destructive"
//                           >
//                             <Trash2 className="mr-2 h-4 w-4" />
//                             Delete campaign
//                           </DropdownMenuItem>
//                         </DropdownMenuContent>
//                       </DropdownMenu>
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </Card>
//       )}

//       {/* CAMPAIGNS LIST (mobile) */}
//       {!campaignsFailed && (
//         <div className="grid grid-cols-1 gap-4 md:hidden">
//           {isLoading ? (
//             <MobileSkeleton />
//           ) : campaigns.length === 0 ? (
//             <EmptyState onCreate={openCreateDialog} />
//           ) : (
//             campaigns.map((c: Campaign) => (
//               <Card key={c.id} className="rounded-xl" onClick={() => setDetailsCampaign(c)}>
//                 <CardContent className="space-y-3 p-4">
//                   <div className="flex items-start justify-between">
//                     <div>
//                       <p className="font-medium text-foreground">{c.name}</p>
//                       <p className="text-xs text-muted-foreground">{formatDate(c.created_at)}</p>
//                     </div>
//                     <StatusBadge status={c.status} />
//                   </div>
//                   <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
//                     <div className="flex items-center gap-1.5 text-foreground">
//                       <Users className="h-3.5 w-3.5 text-muted-foreground" />
//                       {(c.audience_size ?? 0).toLocaleString()} recipients
//                     </div>
//                     <span className="text-xs text-muted-foreground">{formatDate(c.scheduled_date)}</span>
//                   </div>
//                   <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="flex-1"
//                       onClick={() => setSendConfirmCampaign(c)}
//                       disabled={sending === c.id || c.status === "Envoyée"}
//                     >
//                       {sending === c.id ? (
//                         <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
//                       ) : (
//                         <Send className="mr-1.5 h-3.5 w-3.5" />
//                       )}
//                       Send
//                     </Button>
//                     <Button
//                       variant="outline"
//                       size="sm"
//                       className="flex-1 text-destructive hover:text-destructive"
//                       onClick={() => setDeleteCampaignId(c.id)}
//                     >
//                       <Trash2 className="mr-1.5 h-3.5 w-3.5" />
//                       Delete
//                     </Button>
//                   </div>
//                 </CardContent>
//               </Card>
//             ))
//           )}
//         </div>
//       )}

//       {/* CREATE CAMPAIGN DIALOG */}
//       <Dialog open={createOpen} onOpenChange={(o) => (o ? openCreateDialog() : setCreateOpen(false))}>
//         <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
//           <DialogHeader>
//             <DialogTitle className="text-xl">Create Campaign</DialogTitle>
//             <DialogDescription>
//               Reach your customers with a targeted WhatsApp message.
//             </DialogDescription>
//           </DialogHeader>

//           <fieldset disabled={createMutation.isPending} className="space-y-6">
//             {/* Section 1: Campaign Details */}
//             <div className="space-y-3">
//               <p className="text-sm font-medium text-foreground">Campaign Details</p>
//               <div className="space-y-1.5">
//                 <Label htmlFor="campaign_name">Campaign Name</Label>
//                 <Input
//                   id="campaign_name"
//                   placeholder="e.g., Summer Sale 2025"
//                   value={name}
//                   onChange={(e) => setName(e.target.value)}
//                 />
//               </div>
//               <div className="space-y-1.5">
//                 <Label htmlFor="audience">Audience</Label>
//                 <Select value={audienceId} onValueChange={setAudienceId}>
//                   <SelectTrigger id="audience">
//                     <SelectValue placeholder="Choose target audience" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {audiences.map((a: Audience) => (
//                       <SelectItem key={a.id} value={a.id}>
//                         {a.name} · {a.size.toLocaleString()} contacts
//                       </SelectItem>
//                     ))}
//                   </SelectContent>
//                 </Select>
//                 {audiencesFailed && (
//                   <p className="text-xs text-destructive">Unable to load audiences. Please try again.</p>
//                 )}
//               </div>

//               {selectedAudience && (
//                 <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
//                   <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
//                     Target Audience
//                   </p>
//                   <p className="mt-1 font-medium text-foreground">{selectedAudience.name}</p>
//                   <p className="text-muted-foreground">
//                     {selectedAudience.size.toLocaleString()} contacts
//                   </p>
//                   {selectedAudience.criteria_summary && (
//                     <p className="mt-1 text-xs text-muted-foreground">
//                       {selectedAudience.criteria_summary}
//                     </p>
//                   )}
//                 </div>
//               )}
//             </div>

//             {/* Section 2: Message + live preview */}
//             <div className="space-y-3">
//               <p className="text-sm font-medium text-foreground">Message</p>
//               <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
//                 <div className="space-y-1.5">
//                   <Textarea
//                     placeholder="Write your WhatsApp message..."
//                     value={message}
//                     onChange={(e) => setMessage(e.target.value)}
//                     rows={7}
//                     className="resize-none"
//                   />
//                   <p className="text-xs text-muted-foreground">{message.length} characters</p>
//                 </div>
//                 <div className="space-y-1.5">
//                   <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
//                     WhatsApp Preview
//                   </p>
//                   <WhatsAppPreview message={message} />
//                 </div>
//               </div>
//             </div>

//             {/* Section 3: Send options */}
//             <div className="space-y-3">
//               <p className="text-sm font-medium text-foreground">Send Options</p>
//               <div className="flex flex-col gap-2 sm:flex-row">
//                 <button
//                   type="button"
//                   onClick={() => {
//                     setSendMode("now");
//                     setScheduledDate("");
//                   }}
//                   className={cn(
//                     "flex-1 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
//                     sendMode === "now"
//                       ? "border-primary bg-primary/5 text-foreground"
//                       : "border-border text-muted-foreground hover:bg-muted/40"
//                   )}
//                 >
//                   Send now
//                 </button>
//                 <button
//                   type="button"
//                   onClick={() => setSendMode("later")}
//                   className={cn(
//                     "flex-1 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
//                     sendMode === "later"
//                       ? "border-primary bg-primary/5 text-foreground"
//                       : "border-border text-muted-foreground hover:bg-muted/40"
//                   )}
//                 >
//                   Schedule for later
//                 </button>
//               </div>
//               {sendMode === "later" && (
//                 <div className="space-y-1.5">
//                   <Label htmlFor="scheduled_date">Date</Label>
//                   <Input
//                     id="scheduled_date"
//                     type="date"
//                     value={scheduledDate}
//                     onChange={(e) => setScheduledDate(e.target.value)}
//                     min={new Date().toISOString().split("T")[0]}
//                   />
//                 </div>
//               )}
//             </div>

//             {/* Review */}
//             {canSubmitCreate && (
//               <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
//                 <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Review</p>
//                 <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
//                   <div>
//                     <p className="text-xs text-muted-foreground">Campaign</p>
//                     <p className="font-medium text-foreground">{name}</p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-muted-foreground">Audience</p>
//                     <p className="font-medium text-foreground">
//                       {selectedAudience?.name} · {(selectedAudience?.size ?? 0).toLocaleString()} contacts
//                     </p>
//                   </div>
//                   <div>
//                     <p className="text-xs text-muted-foreground">Schedule</p>
//                     <p className="font-medium text-foreground">
//                       {sendMode === "now" ? "Today" : scheduledDate ? formatDate(scheduledDate) : "—"}
//                     </p>
//                   </div>
//                   <div className="sm:col-span-2">
//                     <p className="text-xs text-muted-foreground">Message</p>
//                     <p className="line-clamp-2 font-medium text-foreground">{message}</p>
//                   </div>
//                 </div>
//               </div>
//             )}
//           </fieldset>

//           <DialogFooter>
//             <Button type="button" variant="outline" onClick={() => setCreateOpen(false)} disabled={createMutation.isPending}>
//               Cancel
//             </Button>
//             <Button
//               type="button"
//               className="bg-emerald-600 text-white hover:bg-emerald-700"
//               onClick={handleCreateCampaign}
//               disabled={createMutation.isPending || !canSubmitCreate}
//             >
//               {createMutation.isPending ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Creating...
//                 </>
//               ) : (
//                 "Create Campaign"
//               )}
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* SEND CONFIRMATION */}
//       <AlertDialog open={!!sendConfirmCampaign} onOpenChange={(o) => !o && setSendConfirmCampaign(null)}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Send Campaign?</AlertDialogTitle>
//             <AlertDialogDescription asChild>
//               <div className="space-y-3 text-left">
//                 <p>You are about to send this campaign to:</p>
//                 <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
//                   <p className="font-medium text-foreground">{sendConfirmCampaign?.audience_name}</p>
//                   <p className="text-muted-foreground">
//                     {(sendConfirmCampaign?.audience_size ?? 0).toLocaleString()} contacts
//                   </p>
//                 </div>
//                 <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
//                   <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
//                     Message preview
//                   </p>
//                   <p className="line-clamp-3 text-foreground">{sendConfirmCampaign?.message}</p>
//                 </div>
//                 <p className="text-xs text-amber-600 dark:text-amber-400">
//                   This action will send messages to the selected audience.
//                 </p>
//               </div>
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel disabled={!!sending}>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={() => sendConfirmCampaign && handleSendCampaign(sendConfirmCampaign.id)}
//               disabled={!!sending}
//               className="bg-emerald-600 text-white hover:bg-emerald-700"
//             >
//               {sending === sendConfirmCampaign?.id ? (
//                 <>
//                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
//                   Sending...
//                 </>
//               ) : (
//                 "Send Campaign"
//               )}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       {/* DELETE CONFIRMATION */}
//       <AlertDialog open={!!deleteCampaignId} onOpenChange={(o) => !o && setDeleteCampaignId(null)}>
//         <AlertDialogContent>
//           <AlertDialogHeader>
//             <AlertDialogTitle>Delete campaign?</AlertDialogTitle>
//             <AlertDialogDescription>
//               {deletingCampaign ? `"${deletingCampaign.name}" will be permanently deleted. ` : ""}
//               This action cannot be undone.
//             </AlertDialogDescription>
//           </AlertDialogHeader>
//           <AlertDialogFooter>
//             <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
//             <AlertDialogAction
//               onClick={() => deleteCampaignId && handleDeleteCampaign(deleteCampaignId)}
//               disabled={deleteMutation.isPending}
//               className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
//             >
//               {deleteMutation.isPending ? "Deleting..." : "Delete Campaign"}
//             </AlertDialogAction>
//           </AlertDialogFooter>
//         </AlertDialogContent>
//       </AlertDialog>

//       {/* SEND RESULT DIALOG */}
//       <Dialog open={!!sendResult} onOpenChange={(o) => !o && setSendResult(null)}>
//         <DialogContent className="sm:max-w-lg">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               {sendResult?.details.failed === 0 ? (
//                 <CheckCircle2 className="h-5 w-5 text-emerald-600" />
//               ) : sendResult && sendResult.details.sent > 0 ? (
//                 <AlertCircle className="h-5 w-5 text-amber-600" />
//               ) : (
//                 <XCircle className="h-5 w-5 text-destructive" />
//               )}
//               {sendResult?.details.failed === 0
//                 ? "Campaign sent successfully"
//                 : sendResult && sendResult.details.sent > 0
//                 ? "Campaign partially sent"
//                 : "Campaign failed"}
//             </DialogTitle>
//           </DialogHeader>

//           {sendResult && (
//             <div className="space-y-4">
//               <div className="grid grid-cols-2 gap-3">
//                 <MiniStat label="Sent" value={sendResult.details.sent} />
//                 <MiniStat label="Failed" value={sendResult.details.failed} />
//               </div>

//               {sendResult.details.errors && sendResult.details.errors.length > 0 && (
//                 <div className="rounded-lg border border-border">
//                   <button
//                     type="button"
//                     onClick={() => setShowErrorDetails((v) => !v)}
//                     className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-foreground"
//                   >
//                     Failed recipients ({sendResult.details.errors.length})
//                     {showErrorDetails ? (
//                       <ChevronUp className="h-4 w-4 text-muted-foreground" />
//                     ) : (
//                       <ChevronDown className="h-4 w-4 text-muted-foreground" />
//                     )}
//                   </button>
//                   {showErrorDetails && (
//                     <div className="max-h-48 space-y-1 overflow-y-auto border-t border-border px-3 py-2 text-xs">
//                       {sendResult.details.errors.map((err, idx) => (
//                         <div key={idx} className="text-destructive">
//                           {err.name || err.phone}: {err.error}
//                         </div>
//                       ))}
//                     </div>
//                   )}
//                 </div>
//               )}
//             </div>
//           )}

//           <DialogFooter>
//             <Button variant="outline" onClick={() => setSendResult(null)} className="w-full">
//               Close
//             </Button>
//           </DialogFooter>
//         </DialogContent>
//       </Dialog>

//       {/* REPORT DIALOG */}
//       <Dialog open={!!reportCampaign} onOpenChange={(o) => !o && setReportCampaign(null)}>
//         <DialogContent className="sm:max-w-lg">
//           <DialogHeader>
//             <DialogTitle className="flex items-center gap-2">
//               <BarChart3 className="h-5 w-5" />
//               Campaign Performance
//             </DialogTitle>
//             {reportCampaign && <DialogDescription>{reportCampaign.name}</DialogDescription>}
//           </DialogHeader>
//           <PerformanceMetrics report={reportCampaign?.report} />
//         </DialogContent>
//       </Dialog>

//       {/* CAMPAIGN DETAILS SHEET */}
//       <Sheet open={!!detailsCampaign} onOpenChange={(o) => !o && setDetailsCampaign(null)}>
//         <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
//           {detailsCampaign && (
//             <>
//               <SheetHeader>
//                 <SheetTitle>{detailsCampaign.name}</SheetTitle>
//                 <SheetDescription>Campaign overview and performance</SheetDescription>
//               </SheetHeader>

//               <div className="mt-6 space-y-6">
//                 <div className="space-y-2 text-sm">
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Audience</span>
//                     <span className="font-medium text-foreground">{detailsCampaign.audience_name}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Contacts</span>
//                     <span className="font-medium text-foreground">
//                       {(detailsCampaign.audience_size ?? 0).toLocaleString()}
//                     </span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Created</span>
//                     <span className="font-medium text-foreground">{formatDate(detailsCampaign.created_at)}</span>
//                   </div>
//                   <div className="flex justify-between">
//                     <span className="text-muted-foreground">Scheduled</span>
//                     <span className="font-medium text-foreground">{formatDate(detailsCampaign.scheduled_date)}</span>
//                   </div>
//                   <div className="flex items-center justify-between">
//                     <span className="text-muted-foreground">Status</span>
//                     <StatusBadge status={detailsCampaign.status} />
//                   </div>
//                 </div>

//                 <div className="space-y-2">
//                   <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Message</p>
//                   <WhatsAppPreview message={detailsCampaign.message} />
//                 </div>

//                 <div className="space-y-2">
//                   <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Performance</p>
//                   <PerformanceMetrics report={detailsCampaign.report} />
//                 </div>
//               </div>
//             </>
//           )}
//         </SheetContent>
//       </Sheet>
//     </div>
//   );
// }

// /* ─── Presentational helper components ──────────────────────────────── */

// const StatCard = ({
//   label,
//   value,
//   icon: Icon,
//   accent,
// }: {
//   label: string;
//   value: number;
//   icon: typeof MessageSquare;
//   accent?: string;
// }) => (
//   <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
//     <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted", accent)}>
//       <Icon className="h-4 w-4" />
//     </div>
//     <div className="min-w-0">
//       <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
//       <p className="text-lg font-semibold text-foreground">{value}</p>
//     </div>
//   </div>
// );

// const StatusBadge = ({ status }: { status: Campaign["status"] }) => {
//   const config = STATUS_CONFIG[status];
//   const Icon = config.icon;
//   return (
//     <span
//       className={cn(
//         "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
//         config.className
//       )}
//     >
//       <Icon className="h-3 w-3" aria-hidden="true" />
//       {status}
//     </span>
//   );
// };

// const WhatsAppPreview = ({ message }: { message: string }) => {
//   const now = new Date();
//   const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
//   return (
//     <div className="rounded-lg border border-border bg-[#e5ddd5] p-4 dark:bg-muted">
//       <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-[#dcf8c6] px-3 py-2 shadow-sm dark:bg-emerald-500/20">
//         <p className="whitespace-pre-wrap break-words text-sm text-neutral-900 dark:text-foreground">
//           {message || "Your message will appear here as the customer will see it."}
//         </p>
//         <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-neutral-500 dark:text-muted-foreground">
//           {time}
//           <CheckCheck className="h-3 w-3 text-sky-500" />
//         </div>
//       </div>
//     </div>
//   );
// };

// const MiniStat = ({ label, value }: { label: string; value: number }) => (
//   <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
//     <p className="text-2xl font-semibold text-foreground">{value}</p>
//     <p className="text-xs text-muted-foreground">{label}</p>
//   </div>
// );

// const ProgressRow = ({ label, value }: { label: string; value: number }) => (
//   <div className="space-y-1">
//     <div className="flex items-center justify-between text-xs">
//       <span className="text-muted-foreground">{label}</span>
//       <span className="font-medium text-foreground">{value}%</span>
//     </div>
//     <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
//       <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, value)}%` }} />
//     </div>
//   </div>
// );

// const PerformanceMetrics = ({ report }: { report?: CampaignReport }) => {
//   const rates = ratesFor(report);
//   if (!report) {
//     return <p className="py-6 text-center text-sm text-muted-foreground">No performance data available yet.</p>;
//   }
//   return (
//     <div className="space-y-4">
//       <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
//         <MiniStat label="Sent" value={report.sent} />
//         <MiniStat label="Delivered" value={report.delivered} />
//         <MiniStat label="Failed" value={report.failed} />
//         <MiniStat label="Read" value={report.read} />
//       </div>
//       {rates && (
//         <div className="space-y-3">
//           <ProgressRow label="Delivery rate" value={rates.delivery} />
//           <ProgressRow label="Read rate" value={rates.read} />
//           <ProgressRow label="Failure rate" value={rates.failure} />
//         </div>
//       )}
//     </div>
//   );
// };

// const TableSkeleton = () => (
//   <div>
//     <div className="border-b border-border px-4 py-3">
//       <div className="grid grid-cols-7 gap-4">
//         {["Campaign", "Audience", "Recipients", "Schedule", "Status", "Performance", "Actions"].map((h) => (
//           <Skeleton key={h} className="h-3 w-16" />
//         ))}
//       </div>
//     </div>
//     <div className="divide-y divide-border">
//       {Array.from({ length: 5 }, (_, i) => (
//         <div key={i} className="grid grid-cols-7 items-center gap-4 px-4 py-4">
//           <Skeleton className="h-4 w-24" />
//           <Skeleton className="h-4 w-20" />
//           <Skeleton className="h-4 w-12" />
//           <Skeleton className="h-4 w-20" />
//           <Skeleton className="h-6 w-20 rounded-full" />
//           <Skeleton className="h-4 w-16" />
//           <Skeleton className="ml-auto h-8 w-8 rounded-md" />
//         </div>
//       ))}
//     </div>
//   </div>
// );

// const MobileSkeleton = () => (
//   <>
//     {Array.from({ length: 3 }, (_, i) => (
//       <div key={i} className="space-y-3 rounded-xl border border-border p-4">
//         <div className="flex items-center justify-between">
//           <Skeleton className="h-4 w-28" />
//           <Skeleton className="h-5 w-16 rounded-full" />
//         </div>
//         <Skeleton className="h-9 w-full rounded-lg" />
//         <div className="flex gap-2">
//           <Skeleton className="h-8 flex-1 rounded-md" />
//           <Skeleton className="h-8 flex-1 rounded-md" />
//         </div>
//       </div>
//     ))}
//   </>
// );

// const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
//   <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
//     <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
//       <MessageSquare className="h-5 w-5 text-muted-foreground" />
//     </div>
//     <div className="space-y-1">
//       <p className="font-medium text-foreground">No campaigns yet</p>
//       <p className="max-w-sm text-sm text-muted-foreground">
//         Create your first campaign to start reaching your customers.
//       </p>
//     </div>
//     <Button size="sm" className="bg-emerald-600 text-white hover:bg-emerald-700" onClick={onCreate}>
//       <Plus className="mr-1.5 h-4 w-4" />
//       Create Campaign
//     </Button>
//   </div>
// );
import { useMemo, useState } from "react";
import {
  Search,
  Plus,
  Send,
  Trash2,
  BarChart3,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  MessageSquare,
  Users,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  CheckCheck,
  Filter,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "../context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const API_BASE_URL = "http://localhost:3000/api";

/* ------------------ TYPES (unchanged) ------------------ */

interface Audience {
  id: string;
  name: string;
  size: number;
  criteria_summary?: string;
}

type CampaignStatus = "En attente" | "En cours" | "Envoyée" | "Échouée";

interface Campaign {
  id: string;
  name: string;
  audience_id: string;
  audience_name?: string;
  audience_size?: number;
  message: string;
  status: CampaignStatus;
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

const formatDate = (dateString?: string) => {
  if (!dateString) return "—";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
};

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; icon: typeof Clock; className: string; spin?: boolean }
> = {
  "En attente": {
    label: "Pending",
    icon: Clock,
    className:
      "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
  },
  "En cours": {
    label: "Sending",
    icon: Loader2,
    spin: true,
    className:
      "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
  },
  "Envoyée": {
    label: "Sent",
    icon: CheckCircle2,
    className:
      "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
  },
  "Échouée": {
    label: "Failed",
    icon: XCircle,
    className:
      "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
  },
};

const ratesFor = (report?: CampaignReport) => {
  if (!report) return null;
  const denominator = report.total ?? report.sent;
  if (!denominator) return null;
  return {
    delivery: Math.round((report.delivered / denominator) * 100),
    read: Math.round((report.read / denominator) * 100),
    failure: Math.round((report.failed / denominator) * 100),
  };
};

/* ================== COMPONENT ================== */

export default function WhatsappCampaigns() {
  const { user, session } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Create form state
  const [createOpen, setCreateOpen] = useState(false);
  const [name, setName] = useState("");
  const [audienceId, setAudienceId] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [sendMode, setSendMode] = useState<"now" | "later">("now");

  // Dialog / sheet state
  const [reportCampaign, setReportCampaign] = useState<Campaign | null>(null);
  const [detailsCampaign, setDetailsCampaign] = useState<Campaign | null>(null);
  const [sendConfirmCampaign, setSendConfirmCampaign] = useState<Campaign | null>(null);
  const [deleteCampaignId, setDeleteCampaignId] = useState<string | null>(null);
  const [sending, setSending] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<SendResult | null>(null);
  const [showErrorDetails, setShowErrorDetails] = useState(false);

  // Filters (display only, applied on the already-loaded list)
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [audienceFilter, setAudienceFilter] = useState("all");

  // ===== AUTH & API CALL LOGIC (UNCHANGED) =====
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

  // ===== QUERIES (UNCHANGED) =====
  const { data: audiences = [], isError: audiencesFailed } = useQuery({
    queryKey: ["audiences"],
    queryFn: () =>
      apiCall(`${API_BASE_URL}/audiences`).then((res) =>
        Array.isArray(res) ? res : Array.isArray(res.audiences) ? res.audiences : []
      ),
    enabled: !!user?.id,
  });

  const {
    data: campaigns = [],
    isLoading,
    isError: campaignsFailed,
    refetch: refetchCampaigns,
  } = useQuery({
    queryKey: ["campaigns", user?.id],
    queryFn: async () => {
      const res = await apiCall(`${API_BASE_URL}/campaigns`);
      const campaignsList = Array.isArray(res) ? res : Array.isArray(res.data) ? res.data : [];

      return campaignsList.map((campaign: any) => {
        const audience = audiences.find((a: Audience) => a.id === campaign.audience_id);
        return {
          ...campaign,
          audience_name: audience?.name || campaign.audience_name || "Unknown Audience",
          audience_size: audience?.size,
        };
      });
    },
    enabled: !!user?.id,
    refetchInterval: 5000, // Refetch every 5 seconds to update status
  });

  // ===== MUTATIONS (UNCHANGED) =====
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
          scheduled_date: scheduledDate || new Date().toISOString().split("T")[0],
          user_id: user?.id,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["campaigns", user?.id] });
      toast({
        title: "Campaign created",
        description: "Your campaign is ready to be sent.",
      });

      setName("");
      setAudienceId("");
      setMessage("");
      setScheduledDate("");
      setSendMode("now");
      setCreateOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to create campaign",
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
          title: "Campaign sent successfully",
          description: `All ${data.details.sent} messages were sent.`,
        });
      } else if (data.details.sent > 0) {
        toast({
          title: "Campaign partially sent",
          description: `${data.details.sent} sent, ${data.details.failed} failed.`,
        });
      } else {
        toast({
          title: "Campaign failed",
          description: "All messages failed to send. Check errors below.",
          variant: "destructive",
        });
      }
      setSending(null);
      setSendConfirmCampaign(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to send campaign",
        description: error.message,
        variant: "destructive",
      });
      setSending(null);
      setSendConfirmCampaign(null);
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
      toast({ title: "Campaign deleted" });
      setDeleteCampaignId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Unable to delete campaign",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // ===== HANDLERS (UNCHANGED LOGIC) =====
  const handleCreateCampaign = () => {
    if (createMutation.isPending) return;
    createMutation.mutate();
  };

  const handleSendCampaign = (id: string) => {
    setSending(id);
    setSendResult(null);
    sendMutation.mutate(id);
  };

  const handleDeleteCampaign = (id: string) => {
    deleteMutation.mutate(id);
  };

  const openCreateDialog = () => {
    setName("");
    setAudienceId("");
    setMessage("");
    setScheduledDate("");
    setSendMode("now");
    setCreateOpen(true);
  };

  const closeCreateDialog = () => {
    if (createMutation.isPending) return;
    setCreateOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmitCreate) return;
    handleCreateCampaign();
  };

  // ===== DERIVED DATA =====
  const selectedAudience = useMemo(
    () => audiences.find((a: Audience) => a.id === audienceId),
    [audiences, audienceId]
  );

  const stats = useMemo(
    () => ({
      total: campaigns.length,
      sent: campaigns.filter((c: Campaign) => c.status === "Envoyée").length,
      pending: campaigns.filter((c: Campaign) => c.status === "En attente").length,
      failed: campaigns.filter((c: Campaign) => c.status === "Échouée").length,
    }),
    [campaigns]
  );

  const filteredCampaigns = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return campaigns.filter((c: Campaign) => {
      const matchesSearch =
        !q ||
        c.name?.toLowerCase().includes(q) ||
        c.audience_name?.toLowerCase().includes(q);
      const matchesStatus = statusFilter === "all" || c.status === statusFilter;
      const matchesAudience = audienceFilter === "all" || c.audience_id === audienceFilter;
      return matchesSearch && matchesStatus && matchesAudience;
    });
  }, [campaigns, searchQuery, statusFilter, audienceFilter]);

  const hasActiveFilters =
    searchQuery !== "" || statusFilter !== "all" || audienceFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setAudienceFilter("all");
  };

  const deletingCampaign = campaigns.find((c: Campaign) => c.id === deleteCampaignId) || null;

  const canSubmitCreate = !!name && !!audienceId && !!message;

  // ===== UI =====
  return (
    <div className="space-y-6 text-foreground">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <div className="text-sm text-muted-foreground">
            Campaigns <span className="mx-1">/</span> WhatsApp
          </div>
          <h1 className="text-3xl font-bold tracking-tight">WhatsApp Campaigns</h1>
          <p className="text-muted-foreground">
            Create, schedule and monitor WhatsApp marketing campaigns.
          </p>
        </div>
        <Button onClick={openCreateDialog} className="shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          New Campaign
        </Button>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Total Campaigns" value={stats.total} icon={MessageSquare} />
          <StatCard label="Sent" value={stats.sent} icon={CheckCircle2} accent="text-emerald-600 dark:text-emerald-400" />
          <StatCard label="Pending" value={stats.pending} icon={Clock} accent="text-amber-600 dark:text-amber-400" />
          <StatCard label="Failed" value={stats.failed} icon={XCircle} accent="text-red-600 dark:text-red-400" />
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-center">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search campaigns, audiences..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-10 rounded-lg pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="hidden h-4 w-4 text-muted-foreground sm:block" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-10 w-[160px] rounded-lg">
              <SelectValue placeholder="All statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="En attente">Pending</SelectItem>
              <SelectItem value="En cours">Sending</SelectItem>
              <SelectItem value="Envoyée">Sent</SelectItem>
              <SelectItem value="Échouée">Failed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Select value={audienceFilter} onValueChange={setAudienceFilter}>
          <SelectTrigger className="h-10 w-[190px] rounded-lg">
            <SelectValue placeholder="All audiences" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All audiences</SelectItem>
            {audiences.map((a: Audience) => (
              <SelectItem key={a.id} value={a.id}>
                {a.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-10 text-muted-foreground">
            <X className="mr-1.5 h-4 w-4" />
            Clear filters
          </Button>
        )}
      </div>

      {/* Error state */}
      {campaignsFailed && !isLoading && (
        <div className="flex items-center justify-between rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3">
          <div className="flex items-center gap-2 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            Failed to load campaigns.
          </div>
          <Button variant="outline" size="sm" onClick={() => refetchCampaigns()}>
            Retry
          </Button>
        </div>
      )}

      {/* Desktop Table */}
      {!campaignsFailed && (
        <Card className="hidden overflow-hidden rounded-xl md:block">
          {isLoading ? (
            <SkeletonTable />
          ) : filteredCampaigns.length === 0 ? (
            <EmptyState
              hasCampaigns={campaigns.length > 0}
              hasActiveFilters={hasActiveFilters}
              onCreate={openCreateDialog}
              onClearFilters={clearFilters}
            />
          ) : (
            <Table>
              <TableHeader className="sticky top-0 bg-card">
                <TableRow className="hover:bg-transparent">
                  <TableHead>Campaign</TableHead>
                  <TableHead>Audience</TableHead>
                  <TableHead>Recipients</TableHead>
                  <TableHead>Schedule</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Performance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((c: Campaign) => (
                  <TableRow
                    key={c.id}
                    className="group cursor-pointer"
                    onClick={() => setDetailsCampaign(c)}
                  >
                    <TableCell>
                      <CampaignName name={c.name} date={c.created_at} />
                    </TableCell>
                    <TableCell className="text-sm text-foreground">{c.audience_name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm text-foreground">
                        <Users className="h-3.5 w-3.5 text-muted-foreground" />
                        {(c.audience_size ?? 0).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDate(c.scheduled_date)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={c.status} />
                    </TableCell>
                    <TableCell>
                      {c.report ? (
                        <div className="flex flex-col gap-0.5 text-xs text-muted-foreground">
                          <span>Sent {c.report.sent}</span>
                          <span>Delivered {c.report.delivered}</span>
                          <span>Read {c.report.read}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" aria-label={`Actions for ${c.name}`}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => setSendConfirmCampaign(c)}
                            disabled={sending === c.id || c.status === "Envoyée" || c.status === "En cours"}
                          >
                            <Send className="mr-2 h-4 w-4" />
                            Send Campaign
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => setReportCampaign(c)} disabled={!c.report}>
                            <BarChart3 className="mr-2 h-4 w-4" />
                            View Report
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => setDeleteCampaignId(c.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Campaign
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Card>
      )}

      {/* Mobile Cards */}
      {!campaignsFailed && (
        <div className="grid grid-cols-1 gap-4 md:hidden">
          {isLoading ? (
            <SkeletonMobile />
          ) : filteredCampaigns.length === 0 ? (
            <EmptyState
              hasCampaigns={campaigns.length > 0}
              hasActiveFilters={hasActiveFilters}
              onCreate={openCreateDialog}
              onClearFilters={clearFilters}
            />
          ) : (
            filteredCampaigns.map((c: Campaign) => (
              <Card key={c.id} className="rounded-xl" onClick={() => setDetailsCampaign(c)}>
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-start justify-between">
                    <CampaignName name={c.name} date={c.created_at} />
                    <StatusBadge status={c.status} />
                  </div>

                  <div className="flex items-center justify-between rounded-lg bg-muted/40 px-3 py-2 text-sm">
                    <div className="flex items-center gap-1.5 text-foreground">
                      <Users className="h-3.5 w-3.5 text-muted-foreground" />
                      {(c.audience_size ?? 0).toLocaleString()} recipients
                    </div>
                    <span className="text-xs text-muted-foreground">{formatDate(c.scheduled_date)}</span>
                  </div>

                  <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => setSendConfirmCampaign(c)}
                      disabled={sending === c.id || c.status === "Envoyée" || c.status === "En cours"}
                      aria-label={`Send campaign ${c.name}`}
                    >
                      {sending === c.id ? (
                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="mr-1.5 h-3.5 w-3.5" />
                      )}
                      Send
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 text-destructive hover:text-destructive"
                      onClick={() => setDeleteCampaignId(c.id)}
                      aria-label={`Delete campaign ${c.name}`}
                    >
                      <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      )}

      {/* Create Campaign Dialog */}
      <Dialog open={createOpen} onOpenChange={(o) => (o ? openCreateDialog() : closeCreateDialog())}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[760px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Create Campaign</DialogTitle>
            <DialogDescription>
              Reach your customers with a targeted WhatsApp message.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <fieldset disabled={createMutation.isPending} className="space-y-6">
              {/* Campaign details */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Campaign Information</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="campaign_name">Campaign Name</Label>
                    <Input
                      id="campaign_name"
                      placeholder="e.g., Summer Sale 2025"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="audience">Audience</Label>
                    <Select value={audienceId} onValueChange={setAudienceId}>
                      <SelectTrigger id="audience">
                        <SelectValue placeholder="Choose target audience" />
                      </SelectTrigger>
                      <SelectContent>
                        {audiences.map((a: Audience) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} · {(a.size ?? 0).toLocaleString()} contacts
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {audiencesFailed && (
                      <p className="text-xs text-destructive">
                        Unable to load audiences. Please try again.
                      </p>
                    )}
                  </div>
                </div>

                {selectedAudience && (
                  <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3 text-sm">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Users className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{selectedAudience.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(selectedAudience.size ?? 0).toLocaleString()} contacts
                        {selectedAudience.criteria_summary
                          ? ` — ${selectedAudience.criteria_summary}`
                          : ""}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Message + preview */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Message</p>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Textarea
                      placeholder="Write your WhatsApp message..."
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      rows={7}
                      className="resize-none"
                      required
                    />
                    <p className="text-xs text-muted-foreground">{message.length} characters</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-xs font-medium text-muted-foreground">WhatsApp Preview</p>
                    <WhatsAppPreview message={message} />
                  </div>
                </div>
              </div>

              {/* Send options */}
              <div className="space-y-3">
                <p className="text-sm font-medium text-foreground">Send Options</p>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <button
                    type="button"
                    onClick={() => {
                      setSendMode("now");
                      setScheduledDate("");
                    }}
                    className={cn(
                      "flex-1 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                      sendMode === "now"
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    Send now
                  </button>
                  <button
                    type="button"
                    onClick={() => setSendMode("later")}
                    className={cn(
                      "flex-1 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors",
                      sendMode === "later"
                        ? "border-primary bg-primary/5 text-foreground"
                        : "border-border text-muted-foreground hover:bg-muted/40"
                    )}
                  >
                    Schedule for later
                  </button>
                </div>
                {sendMode === "later" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="scheduled_date">Date</Label>
                    <Input
                      id="scheduled_date"
                      type="date"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().split("T")[0]}
                    />
                  </div>
                )}
              </div>

              {/* Review */}
              {canSubmitCreate && (
                <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">Review</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Campaign</p>
                      <p className="font-medium text-foreground">{name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Audience</p>
                      <p className="font-medium text-foreground">
                        {selectedAudience?.name} ({(selectedAudience?.size ?? 0).toLocaleString()})
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Schedule</p>
                      <p className="font-medium text-foreground">
                        {sendMode === "now" ? "Today" : scheduledDate ? formatDate(scheduledDate) : "—"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </fieldset>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeCreateDialog}
                disabled={createMutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending || !canSubmitCreate}>
                {createMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Campaign...
                  </>
                ) : (
                  "Create"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Send Confirmation */}
      <AlertDialog open={!!sendConfirmCampaign} onOpenChange={(o) => !o && setSendConfirmCampaign(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send Campaign</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-left">
                <p>You are about to send this campaign to:</p>
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <p className="font-medium text-foreground">{sendConfirmCampaign?.audience_name}</p>
                  <p className="text-muted-foreground">
                    {(sendConfirmCampaign?.audience_size ?? 0).toLocaleString()} contacts
                  </p>
                </div>
                <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
                  <p className="text-xs font-medium text-muted-foreground">Message preview</p>
                  <p className="line-clamp-3 text-foreground">{sendConfirmCampaign?.message}</p>
                </div>
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  This action will send messages to the selected audience.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={!!sending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => sendConfirmCampaign && handleSendCampaign(sendConfirmCampaign.id)}
              disabled={!!sending}
            >
              {sending === sendConfirmCampaign?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteCampaignId} onOpenChange={(o) => !o && setDeleteCampaignId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Campaign</AlertDialogTitle>
            <AlertDialogDescription>
              {deletingCampaign ? `"${deletingCampaign.name}" will be permanently deleted. ` : ""}
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCampaignId && handleDeleteCampaign(deleteCampaignId)}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Send Result Dialog */}
      <Dialog open={!!sendResult} onOpenChange={(o) => !o && setSendResult(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {sendResult?.details.failed === 0 ? (
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
              ) : sendResult && sendResult.details.sent > 0 ? (
                <AlertCircle className="h-5 w-5 text-amber-600" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              {sendResult?.details.failed === 0
                ? "Campaign sent successfully"
                : sendResult && sendResult.details.sent > 0
                ? "Campaign partially sent"
                : "Campaign failed"}
            </DialogTitle>
          </DialogHeader>

          {sendResult && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <MiniStat label="Sent" value={sendResult.details.sent} />
                <MiniStat label="Failed" value={sendResult.details.failed} />
              </div>

              {sendResult.details.errors && sendResult.details.errors.length > 0 && (
                <div className="rounded-lg border border-border">
                  <button
                    type="button"
                    onClick={() => setShowErrorDetails((v) => !v)}
                    className="flex w-full items-center justify-between px-3 py-2 text-sm font-medium text-foreground"
                  >
                    Failed recipients ({sendResult.details.errors.length})
                    {showErrorDetails ? (
                      <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    )}
                  </button>
                  {showErrorDetails && (
                    <div className="max-h-48 space-y-1 overflow-y-auto border-t border-border px-3 py-2 text-xs">
                      {sendResult.details.errors.map((err, idx) => (
                        <div key={idx} className="text-destructive">
                          {err.name || err.phone}: {err.error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSendResult(null)} className="w-full">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Report Dialog */}
      <Dialog open={!!reportCampaign} onOpenChange={(o) => !o && setReportCampaign(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Campaign Performance
            </DialogTitle>
            {reportCampaign && <DialogDescription>{reportCampaign.name}</DialogDescription>}
          </DialogHeader>
          <PerformanceMetrics report={reportCampaign?.report} />
        </DialogContent>
      </Dialog>

      {/* Campaign Details Sheet */}
      <Sheet open={!!detailsCampaign} onOpenChange={(o) => !o && setDetailsCampaign(null)}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-lg">
          {detailsCampaign && (
            <>
              <SheetHeader>
                <SheetTitle>{detailsCampaign.name}</SheetTitle>
                <SheetDescription>Campaign overview and performance</SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Audience</span>
                    <span className="font-medium text-foreground">{detailsCampaign.audience_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Contacts</span>
                    <span className="font-medium text-foreground">
                      {(detailsCampaign.audience_size ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Created</span>
                    <span className="font-medium text-foreground">{formatDate(detailsCampaign.created_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Scheduled</span>
                    <span className="font-medium text-foreground">{formatDate(detailsCampaign.scheduled_date)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <StatusBadge status={detailsCampaign.status} />
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Message</p>
                  <WhatsAppPreview message={detailsCampaign.message} />
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Performance</p>
                  <PerformanceMetrics report={detailsCampaign.report} />
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/* ─── Presentational helper components ──────────────────────────────── */

const StatCard = ({
  label,
  value,
  icon: Icon,
  accent,
}: {
  label: string;
  value: number;
  icon: typeof MessageSquare;
  accent?: string;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3">
    <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted", accent)}>
      <Icon className="h-4 w-4" />
    </div>
    <div className="min-w-0">
      <p className="truncate text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold text-foreground">{value}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }: { status: CampaignStatus }) => {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG["En attente"];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium",
        config.className
      )}
    >
      <Icon className={cn("h-3 w-3", config.spin && "animate-spin")} aria-hidden="true" />
      {config.label}
    </span>
  );
};

const CampaignName = ({ name, date }: { name: string; date?: string }) => (
  <div className="flex items-center gap-3">
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-xs font-semibold text-primary">
      {name?.charAt(0)?.toUpperCase() || "?"}
    </div>
    <div className="min-w-0">
      <p className="truncate text-sm font-medium text-foreground">{name}</p>
      <p className="text-xs text-muted-foreground">{formatDate(date)}</p>
    </div>
  </div>
);

const WhatsAppPreview = ({ message }: { message: string }) => {
  const time = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="rounded-lg border border-border bg-[#e5ddd5] p-4 dark:bg-muted">
      <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-none bg-[#dcf8c6] px-3 py-2 shadow-sm dark:bg-emerald-500/20">
        <p className="whitespace-pre-wrap break-words text-sm text-neutral-900 dark:text-foreground">
          {message || "Your message will appear here as the customer will see it."}
        </p>
        <div className="mt-1 flex items-center justify-end gap-1 text-[10px] text-neutral-500 dark:text-muted-foreground">
          {time}
          <CheckCheck className="h-3 w-3 text-sky-500" />
        </div>
      </div>
    </div>
  );
};

const MiniStat = ({ label, value }: { label: string; value: number }) => (
  <div className="rounded-lg border border-border bg-muted/30 p-3 text-center">
    <p className="text-2xl font-semibold text-foreground">{value}</p>
    <p className="text-xs text-muted-foreground">{label}</p>
  </div>
);

const ProgressRow = ({ label, value }: { label: string; value: number }) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between text-xs">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}%</span>
    </div>
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  </div>
);

const PerformanceMetrics = ({ report }: { report?: CampaignReport }) => {
  const rates = ratesFor(report);
  if (!report) {
    return (
      <p className="py-6 text-center text-sm text-muted-foreground">
        No performance data available yet.
      </p>
    );
  }
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <MiniStat label="Sent" value={report.sent} />
        <MiniStat label="Delivered" value={report.delivered} />
        <MiniStat label="Failed" value={report.failed} />
        <MiniStat label="Read" value={report.read} />
      </div>
      {rates && (
        <div className="space-y-3">
          <ProgressRow label="Delivery rate" value={rates.delivery} />
          <ProgressRow label="Read rate" value={rates.read} />
          <ProgressRow label="Failure rate" value={rates.failure} />
        </div>
      )}
    </div>
  );
};

const SkeletonTable = () => (
  <div>
    <div className="border-b border-border px-4 py-3">
      <div className="grid grid-cols-7 gap-4">
        {["Campaign", "Audience", "Recipients", "Schedule", "Status", "Performance", "Actions"].map((h) => (
          <Skeleton key={h} className="h-3 w-16" />
        ))}
      </div>
    </div>
    <div className="divide-y divide-border">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="grid grid-cols-7 items-center gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-24" />
          </div>
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="ml-auto h-8 w-8 rounded-md" />
        </div>
      ))}
    </div>
  </div>
);

const SkeletonMobile = () => (
  <>
    {Array.from({ length: 3 }, (_, i) => (
      <div key={i} className="space-y-3 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-4 w-28" />
          </div>
          <Skeleton className="h-5 w-16 rounded-full" />
        </div>
        <Skeleton className="h-9 w-full rounded-lg" />
        <div className="flex gap-2">
          <Skeleton className="h-8 flex-1 rounded-md" />
          <Skeleton className="h-8 flex-1 rounded-md" />
        </div>
      </div>
    ))}
  </>
);

const EmptyState = ({
  hasCampaigns,
  hasActiveFilters,
  onCreate,
  onClearFilters,
}: {
  hasCampaigns: boolean;
  hasActiveFilters: boolean;
  onCreate: () => void;
  onClearFilters: () => void;
}) => {
  const filtered = hasCampaigns && hasActiveFilters;
  return (
    <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <MessageSquare className="h-5 w-5 text-muted-foreground" />
      </div>
      <div className="space-y-1">
        <p className="font-medium text-foreground">
          {filtered ? "No campaigns match your filters" : "No campaigns yet"}
        </p>
        <p className="max-w-sm text-sm text-muted-foreground">
          {filtered
            ? "Try adjusting or clearing your filters to see more results."
            : "Create your first campaign to start reaching your customers."}
        </p>
      </div>
      {filtered ? (
        <Button variant="outline" size="sm" onClick={onClearFilters}>
          <X className="mr-1.5 h-4 w-4" />
          Clear filters
        </Button>
      ) : (
        <Button size="sm" onClick={onCreate}>
          <Plus className="mr-1.5 h-4 w-4" />
          Create Campaign
        </Button>
      )}
    </div>
  );
};