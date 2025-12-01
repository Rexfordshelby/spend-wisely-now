import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Heart, Share2, Trophy, Target, TrendingUp, Zap, Home, BarChart3, Users, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import BottomNavLink from "@/components/BottomNavLink";
import { toast } from "sonner";

export default function Social() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState<any[]>([]);

  useEffect(() => {
    loadSocialFeed();
  }, []);

  const loadSocialFeed = async () => {
    const { data } = await supabase
      .from("social_posts")
      .select(`
        *,
        profiles (full_name, xp)
      `)
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) {
      setPosts(data);
    }
  };

  const getPostIcon = (type: string) => {
    switch (type) {
      case "achievement":
        return <Trophy className="w-5 h-5 text-yellow-400" />;
      case "goal_completed":
        return <Target className="w-5 h-5 text-green-400" />;
      case "milestone":
        return <TrendingUp className="w-5 h-5 text-primary" />;
      case "streak":
        return <Zap className="w-5 h-5 text-orange-400" />;
      default:
        return <Heart className="w-5 h-5 text-primary" />;
    }
  };

  const shareAchievement = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (!profile) return;

    const { error } = await supabase.from("social_posts").insert({
      user_id: user.id,
      content: `Just reached Level ${Math.floor((profile.xp || 0) / 100) + 1}! 🎉`,
      post_type: "milestone"
    });

    if (error) {
      toast.error("Failed to share achievement");
    } else {
      toast.success("Achievement shared!");
      loadSocialFeed();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 pb-28">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
              className="hover:bg-primary/10"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Social Feed</h1>
              <p className="text-sm text-muted-foreground">Community achievements</p>
            </div>
          </div>
          <Button
            onClick={shareAchievement}
            size="sm"
            className="bg-gradient-primary"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Feed */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Card key={post.id} className="p-4 bg-card/80 backdrop-blur border-border/50">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {post.profiles?.full_name?.[0]?.toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{post.profiles?.full_name || "Anonymous"}</span>
                    <span className="text-xs text-muted-foreground">
                      Level {Math.floor((post.profiles?.xp || 0) / 100) + 1}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mb-2">
                    {getPostIcon(post.post_type)}
                    <span className="text-xs text-muted-foreground capitalize">
                      {post.post_type.replace("_", " ")}
                    </span>
                  </div>

                  <p className="text-sm mb-3">{post.content}</p>

                  <div className="flex items-center gap-4 text-muted-foreground">
                    <button className="flex items-center gap-1 hover:text-primary transition-colors">
                      <Heart className="w-4 h-4" />
                      <span className="text-xs">{post.likes_count || 0}</span>
                    </button>
                    <span className="text-xs">
                      {new Date(post.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          ))}

          {posts.length === 0 && (
            <div className="text-center py-12">
              <Share2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No posts yet</p>
              <Button
                onClick={shareAchievement}
                className="mt-4 bg-gradient-primary"
              >
                Share Your First Achievement
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border/50 z-40">
        <div className="flex items-center justify-around p-3">
          <BottomNavLink to="/" icon={Home} label="Home" />
          <BottomNavLink to="/analytics" icon={BarChart3} label="Analytics" />
          <BottomNavLink to="/leaderboard" icon={Trophy} label="Leaderboard" />
          <BottomNavLink to="/social" icon={Users} label="Social" active />
          <BottomNavLink to="/chat" icon={MessageSquare} label="Chat" />
        </div>
      </div>
    </div>
  );
}
