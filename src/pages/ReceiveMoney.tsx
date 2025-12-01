import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import CurrencySelector from "@/components/CurrencySelector";
import QRGenerator from "@/components/QRGenerator";

const ReceiveMoney = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("INR");
  const [showQR, setShowQR] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
      return;
    }

    // Get username from profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', session.user.id)
      .single();

    if (profile) {
      setUsername(profile.full_name || 'user');
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
          <h1 className="text-2xl font-bold">Receive Money</h1>
        </div>

        {!showQR ? (
          <Card className="p-6 space-y-6">
            <div className="space-y-2">
              <Label>Amount (Optional)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1"
                />
                <div className="w-32">
                  <CurrencySelector value={currency} onChange={setCurrency} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Leave empty to let sender choose amount
              </p>
            </div>

            <Button
              className="w-full h-12"
              onClick={() => setShowQR(true)}
            >
              Generate QR Code
            </Button>
          </Card>
        ) : (
          <Card className="p-8">
            <div className="text-center space-y-6">
              <h2 className="text-xl font-bold">Scan to Pay</h2>
              
              <QRGenerator
                username={username}
                amount={amount ? parseFloat(amount) : undefined}
                currency={currency}
              />

              <div className="bg-muted/50 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  Share this QR code with anyone who wants to send you money
                </p>
              </div>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowQR(false)}
              >
                Generate New QR
              </Button>
            </div>
          </Card>
        )}

        <div className="mt-6">
          <Card className="p-4 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <div className="text-2xl">💡</div>
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Your World Vault ID</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {username}@worldvault
                </p>
                <p className="text-xs text-muted-foreground">
                  Anyone can send you money using this ID
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default ReceiveMoney;