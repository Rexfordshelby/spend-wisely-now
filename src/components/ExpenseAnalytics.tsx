import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";

const EXPENSE_DATA = {
  categories: [
    { name: 'Food', value: 8500, color: 'hsl(var(--primary))' },
    { name: 'Transport', value: 3200, color: 'hsl(var(--secondary))' },
    { name: 'Shopping', value: 5600, color: 'hsl(var(--accent))' },
    { name: 'Entertainment', value: 2400, color: 'hsl(var(--destructive))' },
    { name: 'Bills', value: 12000, color: 'hsl(var(--muted-foreground))' },
    { name: 'Others', value: 1800, color: 'hsl(220 14% 50%)' },
  ],
  daily: [
    { day: 'Mon', income: 0, expense: 450 },
    { day: 'Tue', income: 5000, expense: 800 },
    { day: 'Wed', income: 0, expense: 320 },
    { day: 'Thu', income: 0, expense: 1200 },
    { day: 'Fri', income: 0, expense: 2500 },
    { day: 'Sat', income: 0, expense: 3200 },
    { day: 'Sun', income: 0, expense: 1800 },
  ],
  monthly: [
    { month: 'Jul', income: 45000, expense: 32000 },
    { month: 'Aug', income: 48000, expense: 35000 },
    { month: 'Sep', income: 52000, expense: 38000 },
    { month: 'Oct', income: 50000, expense: 33500 },
    { month: 'Nov', income: 55000, expense: 36000 },
    { month: 'Dec', income: 58000, expense: 33500 },
  ],
  insights: [
    { category: 'Food', change: 12, trend: 'up' },
    { category: 'Transport', change: -8, trend: 'down' },
    { category: 'Shopping', change: 25, trend: 'up' },
    { category: 'Entertainment', change: 0, trend: 'neutral' },
  ]
};

const ExpenseAnalytics = () => {
  const totalExpense = EXPENSE_DATA.categories.reduce((sum, c) => sum + c.value, 0);
  const avgDaily = Math.round(totalExpense / 30);
  const savingsRate = 32; // percentage

  return (
    <div className="space-y-4">
      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <Card className="bg-card/80 backdrop-blur border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">This Month</p>
            <p className="text-xl font-bold">₹{(totalExpense / 1000).toFixed(1)}k</p>
            <div className="flex items-center justify-center gap-1 text-xs text-red-500">
              <ArrowUpRight className="w-3 h-3" />
              <span>8%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Daily Avg</p>
            <p className="text-xl font-bold">₹{avgDaily.toLocaleString()}</p>
            <div className="flex items-center justify-center gap-1 text-xs text-green-500">
              <ArrowDownRight className="w-3 h-3" />
              <span>5%</span>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card/80 backdrop-blur border-border/50">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground">Savings</p>
            <p className="text-xl font-bold">{savingsRate}%</p>
            <div className="flex items-center justify-center gap-1 text-xs text-green-500">
              <TrendingUp className="w-3 h-3" />
              <span>Good</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Breakdown */}
      <Card className="bg-card/80 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Expense Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={EXPENSE_DATA.categories}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={50}
                    dataKey="value"
                  >
                    {EXPENSE_DATA.categories.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-2">
              {EXPENSE_DATA.categories.slice(0, 4).map((cat) => (
                <div key={cat.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                    <span className="text-sm">{cat.name}</span>
                  </div>
                  <span className="text-sm font-medium">₹{cat.value.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Trend Chart */}
      <Card className="bg-card/80 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Income vs Expense</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="monthly">
            <TabsList className="w-full mb-4">
              <TabsTrigger value="daily" className="flex-1">Daily</TabsTrigger>
              <TabsTrigger value="monthly" className="flex-1">Monthly</TabsTrigger>
            </TabsList>
            <TabsContent value="daily">
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={EXPENSE_DATA.daily}>
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar dataKey="expense" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="monthly">
              <ResponsiveContainer width="100%" height={150}>
                <AreaChart data={EXPENSE_DATA.monthly}>
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                  />
                  <Area type="monotone" dataKey="income" stroke="hsl(var(--secondary))" fill="hsl(var(--secondary) / 0.2)" />
                  <Area type="monotone" dataKey="expense" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.2)" />
                </AreaChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Spending Insights */}
      <Card className="bg-card/80 backdrop-blur border-border/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Spending Insights</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {EXPENSE_DATA.insights.map((insight) => (
              <div key={insight.category} className="flex items-center justify-between">
                <span className="text-sm">{insight.category}</span>
                <div className={`flex items-center gap-1 text-sm ${
                  insight.trend === 'up' ? 'text-red-500' : 
                  insight.trend === 'down' ? 'text-green-500' : 'text-muted-foreground'
                }`}>
                  {insight.trend === 'up' && <TrendingUp className="w-4 h-4" />}
                  {insight.trend === 'down' && <TrendingDown className="w-4 h-4" />}
                  {insight.trend === 'neutral' && <Minus className="w-4 h-4" />}
                  <span>{insight.change > 0 ? '+' : ''}{insight.change}% vs last month</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ExpenseAnalytics;
