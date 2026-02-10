import { Dialog } from "./ui/Dialog";
import { Check, Calendar } from "lucide-react";
import { cn } from "../lib/utils";

export function CalendarView({ isOpen, onClose, tasks }) {
    if (!isOpen) return null;

    // Helper to get last 7 days
    const getLast7Days = () => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            days.push(d); // Keep as Date object for formatting
        }
        return days;
    };

    const last7Days = getLast7Days();

    // Helper to format date key YYYY-MM-DD
    const getDateKey = (date) => date.toISOString().split('T')[0];

    // Group completed tasks by date
    const tasksByDate = tasks.reduce((acc, task) => {
        if (task.completed && task.completedAt) {
            const dateKey = task.completedAt.split('T')[0];
            if (!acc[dateKey]) acc[dateKey] = [];
            acc[dateKey].push(task);
        }
        return acc;
    }, {});

    return (
        <Dialog
            isOpen={isOpen}
            onClose={onClose}
            className="bg-white/95 backdrop-blur-xl border border-white/20 max-w-2xl h-[80vh] flex flex-col"
            hideHeader={true}
        >
            <div className="flex items-center gap-4 mb-6 shrink-0">
                <div className="p-3 bg-purple-50 rounded-xl text-purple-500">
                    <Calendar className="w-6 h-6" />
                </div>
                <div>
                    <h3 className="text-xl font-semibold text-slate-800">History</h3>
                    <p className="text-slate-500 text-sm">Your accomplishments over the last 7 days</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
                {last7Days.map((date, index) => {
                    const dateKey = getDateKey(date);
                    const dayTasks = tasksByDate[dateKey] || [];
                    const isToday = index === 0;
                    const isYesterday = index === 1;

                    let label = date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
                    if (isToday) label = "Today";
                    if (isYesterday) label = "Yesterday";

                    // Calculate "rate" based on a daily goal of 3 tasks
                    const GOAL = 3;
                    const count = dayTasks.length;
                    const rate = Math.min(100, Math.round((count / GOAL) * 100));

                    let barColor = "bg-slate-200";
                    if (rate >= 100) barColor = "bg-green-500";
                    else if (rate >= 60) barColor = "bg-blue-400";
                    else if (rate > 0) barColor = "bg-orange-400";

                    return (
                        <div key={dateKey} className="group">
                            <div className="flex items-center gap-4 mb-3">
                                <div className={cn("w-1.5 h-1.5 rounded-full", barColor)} />
                                <h4 className={cn("font-medium text-lg", isToday ? "text-slate-800" : "text-slate-600")}>
                                    {label}
                                </h4>
                                <div className="h-px flex-1 bg-slate-100" />
                                <div className="flex items-center gap-3">
                                    <div className="flex flex-col items-end">
                                        <span className={cn(
                                            "text-xs font-bold",
                                            rate >= 100 ? "text-green-600" : "text-slate-500"
                                        )}>
                                            {rate}% Rate
                                        </span>
                                        <span className="text-[10px] text-slate-400 font-medium">
                                            Target: {GOAL}, {count} completed
                                        </span>
                                    </div>
                                    <div className="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className={cn("h-full rounded-full transition-all duration-500", barColor)}
                                            style={{ width: `${rate}%` }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {dayTasks.length > 0 ? (
                                <div className="space-y-2 pl-6">
                                    {dayTasks.map(task => (
                                        <div key={task.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                                            <div className="mt-0.5 text-green-500">
                                                <Check className="w-4 h-4" />
                                            </div>
                                            <div>
                                                <span className="text-slate-700 block text-sm line-through decoration-slate-300">
                                                    {task.description}
                                                </span>
                                                {task.elapsedTime > 0 && (
                                                    <span className="text-xs text-slate-400 mt-1 block">
                                                        Time spent: {Math.floor(task.elapsedTime / 60000)}m
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="pl-6 text-sm text-slate-400 italic">
                                    No tasks completed.
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 shrink-0 text-right">
                <button
                    onClick={onClose}
                    className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                >
                    Close
                </button>
            </div>
        </Dialog>
    );
}
