import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router } from "react-router-dom";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster as Sonner } from "sonner";
import { Toaster } from "@/components/ui/toaster";
import { UserRoleProvider } from "./components/UserRoleProvider";
import AppRoutes from "./AppRoutes";
import DebugInfo from "./components/DebugInfo";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Router>
          <UserRoleProvider>
            <AppRoutes />
            <Toaster />
            <Sonner />
            <DebugInfo />
          </UserRoleProvider>
        </Router>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
