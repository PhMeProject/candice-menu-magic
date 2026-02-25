import { UtensilsCrossed, CalendarDays, ShoppingCart } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", label: "Library", icon: UtensilsCrossed },
  { path: "/plan", label: "Plan", icon: CalendarDays },
  { path: "/grocery", label: "Grocery", icon: ShoppingCart },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border bg-card/95 backdrop-blur-md pb-[env(safe-area-inset-bottom,0px)]">
      <div className="mx-auto flex max-w-lg">
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-semibold transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <tab.icon className={cn("h-5 w-5", active && "drop-shadow-sm")} />
              {tab.label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
