import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Chat from "./pages/Chat";
import Analytics from "./pages/Analytics";
import Leaderboard from "./pages/Leaderboard";
import Social from "./pages/Social";
import Bills from "./pages/Bills";
import Achievements from "./pages/Achievements";
import BankSync from "./pages/BankSync";
import Wallets from "./pages/Wallets";
import SendMoney from "./pages/SendMoney";
import ReceiveMoney from "./pages/ReceiveMoney";
import ScanPay from "./pages/ScanPay";
import Transfers from "./pages/Transfers";
import PaymentHistory from "./pages/PaymentHistory";
import Contacts from "./pages/Contacts";
import ScheduledPayments from "./pages/ScheduledPayments";
import Notifications from "./pages/Notifications";
import CryptoWallet from "./pages/CryptoWallet";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/social" element={<Social />} />
          <Route path="/bills" element={<Bills />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/bank-sync" element={<BankSync />} />
          <Route path="/wallets" element={<Wallets />} />
          <Route path="/send" element={<SendMoney />} />
          <Route path="/receive" element={<ReceiveMoney />} />
          <Route path="/scan-pay" element={<ScanPay />} />
        <Route path="/transfers" element={<Transfers />} />
        <Route path="/payment-history" element={<PaymentHistory />} />
        <Route path="/contacts" element={<Contacts />} />
        <Route path="/scheduled-payments" element={<ScheduledPayments />} />
        <Route path="/notifications" element={<Notifications />} />
        <Route path="/crypto" element={<CryptoWallet />} />
        <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
