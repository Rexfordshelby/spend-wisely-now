import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { QrCode, X, Keyboard, Store, User, Building2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import QRScanner from "@/components/QRScanner";
import DemoQRCodes from "@/components/DemoQRCodes";
import PaymentProcessing from "@/components/PaymentProcessing";
import QRImageUpload from "@/components/QRImageUpload";

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

// Parse any QR code format - supports global payment systems
const parseAnyQRCode = (qrData: string): PaymentInfo | null => {
  console.log("Parsing QR data:", qrData);
  
  if (!qrData || typeof qrData !== 'string') {
    return null;
  }

  const data = qrData.trim();
  
  try {
    // UPI QR Code format: upi://pay?pa=xxx&pn=xxx&am=xxx&cu=xxx
    if (data.toLowerCase().startsWith('upi://')) {
      try {
        const url = new URL(data);
        const params = url.searchParams;
        
        return {
          type: 'upi',
          recipientId: params.get('pa') || params.get('PA') || '',
          recipientName: decodeURIComponent(params.get('pn') || params.get('PN') || params.get('pa')?.split('@')[0] || 'Merchant'),
          amount: params.get('am') || params.get('AM') ? parseFloat(params.get('am') || params.get('AM') || '0') : undefined,
          currency: params.get('cu') || params.get('CU') || 'INR',
          merchantCode: params.get('mc') || params.get('MC') || undefined,
          transactionNote: params.get('tn') || params.get('TN') || undefined,
          rawData: data,
        };
      } catch {
        // URL parsing failed, try regex
      }
    }
    
    // World Vault QR format
    if (data.startsWith('worldvault://')) {
      try {
        const base64Data = data.replace('worldvault://', '');
        const decoded = JSON.parse(atob(base64Data));
        return {
          type: 'worldvault',
          recipientId: decoded.recipientId || '',
          recipientName: decoded.recipientName || 'World Vault User',
          amount: decoded.amount,
          currency: decoded.currency || 'INR',
          rawData: data,
        };
      } catch {
        // Continue to other parsers
      }
    }

    // EasyPaisa (Pakistan)
    if (data.toLowerCase().includes('easypaisa') || data.toLowerCase().includes('easypay')) {
      const phoneMatch = data.match(/(\+?92|0)?3\d{9}/);
      return {
        type: 'easypaisa',
        recipientId: phoneMatch ? phoneMatch[0] : 'easypaisa_merchant',
        recipientName: 'EasyPaisa Account',
        currency: 'PKR',
        rawData: data,
      };
    }

    // JazzCash (Pakistan)
    if (data.toLowerCase().includes('jazzcash') || data.toLowerCase().includes('jazz')) {
      const phoneMatch = data.match(/(\+?92|0)?3\d{9}/);
      return {
        type: 'jazzcash',
        recipientId: phoneMatch ? phoneMatch[0] : 'jazzcash_merchant',
        recipientName: 'JazzCash Account',
        currency: 'PKR',
        rawData: data,
      };
    }

    // Alipay (China)
    if (data.toLowerCase().includes('alipay') || data.startsWith('https://qr.alipay.com')) {
      return {
        type: 'alipay',
        recipientId: data.substring(0, 50),
        recipientName: 'Alipay Merchant',
        currency: 'CNY',
        rawData: data,
      };
    }

    // WeChat Pay (China)
    if (data.toLowerCase().includes('wechat') || data.startsWith('wxp://')) {
      return {
        type: 'wechatpay',
        recipientId: data.substring(0, 50),
        recipientName: 'WeChat Pay Merchant',
        currency: 'CNY',
        rawData: data,
      };
    }

    // M-Pesa (Africa)
    if (data.toLowerCase().includes('mpesa') || data.toLowerCase().includes('m-pesa')) {
      const phoneMatch = data.match(/(\+?254|0)?7\d{8}/);
      return {
        type: 'mpesa',
        recipientId: phoneMatch ? phoneMatch[0] : 'mpesa_merchant',
        recipientName: 'M-Pesa Account',
        currency: 'KES',
        rawData: data,
      };
    }

    // PayTM QR
    if (data.toLowerCase().includes('paytm')) {
      const upiMatch = data.match(/pa=([^&]+)/i);
      return {
        type: 'paytm',
        recipientId: upiMatch ? decodeURIComponent(upiMatch[1]) : 'paytm_merchant',
        recipientName: 'PayTM Merchant',
        currency: 'INR',
        rawData: data,
      };
    }

    // PhonePe QR
    if (data.toLowerCase().includes('phonepe')) {
      const upiMatch = data.match(/pa=([^&]+)/i);
      return {
        type: 'phonepe',
        recipientId: upiMatch ? decodeURIComponent(upiMatch[1]) : 'phonepe_merchant',
        recipientName: 'PhonePe Merchant',
        currency: 'INR',
        rawData: data,
      };
    }

    // Google Pay / GPay QR
    if (data.toLowerCase().includes('gpay') || data.toLowerCase().includes('tez')) {
      const upiMatch = data.match(/pa=([^&]+)/i);
      return {
        type: 'gpay',
        recipientId: upiMatch ? decodeURIComponent(upiMatch[1]) : 'gpay_merchant',
        recipientName: 'Google Pay Merchant',
        currency: 'INR',
        rawData: data,
      };
    }

    // BHIM QR
    if (data.toLowerCase().includes('bhim')) {
      const upiMatch = data.match(/pa=([^&]+)/i);
      return {
        type: 'bhim',
        recipientId: upiMatch ? decodeURIComponent(upiMatch[1]) : 'bhim_merchant',
        recipientName: 'BHIM Merchant',
        currency: 'INR',
        rawData: data,
      };
    }

    // Generic URL with payment parameters (UPI-style)
    if (data.includes('pa=') || data.includes('PA=')) {
      const upiMatch = data.match(/pa=([^&]+)/i);
      const nameMatch = data.match(/pn=([^&]+)/i);
      const amountMatch = data.match(/am=([^&]+)/i);
      const currMatch = data.match(/cu=([^&]+)/i);
      
      return {
        type: 'generic_upi',
        recipientId: upiMatch ? decodeURIComponent(upiMatch[1]) : 'unknown',
        recipientName: nameMatch ? decodeURIComponent(nameMatch[1]) : 'Merchant',
        amount: amountMatch ? parseFloat(amountMatch[1]) : undefined,
        currency: currMatch ? currMatch[1].toUpperCase() : 'INR',
        rawData: data,
      };
    }

    // Try to parse as JSON
    try {
      const jsonData = JSON.parse(data);
      if (jsonData.upi || jsonData.pa || jsonData.vpa || jsonData.phone || jsonData.account) {
        return {
          type: 'json_payment',
          recipientId: jsonData.upi || jsonData.pa || jsonData.vpa || jsonData.phone || jsonData.account,
          recipientName: jsonData.name || jsonData.pn || jsonData.merchant || 'Merchant',
          amount: jsonData.amount || jsonData.am,
          currency: jsonData.currency || jsonData.cu || 'INR',
          rawData: data,
        };
      }
    } catch {
      // Not JSON, continue
    }

    // Plain UPI ID format (contains @)
    if (data.includes('@') && !data.includes(' ') && data.length < 100) {
      return {
        type: 'plain_upi',
        recipientId: data,
        recipientName: data.split('@')[0],
        currency: 'INR',
        rawData: data,
      };
    }

    // Phone number detection (various formats)
    const phoneRegex = /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,3}[)]?[-\s\.]?[0-9]{4,10}$/;
    if (phoneRegex.test(data.replace(/\s/g, ''))) {
      return {
        type: 'phone_payment',
        recipientId: data.replace(/[\s\-\(\)]/g, ''),
        recipientName: 'Phone Payment',
        currency: 'INR',
        rawData: data,
      };
    }

    // URL-based payment links
    if (data.startsWith('http://') || data.startsWith('https://')) {
      try {
        const url = new URL(data);
        const params = url.searchParams;
        
        // Extract any available payment info from URL
        return {
          type: 'payment_link',
          recipientId: params.get('pa') || params.get('merchant') || params.get('id') || url.hostname,
          recipientName: params.get('pn') || params.get('name') || url.hostname.replace('www.', ''),
          amount: params.get('am') || params.get('amount') ? parseFloat(params.get('am') || params.get('amount') || '0') : undefined,
          currency: params.get('cu') || params.get('currency') || 'INR',
          rawData: data,
        };
      } catch {
        // Invalid URL
      }
    }

    // Unknown format - still allow payment
    return {
      type: 'unknown',
      recipientId: data.substring(0, 50),
      recipientName: 'Payment Recipient',
      currency: 'INR',
      rawData: data,
    };

  } catch (error) {
    console.error('Error parsing QR code:', error);
    // Return a fallback instead of null
    return {
      type: 'unknown',
      recipientId: data.substring(0, 50),
      recipientName: 'Unknown Merchant',
      currency: 'INR',
      rawData: data,
    };
  }
};

const ScanPay = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scanning, setScanning] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState<PaymentInfo | null>(null);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [upiId, setUpiId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'failed'>('idle');
  const [transactionResult, setTransactionResult] = useState<any>(null);

  useEffect(() => {
    checkAuth();
    // Check for prefilled contact from navigation
    const state = location.state as any;
    if (state?.prefillContact) {
      setPaymentInfo({
        type: 'contact',
        recipientId: state.prefillContact.recipientId || '',
        recipientName: state.prefillContact.recipientName || 'Contact',
        currency: state.prefillContact.currency || 'INR',
      });
    }
  }, [location]);

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
    const input = upiId.trim();
    
    // Check for phone number (EasyPaisa, JazzCash, M-Pesa style)
    const phoneRegex = /^[\+]?[0-9]{10,15}$/;
    if (phoneRegex.test(input.replace(/[\s\-]/g, ''))) {
      const cleanPhone = input.replace(/[\s\-]/g, '');
      let currency = 'INR';
      let type = 'phone_payment';
      
      // Detect country from phone prefix
      if (cleanPhone.startsWith('+92') || cleanPhone.startsWith('92') || cleanPhone.startsWith('03')) {
        currency = 'PKR';
        type = 'easypaisa';
      } else if (cleanPhone.startsWith('+254') || cleanPhone.startsWith('254') || cleanPhone.startsWith('07')) {
        currency = 'KES';
        type = 'mpesa';
      } else if (cleanPhone.startsWith('+86') || cleanPhone.startsWith('86')) {
        currency = 'CNY';
        type = 'alipay';
      }
      
      setPaymentInfo({
        type,
        recipientId: cleanPhone,
        recipientName: `Mobile: ${cleanPhone}`,
        currency,
      });
      return;
    }
    
    // Check for UPI ID
    if (input.includes('@')) {
      setPaymentInfo({
        type: 'manual_upi',
        recipientId: input,
        recipientName: input.split('@')[0],
        currency: 'INR',
      });
      return;
    }
    
    // Allow any other input as generic payment
    if (input.length > 3) {
      setPaymentInfo({
        type: 'manual_payment',
        recipientId: input,
        recipientName: input,
        currency: 'INR',
      });
      return;
    }
    
    toast.error("Please enter a valid UPI ID, phone number, or merchant ID");
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
            <TabsList className="grid w-full grid-cols-4 mb-6">
              <TabsTrigger value="scan" className="flex items-center gap-1 text-xs">
                <QrCode className="w-3 h-3" />
                Scan
              </TabsTrigger>
              <TabsTrigger value="upload" className="flex items-center gap-1 text-xs">
                <ImagePlus className="w-3 h-3" />
                Upload
              </TabsTrigger>
              <TabsTrigger value="upi" className="flex items-center gap-1 text-xs">
                <Keyboard className="w-3 h-3" />
                UPI ID
              </TabsTrigger>
              <TabsTrigger value="demo" className="flex items-center gap-1 text-xs">
                <Store className="w-3 h-3" />
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

            <TabsContent value="upload">
              <QRImageUpload onScan={handleScan} />
            </TabsContent>

            <TabsContent value="upi">
              <Card className="p-6 space-y-6">
                <div className="text-center">
                  <h2 className="text-xl font-bold mb-2">Enter Payment ID</h2>
                  <p className="text-muted-foreground text-sm">
                    Pay using UPI ID, phone number, or merchant ID
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>UPI ID / Phone / Merchant ID</Label>
                    <Input
                      placeholder="name@upi, +923001234567, merchant_id"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                    />
                  </div>

                  <div className="text-xs text-muted-foreground">
                    <p className="font-medium mb-2">Try these demo IDs:</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        'demo@upi', 
                        'starbucks@paytm', 
                        '+923001234567', 
                        'merchant@alipay'
                      ].map((id) => (
                        <button
                          key={id}
                          className="px-2 py-1 rounded bg-accent/10 hover:bg-accent/20 transition-colors"
                          onClick={() => setUpiId(id)}
                        >
                          {id}
                        </button>
                      ))}
                    </div>
                    <p className="mt-2 text-xs opacity-70">
                      Supports: UPI, EasyPaisa, JazzCash, Alipay & more
                    </p>
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
