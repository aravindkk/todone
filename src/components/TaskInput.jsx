import { useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { cn } from "../lib/utils";

export function TaskInput({ onAddTask, isEvaluating = false }) {
    const [value, setValue] = useState("");

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!value.trim()) return;
        onAddTask(value);
        setValue("");
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto mb-8 relative group">
            <div className="relative flex items-center">
                <input
                    type="text"
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    placeholder="What do you need to get done?"
                    className={cn(
                        "w-full px-4 py-3 pr-12 rounded-xl border-2 border-transparent bg-white shadow-sm",
                        "text-base focus:outline-none focus:border-primary/20 focus:ring-4 focus:ring-primary/10 transition-all",
                        "placeholder:text-slate-400 text-slate-700"
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
