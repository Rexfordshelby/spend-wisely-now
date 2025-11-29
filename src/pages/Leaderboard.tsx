import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Trophy, Medal, Award } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

export default function Leaderboard() {
  const navigate = useNavigate();
  const [leaders, setLeaders] = useState<any[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<number | null>(null);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data: profiles } = await supabase
      .from("profiles")
      .select("*")
      .order("xp", { ascending: false })
      .limit(50);

    if (profiles) {
      setLeaders(profiles);
      if (user) {
        const rank = profiles.findIndex(p => p.id === user.id);
        setCurrentUserRank(rank !== -1 ? rank + 1 : null);
      }
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="w-6 h-6 text-yellow-400" />;
    if (index === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (index === 2) return <Medal className="w-6 h-6 text-amber-600" />;
    return <Award className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 pb-24">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate("/")}
            className="hover:bg-primary/10"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Leaderboard</h1>
            <p className="text-sm text-muted-foreground">Top savers this month</p>
          </div>
        </div>

        {/* Current User Rank */}
        {currentUserRank && (
          <Card className="mb-6 p-4 bg-gradient-primary text-primary-foreground">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90">Your Rank</p>
                <p className="text-3xl font-bold">#{currentUserRank}</p>
              </div>
              <Trophy className="w-12 h-12 opacity-90" />
            </div>
          </Card>
        )}

        {/* Leaderboard List */}
        <div className="space-y-3">
          {leaders.map((leader, index) => (
            <Card
              key={leader.id}
              className={`p-4 transition-all hover:scale-[1.02] ${
                index < 3 ? "bg-gradient-to-r from-card/80 to-card border-primary/30" : "bg-card/60"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 w-10 flex items-center justify-center">
                  {index < 3 ? (
                    getRankIcon(index)
                  ) : (
                    <span className="text-lg font-bold text-muted-foreground">#{index + 1}</span>
                  )}
                </div>

                <Avatar className="w-12 h-12">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                    {leader.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <h3 className="font-semibold">{leader.full_name || "Anonymous"}</h3>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{leader.xp || 0} XP</span>
                    <span>•</span>
                    <span>Level {Math.floor((leader.xp || 0) / 100) + 1}</span>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Budget Score</p>
                  <p className="text-lg font-bold text-primary">
                    {leader.budget_adherence_score || 100}%
                  </p>
                </div>
              </div>
            </Card>
          ))}

          {leaders.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No rankings available yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
