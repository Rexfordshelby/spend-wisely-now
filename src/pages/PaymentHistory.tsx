import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, Search, Filter, Download, 
  ArrowUpRight, ArrowDownLeft, RefreshCw,
  Calendar, TrendingUp, TrendingDown
} from "lucide-react";
import { format } from "date-fns";

interface Transaction {
  id: string;
  amount: number;
  type: string;
  category: string | null;
  description: string | null;
  created_at: string;
  is_recurring: boolean | null;
}

const PaymentHistory = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("all");
  const [stats, setStats] = useState({
    totalIn: 0,
    totalOut: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [searchTerm, activeFilter, transactions]);

  const loadTransactions = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/auth');
        return;
      }

      // Get wallet
      const { data: wallet } = await supabase
        .from('wallets')
        .select('id')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (!wallet) {
        setLoading(false);
        return;
      }

      // Get all transactions
      const { data: txns, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('wallet_id', wallet.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setTransactions(txns || []);
      
      // Calculate stats
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const totalIn = txns?.filter(t => t.type === 'credit').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const totalOut = txns?.filter(t => t.type === 'debit').reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      const thisMonth = txns?.filter(t => new Date(t.created_at) >= monthStart).reduce((sum, t) => sum + Number(t.amount), 0) || 0;
      
      setStats({ totalIn, totalOut, thisMonth });
    } catch (error) {
      console.error('Error loading transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterTransactions = () => {
    let filtered = [...transactions];
    
    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(t => 
        t.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Type filter
    if (activeFilter === 'sent') {
      filtered = filtered.filter(t => t.type === 'debit');
    } else if (activeFilter === 'received') {
      filtered = filtered.filter(t => t.type === 'credit');
    } else if (activeFilter === 'recurring') {
      filtered = filtered.filter(t => t.is_recurring);
    }
    
    setFilteredTransactions(filtered);
  };

  const getCategoryEmoji = (category: string | null) => {
    const emojis: Record<string, string> = {
      Food: "🍕",
      Transport: "🚗",
      Shopping: "🛍️",
      Entertainment: "🎮",
      Bills: "📱",
      Health: "💊",
      Education: "📚",
      Transfer: "💸",
      Salary: "💰",
      Other: "📦"
    };
    return emojis[category || 'Other'] || "📦";
  };

  const exportTransactions = () => {
    const csv = [
      ['Date', 'Description', 'Category', 'Type', 'Amount'].join(','),
      ...filteredTransactions.map(t => [
        format(new Date(t.created_at), 'yyyy-MM-dd HH:mm'),
        `"${t.description || ''}"`,
        t.category || '',
        t.type,
        t.amount
      ].join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pb-8">
      <div className="container mx-auto p-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold">Payment History</h1>
            <p className="text-sm text-muted-foreground">All your transactions</p>
          </div>
          <Button variant="outline" size="icon" onClick={exportTransactions}>
            <Download className="w-4 h-4" />
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="p-3 text-center bg-green-500/10 border-green-500/20">
            <TrendingUp className="w-5 h-5 mx-auto mb-1 text-green-500" />
            <div className="text-lg font-bold text-green-500">₹{stats.totalIn.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Received</div>
          </Card>
          <Card className="p-3 text-center bg-rose-500/10 border-rose-500/20">
            <TrendingDown className="w-5 h-5 mx-auto mb-1 text-rose-500" />
            <div className="text-lg font-bold text-rose-500">₹{stats.totalOut.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Sent</div>
          </Card>
          <Card className="p-3 text-center bg-primary/10 border-primary/20">
            <Calendar className="w-5 h-5 mx-auto mb-1 text-primary" />
            <div className="text-lg font-bold text-primary">₹{stats.thisMonth.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">This Month</div>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="all" className="mb-4" onValueChange={setActiveFilter}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="sent">Sent</TabsTrigger>
            <TabsTrigger value="received">Received</TabsTrigger>
            <TabsTrigger value="recurring">Recurring</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Transaction List */}
        <div className="space-y-3">
          {filteredTransactions.length === 0 ? (
            <Card className="p-8 text-center">
              <Filter className="w-12 h-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No transactions found</p>
            </Card>
          ) : (
            filteredTransactions.map((txn) => (
              <Card 
                key={txn.id} 
                className="p-4 hover:bg-accent/5 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{getCategoryEmoji(txn.category)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">
                      {txn.description || txn.category || 'Transaction'}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{format(new Date(txn.created_at), 'MMM dd, yyyy • HH:mm')}</span>
                      {txn.is_recurring && (
                        <Badge variant="outline" className="text-xs">
                          <RefreshCw className="w-3 h-3 mr-1" />
                          Recurring
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`text-lg font-bold flex items-center gap-1 ${
                      txn.type === 'credit' ? 'text-green-500' : 'text-rose-500'
                    }`}>
                      {txn.type === 'credit' ? (
                        <ArrowDownLeft className="w-4 h-4" />
                      ) : (
                        <ArrowUpRight className="w-4 h-4" />
                      )}
                      ₹{Number(txn.amount).toLocaleString()}
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {txn.category || 'Other'}
                    </Badge>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Load More */}
        {filteredTransactions.length >= 100 && (
          <Button variant="outline" className="w-full mt-4">
            Load More
          </Button>
        )}
      </div>
    </div>
  );
};

export default PaymentHistory;