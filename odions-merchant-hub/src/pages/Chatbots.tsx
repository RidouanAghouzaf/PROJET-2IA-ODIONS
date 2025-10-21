import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Globe, Facebook, MessageCircle, Play, Edit, Trash2, Bot } from "lucide-react";

const API_URL = "http://localhost:5000/api/chatbots";
const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJUZXN0VXNlciIsImlhdCI6MTc2MDg5MTM1MCwiZXhwIjoxNzYwODk0OTUwfQ.lQb2-EB-HIcp3A7BmWmvXcdvzmtSfoxkm30lEqtJVuY";

const Chatbots: React.FC = () => {
  // ======================= STATES =======================
  const [botName, setBotName] = useState("");
  const [welcomeMessage, setWelcomeMessage] = useState("");
  const [scenarios, setScenarios] = useState([{ question: "", answer: "" }]);
  const [channels, setChannels] = useState({ whatsapp: false, website: false, facebook: false });
  const [isActive, setIsActive] = useState(true);
  const [testMessage, setTestMessage] = useState("");
  const [testResponse, setTestResponse] = useState("");
  const [interactions, setInteractions] = useState<
    { id: number; user: string; message: string; response: string }[]
  >([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [chatbots, setChatbots] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedChatbotId, setSelectedChatbotId] = useState<number | null>(null);

  // ======================= LOAD CHATBOTS =======================
  const loadChatbots = async () => {
    try {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      const data = await res.json();
      setChatbots(data.chatbots || []);
      if (data.chatbots?.length > 0 && selectedChatbotId === null) {
        setSelectedChatbotId(data.chatbots[0].id);
      }
    } catch (error) {
      console.error("Erreur chargement chatbots:", error);
    }
  };

  // ======================= LOAD SESSIONS FOR SELECTED CHATBOT =======================
  useEffect(() => {
    if (!selectedChatbotId) {
      setSessions([]);
      setActiveSessionId(null);
      return;
    }

    fetch(`${API_URL}/${selectedChatbotId}/sessions`, {
      headers: { Authorization: `Bearer ${TOKEN}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setSessions(data.sessions || []);
        setActiveSessionId(data.sessions?.[0]?.id || null);
        setInteractions([]); // Reset interactions when chatbot/session changes
      })
      .catch((err) => console.error("Erreur chargement sessions:", err));
  }, [selectedChatbotId]);

  // ======================= SCENARIOS =======================
  const handleScenarioChange = (index: number, field: string, value: string) => {
    const newScenarios = [...scenarios];
    newScenarios[index] = { ...newScenarios[index], [field]: value };
    setScenarios(newScenarios);
  };
  const addScenario = () => setScenarios([...scenarios, { question: "", answer: "" }]);

  // ======================= CREATE OR UPDATE CHATBOT =======================
  const handleSaveChatbot = async () => {
    if (!botName.trim()) {
      alert("Veuillez saisir un nom pour le chatbot !");
      return;
    }

    const chatbotData = {
      bot_name: botName,
      welcome_message: welcomeMessage,
      scenarios,
      channels,
      is_active: isActive,
    };

    try {
      const url = editingId ? `${API_URL}/${editingId}` : API_URL;
      const method = editingId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify(chatbotData),
      });

      const data = await res.json();
      if (res.ok) {
        alert(editingId ? "Chatbot mis à jour !" : "Chatbot créé !");
        await loadChatbots();
        resetForm();
      } else {
        alert("Erreur: " + data.message);
      }
    } catch (error) {
      console.error("❌ Erreur création/màj chatbot:", error);
    }
  };

  // ======================= DELETE CHATBOT =======================
  const handleDeleteChatbot = async (id: number) => {
    if (!confirm("Voulez-vous vraiment supprimer ce chatbot ?")) return;
    try {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      if (res.ok) {
        setChatbots(chatbots.filter((b) => b.id !== id));
        alert("Chatbot supprimé !");
        if (selectedChatbotId === id) {
          setSelectedChatbotId(null);
          setSessions([]);
          setActiveSessionId(null);
        }
      } else {
        alert("Erreur suppression !");
      }
    } catch (error) {
      console.error("Erreur suppression:", error);
    }
  };

  // ======================= EDIT CHATBOT =======================
  const handleEditChatbot = (bot: any) => {
    setBotName(bot.bot_name);
    setWelcomeMessage(bot.welcome_message);
    setScenarios(bot.scenarios || [{ question: "", answer: "" }]);
    setChannels(bot.channels || { whatsapp: false, website: false, facebook: false });
    setIsActive(bot.is_active);
    setEditingId(bot.id);
    setSelectedChatbotId(bot.id);
  };

  // ======================= RESET FORM =======================
  const resetForm = () => {
    setBotName("");
    setWelcomeMessage("");
    setScenarios([{ question: "", answer: "" }]);
    setChannels({ whatsapp: false, website: false, facebook: false });
    setIsActive(true);
    setEditingId(null);
  };

  const handleSaveSession = async () => {
    if (!selectedChatbotId) {
      alert("Veuillez sélectionner un chatbot avant de créer une session !");
      return;
    }
  
    const url = `${API_URL}/${selectedChatbotId}/sessions`;
    console.log("📤 Creating session with URL:", url);
  
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify({}), // Supabase doesn't need anything in body
      });
  
      const data = await res.json();
      console.log("✅ Session creation response:", data);
  
      if (res.ok) {
        setSessions([data.session, ...sessions]);
        setActiveSessionId(data.session.id);
        setInteractions([]);
        alert("Session créée !");
      } else {
        alert("Erreur création session: " + (data.error?.message || "Erreur inconnue"));
      }
    } catch (error) {
      console.error("❌ Erreur lors de la création de session:", error);
      alert("Erreur réseau ou serveur !");
    }
  };
  

  // ======================= TEST BOT =======================
  const handleTestBot = async () => {
    if (!selectedChatbotId || !activeSessionId) {
      alert("Aucune session active ou chatbot sélectionné !");
      return;
    }
  
    const url = `${API_URL}/${selectedChatbotId}/sessions/${activeSessionId}/messages`;
    console.log("🧪 Sending test message to:", url);
  
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`
        },
        body: JSON.stringify({ message: testMessage, role: "user" })
      });
  
      const data = await res.json();
      console.log("🤖 Bot reply:", data);
  
      const matchedScenario = scenarios.find((s) => s.question === testMessage);
      const simulatedResponse = matchedScenario ? matchedScenario.answer : "Réponse automatique";
  
      setTestResponse(simulatedResponse);
      setInteractions([
        ...interactions,
        { id: interactions.length + 1, user: "Test", message: testMessage, response: simulatedResponse }
      ]);
      setTestMessage("");
    } catch (error) {
      console.error("❌ Erreur en testant le bot:", error);
      alert("Erreur réseau ou serveur !");
    }
  };
  

  // ======================= RENDER =======================
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Bot className="w-6 h-6 text-primary" /> Gestion des Chatbots
      </h1>

      <Tabs defaultValue="config" className="space-y-6">
        <TabsList>
          <TabsTrigger value="config">Configurer</TabsTrigger>
          <TabsTrigger value="channels">Canaux</TabsTrigger>
          <TabsTrigger value="test">Tester</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
          <TabsTrigger value="list">Liste</TabsTrigger>
        </TabsList>

        {/* ===== CONFIGURATION ===== */}
        <TabsContent value="config">
          <Card className="p-4 shadow-md">
            <CardContent className="space-y-4">
              <Input placeholder="Nom du chatbot" value={botName} onChange={(e) => setBotName(e.target.value)} />
              <Textarea
                placeholder="Message de bienvenue"
                value={welcomeMessage}
                onChange={(e) => setWelcomeMessage(e.target.value)}
              />

              <div className="space-y-3">
                <h3 className="font-medium">Scénarios de conversation</h3>
                {scenarios.map((s, idx) => (
                  <div key={idx} className="flex gap-2">
                    <Input
                      placeholder="Question"
                      value={s.question}
                      onChange={(e) => handleScenarioChange(idx, "question", e.target.value)}
                    />
                    <Input
                      placeholder="Réponse"
                      value={s.answer}
                      onChange={(e) => handleScenarioChange(idx, "answer", e.target.value)}
                    />
                  </div>
                ))}
                <Button variant="outline" onClick={addScenario}>
                  ➕ Ajouter un scénario
                </Button>
              </div>

              <div className="flex items-center gap-2 mt-4">
                <Switch checked={isActive} onCheckedChange={setIsActive} />
                <span className="text-sm">{isActive ? "Bot Actif" : "Bot Inactif"}</span>
              </div>

              <Button className="w-full mt-4" onClick={handleSaveChatbot}>
                {editingId ? "💾 Mettre à jour le Chatbot" : "➕ Créer le Chatbot"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== CANAUX ===== */}
        <TabsContent value="channels">
          <Card className="p-4 shadow-md">
            <CardContent className="space-y-4">
              <label className="flex items-center gap-2">
                <Switch checked={channels.whatsapp} onCheckedChange={(v) => setChannels({ ...channels, whatsapp: v })} />
                <MessageCircle className="h-4 w-4" /> WhatsApp
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={channels.website} onCheckedChange={(v) => setChannels({ ...channels, website: v })} />
                <Globe className="h-4 w-4" /> Site Web
              </label>
              <label className="flex items-center gap-2">
                <Switch checked={channels.facebook} onCheckedChange={(v) => setChannels({ ...channels, facebook: v })} />
                <Facebook className="h-4 w-4" /> Facebook Messenger
              </label>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== TEST ===== */}
        <TabsContent value="test">
          <Card className="p-4 shadow-md">
            <CardContent className="space-y-4">
              {!selectedChatbotId ? (
                <p className="text-red-600">Veuillez sélectionner un chatbot dans l'onglet Liste.</p>
              ) : !activeSessionId ? (
                <p className="text-red-600">Veuillez créer ou sélectionner une session dans l'historique.</p>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tapez un message..."
                      value={testMessage}
                      onChange={(e) => setTestMessage(e.target.value)}
                    />
                    <Button variant="outline" onClick={handleTestBot}>
                      <Play className="h-4 w-4" /> Tester
                    </Button>
                  </div>
                  {testResponse && <p className="text-sm text-muted-foreground mt-2">🤖 {testResponse}</p>}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== HISTORIQUE ===== */}
        <TabsContent value="history">
          <Card className="p-4 shadow-md">
            <CardContent>
              <h3 className="mb-2 font-semibold">Sessions pour le chatbot sélectionné</h3>
              {!selectedChatbotId ? (
                <p>Veuillez sélectionner un chatbot dans l'onglet Liste.</p>
              ) : sessions.length === 0 ? (
                <p>Aucune session trouvée.</p>
              ) : (
                <ul className="space-y-2 max-h-48 overflow-y-auto">
                  {sessions.map((session) => (
                    <li
                      key={session.id}
                      className={`p-2 rounded cursor-pointer ${
                        activeSessionId === session.id ? "bg-blue-400 text-white" : "hover:bg-gray-200"
                      }`}
                      onClick={() => {
                        setActiveSessionId(session.id);
                        setInteractions([]); // Clear chat interactions when switching session
                      }}
                    >
                      Session #{session.id} — Créée le {new Date(session.created_at).toLocaleString()}
                    </li>
                  ))}
                </ul>
              )}
              <Button onClick={handleSaveSession} className="mt-4 w-full">
                + Créer une nouvelle session
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ===== LISTE ===== */}
        <TabsContent value="list">
          <Card className="p-4 shadow-md">
            <CardContent className="space-y-4 max-h-[400px] overflow-y-auto">
              {chatbots.length === 0 ? (
                <p>Aucun chatbot trouvé.</p>
              ) : (
                chatbots.map((bot) => (
                  <div
                    key={bot.id}
                    className={`flex justify-between items-center border p-3 rounded-lg hover:bg-gray-50 transition cursor-pointer
                      ${selectedChatbotId === bot.id ? "bg-blue-100" : ""}
                    `}
                    onClick={() => setSelectedChatbotId(bot.id)}
                  >
                    <div className="flex flex-col">
                      <p className="font-semibold">{bot.bot_name}</p>
                      <p className="text-sm text-muted-foreground">ID: {bot.id}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditChatbot(bot);
                        }}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteChatbot(bot.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Chatbots;
