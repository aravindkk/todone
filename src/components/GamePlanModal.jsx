import { useState } from "react";
import { Dialog } from "./ui/Dialog";
import { Brain, Target, Pin, Loader2, Sparkles, AlertCircle } from "lucide-react";
import { cn } from "../lib/utils";
import { aiService } from "../services/ai";

export function GamePlanModal({ isOpen, onClose, userName, todayTasks, onPinTask }) {
    const [pinnedTaskIds, setPinnedTaskIds] = useState(new Set());
    const [gamePlan, setGamePlan] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Filter to only show uncompleted today tasks
    const uncompletedTodayTasks = todayTasks.filter(t => !t.completed);

    const togglePin = (taskId) => {
        setPinnedTaskIds(prev => {
            const next = new Set(prev);
            if (next.has(taskId)) {
                next.delete(taskId);
            } else {
                next.add(taskId);
            }
            return next;
        });
    };

    const handleGeneratePlan = async () => {
        if (pinnedTaskIds.size === 0) return;

        setIsLoading(true);
        setError(null);
        setGamePlan(null);

        try {
            const targetTasks = uncompletedTodayTasks
                .filter(t => pinnedTaskIds.has(t.id))
                .map(t => t.description);

            const otherTasks = uncompletedTodayTasks
                .filter(t => !pinnedTaskIds.has(t.id))
                .map(t => t.description);

            // Fetch AI Game Plan
            const response = await aiService.generateGamePlan(userName || 'Friend', targetTasks, otherTasks);

            if (response.error || response.rateLimited) {
                setError(response.error ? "Failed to generate plan. Please try again." : "Rate limit reached. Please wait a bit.");
            } else {
                setGamePlan(response.plan);

                // Fire the pin task callbacks so the UI state matches the choice
                pinnedTaskIds.forEach(id => {
                    onPinTask(id, true);
                });
            }
        } catch (e) {
            setError("An unexpected error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    // Close and reset
    const handleClose = () => {
        setPinnedTaskIds(new Set());
        setGamePlan(null);
        setError(null);
        onClose();
    };

    return (
        <Dialog
            isOpen={isOpen}
            onClose={handleClose}
            className="w-full max-w-2xl bg-white/95 backdrop-blur-xl border border-white/20 p-6 flex flex-col max-h-[85vh]"
        >
            <div className="flex items-center gap-4 mb-6 shrink-0">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg text-white">
                    <Target className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-slate-800">
                        {gamePlan ? "Your Game Plan" : "Pick Your Target"}
                    </h2>
                    <p className="text-slate-500 text-sm">
                        {gamePlan
                            ? "AI mapped out your day based on your priorities."
                            : "Select the most important tasks to focus on today."}
                    </p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-6 pr-2">
                {!gamePlan ? (
                    <div className="space-y-4">
                        {uncompletedTodayTasks.length === 0 ? (
                            <div className="text-center py-12 text-slate-400">
                                <Target className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                <p>No tasks left for today! You're completely done.</p>
                            </div>
                        ) : (
                            uncompletedTodayTasks.map(task => {
                                const isPinned = pinnedTaskIds.has(task.id);
                                return (
                                    <div
                                        key={task.id}
                                        onClick={() => togglePin(task.id)}
                                        className={cn(
                                            "flex items-center justify-between p-4 rounded-xl border-2 cursor-pointer transition-all",
                                            isPinned
                                                ? "border-blue-500 bg-blue-50 shadow-sm"
                                                : "border-slate-100 bg-white hover:border-blue-200"
                                        )}
                                    >
                                        <span className={cn(
                                            "font-medium",
                                            isPinned ? "text-blue-900" : "text-slate-700"
                                        )}>
                                            {task.description}
                                        </span>
                                        <div className={cn(
                                            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                                            isPinned ? "bg-blue-500 text-white" : "bg-slate-100 text-slate-400"
                                        )}>
                                            <Pin className="w-4 h-4" />
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm mt-4">
                                <AlertCircle className="w-4 h-4" />
                                <span>{error}</span>
                            </div>
                        )}

                    </div>
                ) : (
                    <div className="space-y-6">
                        {(() => {
                            try {
                                const parsedData = typeof gamePlan === 'string' ? JSON.parse(gamePlan) : gamePlan;
                                const plan = Array.isArray(parsedData) ? parsedData[0] : parsedData;

                                return (
                                    <>
                                        {plan.greeting && (
                                            <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 font-medium text-lg mb-6 shadow-sm">
                                                {plan.greeting}
                                            </div>
                                        )}

                                        <div className="space-y-4">
                                            {plan.targets && plan.targets.map((target, idx) => (
                                                <div key={idx} className="bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
                                                    <div className="flex items-start justify-between gap-4 mb-3">
                                                        <h4 className="font-bold text-slate-800 text-lg flex-1">
                                                            {target.task}
                                                        </h4>
                                                        {target.duration && (
                                                            <span className="bg-slate-100 text-slate-600 px-3 py-1 text-sm font-medium rounded-lg shrink-0">
                                                                {target.duration}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {target.subtasks && target.subtasks.length > 0 && (
                                                        <ul className="space-y-2 mt-4 pt-4 border-t border-slate-100">
                                                            {target.subtasks.map((subtask, sIdx) => (
                                                                <li key={sIdx} className="flex gap-3 text-sm text-slate-600">
                                                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                                                                    <span>{subtask}</span>
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                );
                            } catch (e) {
                                // Fallback if parsing fails
                                return (
                                    <div className="prose prose-slate prose-blue max-w-none text-slate-700 leading-relaxed font-medium bg-slate-50 p-6 rounded-2xl border border-slate-100 whitespace-pre-wrap">
                                        {typeof gamePlan === 'string' ? gamePlan : JSON.stringify(gamePlan, null, 2)}
                                    </div>
                                );
                            }
                        })()}
                    </div>
                )}
            </div>

            <div className="mt-6 shrink-0 pt-4 border-t border-slate-100 flex gap-3">
                {!gamePlan ? (
                    <button
                        onClick={handleGeneratePlan}
                        disabled={pinnedTaskIds.size === 0 || isLoading}
                        className={cn(
                            "w-full py-3.5 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all shadow-sm",
                            pinnedTaskIds.size > 0 && !isLoading
                                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-md hover:from-blue-700 hover:to-indigo-700"
                                : "bg-slate-100 text-slate-400 cursor-not-allowed"
                        )}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Generating Plan...
                            </>
                        ) : (
                            <>
                                <Sparkles className="w-5 h-5" />
                                Generate Game Plan
                            </>
                        )}
                    </button>
                ) : (
                    <button
                        onClick={handleClose}
                        className="w-full py-3.5 rounded-xl font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                    >
                        Got it, let's go!
                    </button>
                )}
            </div>
        </Dialog>
    );
}
