import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Bell, CreditCard, Plus, Calendar, DollarSign, Home, BarChart3, Users, MessageSquare, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import BottomNavLink from "@/components/BottomNavLink";
import { toast } from "sonner";

export default function Bills() {
  const navigate = useNavigate();
  const [bills, setBills] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isAddingBill, setIsAddingBill] = useState(false);
  const [newBill, setNewBill] = useState({
    name: "",
    amount: "",
    due_date: "",
    category: "Bills",
    recurring: false
  });

  useEffect(() => {
    loadBillsAndSubscriptions();
  }, []);

  const loadBillsAndSubscriptions = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: billsData } = await supabase
      .from("bills")
      .select("*")
      .eq("user_id", user.id)
      .order("due_date", { ascending: true });

    const { data: subsData } = await supabase
      .from("subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .order("next_billing_date", { ascending: true });

    if (billsData) setBills(billsData);
    if (subsData) setSubscriptions(subsData);
  };

  const addBill = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("bills").insert({
      user_id: user.id,
      name: newBill.name,
      amount: parseFloat(newBill.amount),
      due_date: newBill.due_date,
      category: newBill.category,
      recurring: newBill.recurring
    });

    if (error) {
      toast.error("Failed to add bill");
    } else {
      toast.success("Bill added successfully");
      setIsAddingBill(false);
      setNewBill({ name: "", amount: "", due_date: "", category: "Bills", recurring: false });
      loadBillsAndSubscriptions();
    }
  };

  const totalMonthlySubscriptions = subscriptions.reduce(
    (sum, sub) => sum + (sub.billing_cycle === "monthly" ? Number(sub.amount) : Number(sub.amount) / 12),
    0
  );

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
              <h1 className="text-2xl font-bold">Bills & Subscriptions</h1>
              <p className="text-sm text-muted-foreground">Manage recurring payments</p>
            </div>
          </div>
          <Dialog open={isAddingBill} onOpenChange={setIsAddingBill}>
            <DialogTrigger asChild>
              <Button size="sm" className="bg-gradient-primary">
                <Plus className="w-4 h-4 mr-2" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Bill</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <Label>Bill Name</Label>
                  <Input
                    value={newBill.name}
                    onChange={(e) => setNewBill({ ...newBill, name: e.target.value })}
                    placeholder="Electricity Bill"
                  />
                </div>
                <div>
                  <Label>Amount (₹)</Label>
                  <Input
                    type="number"
                    value={newBill.amount}
                    onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                    placeholder="1500"
                  />
                </div>
                <div>
                  <Label>Due Date</Label>
                  <Input
                    type="date"
                    value={newBill.due_date}
                    onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={newBill.category} onValueChange={(v) => setNewBill({ ...newBill, category: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Bills">Bills</SelectItem>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Shopping">Shopping</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={addBill} className="w-full bg-gradient-primary">
                  Add Bill
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Card */}
        <Card className="mb-6 bg-gradient-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm opacity-90 mb-1">Monthly Subscriptions</p>
                <p className="text-3xl font-bold">₹{Math.round(totalMonthlySubscriptions)}</p>
              </div>
              <CreditCard className="w-12 h-12 opacity-90" />
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Bills */}
        <Card className="mb-6 bg-card/80 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-primary" />
              Upcoming Bills
            </CardTitle>
          </CardHeader>
          <CardContent>
            {bills.length > 0 ? (
              <div className="space-y-3">
                {bills.map((bill) => (
                  <div key={bill.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div>
                      <h3 className="font-semibold">{bill.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3 h-3" />
                        <span>{new Date(bill.due_date).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">₹{bill.amount}</p>
                      {bill.recurring && (
                        <Badge variant="secondary" className="text-xs">Recurring</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No upcoming bills</p>
            )}
          </CardContent>
        </Card>

        {/* Active Subscriptions */}
        <Card className="bg-card/80 backdrop-blur border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary" />
              Active Subscriptions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {subscriptions.length > 0 ? (
              <div className="space-y-3">
                {subscriptions.map((sub) => (
                  <div key={sub.id} className="flex items-center justify-between p-3 bg-background/50 rounded-lg">
                    <div>
                      <h3 className="font-semibold">{sub.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{sub.billing_cycle}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-primary">₹{sub.amount}</p>
                      <p className="text-xs text-muted-foreground">
                        Next: {new Date(sub.next_billing_date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-4">No active subscriptions</p>
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
