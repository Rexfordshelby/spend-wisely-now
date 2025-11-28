import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import AdviceCard from "./AdviceCard";

interface SpendInputModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  walletId: string;
  onSuccess: () => void;
}

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Entertainment",
  "Bills",
  "Health",
  "Education",
  "Other"
];

const SpendInputModal = ({ open, onOpenChange, userId, walletId, onSuccess }: SpendInputModalProps) => {
  const [step, setStep] = useState<'input' | 'advice'>('input');
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState("");
  const [item, setItem] = useState("");
  const [category, setCategory] = useState("Food");
  const [advice, setAdvice] = useState<any>(null);

  const handleGetAdvice = async () => {
    if (!amount || !item) {
      toast.error("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/spend-advisor`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`
          },
          body: JSON.stringify({
            amount: parseFloat(amount),
            category,
            item,
            userId
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to get advice');
      }

      const data = await response.json();
      setAdvice(data);
      setStep('advice');
    } catch (error: any) {
      toast.error(error.message || "Failed to get advice");
    } finally {
      setLoading(false);
    }
  };

  const handleProceed = async () => {
    setLoading(true);

    try {
      const { error } = await supabase
        .from('transactions')
        .insert({
          wallet_id: walletId,
          amount: parseFloat(amount),
          category,
          description: item,
          type: 'debit'
        });

      if (error) throw error;

      toast.success("Transaction recorded");
      handleClose();
      onSuccess();
    } catch (error: any) {
      toast.error(error.message || "Failed to record transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = async () => {
    // Update skip count
    const { data: profile } = await supabase
      .from('profiles')
      .select('spends_skipped_count')
      .eq('id', userId)
      .single();

    await supabase
      .from('profiles')
      .update({
        spends_skipped_count: (profile?.spends_skipped_count || 0) + 1
      })
      .eq('id', userId);

    toast.success("Good choice! Money saved.");
    handleClose();
    onSuccess();
  };

  const handleClose = () => {
    setStep('input');
    setAmount("");
    setItem("");
    setCategory("Food");
    setAdvice(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {step === 'input' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">What are you buying?</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="item">Item / Description</Label>
                <Input
                  id="item"
                  placeholder="Coffee, Uber ride, T-shirt..."
                  value={item}
                  onChange={(e) => setItem(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xl text-muted-foreground">
                    ₹
                  </span>
                  <Input
                    id="amount"
                    type="number"
                    placeholder="450"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="pl-10 text-xl h-12"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Category</Label>
                <div className="grid grid-cols-4 gap-2">
                  {CATEGORIES.map((cat) => (
                    <Button
                      key={cat}
                      variant={category === cat ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCategory(cat)}
                      className="text-xs"
                    >
                      {cat}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGetAdvice}
                className="w-full neon-glow"
                size="lg"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  "Get Advice"
                )}
              </Button>
            </div>
          </>
        )}

        {step === 'advice' && advice && (
          <AdviceCard
            advice={advice}
            amount={parseFloat(amount)}
            item={item}
            onProceed={handleProceed}
            onSkip={handleSkip}
            loading={loading}
          />
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SpendInputModal;
