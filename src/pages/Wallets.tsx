import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Plus, Wallet, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import BottomNavLink from "@/components/BottomNavLink";
import { Home, BarChart3, Trophy, Users } from "lucide-react";

interface WalletData {
  id: string;
  currency: string;
  balance: number;
  is_primary: boolean;
}

const CURRENCY_FLAGS: Record<string, string> = {
  USD: '🇺🇸', INR: '🇮🇳', EUR: '🇪🇺', GBP: '🇬🇧',
  PKR: '🇵🇰', CNY: '🇨🇳', RUB: '🇷🇺', UAH: '🇺🇦',
};

const Wallets = () => {
  const navigate = useNavigate();
  const [wallets, setWallets] = useState<WalletData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    loadWallets();
  };

  const loadWallets = async () => {
    try {
      const { data, error } = await supabase
        .from('multi_currency_wallets')
        .select('*')
        .order('is_primary', { ascending: false });

      if (error) throw error;
      setWallets(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const totalInPrimary = wallets.reduce((sum, w) => {
    if (w.is_primary) return sum + w.balance;
    return sum; // In production, convert to primary currency
  }, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-20">
      <div className="container mx-auto p-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">My Wallets</h1>
          <Button size="icon" className="bg-primary/10 hover:bg-primary/20">
            <Plus className="w-5 h-5" />
          </Button>
        </div>

        {/* Total Balance */}
        <Card className="p-6 mb-6 bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
          <div className="flex items-center gap-2 mb-2">
            <Wallet className="w-5 h-5 text-primary" />
            <span className="text-sm text-muted-foreground">Total Balance</span>
          </div>
          <div className="text-4xl font-bold mb-2">
            {totalInPrimary.toFixed(2)} {wallets.find(w => w.is_primary)?.currency || 'INR'}
          </div>
          <div className="flex items-center gap-1 text-sm text-primary">
            <TrendingUp className="w-4 h-4" />
            <span>+2.5% this month</span>
          </div>
        </Card>

        {/* Wallets List */}
        <div className="space-y-3">
          <h2 className="text-lg font-semibold mb-3">Currency Wallets</h2>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : wallets.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No wallets yet</p>
              <Button>Add Your First Wallet</Button>
            </Card>
          ) : (
            wallets.map((wallet) => (
              <Card key={wallet.id} className="p-4 hover:border-primary/40 transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-4xl">{CURRENCY_FLAGS[wallet.currency] || '💰'}</div>
                    <div>
                      <div className="font-semibold">{wallet.currency}</div>
                      <div className="text-xs text-muted-foreground">
                        {wallet.is_primary && '⭐ Primary'}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{wallet.balance.toFixed(2)}</div>
                    <div className="text-xs text-muted-foreground">{wallet.currency}</div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <Button variant="outline" className="h-20" onClick={() => navigate('/send')}>
            <div className="text-center">
              <div className="text-2xl mb-1">💸</div>
              <div className="text-sm">Send Money</div>
            </div>
          </Button>
          <Button variant="outline" className="h-20" onClick={() => navigate('/receive')}>
            <div className="text-center">
              <div className="text-2xl mb-1">📥</div>
              <div className="text-sm">Receive</div>
            </div>
          </Button>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border">
        <div className="container mx-auto px-4 py-3">
          <div className="flex justify-around items-center">
            <BottomNavLink to="/" icon={Home} label="Home" />
            <BottomNavLink to="/analytics" icon={BarChart3} label="Analytics" />
            <BottomNavLink to="/leaderboard" icon={Trophy} label="Leaderboard" />
            <BottomNavLink to="/social" icon={Users} label="Social" active />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallets;