import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Authentication pages
import UserLogin from "./pages/UserLogin";
import UserSignup from "./pages/UserSignup";
import AdminLogin from "./pages/AdminLogin";

// User portal pages
import UserDashboard from "./pages/UserDashboard";
import SubmitDeal from "./pages/SubmitDeal";
import DealDetail from "./pages/DealDetail";

// Admin portal pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminFormOptions from "./pages/AdminFormOptions";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<UserLogin />} />
          
          {/* Authentication Routes */}
          <Route path="/login" element={<UserLogin />} />
          <Route path="/signup" element={<UserSignup />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          
          {/* User Portal Routes */}
          <Route path="/dashboard" element={<UserDashboard />} />
          <Route path="/submit-deal" element={<SubmitDeal />} />
          <Route path="/deal/:id" element={<DealDetail />} />
          
          {/* Admin Portal Routes */}
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/form-options" element={<AdminFormOptions />} />
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
