import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ArrowRightLeft, TrendingDown } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface ExchangeRateDisplayProps {
  from: string;
  to: string;
  amount: number;
}

const ExchangeRateDisplay = ({ from, to, amount }: ExchangeRateDisplayProps) => {
  const [rate, setRate] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!from || !to) return;

    const fetchRate = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.functions.invoke('exchange-rates', {
          body: { base: from, target: to }
        });

        if (error) throw error;
        setRate(data.rate);
      } catch (error) {
        console.error('Error fetching exchange rate:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRate();
  }, [from, to]);

  if (loading) {
    return <Skeleton className="h-20 w-full" />;
  }

  if (!rate) return null;

  const convertedAmount = amount * rate;

  return (
    <div className="bg-card border border-border rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-4 h-4 text-primary" />
          <span className="text-sm text-muted-foreground">Exchange Rate</span>
        </div>
        <span className="text-sm font-medium">1 {from} = {rate.toFixed(4)} {to}</span>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-2xl font-bold">{amount.toFixed(2)} {from}</span>
        <ArrowRightLeft className="w-5 h-5 text-muted-foreground" />
        <span className="text-2xl font-bold text-primary">{convertedAmount.toFixed(2)} {to}</span>
      </div>

      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        <TrendingDown className="w-3 h-3" />
        <span>Mid-market rate · No hidden fees</span>
      </div>
    </div>
  );
};

export default ExchangeRateDisplay;