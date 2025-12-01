import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QrCode, X } from "lucide-react";
import { toast } from "sonner";
import QRScanner from "@/components/QRScanner";

const ScanPay = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [amount, setAmount] = useState("");

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const handleScan = async (qrData: string) => {
    setScanning(false);
    
    try {
      const { data, error } = await supabase.functions.invoke('qr-payment', {
        body: { qrData }
      });

      if (error) throw error;
      
      setPaymentInfo(data.paymentInfo);
      if (data.paymentInfo.amount) {
        setAmount(data.paymentInfo.amount.toString());
      }
      
      toast.success("QR Code scanned successfully");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handlePay = async () => {
    if (!amount || !paymentInfo) {
      toast.error("Please enter amount");
      return;
    }

    // Process payment logic here
    toast.success("Payment processing...");
    setTimeout(() => {
      navigate('/');
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto p-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Scan & Pay</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {!paymentInfo ? (
          <Card className="p-8 text-center space-y-6">
            <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
              <QrCode className="w-16 h-16 text-primary" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold mb-2">Scan Any QR Code</h2>
              <p className="text-muted-foreground">
                Supports UPI, World Vault, and other payment QR codes
              </p>
            </div>

            <Button
              className="w-full h-12"
              onClick={() => setScanning(true)}
            >
              <QrCode className="w-4 h-4 mr-2" />
              Open Camera
            </Button>
          </Card>
        ) : (
          <Card className="p-6 space-y-6">
            <div className="text-center">
              <div className="text-4xl mb-2">✅</div>
              <h2 className="text-xl font-bold">Payment Details</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground">Pay to</Label>
                <p className="text-lg font-semibold">{paymentInfo.recipientName}</p>
                <p className="text-sm text-muted-foreground">{paymentInfo.recipientId}</p>
              </div>

              <div className="space-y-2">
                <Label>Amount ({paymentInfo.currency})</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!!paymentInfo.amount}
                />
              </div>

              <Button
                className="w-full h-12"
                onClick={handlePay}
                disabled={!amount}
              >
                Pay {amount} {paymentInfo.currency}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setPaymentInfo(null);
                  setAmount("");
                }}
              >
                Scan Another QR
              </Button>
            </div>
          </Card>
        )}
      </div>

      {scanning && (
        <QRScanner
          onScan={handleScan}
          onClose={() => setScanning(false)}
        />
      )}
    </div>
  );
};

export default ScanPay;