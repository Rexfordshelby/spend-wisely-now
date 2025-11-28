interface BudgetRingProps {
  spent: number;
  total: number;
  size?: number;
}

const BudgetRing = ({ spent, total, size = 120 }: BudgetRingProps) => {
  const percentage = Math.min((spent / total) * 100, 100);
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const getColor = () => {
    if (percentage >= 90) return "hsl(var(--accent))";
    if (percentage >= 70) return "hsl(var(--secondary))";
    return "hsl(var(--primary))";
  };

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth="8"
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          className="transition-all duration-500 ease-out"
          style={{
            filter: `drop-shadow(0 0 8px ${getColor()})`
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-bold">{Math.round(percentage)}%</div>
        <div className="text-xs text-muted-foreground">used</div>
      </div>
    </div>
  );
};

export default BudgetRing;
