import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import CurrencySelector from "@/components/CurrencySelector";
import { 
  Wallet, 
  User, 
  Globe, 
  Shield, 
  CheckCircle2, 
  Loader2,
  CreditCard,
  Smartphone,
  Building
} from "lucide-react";
import { toast } from "sonner";

const PublicPay = () => {
  const { username } = useParams();
  const [searchParams] = useSearchParams();
  
  const requestedAmount = searchParams.get('amount');
  const requestedCurrency = searchParams.get('currency') || 'USD';
  const recipientName = searchParams.get('name') || username;
  
  const [amount, setAmount] = useState(requestedAmount || "");
  const [currency, setCurrency] = useState(requestedCurrency);
  const [senderName, setSenderName] = useState("");
  const [senderEmail, setSenderEmail] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [transactionId, setTransactionId] = useState("");

  const paymentMethods = [
    { id: 'card', icon: CreditCard, name: 'Card', description: 'Visa, Mastercard, Amex' },
    { id: 'upi', icon: Smartphone, name: 'UPI', description: 'GPay, PhonePe, Paytm' },
    { id: 'bank', icon: Building, name: 'Bank Transfer', description: 'Direct bank transfer' },
  ];

  const getCurrencySymbol = (curr: string) => {
    const symbols: Record<string, string> = {
      USD: '$', EUR: '€', GBP: '£', INR: '₹', PKR: '₨', CNY: '¥', JPY: '¥'
    };
    return symbols[curr] || curr;
  };

  const handlePay = async () => {
    if (!amount || !senderName || !paymentMethod) {
      toast.error("Please fill all required fields");
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Generate transaction ID
    const txId = `WV${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setTransactionId(txId);
    setIsComplete(true);
    setIsProcessing(false);
    
    toast.success("Payment successful!");
  };

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full p-8 bg-background/95 backdrop-blur-xl border-primary/20 text-center space-y-6">
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
          
          <div>
            <h1 className="text-2xl font-bold text-green-500">Payment Successful!</h1>
            <p className="text-muted-foreground mt-2">
              Your payment has been sent to {recipientName}
            </p>
          </div>

          <Card className="p-4 bg-muted/50">
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-bold text-lg">
                  {getCurrencySymbol(currency)}{parseFloat(amount).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="font-medium">{recipientName}@worldvault</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transaction ID</span>
                <span className="font-mono text-xs">{transactionId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge className="bg-green-500/20 text-green-500">Completed</Badge>
              </div>
            </div>
          </Card>

          <div className="space-y-3">
            <Button className="w-full" onClick={() => window.location.href = '/'}>
              <Wallet className="w-4 h-4 mr-2" />
              Open World Vault
            </Button>
            <p className="text-xs text-muted-foreground">
              Create your own World Vault wallet to send & receive money globally
            </p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-white text-lg">World Vault</span>
          </div>
          <Badge variant="outline" className="border-green-500/50 text-green-400">
            <Shield className="w-3 h-3 mr-1" />
            Secure Payment
          </Badge>
        </div>
      </div>

      <div className="container mx-auto p-4 max-w-lg">
        <Card className="mt-8 p-6 bg-background/95 backdrop-blur-xl border-primary/20">
          {/* Recipient Info */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center mx-auto mb-4">
              <User className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold">{recipientName}</h1>
            <p className="text-muted-foreground text-sm">{username}@worldvault</p>
            {requestedAmount && (
              <div className="mt-4 p-3 bg-primary/10 rounded-xl">
                <p className="text-sm text-muted-foreground">Requested amount</p>
                <p className="text-3xl font-bold text-primary">
                  {getCurrencySymbol(requestedCurrency)}{parseFloat(requestedAmount).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {/* Amount */}
            <div className="space-y-2">
              <Label>Amount to Pay</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1 text-lg h-12"
                  disabled={!!requestedAmount}
                />
                <div className="w-28">
                  <CurrencySelector 
                    value={currency} 
                    onChange={setCurrency}
                  />
                </div>
              </div>
            </div>

            {/* Sender Info */}
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Your Name *</Label>
                <Input
                  placeholder="John Doe"
                  value={senderName}
                  onChange={(e) => setSenderName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Your Email (for receipt)</Label>
                <Input
                  type="email"
                  placeholder="john@example.com"
                  value={senderEmail}
                  onChange={(e) => setSenderEmail(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Methods */}
            <div className="space-y-3">
              <Label>Payment Method *</Label>
              <div className="grid gap-2">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                      paymentMethod === method.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      paymentMethod === method.id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                    }`}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{method.name}</p>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                    </div>
                    {paymentMethod === method.id && (
                      <CheckCircle2 className="w-5 h-5 text-primary ml-auto" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Pay Button */}
            <Button
              className="w-full h-14 text-lg"
              onClick={handlePay}
              disabled={isProcessing || !amount || !senderName || !paymentMethod}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Pay {getCurrencySymbol(currency)}{amount ? parseFloat(amount).toLocaleString() : '0'}</>
              )}
            </Button>

            {/* Trust Badges */}
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground pt-4 border-t border-border/50">
              <div className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                256-bit SSL
              </div>
              <div className="flex items-center gap-1">
                <Globe className="w-4 h-4" />
                150+ Countries
              </div>
            </div>
          </div>
        </Card>

        {/* Promo */}
        <Card className="mt-6 p-4 bg-gradient-to-r from-cyan-500/10 to-violet-500/10 border-primary/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-violet-500 flex items-center justify-center">
              <Wallet className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">Get World Vault</h3>
              <p className="text-sm text-muted-foreground">
                Send & receive money globally with zero fees
              </p>
            </div>
            <Button size="sm" variant="secondary" onClick={() => window.location.href = '/auth'}>
              Sign Up
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PublicPay;
