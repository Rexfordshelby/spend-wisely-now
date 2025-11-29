import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, RefreshCcw, Wallet, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export default function BankSync() {
  const navigate = useNavigate();
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<any>(null);

  const syncBank = async () => {
    setIsSyncing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase.functions.invoke("sync-mock-bank", {
        body: { userId: user.id }
      });

      if (error) throw error;

      setLastSyncResult(data);
      toast.success(`Synced ${data.transactions_synced} transactions`);
      
      // Calculate achievements after sync
      await supabase.functions.invoke("calculate-achievements", {
        body: { userId: user.id }
      });
    } catch (error) {
      console.error("Error syncing bank:", error);
      toast.error("Failed to sync bank account");
    } finally {
      setIsSyncing(false);
    }
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
            <h1 className="text-2xl font-bold">Bank Sync</h1>
            <p className="text-sm text-muted-foreground">Sync your transactions (Demo Mode)</p>
          </div>
        </div>

        {/* Sync Card */}
        <Card className="mb-6 bg-gradient-primary text-primary-foreground">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="text-sm opacity-90 mb-1">Demo Bank Account</p>
                <p className="text-2xl font-bold">Mock Bank Connection</p>
              </div>
              <Wallet className="w-12 h-12 opacity-90" />
            </div>
            <Button
              onClick={syncBank}
              disabled={isSyncing}
              className="w-full bg-background text-foreground hover:bg-background/90"
            >
              {isSyncing ? (
                <>
                  <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Sync Now
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Last Sync Result */}
        {lastSyncResult && (
          <Card className="bg-card/80 backdrop-blur border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
                Last Sync
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Transactions Synced</span>
                  <span className="font-semibold">{lastSyncResult.transactions_synced}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-semibold text-primary">₹{lastSyncResult.total_amount}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Balance</span>
                  <span className="font-semibold">₹{lastSyncResult.new_balance}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Info Card */}
        <Card className="mt-6 bg-muted/50">
          <CardContent className="pt-6">
            <h3 className="font-semibold mb-2">About Demo Mode</h3>
            <p className="text-sm text-muted-foreground">
              This demo generates sample transactions to simulate real bank synchronization. 
              In a production app, this would connect to actual banking APIs like Plaid or Razorpay.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
