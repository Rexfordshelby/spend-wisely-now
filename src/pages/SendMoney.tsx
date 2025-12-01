import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Send } from "lucide-react";
import { toast } from "sonner";
import CurrencySelector from "@/components/CurrencySelector";
import ExchangeRateDisplay from "@/components/ExchangeRateDisplay";

const SendMoney = () => {
  const navigate = useNavigate();
  const [amount, setAmount] = useState("");
  const [sourceCurrency, setSourceCurrency] = useState("INR");
  const [targetCurrency, setTargetCurrency] = useState("USD");
  const [recipientName, setRecipientName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const handleSend = async () => {
    if (!amount || !recipientName) {
      toast.error("Please fill all fields");
      return;
    }

    setLoading(true);
    try {
      // Get exchange rate
      const { data: rateData } = await supabase.functions.invoke('exchange-rates', {
        body: { base: sourceCurrency, target: targetCurrency }
      });

      // Send transfer
      const { data, error } = await supabase.functions.invoke('send-transfer', {
        body: {
          amount: parseFloat(amount),
          sourceCurrency,
          targetCurrency,
          exchangeRate: rateData.rate,
          transferType: 'wallet',
          recipientDetails: { name: recipientName }
        }
      });

      if (error) throw error;

      toast.success("Transfer initiated successfully!");
      navigate('/transfers');
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
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
          <h1 className="text-2xl font-bold">Send Money</h1>
        </div>

        {/* Send Form */}
        <Card className="p-6 space-y-6">
          <div className="space-y-2">
            <Label>Recipient Name</Label>
            <Input
              placeholder="Enter recipient name"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>You Send</Label>
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1"
              />
              <div className="w-32">
                <CurrencySelector value={sourceCurrency} onChange={setSourceCurrency} />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>They Receive</Label>
            <CurrencySelector value={targetCurrency} onChange={setTargetCurrency} />
          </div>

          {amount && (
            <ExchangeRateDisplay
              from={sourceCurrency}
              to={targetCurrency}
              amount={parseFloat(amount)}
            />
          )}

          <Button
            className="w-full h-12"
            onClick={handleSend}
            disabled={loading}
          >
            <Send className="w-4 h-4 mr-2" />
            {loading ? "Processing..." : "Send Money"}
          </Button>
        </Card>

        <div className="mt-6 space-y-4">
          <h2 className="font-semibold">Recent Recipients</h2>
          <div className="text-center py-8 text-muted-foreground">
            No recent recipients
          </div>
        </div>
      </div>
    </div>
  );
};

export default SendMoney;