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
import PasswordLogin from "./pages/PasswordLogin";
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
            <Route path="/login" element={<PasswordLogin />} />
            <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
            <Route path="/setup" element={<ProtectedRoute><Setup /></ProtectedRoute>} />
            <Route path="/scan" element={<ProtectedRoute><Scan /></ProtectedRoute>} />
            <Route path="/scoreboard" element={<ProtectedRoute><Scoreboard /></ProtectedRoute>} />
            <Route path="/submissions" element={<ProtectedRoute><Submissions /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PasswordProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
