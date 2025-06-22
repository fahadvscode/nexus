import { Route, Routes } from "react-router-dom";
import Index from "./pages/Index";
import Calendar from "./pages/Calendar";
import CallHistory from "./pages/CallHistory";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/calendar" element={<Calendar />} />
    <Route path="/call-history" element={<CallHistory />} />
    <Route path="/settings" element={<Settings />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes; 