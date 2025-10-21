export interface ChannelOptions {
    whatsapp: boolean;
    website: boolean;
    facebook: boolean;
  }
  
  export interface Chatbot {
    id?: number;
    bot_name: string;
    welcome_message: string;
    is_active: boolean;
    channels: ChannelOptions;
    created_at?: string;
  }
  
  const API_URL = "http://localhost:5000/api/chatbots";
  const TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwidXNlcm5hbWUiOiJUZXN0VXNlciIsImlhdCI6MTc2MDIwMzMzMywiZXhwIjoxNzYwMjA2OTMzfQ.97wQmgmoJIQfm9OEPCv5PH7YW3qtyn5wZkXPloDYV_o"; // Replace or dynamically load from auth context
  
  export const chatbotService = {
    async getAll(): Promise<Chatbot[]> {
      const res = await fetch(API_URL, {
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      if (!res.ok) throw new Error("Failed to fetch chatbots");
      const data = await res.json();
      return data.chatbots || [];
    },
  
    async create(bot: Chatbot): Promise<Chatbot> {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify(bot),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to create chatbot");
      return data.chatbot;
    },
  
    async update(id: number, bot: Chatbot): Promise<void> {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${TOKEN}`,
        },
        body: JSON.stringify(bot),
      });
      if (!res.ok) throw new Error("Failed to update chatbot");
    },
  
    async delete(id: number): Promise<void> {
      const res = await fetch(`${API_URL}/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${TOKEN}` },
      });
      if (!res.ok) throw new Error("Failed to delete chatbot");
    },
  };
  