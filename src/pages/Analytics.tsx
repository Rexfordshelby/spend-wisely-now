import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, TrendingUp, PieChart as PieChartIcon, Home, BarChart3, Users, MessageSquare, Trophy, Wallet } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, BarChart, Bar } from "recharts";
import BottomNavLink from "@/components/BottomNavLink";
import ExpenseAnalytics from "@/components/ExpenseAnalytics";

export default function Analytics() {
  const navigate = useNavigate();
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: wallet } = await supabase
      .from("wallets")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (!wallet) return;

    // Category breakdown
    const { data: transactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("wallet_id", wallet.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (transactions) {
      // Group by category
      const categoryMap = new Map();
      transactions.forEach(t => {
        const category = t.category || "Other";
        categoryMap.set(category, (categoryMap.get(category) || 0) + Number(t.amount));
      });
      
      const catData = Array.from(categoryMap.entries()).map(([name, value]) => ({
        name,
        value: Math.round(value)
      }));
      setCategoryData(catData);

      // Weekly trend (last 4 weeks)
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const weekEnd = new Date();
        weekEnd.setDate(weekEnd.getDate() - (i * 7));
        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 7);

        const weekTransactions = transactions.filter(t => {
          const date = new Date(t.created_at);
          return date >= weekStart && date <= weekEnd;
        });

        const total = weekTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        weeks.push({
          week: `Week ${4 - i}`,
          amount: Math.round(total)
        });
      }
      setWeeklyData(weeks);

      // Monthly comparison (last 3 months)
      const months = [];
      for (let i = 2; i >= 0; i--) {
        const monthDate = new Date();
        monthDate.setMonth(monthDate.getMonth() - i);
        const monthName = monthDate.toLocaleString('default', { month: 'short' });

        const monthTransactions = transactions.filter(t => {
          const date = new Date(t.created_at);
          return date.getMonth() === monthDate.getMonth() && 
                 date.getFullYear() === monthDate.getFullYear();
        });

        const total = monthTransactions.reduce((sum, t) => sum + Number(t.amount), 0);
        months.push({
          month: monthName,
          amount: Math.round(total)
        });
      }
      setMonthlyData(months);
    }
  };

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', 'hsl(var(--destructive))', 'hsl(var(--muted))'];

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
            <h1 className="text-2xl font-bold">Analytics</h1>
            <p className="text-sm text-muted-foreground">Understand your spending patterns</p>
          </div>
        </div>

        {/* Tabs for different analytics views */}
        <Tabs defaultValue="expenses" className="mb-6">
          <TabsList className="w-full">
            <TabsTrigger value="expenses" className="flex-1">
              <Wallet className="w-4 h-4 mr-2" />
              Expenses
            </TabsTrigger>
            <TabsTrigger value="detailed" className="flex-1">
              <BarChart3 className="w-4 h-4 mr-2" />
              Detailed
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="expenses" className="mt-4">
            <ExpenseAnalytics />
          </TabsContent>
          
          <TabsContent value="detailed" className="mt-4">

        {/* Category Breakdown */}
        <Card className="mb-6 bg-card/80 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-primary" />
              Spending by Category
            </CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-4 space-y-2">
                  {categoryData.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                        <span className="text-sm">{item.name}</span>
                      </div>
                      <span className="text-sm font-semibold">₹{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="text-muted-foreground text-center py-8">No spending data available</p>
            )}
          </CardContent>
        </Card>

        {/* Weekly Trend */}
        <Card className="mb-6 bg-card/80 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Weekly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weeklyData}>
                  <XAxis dataKey="week" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Line type="monotone" dataKey="amount" stroke="hsl(var(--primary))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No weekly data available</p>
            )}
          </CardContent>
        </Card>

        {/* Monthly Comparison */}
        <Card className="bg-card/80 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle>Monthly Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={monthlyData}>
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">No monthly data available</p>
            )}
          </CardContent>
        </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background/90 backdrop-blur-lg border-t border-border/50 z-40">
        <div className="flex items-center justify-around p-3">
          <BottomNavLink to="/" icon={Home} label="Home" />
          <BottomNavLink to="/analytics" icon={BarChart3} label="Analytics" active />
          <BottomNavLink to="/leaderboard" icon={Trophy} label="Leaderboard" />
          <BottomNavLink to="/social" icon={Users} label="Social" />
          <BottomNavLink to="/chat" icon={MessageSquare} label="Chat" />
        </div>
      </div>
    </div>
  );
}
