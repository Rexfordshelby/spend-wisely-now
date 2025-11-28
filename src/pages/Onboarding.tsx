import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { toast } from "sonner";
import { ArrowRight, Target, Wallet, TrendingUp } from "lucide-react";

const Onboarding = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [walletId, setWalletId] = useState<string | null>(null);

  // Step 1: Monthly Income
  const [monthlyIncome, setMonthlyIncome] = useState("");

  // Step 2: Weekly Budget
  const [weeklyBudget, setWeeklyBudget] = useState(0);

  // Step 3: Savings Goal
  const [goalName, setGoalName] = useState("");
  const [goalAmount, setGoalAmount] = useState("");
  const [goalDeadline, setGoalDeadline] = useState("");

  const presetGoals = [
    "New Gadget",
    "Dream Trip",
    "Emergency Fund",
    "Custom Goal"
  ];

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

    // Get wallet ID
    const { data: wallet } = await supabase
      .from('wallets')
      .select('id')
      .eq('user_id', session.user.id)
      .single();

    if (wallet) {
      setWalletId(wallet.id);
    }
  };

  useEffect(() => {
    if (monthlyIncome) {
      const income = parseFloat(monthlyIncome);
      const suggested = Math.floor((income * 0.25) / 4);
      setWeeklyBudget(suggested);
    }
  }, [monthlyIncome]);

  const handleStep1 = () => {
    if (!monthlyIncome || parseFloat(monthlyIncome) <= 0) {
      toast.error("Please enter a valid monthly income");
      return;
    }
    setStep(2);
  };

  const handleStep2 = () => {
    if (weeklyBudget <= 0) {
      toast.error("Please set a weekly budget");
      return;
    }
    setStep(3);
  };

  const handleStep3 = async () => {
    if (!goalName || !goalAmount || parseFloat(goalAmount) <= 0) {
      toast.error("Please fill in all goal details");
      return;
    }

    setLoading(true);

    try {
      // Update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          monthly_income: parseFloat(monthlyIncome),
          onboarding_completed: true
        })
        .eq('id', userId);

      if (profileError) throw profileError;

      // Create budget
      const dailyBudget = Math.floor(weeklyBudget / 7);
      const { error: budgetError } = await supabase
        .from('budgets')
        .insert({
          user_id: userId,
          weekly_limit: weeklyBudget,
          daily_limit: dailyBudget
        });

      if (budgetError) throw budgetError;

      // Create goal
      const { error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          name: goalName,
          target_amount: parseFloat(goalAmount),
          deadline: goalDeadline || null,
          current_amount: 0,
          status: 'active'
        });

      if (goalError) throw goalError;

      toast.success("Welcome to World Vault!");
      navigate('/');
    } catch (error: any) {
      toast.error(error.message || "Setup failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Progress indicator */}
        <div className="flex justify-center gap-2 mb-8">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className={`h-1 flex-1 rounded-full transition-all ${
                i <= step ? 'bg-primary' : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <div className="glass-card rounded-2xl p-8 shadow-card slide-up">
          {step === 1 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-primary/10">
                  <Wallet className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Monthly Income</h2>
                  <p className="text-sm text-muted-foreground">How much do you earn?</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="income" className="text-lg">Enter your monthly income</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-2xl text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="income"
                    type="number"
                    placeholder="25000"
                    value={monthlyIncome}
                    onChange={(e) => setMonthlyIncome(e.target.value)}
                    className="pl-10 text-2xl h-14"
                  />
                </div>
              </div>

              <Button onClick={handleStep1} className="w-full neon-glow" size="lg">
                Next
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-secondary/10">
                  <TrendingUp className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Weekly Budget</h2>
                  <p className="text-sm text-muted-foreground">Set your spending limit</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-4xl font-bold text-primary mb-2">
                    ₹{weeklyBudget.toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">per week</p>
                </div>

                <Slider
                  value={[weeklyBudget]}
                  onValueChange={(v) => setWeeklyBudget(v[0])}
                  min={500}
                  max={parseFloat(monthlyIncome) * 0.5 || 10000}
                  step={100}
                  className="py-4"
                />

                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹500</span>
                  <span>₹{Math.floor((parseFloat(monthlyIncome) * 0.5)).toLocaleString()}</span>
                </div>
              </div>

              <Button onClick={handleStep2} className="w-full neon-glow" size="lg">
                Next
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-xl bg-accent/10">
                  <Target className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Savings Goal</h2>
                  <p className="text-sm text-muted-foreground">What are you saving for?</p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  {presetGoals.map((goal) => (
                    <Button
                      key={goal}
                      variant={goalName === goal ? "default" : "outline"}
                      onClick={() => setGoalName(goal)}
                      className="h-auto py-3"
                    >
                      {goal}
                    </Button>
                  ))}
                </div>

                {goalName === "Custom Goal" && (
                  <Input
                    placeholder="Enter goal name"
                    value={goalName !== "Custom Goal" ? goalName : ""}
                    onChange={(e) => setGoalName(e.target.value)}
                  />
                )}

                <div className="space-y-2">
                  <Label htmlFor="amount">Target Amount</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
                      ₹
                    </span>
                    <Input
                      id="amount"
                      type="number"
                      placeholder="15000"
                      value={goalAmount}
                      onChange={(e) => setGoalAmount(e.target.value)}
                      className="pl-10 text-xl h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="deadline">Deadline (Optional)</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={goalDeadline}
                    onChange={(e) => setGoalDeadline(e.target.value)}
                  />
                </div>
              </div>

              <Button
                onClick={handleStep3}
                className="w-full neon-glow"
                size="lg"
                disabled={loading}
              >
                {loading ? "Setting up..." : "Complete Setup"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
