// import React, { useState, useEffect } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import { Card, CardContent } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Textarea } from "@/components/ui/textarea";
// import { Button } from "@/components/ui/button";
// import toast from "react-hot-toast";

// const API_URL = "http://localhost:5000/api/chatbots";
// const TOKEN = "YOUR_TOKEN_HERE";

// const EditChatbot: React.FC = () => {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const [bot, setBot] = useState<any>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     fetch(`${API_URL}/${id}`, { headers: { Authorization: `Bearer ${TOKEN}` } })
//       .then((res) => res.json())
//       .then((data) => setBot(data.chatbot))
//       .catch(() => toast.error("Erreur de chargement du chatbot"))
//       .finally(() => setLoading(false));
//   }, [id]);

//   const handleSave = async () => {
//     try {
//       const res = await fetch(`${API_URL}/${id}`, {
//         method: "PUT",
//         headers: {
//           "Content-Type": "application/json",
//           Authorization: `Bearer ${TOKEN}`,
//         },
//         body: JSON.stringify(bot),
//       });
//       if (res.ok) {
//         toast.success("Chatbot mis à jour !");
//         navigate("/chatbots");
//       } else toast.error("Erreur lors de la mise à jour");
//     } catch {
//       toast.error("Erreur réseau");
//     }
//   };

//   if (loading) return <p className="p-6">Chargement...</p>;
//   if (!bot) return <p className="p-6">Chatbot introuvable</p>;

//   return (
//     <div className="p-8 space-y-6">
//       <h1 className="text-2xl font-bold">Modifier Chatbot</h1>
//       <Card className="p-6">
//         <CardContent className="space-y-4">
//           <Input
//             value={bot.bot_name}
//             onChange={(e) => setBot({ ...bot, bot_name: e.target.value })}
//             placeholder="Nom du chatbot"
//           />
//           <Textarea
//             value={bot.welcome_message}
//             onChange={(e) => setBot({ ...bot, welcome_message: e.target.value })}
//             placeholder="Message de bienvenue"
//           />
//           <Button onClick={handleSave} className="w-full">
//             💾 Sauvegarder les modifications
//           </Button>
//         </CardContent>
//       </Card>
//     </div>
//   );
// };

// export default EditChatbot;
