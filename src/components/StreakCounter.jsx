import { Flame } from "lucide-react";
import { cn } from "../lib/utils";

export function StreakCounter({ streak = 0, hasRecentTasks = true, className }) {
    const isCold = !hasRecentTasks; // fire is cold if no activities in last 7 days

    return (
        <div className={cn(
            "flex items-center gap-1.5 px-3 py-1.5 bg-white rounded-lg shadow-sm border transition-all hover:scale-105",
            isCold ? "border-blue-100 text-blue-600" : "border-orange-100 text-orange-600",
            className
        )}>
            <Flame className={cn(
                "w-4 h-4 animate-pulse",
                isCold ? "fill-blue-500/20 text-blue-500" : "fill-orange-500 text-orange-600"
            )} />
            <span className="font-medium text-sm">{streak} Days</span>
        </div>
    );
}
