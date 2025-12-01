import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Award, Zap, Star, Trophy, Home, BarChart3, Users, MessageSquare } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import BottomNavLink from "@/components/BottomNavLink";

export default function Achievements() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [streak, setStreak] = useState<any>(null);
  const [userBadges, setUserBadges] = useState<any[]>([]);
  const [allBadges, setAllBadges] = useState<any[]>([]);

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    const { data: streakData } = await supabase
      .from("streaks")
      .select("*")
      .eq("user_id", user.id)
      .single();

    const { data: badgesData } = await supabase
      .from("badges")
      .select("*");

    const { data: userBadgesData } = await supabase
      .from("user_badges")
      .select(`
        *,
        badges (*)
      `)
      .eq("user_id", user.id);

    if (profileData) setProfile(profileData);
    if (streakData) setStreak(streakData);
    if (badgesData) setAllBadges(badgesData);
    if (userBadgesData) setUserBadges(userBadgesData);
  };

  const level = Math.floor((profile?.xp || 0) / 100) + 1;
  const xpProgress = ((profile?.xp || 0) % 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 pb-28">
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
            <h1 className="text-2xl font-bold">Achievements</h1>
            <p className="text-sm text-muted-foreground">Your progress and badges</p>
          </div>
        </div>

        {/* Level Card */}
        <Card className="mb-6 bg-gradient-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm opacity-90 mb-1">Level</p>
                <p className="text-4xl font-bold">{level}</p>
              </div>
              <Trophy className="w-16 h-16 opacity-90" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>{profile?.xp || 0} XP</span>
                <span>{level * 100} XP</span>
              </div>
              <Progress value={xpProgress} className="h-2 bg-primary-foreground/20" />
            </div>
          </CardContent>
        </Card>

        {/* Streak Card */}
        <Card className="mb-6 bg-card/80 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-400" />
              Daily Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-3xl font-bold text-primary">{streak?.current_streak || 0}</p>
                <p className="text-sm text-muted-foreground">days in a row</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-semibold text-muted-foreground">Best</p>
                <p className="text-2xl font-bold">{streak?.longest_streak || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges */}
        <Card className="bg-card/80 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Badges
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              {allBadges.map((badge) => {
                const earned = userBadges.some(ub => ub.badges?.id === badge.id);
                return (
                  <div
                    key={badge.id}
                    className={`flex flex-col items-center text-center p-3 rounded-lg transition-all ${
                      earned
                        ? "bg-primary/10 border-2 border-primary"
                        : "bg-background/50 opacity-50"
                    }`}
                  >
                    <div className="text-3xl mb-2">{badge.icon}</div>
                    <p className="text-xs font-semibold mb-1">{badge.name}</p>
                    {earned && (
                      <Badge variant="secondary" className="text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Earned
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>

            {allBadges.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No badges available yet</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border/50 z-40">
        <div className="flex items-center justify-around p-3">
          <BottomNavLink to="/" icon={Home} label="Home" />
          <BottomNavLink to="/analytics" icon={BarChart3} label="Analytics" />
          <BottomNavLink to="/leaderboard" icon={Trophy} label="Leaderboard" />
          <BottomNavLink to="/social" icon={Users} label="Social" />
          <BottomNavLink to="/chat" icon={MessageSquare} label="Chat" />
        </div>
      </div>
    </div>
  );
}
