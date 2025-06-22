import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Toaster as Sonner } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import { UserRoleProvider } from "./components/UserRoleProvider";
import Calendar from "./pages/Calendar";
import CallHistory from "./pages/CallHistory";
import Settings from "./pages/Settings";
import { DebugInfo } from "./components/DebugInfo";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <UserRoleProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/calendar" element={<Calendar />} />
              <Route path="/call-history" element={<CallHistory />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
          <Sonner />
          <DebugInfo />
        </UserRoleProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
