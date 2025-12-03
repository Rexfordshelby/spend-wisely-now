import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, X, Keyboard, Store, User, Building2 } from "lucide-react";
import { toast } from "sonner";
import QRScanner from "@/components/QRScanner";
import DemoQRCodes from "@/components/DemoQRCodes";
import PaymentProcessing from "@/components/PaymentProcessing";

interface PaymentInfo {
  type: string;
  recipientId: string;
  recipientName: string;
  amount?: number;
  currency: string;
  merchantCode?: string;
  transactionNote?: string;
  rawData?: string;
}

// Parse any QR code format
const parseAnyQRCode = (qrData: string): PaymentInfo | null => {
  console.log("Parsing QR data:", qrData);
  
  try {
    // UPI QR Code format: upi://pay?pa=xxx&pn=xxx&am=xxx&cu=xxx
    if (qrData.toLowerCase().startsWith('upi://')) {
      const url = new URL(qrData);
      const params = url.searchParams;
      
      return {
        type: 'upi',
        recipientId: params.get('pa') || params.get('PA') || '',
        recipientName: decodeURIComponent(params.get('pn') || params.get('PN') || params.get('pa')?.split('@')[0] || 'Merchant'),
        amount: params.get('am') || params.get('AM') ? parseFloat(params.get('am') || params.get('AM') || '0') : undefined,
        currency: params.get('cu') || params.get('CU') || 'INR',
        merchantCode: params.get('mc') || params.get('MC') || undefined,
        transactionNote: params.get('tn') || params.get('TN') || undefined,
        rawData: qrData,
      };
    }
    
    // World Vault QR format
    if (qrData.startsWith('worldvault://')) {
      const base64Data = qrData.replace('worldvault://', '');
      const decoded = JSON.parse(atob(base64Data));
      return {
        type: 'worldvault',
        recipientId: decoded.recipientId || '',
        recipientName: decoded.recipientName || 'World Vault User',
        amount: decoded.amount,
        currency: decoded.currency || 'INR',
        rawData: qrData,
      };
    }

    // PayTM QR (often starts with paytmqr:// or contains paytm)
    if (qrData.toLowerCase().includes('paytm')) {
      // Try to extract UPI from PayTM QR
      const upiMatch = qrData.match(/pa=([^&]+)/i);
      return {
        type: 'paytm',
        recipientId: upiMatch ? upiMatch[1] : 'paytm_merchant',
        recipientName: 'PayTM Merchant',
        currency: 'INR',
        rawData: qrData,
      };
    }

    // PhonePe QR
    if (qrData.toLowerCase().includes('phonepe')) {
      const upiMatch = qrData.match(/pa=([^&]+)/i);
      return {
        type: 'phonepe',
        recipientId: upiMatch ? upiMatch[1] : 'phonepe_merchant',
        recipientName: 'PhonePe Merchant',
        currency: 'INR',
        rawData: qrData,
      };
    }

    // Google Pay / GPay QR
    if (qrData.toLowerCase().includes('gpay') || qrData.toLowerCase().includes('tez')) {
      const upiMatch = qrData.match(/pa=([^&]+)/i);
      return {
        type: 'gpay',
        recipientId: upiMatch ? upiMatch[1] : 'gpay_merchant',
        recipientName: 'Google Pay Merchant',
        currency: 'INR',
        rawData: qrData,
      };
    }

    // BHIM QR
    if (qrData.toLowerCase().includes('bhim')) {
      const upiMatch = qrData.match(/pa=([^&]+)/i);
      return {
        type: 'bhim',
        recipientId: upiMatch ? upiMatch[1] : 'bhim_merchant',
        recipientName: 'BHIM Merchant',
        currency: 'INR',
        rawData: qrData,
      };
    }

    // Generic URL with payment parameters
    if (qrData.includes('pa=') || qrData.includes('PA=')) {
      const upiMatch = qrData.match(/pa=([^&]+)/i);
      const nameMatch = qrData.match(/pn=([^&]+)/i);
      const amountMatch = qrData.match(/am=([^&]+)/i);
      
      return {
        type: 'generic_upi',
        recipientId: upiMatch ? decodeURIComponent(upiMatch[1]) : 'unknown',
        recipientName: nameMatch ? decodeURIComponent(nameMatch[1]) : 'Merchant',
        amount: amountMatch ? parseFloat(amountMatch[1]) : undefined,
        currency: 'INR',
        rawData: qrData,
      };
    }

    // Try to parse as JSON (some QR codes are just JSON)
    try {
      const jsonData = JSON.parse(qrData);
      if (jsonData.upi || jsonData.pa || jsonData.vpa) {
        return {
          type: 'json_upi',
          recipientId: jsonData.upi || jsonData.pa || jsonData.vpa,
          recipientName: jsonData.name || jsonData.pn || 'Merchant',
          amount: jsonData.amount || jsonData.am,
          currency: jsonData.currency || 'INR',
          rawData: qrData,
        };
      }
    } catch (e) {
      // Not JSON, continue
    }

    // If nothing else matches, treat as plain text UPI ID
    if (qrData.includes('@')) {
      return {
        type: 'plain_upi',
        recipientId: qrData.trim(),
        recipientName: qrData.split('@')[0],
        currency: 'INR',
        rawData: qrData,
      };
    }

    // Unknown format - still allow payment
    return {
      type: 'unknown',
      recipientId: qrData.substring(0, 50),
      recipientName: 'Unknown Merchant',
      currency: 'INR',
      rawData: qrData,
    };

  } catch (error) {
    console.error('Error parsing QR code:', error);
    return null;
  }
};

const ScanPay = () => {
  const navigate = useNavigate();
  const [scanning, setScanning] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
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

  const handleScan = useCallback((qrData: string) => {
    console.log("Received QR data:", qrData);
    setScanning(false);
    
    const parsed = parseAnyQRCode(qrData);
    console.log("Parsed result:", parsed);
    
    if (parsed) {
      setPaymentInfo(parsed);
      if (parsed.amount) {
        setAmount(parsed.amount.toString());
      }
      if (parsed.transactionNote) {
        setNote(parsed.transactionNote);
      }
      toast.success(`${parsed.type.toUpperCase()} QR code detected!`);
    } else {
      toast.error("Could not parse QR code. Please try again.");
    }
  }, []);

  const handleDemoSelect = (qrData: string, merchant: { name: string; amount?: number }) => {
    const parsed = parseAnyQRCode(qrData);
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
      toast.error("Please enter a valid UPI ID (e.g., name@upi)");
      return;
    }
    
    setPaymentInfo({
      type: 'manual_upi',
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
          note: note || paymentInfo.transactionNote,
          paymentType: paymentInfo.type,
        }
      });

      if (error) throw error;

      setTransactionResult({
        ...data,
        recipientName: paymentInfo.recipientName,
      });
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

  // Get icon based on payment type
  const getPaymentTypeIcon = (type: string) => {
    switch (type) {
      case 'upi':
      case 'manual_upi':
      case 'plain_upi':
        return <User className="w-6 h-6" />;
      default:
        return <Building2 className="w-6 h-6" />;
    }
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
                <div className="w-32 h-32 mx-auto bg-primary/10 rounded-full flex items-center justify-center animate-pulse-glow">
                  <QrCode className="w-16 h-16 text-primary" />
                </div>
                
                <div>
                  <h2 className="text-xl font-bold mb-2">Scan Any QR Code</h2>
                  <p className="text-muted-foreground">
                    Works with UPI, PayTM, PhonePe, GPay & more
                  </p>
                </div>

                <Button
                  className="w-full h-12"
                  onClick={() => setScanning(true)}
                >
                  <QrCode className="w-4 h-4 mr-2" />
                  Open Camera
                </Button>
                
                <p className="text-xs text-muted-foreground">
                  Demo mode: Payments are simulated, no real money is transferred
                </p>
              </Card>
            </TabsContent>

            <TabsContent value="upi">
              <Card className="p-6 space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-2">Enter UPI ID</h2>
                  <p className="text-muted-foreground text-sm">
                    Pay directly using any UPI ID
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>UPI ID</Label>
                    <Input
                      placeholder="name@upi, name@paytm, name@ybl"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-2">Try these demo UPI IDs:</p>
                    <div className="flex flex-wrap gap-2">
                      {['demo@upi', 'starbucks@paytm', 'amazon@ybl', 'swiggy@axisbank'].map((id) => (
                        <button
                          key={id}
                          className="px-2 py-1 rounded bg-accent/10 hover:bg-accent/20 transition-colors"
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
                {getPaymentTypeIcon(paymentInfo.type)}
              </div>
              <h2 className="text-xl font-bold">Payment Details</h2>
              <span className="inline-block px-2 py-1 mt-2 text-xs rounded-full bg-primary/10 text-primary">
                {paymentInfo.type.replace('_', ' ').toUpperCase()}
              </span>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-accent/10">
                <Label className="text-muted-foreground text-sm">Pay to</Label>
                <p className="text-lg font-semibold">{paymentInfo.recipientName}</p>
                <p className="text-sm text-muted-foreground font-mono">{paymentInfo.recipientId}</p>
                {paymentInfo.merchantCode && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Merchant Code: {paymentInfo.merchantCode}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Amount ({paymentInfo.currency})</Label>
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

              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
                <p className="text-xs text-yellow-600 dark:text-yellow-400">
                  🔒 Demo Mode: This is a simulated payment. No real money will be transferred.
                </p>
              </div>

              <Button
                className="w-full h-12 text-lg"
                onClick={handlePay}
                disabled={!amount}
              >
                Pay {paymentInfo.currency === 'INR' ? '₹' : paymentInfo.currency}{amount || '0'}
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
