import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import DashboardPage from "./pages/DashboardPage";
import RegistrationsPage from "./pages/RegistrationsPage";
import ExamSessionsPage from "./pages/ExamSessionsPage";
import KeysPage from "./pages/KeysPage";
import ImportDataPage from "./pages/ImportDataPage";
import GuestRegisterPage from "./pages/GuestRegisterPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/registrations" element={<RegistrationsPage />} />
          <Route path="/sessions" element={<ExamSessionsPage />} />
          <Route path="/keys" element={<KeysPage />} />
          <Route path="/import" element={<ImportDataPage />} />
          <Route path="/register" element={<GuestRegisterPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
