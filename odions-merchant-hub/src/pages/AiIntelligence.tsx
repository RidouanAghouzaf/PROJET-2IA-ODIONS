import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { BarChart3, Brain, Smile, DollarSign, AlertCircle, Gift } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { ReferenceLine } from "recharts";
import { Loader2 } from "lucide-react";

const API_URL = "http://127.0.0.1:8000"; // your FastAPI backend
const COLORS = ["#4ade80", "#60a5fa", "#fbbf24"];

export default function AiIntelligence() {
  const [activeTab, setActiveTab] = useState("segmentation");
  const [loading, setLoading] = useState(false);

  const [segmentationData, setSegmentationData] = useState<any>(null);
  const [predictionData, setPredictionData] = useState<any>(null);
  const [sentimentData, setSentimentData] = useState<any>(null);
  const [sentimentTrend, setSentimentTrend] = useState<any>([]);
  const [clvData, setClvData] = useState<any>(null);
  const [churnData, setChurnData] = useState<any>(null);
  const [recommendationData, setRecommendationData] = useState<any>(null);
  const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");
const [clientType, setClientType] = useState("all");
const [minSpent, setMinSpent] = useState("");
const [minOrders, setMinOrders] = useState("");


  // ----------------- Regenerate CSV Data -----------------
  const regenerateData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/regenerate-data`, { method: "POST" });
      const data = await res.json();

      // Refresh all tabs
      await fetchSegmentation();
      await fetchPrediction();
      await fetchSentiment();
      await fetchCLV();
      await fetchChurn();
      await fetchRecommendations();

      alert(data.message);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la régénération des données");
    }
    setLoading(false);
  };

  // ----------------- Segmentation -----------------
  const fetchSegmentation = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/segmentation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tenant_id: 1,
          n_clusters: 3,
          filters: {
            date_from: dateFrom || null,
            date_to: dateTo || null,
            client_type: clientType !== "all" ? clientType : null,
            min_spent: minSpent ? parseFloat(minSpent) : null,
            min_orders: minOrders ? parseInt(minOrders) : null,
          },
        }),
      });
      const data = await res.json();
      setSegmentationData(data);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la segmentation");
    }
    setLoading(false);
  };
  

  // ----------------- Prediction -----------------
  const fetchPrediction = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/prediction`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: 1 }),
      });
      const data = await res.json();
      setPredictionData(data.predictions);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la prédiction");
    }
    setLoading(false);
  };

  // ----------------- Sentiment -----------------
  const fetchSentiment = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/sentiment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: 1 }),
      });
      const data = await res.json();
      setSentimentData(data.sentiments);

      // Trend for chart
      const trendMap: any = {};
      data.sentiments.forEach((s: any) => {
        const date = new Date().toISOString().split("T")[0]; // you can replace with real timestamp
        if (!trendMap[date]) trendMap[date] = { date, positive: 0, negative: 0 };
        trendMap[date].positive += s.score.pos;
        trendMap[date].negative += s.score.neg;
      });
      setSentimentTrend(Object.values(trendMap));
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'analyse des sentiments");
    }
    setLoading(false);
  };

  // ----------------- CLV -----------------
  const fetchCLV = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/clv`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: 1 }),
      });
      const data = await res.json();
      setClvData(data.clv);
    } catch (err) {
      console.error(err);
      alert("Erreur lors du calcul du CLV");
    }
    setLoading(false);
  };

  // ----------------- Churn -----------------
  const fetchChurn = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/churn`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: 1 }),
      });
      const data = await res.json();
      setChurnData(data.risks);
    } catch (err) {
      console.error(err);
      alert("Erreur lors de l'analyse du churn");
    }
    setLoading(false);
  };

  // ----------------- Recommendations -----------------
  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/ai/recommendations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenant_id: 1 }),
      });
      const data = await res.json();
      setRecommendationData(data.recommendations);
    } catch (err) {
      console.error(err);
      alert("Erreur lors des recommandations");
    }
    setLoading(false);
  };

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center gap-3">
        <Brain className="w-8 h-8 text-blue-600" />
        <h1 className="text-3xl font-bold">Gestion de l’Intelligence Artificielle</h1>
      </div>

      <Button className="mb-4" onClick={regenerateData} disabled={loading}>
        {loading ? "Chargement..." : "Regénérer les Données"}
      </Button>

      <p className="text-gray-600 max-w-3xl">
        Cette section exploite l’IA pour aider les e-commerçants à mieux comprendre leurs clients : segmentation, prédiction, sentiment, CLV, churn et recommandations produits.
      </p>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-6 w-full">
          <TabsTrigger value="segmentation">Segmentation</TabsTrigger>
          <TabsTrigger value="prediction">Prédiction</TabsTrigger>
          <TabsTrigger value="sentiment">Sentiment</TabsTrigger>
          <TabsTrigger value="clv">CLV</TabsTrigger>
          <TabsTrigger value="churn">Churn</TabsTrigger>
          
          
          <TabsTrigger value="recommendations">Recommandations</TabsTrigger>
        
        </TabsList>

       {/* SEGMENTATION */}
       <TabsContent value="segmentation">
  <Card>
    <CardContent className="p-6 space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="text-blue-500" />
        <h2 className="text-xl font-semibold">Segmentation Avancée des Clients</h2>
      </div>

      <p className="text-gray-600 text-sm">
        Cette analyse divise les clients en groupes selon leurs comportements d’achat, fréquence, et valeur.
      </p>

      {/* 🔍 Advanced Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm text-gray-600">Date début</label>
          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Date fin</label>
          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Type de client</label>
          <select
            value={clientType}
            onChange={(e) => setClientType(e.target.value)}
            className="w-full border rounded px-2 py-1"
          >
            <option value="all">Tous</option>
            <option value="vip">VIP</option>
            <option value="frequent">Fréquent</option>
            <option value="new">Nouveau</option>
          </select>
        </div>
        <div>
          <label className="text-sm text-gray-600">Dépense min. (DH)</label>
          <input
            type="number"
            value={minSpent}
            onChange={(e) => setMinSpent(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
        <div>
          <label className="text-sm text-gray-600">Commandes min.</label>
          <input
            type="number"
            value={minOrders}
            onChange={(e) => setMinOrders(e.target.value)}
            className="w-full border rounded px-2 py-1"
          />
        </div>
      </div>

      <Button onClick={fetchSegmentation} disabled={loading}>
        {loading ? "Analyse en cours..." : "Lancer la Segmentation"}
      </Button>

      {/* ✅ Rest of your existing code stays unchanged below */}
      {segmentationData && (
        <>
          {/* SUMMARY STATS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <div className="p-4 rounded-xl bg-gradient-to-r from-blue-100 to-blue-50 shadow">
              <h4 className="text-blue-700 font-semibold">Total Segments</h4>
              <p className="text-2xl font-bold text-blue-600">
                {Object.keys(segmentationData.segments).length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-green-100 to-green-50 shadow">
              <h4 className="text-green-700 font-semibold">Clients Analysés</h4>
              <p className="text-2xl font-bold text-green-600">
                {Object.values(segmentationData.segments).flat().length}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-gradient-to-r from-yellow-100 to-yellow-50 shadow">
              <h4 className="text-yellow-700 font-semibold">Insights Générés</h4>
              <p className="text-2xl font-bold text-yellow-600">
                {segmentationData.insights?.length || 0}
              </p>
            </div>
          </div>

          {/* PIE CHART */}
          <div className="mt-8">
            <h3 className="font-semibold text-gray-700 mb-3">
              Répartition des Clients par Segment
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(segmentationData.segments).map(([segment, clients]) => ({
                    name: segment,
                    value: clients.length,
                  }))}
                  dataKey="value"
                  nameKey="name"
                  outerRadius={100}
                  label
                >
                  {Object.entries(segmentationData.segments).map((_, index) => (
                    <Cell key={index} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* BAR CHART */}
          <div className="mt-10">
            <h3 className="font-semibold text-gray-700 mb-3">
              Valeur Moyenne par Segment (DH)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={Object.entries(segmentationData.segments).map(([segment, clients]) => ({
                  segment,
                  avg_spent:
                    clients.reduce((sum: number, c: any) => sum + (c.spent || 0), 0) / clients.length,
                }))}
              >
                <XAxis dataKey="segment" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="avg_spent" fill="#60a5fa" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* INSIGHTS */}
          {segmentationData.insights && (
            <div className="mt-10 space-y-6">
              <h3 className="text-lg font-semibold text-gray-700">
                🧠 Insights et Actions Recommandées
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {segmentationData.insights.map((insight: any, idx: number) => (
                  <div
                    key={idx}
                    className="border rounded-2xl p-5 bg-white shadow hover:shadow-lg transition"
                  >
                    <h4 className="font-semibold text-blue-600 mb-2">
                      {insight.cluster}
                    </h4>
                    <p className="text-sm text-gray-700">{insight.description}</p>
                    <ul className="list-disc pl-5 text-sm text-gray-600 mt-3 space-y-1">
                      {insight.actions.map((action: string, i: number) => (
                        <li key={i}>{action}</li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </CardContent>
  </Card>
</TabsContent>



{/* 🔮 PREDICTION SECTION */}
<TabsContent value="prediction">
  <Card className="shadow-md border">
    <CardContent className="p-6 space-y-6">
      {/* 🧠 Header */}
      <div className="flex items-center gap-3">
        <Brain className="text-purple-600 w-6 h-6" />
        <h2 className="text-xl font-bold text-gray-800">
          Prédiction du Comportement d’Achat
        </h2>
      </div>

      {/* 🚀 Launch Button */}
      <Button
  onClick={fetchPrediction}
  disabled={loading}
  className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all duration-300
    ${loading ? "bg-purple-300 cursor-not-allowed" : "bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600"}
    text-white font-semibold shadow-lg`}
>
  {loading ? (
    <>
      <Loader2 className="animate-spin h-5 w-5" />
      Chargement...
    </>
  ) : (
    <>
      <Brain className="h-5 w-5" />
      Lancer la Prédiction
    </>
  )}
</Button>


      {/* ✅ Prediction Data Display */}
      {predictionData && predictionData.length > 0 && (() => {
        const avgPurchase =
          predictionData.reduce((sum, p) => sum + p.predicted_next_purchase, 0) /
          predictionData.length;

        const topClients = [...predictionData]
          .sort((a, b) => b.predicted_next_purchase - a.predicted_next_purchase)
          .slice(0, 5);

        return (
          <>
            {/* 📊 Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-purple-50 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-purple-700 font-medium">Clients Prédits</p>
                <p className="text-3xl font-bold text-purple-600">{predictionData.length}</p>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-yellow-700 font-medium">Dépense Moyenne</p>
                <p className="text-3xl font-bold text-yellow-600">{avgPurchase.toFixed(2)} DH</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg shadow-sm">
                <p className="text-sm text-green-700 font-medium">Top Client</p>
                <p className="text-3xl font-bold text-green-600">#{topClients[0].client_id}</p>
              </div>
            </div>

            {/* 📈 Bar Chart */}
            <div className="mt-10">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                Montants Prévus par Client
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={predictionData}>
                  <XAxis dataKey="client_id" />
                  <YAxis />
                  <Tooltip formatter={(v) => `${v} DH`} />
                  <Legend />
                  <Bar dataKey="predicted_next_purchase" fill="#a78bfa" name="Prédiction" />
                  {/* Average Line */}
                  <ReferenceLine y={avgPurchase} stroke="#8884d8" strokeDasharray="3 3" label="Moyenne" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 🏆 Top Clients Cards */}
            <div className="mt-10">
              <h3 className="text-lg font-semibold text-gray-700 mb-4">Top 5 Clients Ciblés</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {topClients.map((client) => (
                  <div
                    key={client.client_id}
                    className="border rounded-lg p-4 bg-white shadow-sm hover:shadow-md transition"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-semibold text-purple-600">Client #{client.client_id}</h4>
                      <span
                        className={`text-xs font-medium px-2 py-1 rounded-full ${
                          client.predicted_next_purchase >= avgPurchase
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {client.predicted_next_purchase >= avgPurchase
                          ? "Au-dessus de la Moyenne"
                          : "En dessous"}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Montant Prédit :{" "}
                      <span className="font-bold text-purple-500">
                        {client.predicted_next_purchase.toFixed(2)} DH
                      </span>
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 📋 Detailed Table */}
            <div className="mt-10 overflow-x-auto">
              <h3 className="text-lg font-semibold text-gray-700 mb-2">Détails Prédictifs</h3>
              <table className="w-full border-collapse border rounded-md overflow-hidden">
                <thead>
                  <tr className="bg-gray-100 text-sm text-gray-700">
                    <th className="p-3 border">Client</th>
                    <th className="p-3 border">Montant Prédit</th>
                    <th className="p-3 border">Comparaison Moyenne</th>
                  </tr>
                </thead>
                <tbody>
                  {predictionData.map((p) => (
                    <tr
                      key={p.client_id}
                      className={
                        p.predicted_next_purchase >= avgPurchase
                          ? "bg-green-50"
                          : "bg-red-50"
                      }
                    >
                      <td className="p-2 border font-medium">#{p.client_id}</td>
                      <td className="p-2 border">{p.predicted_next_purchase.toFixed(2)} DH</td>
                      <td className="p-2 border">
                        <span
                          className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                            p.predicted_next_purchase >= avgPurchase
                              ? "bg-green-200 text-green-800"
                              : "bg-red-200 text-red-800"
                          }`}
                        >
                          {p.predicted_next_purchase >= avgPurchase
                            ? "Au-dessus"
                            : "En dessous"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        );
      })()}
    </CardContent>
  </Card>
</TabsContent>




        {/* SENTIMENT */}
        <TabsContent value="sentiment">
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Smile className="text-green-500" />
                <h2 className="text-xl font-semibold">Analyse de Sentiments</h2>
              </div>
              <Button onClick={fetchSentiment} disabled={loading}>
                {loading ? "Chargement..." : "Analyser les Messages"}
              </Button>

              {sentimentData &&
                sentimentData.map((s: any, i: number) => (
                  <div key={i} className="p-3 border rounded-lg my-2 bg-gray-50">
                    <p>{s.text}</p>
                    <p className="text-sm">Pos: {s.score.pos}, Neu: {s.score.neu}, Neg: {s.score.neg}</p>
                  </div>
                ))}

              {sentimentTrend.length > 0 && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={sentimentTrend}>
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="positive" fill="#4ade80" />
                    <Bar dataKey="negative" fill="#f87171" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CLV */}
        <TabsContent value="clv">
          <Card>
            <CardContent>
              <div className="flex items-center gap-2">
                <DollarSign className="text-yellow-500" />
                <h2 className="text-xl font-semibold">Customer Lifetime Value</h2>
              </div>
              <Button onClick={fetchCLV} disabled={loading}>
                {loading ? "Chargement..." : "Calculer CLV"}
              </Button>
              {clvData && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={clvData}>
                    <XAxis dataKey="client_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="predicted_clv" fill="#facc15" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* CHURN */}
        <TabsContent value="churn">
          <Card>
            <CardContent>
              <div className="flex items-center gap-2">
                <AlertCircle className="text-red-500" />
                <h2 className="text-xl font-semibold">Churn Risk</h2>
              </div>
              <Button onClick={fetchChurn} disabled={loading}>
                {loading ? "Chargement..." : "Analyser le Churn"}
              </Button>
              {churnData && (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={churnData}>
                    <XAxis dataKey="client_id" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="risk_level" fill="#f87171" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* RECOMMENDATIONS */}
        <TabsContent value="recommendations">
          <Card>
            <CardContent>
              <div className="flex items-center gap-2">
                <Gift className="text-pink-500" />
                <h2 className="text-xl font-semibold">Recommandations Produits</h2>
              </div>
              <Button onClick={fetchRecommendations} disabled={loading}>
                {loading ? "Chargement..." : "Voir Recommandations"}
              </Button>
              {recommendationData && recommendationData.map((r: any, i: number) => (
                <p key={i}>Client #{r.client_id} – Produit recommandé: {r.product_name}</p>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
