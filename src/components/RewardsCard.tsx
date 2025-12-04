import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Gift, Zap, Trophy, Star, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Reward {
  id: string;
  title: string;
  description: string;
  xpRequired: number;
  icon: string;
  claimed: boolean;
}

const REWARDS: Reward[] = [
  { id: '1', title: 'First Payment', description: 'Complete your first payment', xpRequired: 10, icon: '💳', claimed: false },
  { id: '2', title: 'Budget Keeper', description: 'Stay within budget for a week', xpRequired: 50, icon: '📊', claimed: false },
  { id: '3', title: 'Savings Star', description: 'Save 10% of your income', xpRequired: 100, icon: '⭐', claimed: false },
  { id: '4', title: 'Global Traveler', description: 'Send money internationally', xpRequired: 200, icon: '🌍', claimed: false },
  { id: '5', title: 'Money Master', description: 'Reach 500 XP', xpRequired: 500, icon: '👑', claimed: false },
];

const RewardsCard = () => {
  const navigate = useNavigate();
  const [xp, setXp] = useState(0);
  const [level, setLevel] = useState(1);

  useEffect(() => {
    loadXp();
  }, []);

  const loadXp = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('xp')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setXp(profile.xp || 0);
        setLevel(Math.floor((profile.xp || 0) / 100) + 1);
      }
    } catch (error) {
      console.error('Error loading XP:', error);
    }
  };

  const xpToNextLevel = level * 100;
  const progressInLevel = xp % 100;
  const progressPercent = (progressInLevel / 100) * 100;

  const availableRewards = REWARDS.filter(r => xp >= r.xpRequired && !r.claimed);
  const nextReward = REWARDS.find(r => xp < r.xpRequired);

  return (
    <Card className="p-4 bg-gradient-to-br from-primary/10 via-background to-secondary/10 border-primary/20">
      {/* XP Progress */}
      <div className="flex items-center gap-4 mb-4">
        <div className="relative">
          <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Zap className="w-7 h-7 text-white" />
          </div>
          <div className="absolute -bottom-1 -right-1 bg-background rounded-full px-2 py-0.5 text-xs font-bold border">
            Lv.{level}
          </div>
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold">Level {level}</span>
            <span className="text-sm text-muted-foreground">{xp} / {xpToNextLevel} XP</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {/* Available Rewards */}
      {availableRewards.length > 0 && (
        <div className="mb-4 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
          <div className="flex items-center gap-2 text-green-500 mb-2">
            <Gift className="w-4 h-4" />
            <span className="text-sm font-medium">{availableRewards.length} rewards to claim!</span>
          </div>
          <div className="flex gap-2">
            {availableRewards.slice(0, 3).map(reward => (
              <div key={reward.id} className="text-2xl animate-bounce">
                {reward.icon}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Next Milestone */}
      {nextReward && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3">
            <div className="text-2xl opacity-50">{nextReward.icon}</div>
            <div>
              <div className="text-sm font-medium">{nextReward.title}</div>
              <div className="text-xs text-muted-foreground">
                {nextReward.xpRequired - xp} XP to unlock
              </div>
            </div>
          </div>
          <Progress 
            value={(xp / nextReward.xpRequired) * 100} 
            className="w-16 h-2" 
          />
        </div>
      )}

      {/* View All Button */}
      <Button 
        variant="ghost" 
        className="w-full mt-3 text-sm"
        onClick={() => navigate('/achievements')}
      >
        View All Achievements
        <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </Card>
  );
};

export default RewardsCard;