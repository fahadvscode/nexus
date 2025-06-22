import { Route, Routes } from "react-router-dom";
import DeploymentStatusPage from "./pages/DeploymentStatusPage";

const AppRoutes = () => (
  <Routes>
    {/* Temporarily disabling all other routes to force a deployment check. */}
    <Route path="*" element={<DeploymentStatusPage />} />
  </Routes>
);

export default AppRoutes; 