import { Button } from "@/components/ui/button";
import { AlertTriangle, TrendingDown, Target, CheckCircle, XCircle } from "lucide-react";

interface AdviceCardProps {
  advice: {
    impact: string;
    alternatives?: string;
    goal_delay?: string;
    recommendation: 'PROCEED' | 'SKIP';
    confidence: string;
    context: {
      weekly_remaining: number;
      daily_remaining: number;
      week_spent: number;
      today_spent: number;
    };
  };
  amount: number;
  item: string;
  onProceed: () => void;
  onSkip: () => void;
  loading: boolean;
}

const AdviceCard = ({ advice, amount, item, onProceed, onSkip, loading }: AdviceCardProps) => {
  const isRisky = advice.recommendation === 'SKIP';

  return (
    <div className="space-y-6 py-4">
      <div className="text-center">
        <div className={`inline-flex p-3 rounded-full mb-3 ${
          isRisky ? 'bg-accent/10' : 'bg-primary/10'
        }`}>
          {isRisky ? (
            <AlertTriangle className="w-8 h-8 text-accent" />
          ) : (
            <CheckCircle className="w-8 h-8 text-primary" />
          )}
        </div>
        <h3 className="text-2xl font-bold mb-2">
          {isRisky ? 'Hold On!' : 'Looking Good!'}
        </h3>
        <p className="text-muted-foreground">
          Spending ₹{amount} on {item}
        </p>
      </div>

      <div className="space-y-4">
        {/* Impact Section */}
        <div className="glass-card p-4 rounded-xl border-l-4 border-accent">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold mb-1">Impact</h4>
              <p className="text-sm text-muted-foreground">{advice.impact}</p>
            </div>
          </div>
        </div>

        {/* Alternatives */}
        {advice.alternatives && (
          <div className="glass-card p-4 rounded-xl border-l-4 border-secondary">
            <div className="flex items-start gap-3">
              <TrendingDown className="w-5 h-5 text-secondary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Smarter Choice</h4>
                <p className="text-sm text-muted-foreground">{advice.alternatives}</p>
              </div>
            </div>
          </div>
        )}

        {/* Goal Impact */}
        {advice.goal_delay && (
          <div className="glass-card p-4 rounded-xl border-l-4 border-primary">
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold mb-1">Goal Impact</h4>
                <p className="text-sm text-muted-foreground">{advice.goal_delay}</p>
              </div>
            </div>
          </div>
        )}

        {/* Status Summary */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-primary">
              ₹{Math.max(0, advice.context.daily_remaining).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Left Today</div>
          </div>
          <div className="glass-card p-3 rounded-lg text-center">
            <div className="text-lg font-bold text-secondary">
              ₹{Math.max(0, advice.context.weekly_remaining).toLocaleString()}
            </div>
            <div className="text-xs text-muted-foreground">Left This Week</div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={onSkip}
          disabled={loading}
        >
          <XCircle className="w-4 h-4 mr-2" />
          Skip Purchase
        </Button>
        <Button
          className={`flex-1 ${isRisky ? 'bg-accent hover:bg-accent/90' : 'neon-glow'}`}
          onClick={onProceed}
          disabled={loading}
        >
          <CheckCircle className="w-4 h-4 mr-2" />
          Proceed Anyway
        </Button>
      </div>
    </div>
  );
};

export default AdviceCard;
