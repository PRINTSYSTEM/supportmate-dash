import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import RegistrationsPage from "./pages/RegistrationsPage";
import ExamSessionsPage from "./pages/ExamSessionsPage";
import KeysPage from "./pages/KeysPage";
import ImportDataPage from "./pages/ImportDataPage";
import GuestRegisterPage from "./pages/GuestRegisterPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<GuestRegisterPage />} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="/registrations" element={<ProtectedRoute><RegistrationsPage /></ProtectedRoute>} />
            <Route path="/sessions" element={<ProtectedRoute><ExamSessionsPage /></ProtectedRoute>} />
            <Route path="/keys" element={<ProtectedRoute><KeysPage /></ProtectedRoute>} />
            <Route path="/import" element={<ProtectedRoute><ImportDataPage /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
