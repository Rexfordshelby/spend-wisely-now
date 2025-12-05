import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ArrowLeft, Plus, Calendar, Clock, Trash2, Edit, Play, Pause, Bell } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

interface ScheduledPayment {
  id: string;
  recipient: string;
  amount: number;
  currency: string;
  frequency: string;
  nextDate: string;
  status: 'active' | 'paused';
  category: string;
}

const DEMO_SCHEDULED = [
  { id: '1', recipient: 'Netflix', amount: 649, currency: 'INR', frequency: 'monthly', nextDate: '2025-01-05', status: 'active' as const, category: 'Entertainment' },
  { id: '2', recipient: 'Spotify', amount: 119, currency: 'INR', frequency: 'monthly', nextDate: '2025-01-10', status: 'active' as const, category: 'Entertainment' },
  { id: '3', recipient: 'Gym Membership', amount: 1500, currency: 'INR', frequency: 'monthly', nextDate: '2025-01-01', status: 'active' as const, category: 'Health' },
  { id: '4', recipient: 'House Rent', amount: 25000, currency: 'INR', frequency: 'monthly', nextDate: '2025-01-01', status: 'active' as const, category: 'Housing' },
  { id: '5', recipient: 'Internet Bill', amount: 999, currency: 'INR', frequency: 'monthly', nextDate: '2025-01-15', status: 'paused' as const, category: 'Utilities' },
];

export default function ScheduledPayments() {
  const navigate = useNavigate();
  const [payments, setPayments] = useState<ScheduledPayment[]>(DEMO_SCHEDULED);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState<ScheduledPayment | null>(null);
  
  // Form state
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('INR');
  const [frequency, setFrequency] = useState('monthly');
  const [nextDate, setNextDate] = useState('');
  const [category, setCategory] = useState('');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const resetForm = () => {
    setRecipient('');
    setAmount('');
    setCurrency('INR');
    setFrequency('monthly');
    setNextDate('');
    setCategory('');
    setEditingPayment(null);
  };

  const handleSave = () => {
    if (!recipient || !amount || !nextDate) {
      toast.error('Please fill all required fields');
      return;
    }

    if (editingPayment) {
      setPayments(prev => prev.map(p => 
        p.id === editingPayment.id 
          ? { ...p, recipient, amount: parseFloat(amount), currency, frequency, nextDate, category }
          : p
      ));
      toast.success('Payment updated successfully');
    } else {
      const newPayment: ScheduledPayment = {
        id: Date.now().toString(),
        recipient,
        amount: parseFloat(amount),
        currency,
        frequency,
        nextDate,
        status: 'active',
        category
      };
      setPayments(prev => [...prev, newPayment]);
      toast.success('Scheduled payment created');
    }
    
    setDialogOpen(false);
    resetForm();
  };

  const handleEdit = (payment: ScheduledPayment) => {
    setEditingPayment(payment);
    setRecipient(payment.recipient);
    setAmount(payment.amount.toString());
    setCurrency(payment.currency);
    setFrequency(payment.frequency);
    setNextDate(payment.nextDate);
    setCategory(payment.category);
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    setPayments(prev => prev.filter(p => p.id !== id));
    toast.success('Payment deleted');
  };

  const toggleStatus = (id: string) => {
    setPayments(prev => prev.map(p => 
      p.id === id 
        ? { ...p, status: p.status === 'active' ? 'paused' as const : 'active' as const }
        : p
    ));
  };

  const totalMonthly = payments
    .filter(p => p.status === 'active')
    .reduce((sum, p) => sum + p.amount, 0);

  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = { INR: '₹', USD: '$', EUR: '€', GBP: '£', PKR: 'Rs' };
    return symbols[curr] || curr;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-background/90 pb-8">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Scheduled Payments</h1>
              <p className="text-sm text-muted-foreground">Manage recurring payments</p>
            </div>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="w-4 h-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingPayment ? 'Edit' : 'New'} Scheduled Payment</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <Label>Recipient Name</Label>
                  <Input value={recipient} onChange={(e) => setRecipient(e.target.value)} placeholder="Netflix, Rent, etc." />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Amount</Label>
                    <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" />
                  </div>
                  <div>
                    <Label>Currency</Label>
                    <Select value={currency} onValueChange={setCurrency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="INR">INR</SelectItem>
                        <SelectItem value="USD">USD</SelectItem>
                        <SelectItem value="EUR">EUR</SelectItem>
                        <SelectItem value="GBP">GBP</SelectItem>
                        <SelectItem value="PKR">PKR</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Frequency</Label>
                    <Select value={frequency} onValueChange={setFrequency}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Next Payment</Label>
                    <Input type="date" value={nextDate} onChange={(e) => setNextDate(e.target.value)} />
                  </div>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Entertainment">Entertainment</SelectItem>
                      <SelectItem value="Utilities">Utilities</SelectItem>
                      <SelectItem value="Housing">Housing</SelectItem>
                      <SelectItem value="Health">Health</SelectItem>
                      <SelectItem value="Education">Education</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full" onClick={handleSave}>
                  {editingPayment ? 'Update' : 'Create'} Payment
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Summary Card */}
        <Card className="mb-6 bg-gradient-to-r from-primary/10 to-secondary/10 border-primary/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Monthly</p>
                <p className="text-3xl font-bold">₹{totalMonthly.toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Active Payments</p>
                <p className="text-2xl font-bold">{payments.filter(p => p.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment List */}
        <div className="space-y-3">
          {payments.map((payment) => (
            <Card key={payment.id} className={`bg-card/80 backdrop-blur border-border/50 ${payment.status === 'paused' ? 'opacity-60' : ''}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${payment.status === 'active' ? 'bg-primary/10' : 'bg-muted'}`}>
                      <Calendar className={`w-5 h-5 ${payment.status === 'active' ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{payment.recipient}</h3>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{payment.frequency}</span>
                        <span>•</span>
                        <span>{format(new Date(payment.nextDate), 'MMM d')}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">{payment.category}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-lg">{getCurrencySymbol(payment.currency)}{payment.amount.toLocaleString()}</p>
                    <div className="flex items-center gap-1 mt-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStatus(payment.id)}>
                        {payment.status === 'active' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(payment)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(payment.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {payments.length === 0 && (
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="font-semibold mb-2">No scheduled payments</h3>
            <p className="text-sm text-muted-foreground">Add your recurring bills and subscriptions</p>
          </Card>
        )}
      </div>
    </div>
  );
}
