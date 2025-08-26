import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from './store';
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
import BuyBoxCriteria from "./pages/BuyBoxCriteria";
import ConversationsInbox from "./pages/ConversationsInbox";
import ConversationDetail from "./pages/ConversationDetail";

// Admin portal pages
import AdminDashboard from "./pages/AdminDashboard";
import AdminFormOptions from "./pages/AdminFormOptions";
import AdminDealDetail from "./pages/AdminDealDetail";

const queryClient = new QueryClient();

const App = () => (

  
  <Provider store={store}>
    
    <PersistGate loading={null} persistor={persistor}>
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
            <Route path="/criteria" element={<BuyBoxCriteria />} />
            <Route path="/deal/:id" element={<DealDetail />} />
            <Route path="/conversations" element={<ConversationsInbox />} />
            <Route path="/conversations/:propertySubmissionId" element={<ConversationDetail />} />
              
              {/* Admin Portal Routes */}
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/form-options" element={<AdminFormOptions />} />
              <Route path="/admin/deal/:id" element={<AdminDealDetail />} />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </PersistGate>
  </Provider>
);

export default App;
