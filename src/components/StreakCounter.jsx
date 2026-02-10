import { Flame } from "lucide-react";
import { cn } from "../lib/utils";

export function StreakCounter({ streak = 0, className }) {
    return (
        <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-sm border border-orange-100",
            "text-orange-600 font-medium text-sm transition-all hover:scale-105",
            className
        )}>
            <Flame className="w-4 h-4 fill-orange-500 text-orange-600 animate-pulse" />
            <span>{streak} Days</span>
        </div>
    );
}
