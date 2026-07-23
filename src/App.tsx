import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/i18n";
import ProtectedRoute from "@/components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import DashboardPage from "./pages/DashboardPage";
import RegistrationsPage from "./pages/RegistrationsPage";
import SubjectsPage from "./pages/SubjectsPage";
import TermsPage from "./pages/TermsPage";
import ExamSessionsPage from "./pages/ExamSessionsPage";
import KeysPage from "./pages/KeysPage";
import ImportDataPage from "./pages/ImportDataPage";
import GuestRegisterPage from "./pages/GuestRegisterPage";
import LoginPage from "./pages/LoginPage";
import NotFound from "./pages/NotFound";
import QuotePage from "./pages/QuotePage";
import ToolRegistrationsPage from "./pages/ToolRegistrationsPage";
import MoneyManagementPage from "./pages/MoneyManagementPage";
import PricingPage from "./pages/PricingPage";
import ToolsPage from "./pages/ToolsPage";
import TodaySupportPage from "./pages/TodaySupportPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <I18nProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<GuestRegisterPage />} />
              <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
              <Route path="/today" element={<ProtectedRoute><TodaySupportPage /></ProtectedRoute>} />
              <Route path="/registrations" element={<ProtectedRoute><RegistrationsPage /></ProtectedRoute>} />
              <Route path="/subjects" element={<ProtectedRoute><SubjectsPage /></ProtectedRoute>} />
              <Route path="/terms" element={<ProtectedRoute><TermsPage /></ProtectedRoute>} />
              <Route path="/sessions" element={<ProtectedRoute><ExamSessionsPage /></ProtectedRoute>} />
              <Route path="/keys" element={<ProtectedRoute><KeysPage /></ProtectedRoute>} />
              <Route path="/import" element={<ProtectedRoute><ImportDataPage /></ProtectedRoute>} />
              <Route path="/tool-registrations" element={<ProtectedRoute><ToolRegistrationsPage /></ProtectedRoute>} />
              <Route path="/money-management" element={<ProtectedRoute><MoneyManagementPage /></ProtectedRoute>} />
              <Route path="/pricing" element={<ProtectedRoute><PricingPage /></ProtectedRoute>} />
              <Route path="/tools" element={<ProtectedRoute><ToolsPage /></ProtectedRoute>} />
              <Route path="/quote/:id" element={<QuotePage />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </I18nProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
