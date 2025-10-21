import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableHeader, TableBody, TableRow, TableCell, TableHead } from "@/components/ui/table";
import { PlusCircle, Send, Trash2, BarChart } from "lucide-react";

// Interfaces
interface Audience {
  id: number;
  name: string;
}

interface Campaign {
  id: number;
  name: string;
  audience: string;
  message: string;
  status: "En attente" | "Envoyée" | "Échouée";
  scheduledDate: string;
  report?: CampaignReport;
}

interface CampaignReport {
  sent: number;
  delivered: number;
  failed: number;
  read: number;
}

export default function WhatsappCampaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [audiences, setAudiences] = useState<Audience[]>([]);
  const [name, setName] = useState("");
  const [audience, setAudience] = useState("");
  const [message, setMessage] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [selectedReport, setSelectedReport] = useState<CampaignReport | null>(null);

  useEffect(() => {
    // 🔗 API call simulée – à remplacer par ton backend
    setAudiences([
      { id: 1, name: "Clients Premium" },
      { id: 2, name: "Clients Fidèles" },
      { id: 3, name: "Commandes refusées" },
    ]);
    setCampaigns([
      {
        id: 1,
        name: "Promo Nouvel An",
        audience: "Clients Premium",
        message: "Bonne année ! Profitez de -20% sur tout le site 🎉",
        status: "Envoyée",
        scheduledDate: "2025-01-01",
        report: { sent: 100, delivered: 90, failed: 10, read: 70 },
      },
    ]);
  }, []);

  // Créer une nouvelle campagne
  const handleCreateCampaign = () => {
    if (!name || !audience || !message) {
      alert("Veuillez remplir tous les champs !");
      return;
    }
    const newCampaign: Campaign = {
      id: campaigns.length + 1,
      name,
      audience,
      message,
      status: "En attente",
      scheduledDate,
    };
    setCampaigns([...campaigns, newCampaign]);
    setName("");
    setAudience("");
    setMessage("");
    setScheduledDate("");
  };

  // Envoyer une campagne (mock)
  const handleSendCampaign = (id: number) => {
    setCampaigns(
      campaigns.map((c) =>
        c.id === id
          ? {
              ...c,
              status: Math.random() > 0.2 ? "Envoyée" : "Échouée", // 80% réussite, 20% échec
              report: {
                sent: 100,
                delivered: Math.floor(Math.random() * 100),
                failed: Math.floor(Math.random() * 20),
                read: Math.floor(Math.random() * 90),
              },
            }
          : c
      )
    );
  };

  // Supprimer une campagne
  const handleDeleteCampaign = (id: number) => {
    setCampaigns(campaigns.filter((c) => c.id !== id));
  };

  // Voir rapport
  const handleViewReport = (report: CampaignReport | undefined) => {
    if (report) {
      setSelectedReport(report);
    } else {
      alert("Aucun rapport disponible pour cette campagne.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Formulaire de création */}
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Créer une Campagne WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Nom de la campagne" value={name} onChange={(e) => setName(e.target.value)} />
          <Select value={audience} onValueChange={setAudience}>
            <SelectTrigger>
              <SelectValue placeholder="Sélectionner une audience" />
            </SelectTrigger>
            <SelectContent>
              {audiences.map((a) => (
                <SelectItem key={a.id} value={a.name}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea placeholder="Message à envoyer" value={message} onChange={(e) => setMessage(e.target.value)} />
          <Input type="date" value={scheduledDate} onChange={(e) => setScheduledDate(e.target.value)} />
          <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleCreateCampaign}>
            <PlusCircle className="h-4 w-4 mr-2" />
            Créer Campagne
          </Button>
        </CardContent>
      </Card>

      {/* Liste des campagnes */}
      <Card>
        <CardHeader>
          <CardTitle>Campagnes Existantes</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Audience</TableHead>
                <TableHead>Message</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id}>
                  <TableCell>{c.name}</TableCell>
                  <TableCell>{c.audience}</TableCell>
                  <TableCell>{c.message}</TableCell>
                  <TableCell>{c.scheduledDate}</TableCell>
                  <TableCell
                    className={
                      c.status === "Envoyée"
                        ? "text-green-600 font-semibold"
                        : c.status === "Échouée"
                        ? "text-red-600 font-semibold"
                        : "text-yellow-600 font-semibold"
                    }
                  >
                    {c.status}
                  </TableCell>
                  <TableCell className="space-x-2">
                    <Button size="sm" variant="outline" onClick={() => handleSendCampaign(c.id)}>
                      <Send className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => handleViewReport(c.report)}>
                      <BarChart className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDeleteCampaign(c.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Rapport */}
      {selectedReport && (
        <Card className="shadow-md">
          <CardHeader>
            <CardTitle>Rapport de Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="list-disc pl-6">
              <li>📤 Envoyés : {selectedReport.sent}</li>
              <li>✅ Livrés : {selectedReport.delivered}</li>
              <li>❌ Échecs : {selectedReport.failed}</li>
              <li>👀 Lus : {selectedReport.read}</li>
            </ul>
            <Button className="mt-4" onClick={() => setSelectedReport(null)}>
              Fermer
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
