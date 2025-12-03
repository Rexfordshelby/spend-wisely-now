import { useState, useEffect } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "./ui/button";

interface PaymentProcessingProps {
  status: 'processing' | 'success' | 'failed';
  amount: number;
  currency: string;
  recipientName: string;
  transactionId?: string;
  onDone: () => void;
  onRetry?: () => void;
}

const PaymentProcessing = ({
  status,
  amount,
  currency,
  recipientName,
  transactionId,
  onDone,
  onRetry,
}: PaymentProcessingProps) => {
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (status === 'success') {
      setTimeout(() => setShowDetails(true), 500);
    }
  }, [status]);

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-sm flex items-center justify-center">
      <div className="text-center space-y-6 p-8 max-w-sm mx-auto">
        {/* Status Icon */}
        <div className="relative">
          {status === 'processing' && (
            <div className="w-24 h-24 mx-auto relative">
              <div className="absolute inset-0 rounded-full border-4 border-primary/20"></div>
              <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-primary animate-spin"></div>
              <Loader2 className="w-12 h-12 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" />
            </div>
          )}
          
          {status === 'success' && (
            <div className="w-24 h-24 mx-auto bg-green-500/20 rounded-full flex items-center justify-center animate-scale-in">
              <CheckCircle2 className="w-16 h-16 text-green-500" />
            </div>
          )}
          
          {status === 'failed' && (
            <div className="w-24 h-24 mx-auto bg-destructive/20 rounded-full flex items-center justify-center animate-scale-in">
              <XCircle className="w-16 h-16 text-destructive" />
            </div>
          )}
        </div>

        {/* Status Text */}
        <div>
          {status === 'processing' && (
            <>
              <h2 className="text-2xl font-bold mb-2">Processing Payment</h2>
              <p className="text-muted-foreground">Please wait...</p>
            </>
          )}
          
          {status === 'success' && (
            <>
              <h2 className="text-2xl font-bold text-green-500 mb-2">Payment Successful!</h2>
              <div className={`transition-all duration-500 ${showDetails ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
                <p className="text-4xl font-bold my-4">
                  {currency === 'INR' ? '₹' : currency} {amount.toLocaleString()}
                </p>
                <p className="text-muted-foreground">Paid to {recipientName}</p>
                {transactionId && (
                  <p className="text-xs text-muted-foreground mt-2">
                    Transaction ID: {transactionId.slice(0, 8)}...
                  </p>
                )}
              </div>
            </>
          )}
          
          {status === 'failed' && (
            <>
              <h2 className="text-2xl font-bold text-destructive mb-2">Payment Failed</h2>
              <p className="text-muted-foreground">Something went wrong. Please try again.</p>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          {status === 'success' && (
            <Button className="w-full" onClick={onDone}>
              Done
            </Button>
          )}
          
          {status === 'failed' && (
            <>
              <Button className="w-full" onClick={onRetry}>
                Try Again
              </Button>
              <Button variant="outline" className="w-full" onClick={onDone}>
                Cancel
              </Button>
            </>
          )}
        </div>

        {/* Fun confetti effect for success */}
        {status === 'success' && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-3 h-3 rounded-full animate-confetti"
                style={{
                  left: `${Math.random() * 100}%`,
                  backgroundColor: ['#22D3EE', '#A78BFA', '#FB7185', '#4ADE80', '#FACC15'][Math.floor(Math.random() * 5)],
                  animationDelay: `${Math.random() * 0.5}s`,
                  animationDuration: `${1 + Math.random()}s`,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentProcessing;
