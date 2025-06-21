import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { UserRoleProvider } from "@/components/UserRoleProvider";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import Calendar from "./pages/Calendar";
import CallHistory from "./pages/CallHistory";
import NotFound from "./pages/NotFound";
import { TwilioAuthListener } from "@/components/TwilioAuthListener";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useTwilioStore } from "./hooks/useTwilioStore";
import { useEffect } from "react";

const queryClient = new QueryClient();

const App = () => {
  const { unlockAudio, audioUnlocked } = useTwilioStore();

  useEffect(() => {
    const handleFirstClick = () => {
      if (!audioUnlocked) {
        unlockAudio();
      }
      // Remove the event listener after the first interaction
      window.removeEventListener('click', handleFirstClick);
    };
    
    window.addEventListener('click', handleFirstClick);

    return () => {
      window.removeEventListener('click', handleFirstClick);
    };
  }, [unlockAudio, audioUnlocked]);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <UserRoleProvider>
            <TwilioAuthListener />
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/call-history" element={<CallHistory />} />
                <Route path="/settings" element={<Settings />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </UserRoleProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
