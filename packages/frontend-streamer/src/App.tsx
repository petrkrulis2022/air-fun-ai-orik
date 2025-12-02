import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import HomePage from "./pages/HomePage";
import DashboardPage from "./pages/DashboardPage";
import AuthPage from "./pages/AuthPage";
import StreamCreatePage from "./pages/StreamCreatePage";
import StreamDashboardPage from "./pages/StreamDashboardPage";
import AgentManagementPage from "./pages/AgentManagementPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import ProtectedRoute from "./components/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/stream/create"
          element={
            <ProtectedRoute>
              <StreamCreatePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stream/:id"
          element={
            <ProtectedRoute>
              <StreamDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/stream/:id/agents"
          element={
            <ProtectedRoute>
              <AgentManagementPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
