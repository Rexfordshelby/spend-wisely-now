import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Settings, TrendingUp, Wallet, Target, ArrowRight, Home, BarChart3, Users, MessageSquare, Trophy, Bitcoin, Calendar } from "lucide-react";
import BudgetRing from "@/components/BudgetRing";
import SpendInputModal from "@/components/SpendInputModal";
import TransactionCard from "@/components/TransactionCard";
import BottomNavLink from "@/components/BottomNavLink";
import QuickPaySection from "@/components/QuickPaySection";
import QuickContacts from "@/components/QuickContacts";
import RewardsCard from "@/components/RewardsCard";
import SplitBillCard from "@/components/SplitBillCard";
import NotificationBell from "@/components/NotificationBell";
import { toast } from "sonner";

const Index = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);
  const [spendModalOpen, setSpendModalOpen] = useState(false);

  // Budget data
  const [dailyBudget, setDailyBudget] = useState(0);
  const [weeklyBudget, setWeeklyBudget] = useState(0);
  const [todaySpent, setTodaySpent] = useState(0);
  const [weekSpent, setWeekSpent] = useState(0);

  // Goal data
  const [goal, setGoal] = useState<any>(null);

  // Transactions
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);

  // Profile stats
  const [stats, setStats] = useState({
    advised: 0,
    skipped: 0,
    adherence: 100
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', session.user.id)
      .single();

    if (!profile?.onboarding_completed) {
      navigate('/onboarding');
      return;
    }

    setUserId(session.user.id);
    await loadUserData(session.user.id);
  };

  const loadUserData = async (userId: string) => {
    try {
      // Get wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (wallet) {
        setWalletId(wallet.id);
      }

      // Get budget
      const { data: budget } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (budget) {
        setDailyBudget(Number(budget.daily_limit));
        setWeeklyBudget(Number(budget.weekly_limit));
      }

      // Get active goal
      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      setGoal(goalData);

      // Get profile stats
      const { data: profile } = await supabase
        .from('profiles')
        .select('spends_advised_count, spends_skipped_count, budget_adherence_score')
        .eq('id', userId)
        .single();

      if (profile) {
        setStats({
          advised: profile.spends_advised_count || 0,
          skipped: profile.spends_skipped_count || 0,
          adherence: profile.budget_adherence_score || 100
        });
      }

      // Calculate spending for today and this week
      if (wallet) {
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: todayTxns } = await supabase
          .from('transactions')
          .select('amount')
          .eq('wallet_id', wallet.id)
          .gte('created_at', todayStart.toISOString());

        const todayTotal = todayTxns?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        setTodaySpent(todayTotal);

        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const { data: weekTxns } = await supabase
          .from('transactions')
          .select('*')
          .eq('wallet_id', wallet.id)
          .gte('created_at', weekStart.toISOString())
          .order('created_at', { ascending: false })
          .limit(7);

        const weekTotal = weekTxns?.reduce((sum, t) => sum + Number(t.amount), 0) || 0;
        setWeekSpent(weekTotal);
        setRecentTransactions(weekTxns || []);
      }
    } catch (error: any) {
      toast.error("Failed to load data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="shimmer h-12 w-32 rounded-lg"></div>
      </div>
    );
  }

  const dailyRemaining = Math.max(0, dailyBudget - todaySpent);
  const weeklyRemaining = Math.max(0, weeklyBudget - weekSpent);
  const goalProgress = goal ? ((Number(goal.current_amount) / Number(goal.target_amount)) * 100) : 0;

  return (
    <div className="min-h-screen pb-28">
      {/* Header */}
      <div className="p-4 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            World Vault
          </h1>
          <p className="text-sm text-muted-foreground">Smart spending advisor</p>
        </div>
        <div className="flex items-center gap-2">
          <NotificationBell />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 space-y-4">
        {/* Budget Status Card */}
        <div className="glass-card p-6 rounded-2xl shadow-card">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-sm text-muted-foreground mb-1">Today's Balance</h2>
              <div className="text-4xl font-bold text-primary">
                ₹{dailyRemaining.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                of ₹{dailyBudget.toLocaleString()} left
              </p>
            </div>
            <BudgetRing spent={todaySpent} total={dailyBudget} />
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-border/50">
            <div className="flex items-center gap-2">
              <Wallet className="w-4 h-4 text-secondary" />
              <div>
                <div className="text-lg font-bold text-secondary">
                  ₹{weeklyRemaining.toLocaleString()}
                </div>
                <div className="text-xs text-muted-foreground">Week remaining</div>
              </div>
            </div>
          </div>
        </div>

        {/* Savings Goal Card */}
        {goal && (
          <div className="glass-card p-6 rounded-2xl shadow-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-accent/10">
                <Target className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{goal.name}</h3>
                <p className="text-sm text-muted-foreground">
                  ₹{Number(goal.current_amount).toLocaleString()} of ₹{Number(goal.target_amount).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-accent">{Math.round(goalProgress)}%</div>
              </div>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-accent to-secondary transition-all duration-500"
                style={{ width: `${goalProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Quick Contacts */}
        <QuickContacts />

        {/* Quick Pay Section */}
        <QuickPaySection />

        {/* Quick Actions - Crypto & Scheduled */}
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center gap-1"
            onClick={() => navigate('/crypto')}
          >
            <Bitcoin className="w-5 h-5 text-orange-500" />
            <span className="text-xs">Crypto Wallet</span>
          </Button>
          <Button 
            variant="outline" 
            className="h-16 flex flex-col items-center justify-center gap-1"
            onClick={() => navigate('/scheduled-payments')}
          >
            <Calendar className="w-5 h-5 text-primary" />
            <span className="text-xs">Scheduled</span>
          </Button>
        </div>

        {/* Split Bill */}
        <SplitBillCard />

        {/* Rewards Card */}
        <RewardsCard />

        {/* Stats Card */}
        <div className="glass-card p-4 rounded-2xl">
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{stats.advised}</div>
              <div className="text-xs text-muted-foreground">Advised</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">{stats.skipped}</div>
              <div className="text-xs text-muted-foreground">Skipped</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">{Math.round(stats.adherence)}%</div>
              <div className="text-xs text-muted-foreground">Adherence</div>
            </div>
          </div>
        </div>

        {/* Recent Transactions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold">Recent Transactions</h3>
            {recentTransactions.length > 0 && (
              <Button variant="ghost" size="sm">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
          </div>

          {recentTransactions.length === 0 ? (
            <div className="glass-card p-8 rounded-2xl text-center">
              <TrendingUp className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Start tracking your spending now!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((txn) => (
                <TransactionCard
                  key={txn.id}
                  amount={Number(txn.amount)}
                  category={txn.category || 'Other'}
                  description={txn.description || 'Transaction'}
                  date={txn.created_at}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button */}
      <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50">
        <Button
          size="lg"
          className="h-16 w-16 rounded-full neon-glow shadow-glow-cyan"
          onClick={() => setSpendModalOpen(true)}
        >
          <Plus className="w-8 h-8" />
        </Button>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border/50 z-40">
        <div className="flex items-center justify-around p-3">
          <BottomNavLink to="/" icon={Home} label="Home" active />
          <BottomNavLink to="/analytics" icon={BarChart3} label="Analytics" />
          <BottomNavLink to="/leaderboard" icon={Trophy} label="Leaderboard" />
          <BottomNavLink to="/social" icon={Users} label="Social" />
          <BottomNavLink to="/chat" icon={MessageSquare} label="Chat" />
        </div>
      </div>

      {/* Spend Input Modal */}
      {userId && walletId && (
        <SpendInputModal
          open={spendModalOpen}
          onOpenChange={setSpendModalOpen}
          userId={userId}
          walletId={walletId}
          onSuccess={() => loadUserData(userId)}
        />
      )}
    </div>
  );
};

export default Index;
