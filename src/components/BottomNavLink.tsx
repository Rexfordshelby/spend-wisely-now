import { useNavigate } from "react-router-dom";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface BottomNavLinkProps {
  to: string;
  icon: LucideIcon;
  label: string;
  active?: boolean;
}

const BottomNavLink = ({ to, icon: Icon, label, active }: BottomNavLinkProps) => {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate(to)}
      className={cn(
        "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all",
        active
          ? "text-primary"
          : "text-muted-foreground hover:text-foreground"
      )}
    >
      <Icon className={cn("w-5 h-5", active && "scale-110")} />
      <span className={cn("text-xs font-medium", active && "font-bold")}>{label}</span>
    </button>
  );
};

export default BottomNavLink;
