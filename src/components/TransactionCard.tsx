import { Calendar, Tag } from "lucide-react";

interface TransactionCardProps {
  amount: number;
  category: string;
  description: string;
  date: string;
}

const getCategoryIcon = (category: string) => {
  const icons: Record<string, string> = {
    Food: "🍕",
    Transport: "🚗",
    Shopping: "🛍️",
    Entertainment: "🎮",
    Bills: "📱",
    Health: "💊",
    Education: "📚",
    Other: "📦"
  };
  return icons[category] || "📦";
};

const TransactionCard = ({ amount, category, description, date }: TransactionCardProps) => {
  const formattedDate = new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short'
  });

  return (
    <div className="glass-card p-4 rounded-xl hover:bg-card/80 transition-colors cursor-pointer">
      <div className="flex items-center gap-3">
        <div className="text-3xl">{getCategoryIcon(category)}</div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold truncate">{description}</div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
            <Tag className="w-3 h-3" />
            <span>{category}</span>
            <span>•</span>
            <Calendar className="w-3 h-3" />
            <span>{formattedDate}</span>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold text-accent">-₹{amount.toLocaleString()}</div>
        </div>
      </div>
    </div>
  );
};

export default TransactionCard;
