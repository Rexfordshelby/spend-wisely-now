import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, X, Keyboard, Store } from "lucide-react";
import { toast } from "sonner";
import QRScanner from "@/components/QRScanner";
import DemoQRCodes from "@/components/DemoQRCodes";
import PaymentProcessing from "@/components/PaymentProcessing";

const ScanPay = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<any>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [upiId, setUpiId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [transactionResult, setTransactionResult] = useState<any>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/auth');
    }
  };

  const parseQRData = (qrData: string) => {
    try {
      if (qrData.startsWith('upi://pay')) {
        const url = new URL(qrData);
        return {
          type: 'upi',
          recipientId: url.searchParams.get('pa') || '',
          recipientName: url.searchParams.get('pn') || url.searchParams.get('pa')?.split('@')[0] || 'Unknown',
          amount: parseFloat(url.searchParams.get('am') || '0'),
          currency: 'INR',
        };
      } else if (qrData.startsWith('worldvault://')) {
        const data = JSON.parse(atob(qrData.replace('worldvault://', '')));
        return {
          type: 'worldvault',
          ...data,
        };
      }
      return null;
    } catch (error) {
      console.error('Error parsing QR:', error);
      return null;
    }
  };

  const handleScan = (qrData: string) => {
    setScanning(false);
    const parsed = parseQRData(qrData);
    
    if (parsed) {
      setPaymentInfo(parsed);
      if (parsed.amount) {
        setAmount(parsed.amount.toString());
      }
      toast.success("QR Code scanned successfully");
    } else {
      toast.error("Invalid QR code format");
    }
  };

  const handleDemoSelect = (qrData: string, merchant: { name: string; amount?: number }) => {
    const parsed = parseQRData(qrData);
    if (parsed) {
      setPaymentInfo({
        ...parsed,
        recipientName: merchant.name,
      });
      if (merchant.amount) {
        setAmount(merchant.amount.toString());
      }
    }
  };

  const handleUpiIdSubmit = () => {
    if (!upiId.includes('@')) {
      toast.error("Please enter a valid UPI ID");
      return;
    }
    
    setPaymentInfo({
      type: 'upi',
      recipientId: upiId,
      recipientName: upiId.split('@')[0],
      currency: 'INR',
    });
  };

  const handlePay = async () => {
    if (!amount || !paymentInfo) {
      toast.error("Please enter amount");
      return;
    }

    setPaymentStatus('processing');

    try {
      const { data, error } = await supabase.functions.invoke('process-demo-payment', {
        body: {
          recipientId: paymentInfo.recipientId,
          amount: parseFloat(amount),
          currency: paymentInfo.currency || 'INR',
          note: note,
          paymentType: paymentInfo.type,
        }
      });

      if (error) throw error;

      setTransactionResult(data);
      setPaymentStatus('success');
    } catch (error: any) {
      console.error('Payment error:', error);
      setPaymentStatus('failed');
    }
  };

  const resetPayment = () => {
    setPaymentInfo(null);
    setAmount("");
    setNote("");
    setUpiId("");
    setPaymentStatus('idle');
    setTransactionResult(null);
  };

  const handlePaymentDone = () => {
    resetPayment();
    navigate('/');
  };

  if (paymentStatus !== 'idle') {
    return (
      <PaymentProcessing
        status={paymentStatus}
        amount={parseFloat(amount) || 0}
        currency={paymentInfo?.currency || 'INR'}
        recipientName={transactionResult?.recipientName || paymentInfo?.recipientName || 'Unknown'}
        transactionId={transactionResult?.transactionId}
        onDone={handlePaymentDone}
        onRetry={() => {
          setPaymentStatus('idle');
          handlePay();
        }}
      />
    );
  }

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
          <Tabs defaultValue="scan" className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="scan" className="flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                Scan
              </TabsTrigger>
              <TabsTrigger value="upi" className="flex items-center gap-2">
                <Keyboard className="w-4 h-4" />
                UPI ID
              </TabsTrigger>
              <TabsTrigger value="demo" className="flex items-center gap-2">
                <Store className="w-4 h-4" />
                Demo
              </TabsTrigger>
            </TabsList>

            <TabsContent value="scan">
              <Card className="p-8 text-center space-y-6">
                <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-primary" />
                </div>
                
                <div>
                  <h2 className="text-xl font-bold mb-2">Scan QR Code</h2>
                  <p className="text-muted-foreground">
                    Supports UPI and World Vault QR codes
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
            </TabsContent>

            <TabsContent value="upi">
              <Card className="p-6 space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-2">Enter UPI ID</h2>
                  <p className="text-muted-foreground text-sm">
                    Pay directly using UPI ID
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>UPI ID</Label>
                    <Input
                      placeholder="username@upi"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-1">Demo UPI IDs:</p>
                    <div className="flex flex-wrap gap-2">
                      {['demo@upi', 'coffee@worldvault', 'grocery@worldvault'].map((id) => (
                        <button
                          key={id}
                          className="px-2 py-1 rounded bg-accent/10 hover:bg-accent/20"
                          onClick={() => setUpiId(id)}
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                  </div>

                  <Button
                    className="w-full h-12"
                    onClick={handleUpiIdSubmit}
                    disabled={!upiId}
                  >
                    Continue
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="demo">
              <DemoQRCodes onSelect={handleDemoSelect} />
            </TabsContent>
          </Tabs>
        ) : (
          <Card className="p-6 space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">✅</span>
              </div>
              <h2 className="text-xl font-bold">Payment Details</h2>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-accent/10">
                <Label className="text-muted-foreground text-sm">Pay to</Label>
                <p className="text-lg font-semibold">{paymentInfo.recipientName}</p>
                <p className="text-sm text-muted-foreground">{paymentInfo.recipientId}</p>
              </div>

              <div className="space-y-2">
                <Label>Amount ({paymentInfo.currency || 'INR'})</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={!!paymentInfo.amount}
                  className="text-2xl font-bold h-14 text-center"
                />
              </div>

              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Input
                  placeholder="Add a note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                />
              </div>

              <Button
                className="w-full h-12 text-lg"
                onClick={handlePay}
                disabled={!amount}
              >
                Pay ₹{amount || '0'}
              </Button>

              <Button
                variant="outline"
                className="w-full"
                onClick={resetPayment}
              >
                Cancel
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