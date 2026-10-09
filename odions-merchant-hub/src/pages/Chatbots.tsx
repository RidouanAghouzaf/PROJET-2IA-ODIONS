"use client";

import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // ✅ Fixed import
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Edit3, Send, Play } from "lucide-react";
import axios from "axios";

// ====================== WhatsApp Function ======================
const handleSendWhatsApp = (message: string, userPhone: string) => {
  const encodedMessage = encodeURIComponent(message);
  const phone = userPhone.replace(/\D/g, "");
  const url = `https://wa.me/${phone}?text=${encodedMessage}`;
  window.open(url, "_blank");
  toast.success("WhatsApp ouvert ✅");
};

// ====================== ScenarioList ======================
function ScenarioList({ scenarios, setScenarios }: any) {
  const handleChange = (index: number, field: string, value: string) => {
    const newScenarios = [...scenarios];
    (newScenarios[index] as any)[field] = value;
    setScenarios(newScenarios);
  };

  const addScenario = () => setScenarios([...scenarios, { question: "", answer: "" }]);
  const removeScenario = (index: number) =>
    setScenarios(scenarios.filter((_, i) => i !== index));

  return (
    <div>
      <h3 className="font-semibold mb-2">Scénarios</h3>
      {scenarios.map((s: any, i: number) => (
        <div key={i} className="flex items-center gap-2 mb-2">
          <Input
            placeholder="Question"
            value={s.question}
            onChange={(e) => handleChange(i, "question", e.target.value)}
          />
          <Input
            placeholder="Réponse"
            value={s.answer}
            onChange={(e) => handleChange(i, "answer", e.target.value)}
          />
          <Button variant="destructive" size="icon" onClick={() => removeScenario(i)}>
            <Trash2 size={16} />
          </Button>
        </div>
      ))}
      <Button onClick={addScenario}>
        <Plus className="mr-2 h-4 w-4" /> Ajouter un scénario
      </Button>
    </div>
  );
}

// ====================== ChatbotForm ======================
function ChatbotForm({ bot, onSave }: any) {
  const [botName, setBotName] = useState(bot?.bot_name || "");
  const [welcomeMessage, setWelcomeMessage] = useState(bot?.welcome_message || "");
  const [scenarios, setScenarios] = useState(bot?.scenarios || [{ question: "", answer: "" }]);
  const [channels, setChannels] = useState(bot?.channels || { whatsapp: false, website: false, facebook: false });
  const [isActive, setIsActive] = useState(bot?.is_active ?? true);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!botName) return toast.error("Le nom du chatbot est requis");
    setLoading(true);

    const data = { bot_name: botName, welcome_message: welcomeMessage, channels, is_active: isActive, scenarios, user_id: 1 };
    await onSave(data);
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{bot ? "Modifier le Chatbot" : "Créer un nouveau Chatbot"}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Nom du chatbot" value={botName} onChange={(e) => setBotName(e.target.value)} />
        <Textarea placeholder="Message de bienvenue" value={welcomeMessage} onChange={(e) => setWelcomeMessage(e.target.value)} />

        {/* Channels */}
        <div className="space-y-2 mt-2">
          <h3 className="font-semibold">Canaux</h3>
          <div className="flex gap-4">
            {["whatsapp", "facebook", "website"].map((ch: string) => (
              <label key={ch} className="flex items-center gap-2">
                <Switch
                  checked={channels[ch as keyof typeof channels]}
                  onCheckedChange={(v) => setChannels({ ...channels, [ch]: v })}
                />
                {ch.charAt(0).toUpperCase() + ch.slice(1)}
              </label>
            ))}
          </div>
        </div>

        {/* Active */}
        <div className="flex items-center gap-4 mt-2">
          <label>Activer le chatbot :</label>
          <Switch checked={isActive} onCheckedChange={setIsActive} />
        </div>

        {/* Scenarios */}
        <ScenarioList scenarios={scenarios} setScenarios={setScenarios} />

        <Button onClick={handleSave} disabled={loading}>
          {loading ? <Loader2 className="animate-spin" /> : "Enregistrer"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ====================== ChatbotCard ======================
function ChatbotCard({ bot, onEdit, onDelete, onTest }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{bot.bot_name}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p>{bot.welcome_message}</p>
        <div className="flex gap-2">
          <Button onClick={() => onEdit(bot)}>
            <Edit3 size={16} className="mr-2" /> Modifier
          </Button>
          <Button variant="outline" onClick={() => onTest(bot.id)}>
            <Play size={16} className="mr-2" /> Tester
          </Button>
          <Button variant="destructive" onClick={() => onDelete(bot.id)}>
            <Trash2 size={16} />
          </Button>
        </div>

        {/* Channels Display */}
        <div className="mt-2 flex gap-2 text-sm">
          {bot.channels?.whatsapp && <span className="bg-green-100 px-2 rounded">WhatsApp</span>}
          {bot.channels?.facebook && <span className="bg-blue-100 px-2 rounded">Facebook</span>}
          {bot.channels?.website && <span className="bg-gray-100 px-2 rounded">Web</span>}
        </div>

        {/* WhatsApp Button */}
        {bot.channels?.whatsapp && (
          <Button
            variant="outline"
            onClick={() => handleSendWhatsApp(bot.welcome_message, "+212624093004")}
          >
            <Send className="mr-2 h-4 w-4" /> Envoyer WhatsApp
          </Button>
        )}

        <div className="mt-1 text-sm">{bot.is_active ? "Actif ✅" : "Inactif ❌"}</div>
      </CardContent>
    </Card>
  );
}

// ====================== MAIN COMPONENT ======================
export default function Chatbots() {
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [editingBot, setEditingBot] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState("list");
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [testMessage, setTestMessage] = useState("");
  const [interactions, setInteractions] = useState<any[]>([]);
  const topRef = useRef<HTMLDivElement | null>(null);

  const API_URL = "http://localhost:3000/api/chatbots";

  useEffect(() => {
    fetchChatbots();
  }, []);

  const fetchChatbots = async () => {
    try {
      const res = await axios.get(API_URL);
      setChatbots(res.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleSave = async (data: any) => {
    try {
      if (editingBot) {
        await axios.put(`${API_URL}/${editingBot.id}`, data);
        toast.success("Chatbot mis à jour !");
      } else {
        await axios.post(API_URL, data);
        toast.success("Chatbot créé !");
      }
      setEditingBot(null);
      setActiveTab("list");
      fetchChatbots();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de l’enregistrement");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce chatbot ?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`);
      toast.success("Chatbot supprimé");
      fetchChatbots();
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleEdit = (bot: any) => {
    setEditingBot(bot);
    setActiveTab("config");
    setTimeout(() => topRef.current?.scrollIntoView({ behavior: "smooth" }), 200);
  };

  const handleStartTest = async (botId: number) => {
    try {
      const res = await axios.post(`${API_URL}/${botId}/sessions`);
      const sessionId = res.data.session.id;
      setActiveSessionId(sessionId);
      setInteractions([]);
      setActiveTab("test");
      toast.success("Session de test créée !");
    } catch (error) {
      console.error(error);
      toast.error("Impossible de créer la session de test");
    }
  };

  const handleTestBot = async () => {
    if (!activeSessionId || !testMessage.trim()) return toast.error("Message requis !");
    try {
      const res = await axios.post(`${API_URL}/sessions/${activeSessionId}/messages`, { message: testMessage, role: "user" });
      setInteractions((prev) => [...prev, { user: "Vous", message: testMessage, response: res.data.botReply || "Pas de réponse." }]);
      setTestMessage("");
    } catch (error) {
      console.error(error);
      toast.error("Erreur lors du test");
    }
  };

  return (
    <div ref={topRef} className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">🤖 Gestion des Chatbots</h1>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="list">Liste</TabsTrigger>
          <TabsTrigger value="config">Configurer</TabsTrigger>
          <TabsTrigger value="test">Tester</TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <ChatbotForm bot={editingBot} onSave={handleSave} />
        </TabsContent>

        <TabsContent value="list">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {chatbots.map((bot) => (
              <ChatbotCard key={bot.id} bot={bot} onEdit={handleEdit} onDelete={handleDelete} onTest={handleStartTest} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="test">
          <Card>
            <CardHeader>
              <CardTitle>🧪 Tester le Chatbot</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input placeholder="Entrez un message..." value={testMessage} onChange={(e) => setTestMessage(e.target.value)} />
              <Button onClick={handleTestBot}><Send className="mr-2 h-4 w-4" /> Envoyer</Button>
              <div className="mt-4 border rounded-md p-4 bg-gray-50 max-h-80 overflow-auto">
                {interactions.length === 0 ? <p>Aucune interaction pour le moment.</p> :
                  interactions.map((i, idx) => (
                    <div key={idx} className="mb-3">
                      <p className="font-semibold text-blue-600">{i.user}: {i.message}</p>
                      <p className="text-gray-700 ml-4">🤖 {i.response}</p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
