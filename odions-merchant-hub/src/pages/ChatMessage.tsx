import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

const API_URL = "http://127.0.0.1:8000"; // your FastAPI backend

interface ChatMessage {
  type: "user" | "bot";
  text: string;
}

export default function Chatbot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when a new message arrives
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage = { type: "user", text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API_URL}/api/ai/chatbot`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, tenant_id: 1 }),
      });
      const data = await res.json();
      const botMessage = { type: "bot", text: data.response };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { type: "bot", text: "Erreur lors de la communication avec le serveur." },
      ]);
    }

    setLoading(false);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") sendMessage();
  };

  return (
    <Card className="fixed bottom-4 right-4 w-96 shadow-xl border rounded-lg flex flex-col h-[500px] bg-white z-50">
      <CardContent className="flex flex-col flex-1 p-4">
        <h3 className="text-lg font-semibold mb-2">Chatbot IA</h3>
        <div className="flex-1 overflow-y-auto mb-2 space-y-2">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`px-3 py-2 rounded-xl max-w-[80%] ${
                msg.type === "user" ? "bg-blue-500 text-white self-end" : "bg-gray-100 text-gray-800 self-start"
              }`}
            >
              {msg.text}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            className="flex-1 border rounded-lg px-3 py-2 focus:outline-none"
            placeholder="Posez votre question..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            disabled={loading}
          />
          <Button onClick={sendMessage} disabled={loading}>
            {loading ? <Loader2 className="animate-spin w-4 h-4" /> : "Envoyer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
