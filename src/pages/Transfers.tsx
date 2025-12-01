import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

interface Transfer {
  id: string;
  amount: number;
  source_currency: string;
  target_currency: string;
  status: string;
  created_at: string;
  recipient_details: any;
}

const Transfers = () => {
  const navigate = useNavigate();
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }
    loadTransfers();
  };

  const loadTransfers = async () => {
    try {
      const { data, error } = await supabase
        .from('international_transfers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransfers(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-destructive" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-500/10 text-green-500';
      case 'failed':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-yellow-500/10 text-yellow-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate('/wallets')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-2xl font-bold">Transfer History</h1>
        </div>

        {/* Transfers List */}
        <div className="space-y-3">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading...</div>
          ) : transfers.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground mb-4">No transfers yet</p>
              <Button onClick={() => navigate('/send')}>Send Your First Transfer</Button>
            </Card>
          ) : (
            transfers.map((transfer) => (
              <Card key={transfer.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    {getStatusIcon(transfer.status)}
                    <div>
                      <div className="font-semibold">
                        {transfer.recipient_details?.name || 'Unknown Recipient'}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(transfer.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <Badge className={getStatusColor(transfer.status)}>
                    {transfer.status}
                  </Badge>
                </div>

                <div className="flex items-center justify-between border-t border-border pt-3">
                  <div className="text-sm text-muted-foreground">
                    {transfer.source_currency} → {transfer.target_currency}
                  </div>
                  <div className="text-lg font-bold">
                    {transfer.amount.toFixed(2)} {transfer.source_currency}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Transfers;