import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PasswordProvider } from "@/contexts/PasswordContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Index from "./pages/Index";
import Setup from "./pages/Setup";
import Scan from "./pages/Scan";
import Scoreboard from "./pages/Scoreboard";
import Submissions from "./pages/Submissions";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PasswordProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/submit" element={<Scan />} />
            <Route path="/scoreboard" element={<Scoreboard />} />
            {/* Admin routes */}
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/setup" element={
              <ProtectedRoute><Setup /></ProtectedRoute>
            } />
            <Route path="/admin/submissions" element={
              <ProtectedRoute><Submissions /></ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PasswordProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
