import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, LogOut, Target, Trash2, MessageSquare, Award, CreditCard, Zap, BarChart3 } from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  // Budget settings
  const [weeklyBudget, setWeeklyBudget] = useState(0);
  const [dailyBudget, setDailyBudget] = useState(0);

  // Goals
  const [goals, setGoals] = useState<any[]>([]);
  const [newGoalName, setNewGoalName] = useState("");
  const [newGoalAmount, setNewGoalAmount] = useState("");
  const [newGoalDeadline, setNewGoalDeadline] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    setUserId(session.user.id);
    await loadSettings(session.user.id);
  };

  const loadSettings = async (userId: string) => {
    try {
      // Load budget
      const { data: budget } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (budget) {
        setWeeklyBudget(Number(budget.weekly_limit));
        setDailyBudget(Number(budget.daily_limit));
      }

      // Load goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      setGoals(goalsData || []);
    } catch (error: any) {
      toast.error("Failed to load settings");
    }
  };

  const handleSaveBudget = async () => {
    if (!userId) return;

    setLoading(true);
    try {
      const newDailyBudget = Math.floor(weeklyBudget / 7);

      const { error } = await supabase
        .from('budgets')
        .update({
          weekly_limit: weeklyBudget,
          daily_limit: newDailyBudget
        })
        .eq('user_id', userId);

      if (error) throw error;

      setDailyBudget(newDailyBudget);
      toast.success("Budget updated!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update budget");
    } finally {
      setLoading(false);
    }
  };

  const handleAddGoal = async () => {
    if (!userId || !newGoalName || !newGoalAmount) {
      toast.error("Please fill in goal details");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          name: newGoalName,
          target_amount: parseFloat(newGoalAmount),
          deadline: newGoalDeadline || null,
          current_amount: 0,
          status: 'active'
        });

      if (error) throw error;

      toast.success("Goal added!");
      setNewGoalName("");
      setNewGoalAmount("");
      setNewGoalDeadline("");
      await loadSettings(userId);
    } catch (error: any) {
      toast.error(error.message || "Failed to add goal");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGoal = async (goalId: string) => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goalId);

      if (error) throw error;

      toast.success("Goal deleted");
      await loadSettings(userId);
    } catch (error: any) {
      toast.error(error.message || "Failed to delete goal");
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/auth');
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="p-4 flex items-center gap-3 sticky top-0 bg-background/80 backdrop-blur-lg z-10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate('/')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="px-4 space-y-6">
        {/* Budget Settings */}
        <div className="glass-card p-6 rounded-2xl shadow-card">
          <h2 className="text-xl font-bold mb-4">Budget Settings</h2>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Weekly Budget</Label>
                <span className="text-2xl font-bold text-primary">
                  ₹{weeklyBudget.toLocaleString()}
                </span>
              </div>
              <Slider
                value={[weeklyBudget]}
                onValueChange={(v) => setWeeklyBudget(v[0])}
                min={500}
                max={20000}
                step={100}
                className="py-4"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>₹500</span>
                <span>₹20,000</span>
              </div>
            </div>

            <div className="pt-4 border-t border-border/50">
              <p className="text-sm text-muted-foreground mb-2">Daily Budget (Auto-calculated)</p>
              <div className="text-xl font-bold text-secondary">
                ₹{Math.floor(weeklyBudget / 7).toLocaleString()}
              </div>
            </div>

            <Button onClick={handleSaveBudget} className="w-full neon-glow" disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              {loading ? "Saving..." : "Save Budget"}
            </Button>
          </div>
        </div>

        {/* Goals Management */}
        <div className="glass-card p-6 rounded-2xl shadow-card">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5" />
            Savings Goals
          </h2>

          {/* Existing Goals */}
          <div className="space-y-3 mb-6">
            {goals.length === 0 ? (
              <p className="text-muted-foreground text-center py-4">No goals yet</p>
            ) : (
              goals.map((goal) => {
                const progress = (Number(goal.current_amount) / Number(goal.target_amount)) * 100;
                return (
                  <div key={goal.id} className="glass-card p-4 rounded-xl">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h3 className="font-semibold">{goal.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          ₹{Number(goal.current_amount).toLocaleString()} / ₹{Number(goal.target_amount).toLocaleString()}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-accent to-secondary transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Add New Goal */}
          <div className="pt-4 border-t border-border/50 space-y-4">
            <h3 className="font-semibold">Add New Goal</h3>
            <div className="space-y-3">
              <div>
                <Label htmlFor="goal-name">Goal Name</Label>
                <Input
                  id="goal-name"
                  placeholder="New Phone, Vacation..."
                  value={newGoalName}
                  onChange={(e) => setNewGoalName(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="goal-amount">Target Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="goal-amount"
                    type="number"
                    placeholder="15000"
                    value={newGoalAmount}
                    onChange={(e) => setNewGoalAmount(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="goal-deadline">Deadline (Optional)</Label>
                <Input
                  id="goal-deadline"
                  type="date"
                  value={newGoalDeadline}
                  onChange={(e) => setNewGoalDeadline(e.target.value)}
                />
              </div>

              <Button onClick={handleAddGoal} className="w-full" disabled={loading}>
                <Target className="w-4 h-4 mr-2" />
                Add Goal
              </Button>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="glass-card p-6 rounded-2xl shadow-card">
          <h2 className="text-xl font-bold mb-4">Features</h2>
          <div className="grid grid-cols-2 gap-3">
            <Card 
              className="p-4 cursor-pointer hover:bg-accent/10 transition-colors"
              onClick={() => navigate('/chat')}
            >
              <MessageSquare className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold text-sm">AI Assistant</h3>
              <p className="text-xs text-muted-foreground">Chat with advisor</p>
            </Card>
            
            <Card 
              className="p-4 cursor-pointer hover:bg-accent/10 transition-colors"
              onClick={() => navigate('/achievements')}
            >
              <Award className="w-8 h-8 text-accent mb-2" />
              <h3 className="font-semibold text-sm">Achievements</h3>
              <p className="text-xs text-muted-foreground">View badges & XP</p>
            </Card>
            
            <Card 
              className="p-4 cursor-pointer hover:bg-accent/10 transition-colors"
              onClick={() => navigate('/bills')}
            >
              <CreditCard className="w-8 h-8 text-secondary mb-2" />
              <h3 className="font-semibold text-sm">Bills</h3>
              <p className="text-xs text-muted-foreground">Manage payments</p>
            </Card>
            
            <Card 
              className="p-4 cursor-pointer hover:bg-accent/10 transition-colors"
              onClick={() => navigate('/bank-sync')}
            >
              <Zap className="w-8 h-8 text-primary mb-2" />
              <h3 className="font-semibold text-sm">Bank Sync</h3>
              <p className="text-xs text-muted-foreground">Demo mode</p>
            </Card>
          </div>
        </div>

        {/* Sign Out */}
        <Button
          variant="destructive"
          className="w-full"
          onClick={handleSignOut}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default Settings;
