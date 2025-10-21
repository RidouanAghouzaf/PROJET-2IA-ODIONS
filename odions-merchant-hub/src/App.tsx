import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./context/AuthContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Audiences from "./pages/Audiences";
import AudienceDetail from "./pages/AudienceDetail";
import Campaigns from "./pages/WhatsappCampaigns";
import Chatbots from "./pages/Chatbots";
import Orders from "./pages/Orders";
import Delivery from "./pages/Delivery";
import Analytics from "./pages/Analytics";
import UsersTenants from "./pages/Users";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Index from "./pages/Index";
import AiIntelligence from "./pages/AiIntelligence";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<Signup />} />

              {/* Dashboard Route (protected) */}
              <Route
                path="/dashboard"
                element={
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                }
              />
              <Route
                path="/audiences"
                element={
                  <AppLayout>
                    <Audiences />
                  </AppLayout>
                }
              />
              <Route
                path="/audiences/:id"
                element={
                  <AppLayout>
                    <AudienceDetail />
                  </AppLayout>
                }
              />
              <Route
                path="/campaigns"
                element={
                  <AppLayout>
                    <Campaigns />
                  </AppLayout>
                }
              />
              <Route
                path="/chatbots"
                element={
                  <AppLayout>
                    <Chatbots />
                  </AppLayout>
                }
              />
              <Route 
                path="/ai-intelligence" 
                element={
                  <AppLayout>
                    <AiIntelligence />
                </AppLayout>
                } 
                />
              <Route
                path="/orders"
                element={
                  <AppLayout>
                    <Orders />
                  </AppLayout>
                }
              />
              <Route
                path="/delivery"
                element={
                  <AppLayout>
                    <Delivery />
                  </AppLayout>
                }
              />
              <Route
                path="/analytics"
                element={
                  <AppLayout>
                    <Analytics />
                  </AppLayout>
                }
              />
              <Route
                path="/admin"
                element={
                  <AppLayout>
                    <Admin />
                  </AppLayout>
                }
              />
              <Route
                path="/settings"
                element={
                  <AppLayout>
                    <Settings />
                  </AppLayout>
                }
              />

              {/* Catch-All */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
