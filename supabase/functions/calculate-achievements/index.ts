import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId } = await req.json();
    
    console.log('Calculate achievements for user:', userId);

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch user data
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    const { data: wallet } = await supabase
      .from('wallets')
      .select('*')
      .eq('user_id', userId)
      .single();

    const { data: transactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('wallet_id', wallet?.id || '')
      .order('created_at', { ascending: false });

    const { data: badges } = await supabase
      .from('badges')
      .select('*');

    const { data: userBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId);

    const earnedBadgeIds = new Set(userBadges?.map(ub => ub.badge_id) || []);
    const newBadges = [];

    // Achievement logic
    for (const badge of badges || []) {
      if (earnedBadgeIds.has(badge.id)) continue;

      const criteria = badge.criteria as any;
      let earned = false;

      switch (badge.category) {
        case 'spending':
          if (criteria.spends_advised && profile?.spends_advised_count >= criteria.spends_advised) {
            earned = true;
          }
          if (criteria.spends_skipped && profile?.spends_skipped_count >= criteria.spends_skipped) {
            earned = true;
          }
          break;

        case 'saving':
          if (criteria.xp && profile?.xp >= criteria.xp) {
            earned = true;
          }
          break;

        case 'transactions':
          if (criteria.transaction_count && transactions && transactions.length >= criteria.transaction_count) {
            earned = true;
          }
          break;
      }

      if (earned) {
        newBadges.push({
          user_id: userId,
          badge_id: badge.id
        });
      }
    }

    // Award new badges
    if (newBadges.length > 0) {
      await supabase.from('user_badges').insert(newBadges);
      
      // Update XP
      const xpGained = newBadges.length * 100;
      await supabase
        .from('profiles')
        .update({ xp: (profile?.xp || 0) + xpGained })
        .eq('id', userId);
    }

    // Update streak
    const today = new Date().toISOString().split('T')[0];
    const { data: streak } = await supabase
      .from('streaks')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (transactions && transactions.length > 0) {
      const todayTransactions = transactions.filter(t => 
        t.created_at.startsWith(today)
      );

      if (todayTransactions.length > 0) {
        if (!streak) {
          await supabase.from('streaks').insert({
            user_id: userId,
            current_streak: 1,
            longest_streak: 1,
            last_activity_date: today
          });
        } else {
          const lastActivity = new Date(streak.last_activity_date);
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          let newStreak = streak.current_streak;
          if (streak.last_activity_date === yesterdayStr) {
            newStreak += 1;
          } else if (streak.last_activity_date !== today) {
            newStreak = 1;
          }

          await supabase.from('streaks').update({
            current_streak: newStreak,
            longest_streak: Math.max(newStreak, streak.longest_streak),
            last_activity_date: today
          }).eq('user_id', userId);
        }
      }
    }

    console.log(`Awarded ${newBadges.length} new badges`);

    return new Response(
      JSON.stringify({
        badges_earned: newBadges.length,
        new_badges: newBadges
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in calculate-achievements:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
