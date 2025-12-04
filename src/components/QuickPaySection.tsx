import { useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import { QrCode, Send, Wallet, ArrowDownLeft, Globe, CreditCard, History, Users } from "lucide-react";

const QuickPaySection = () => {
  const navigate = useNavigate();

  const quickActions = [
    { icon: QrCode, label: 'Scan & Pay', route: '/scan-pay', color: 'bg-cyan-500/10 text-cyan-500' },
    { icon: Send, label: 'Send', route: '/send', color: 'bg-violet-500/10 text-violet-500' },
    { icon: ArrowDownLeft, label: 'Receive', route: '/receive', color: 'bg-green-500/10 text-green-500' },
    { icon: Globe, label: 'Transfer', route: '/transfers', color: 'bg-blue-500/10 text-blue-500' },
    { icon: Wallet, label: 'Wallets', route: '/wallets', color: 'bg-amber-500/10 text-amber-500' },
    { icon: History, label: 'History', route: '/payment-history', color: 'bg-rose-500/10 text-rose-500' },
  ];

  return (
    <Card className="p-4">
      <h3 className="font-semibold mb-4">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-3">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <button
              key={action.label}
              onClick={() => navigate(action.route)}
              className="flex flex-col items-center gap-2 p-3 rounded-xl hover:bg-accent/10 transition-all hover:scale-105 active:scale-95"
            >
              <div className={`p-3 rounded-full ${action.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium">{action.label}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
};

export default QuickPaySection;
