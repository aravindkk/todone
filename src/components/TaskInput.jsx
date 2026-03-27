import { useState, useEffect, useRef } from "react";
import { Plus, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

const PLACEHOLDERS = [
    "What's the one thing that would make today a win?",
    "What's been sitting on your mind?",
    "What needs to move forward today?",
    "What would make you feel accomplished tonight?",
    "What's the next step?",
    "What do you need to get done?",
    "What's most important right now?",
];

// Stable per day — changes overnight, consistent within the day
const dailyPlaceholder = PLACEHOLDERS[new Date().getDate() % PLACEHOLDERS.length];

export function TaskInput({ onAddTask, isEvaluating = false }) {
    const [value, setValue] = useState("");

    // Effect to clear input only after evaluation succeeds (when isEvaluating returns to false)
    // We assume if isEvaluating goes from true -> false, the task was added.
    const prevIsEvaluating = useRef(false);

    useEffect(() => {
        if (prevIsEvaluating.current && !isEvaluating) {
            setValue("");
        }
        prevIsEvaluating.current = isEvaluating;
    }, [isEvaluating]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!value.trim() || isEvaluating) return;
        onAddTask(value);
        // We do *not* clear value here. We wait for isEvaluating to finish or the parent completely bypassing it.
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto mb-8 relative group">
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder={isEvaluating ? "Evaluating task..." : dailyPlaceholder}
                    disabled={isEvaluating}
                    className={cn(
                        "w-full px-4 py-3 pr-12 rounded-xl border-2 border-transparent bg-white shadow-sm",
                        "text-base focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/10 transition-all",
                        "placeholder:text-slate-400 text-slate-700",
                        isEvaluating && "opacity-70 bg-slate-50 text-slate-500 cursor-not-allowed border-indigo-100"
                    )}
                />
                <button
                    type="submit"
                    disabled={!value.trim() || isEvaluating}
                    className={cn(
                        "absolute right-2 p-1.5 rounded-lg transition-colors",
                        value.trim() ? "bg-primary text-white hover:bg-primary/90" : "bg-slate-100 text-slate-300 cursor-not-allowed"
                    )}
                >
                    {isEvaluating ? (
                        <Sparkles className="w-5 h-5 animate-pulse text-indigo-400" />
                    ) : (
                        <Plus className="w-5 h-5" />
                    )}
                </button>
            </div>
        </form>
    );
}
